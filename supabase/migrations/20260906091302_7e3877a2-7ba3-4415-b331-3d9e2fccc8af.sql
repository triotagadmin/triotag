-- 1. One brand profile per auth user
CREATE UNIQUE INDEX IF NOT EXISTS brand_advertiser_profiles_user_id_key
  ON public.brand_advertiser_profiles (user_id);

-- 2. Backfill roles for existing brand advertisers missing a role row
INSERT INTO public.user_roles (user_id, role)
SELECT b.user_id, 'brand_advertiser'::app_role
FROM public.brand_advertiser_profiles b
JOIN auth.users u ON u.id = b.user_id
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = b.user_id)
ON CONFLICT (user_id) DO NOTHING;

-- 3. Self-serve signups default to brand_advertiser instead of no role at all
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_type_value text;
  user_role app_role;
BEGIN
  user_type_value := NEW.raw_user_meta_data->>'user_type';

  IF user_type_value IN ('venue', 'digital', 'agent') THEN
    user_role := 'agent'::app_role;
  ELSIF user_type_value = 'talent' THEN
    user_role := 'talent'::app_role;
  ELSIF user_type_value = 'print_partner' THEN
    user_role := 'print_partner'::app_role;
  ELSIF user_type_value = 'admin' THEN
    user_role := 'admin'::app_role;
  ELSE
    -- Public self-serve signup: brand advertiser is the only self-serve account type.
    -- Invitation flows (agent / super admin) overwrite this in accept_invitation().
    user_role := 'brand_advertiser'::app_role;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user_role failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;

-- 4. Invited super admins get admin role on acceptance
CREATE OR REPLACE FUNCTION public.accept_invitation(_token text)
RETURNS TABLE(member_role text, tenant_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE inv record; em text; existing record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT lower(email::text) INTO em FROM auth.users WHERE id = auth.uid();

  SELECT * INTO inv FROM public.tenant_invitations
  WHERE token = _token AND accepted_at IS NULL AND revoked_at IS NULL FOR UPDATE;
  IF inv IS NULL THEN RAISE EXCEPTION 'This invitation is invalid or already used'; END IF;
  IF inv.expires_at < now() THEN RAISE EXCEPTION 'This invitation has expired'; END IF;
  IF lower(inv.email) IS DISTINCT FROM em THEN
    RAISE EXCEPTION 'This invitation was sent to a different email address';
  END IF;

  SELECT * INTO existing FROM public.tenant_members WHERE user_id = auth.uid();
  IF existing IS NOT NULL AND existing.tenant_id <> inv.tenant_id THEN
    RAISE EXCEPTION 'This account already belongs to another tenant';
  END IF;

  INSERT INTO public.tenant_members (user_id, tenant_id, member_role, full_name, email, invited_by)
  VALUES (auth.uid(), inv.tenant_id, inv.invited_role, inv.full_name, em, inv.invited_by)
  ON CONFLICT (user_id) DO UPDATE
    SET member_role = EXCLUDED.member_role, status = 'active', updated_at = now();

  IF inv.invited_role = 'agent' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'agent'::app_role)
    ON CONFLICT (user_id) DO UPDATE SET role = 'agent'::app_role;
  ELSIF inv.invited_role = 'super_admin' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin'::app_role)
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin'::app_role;
  END IF;

  UPDATE public.tenant_invitations
  SET accepted_at = now(), accepted_by = auth.uid() WHERE id = inv.id;

  PERFORM public.log_audit('invitation.accepted', inv.id,
    jsonb_build_object('role', inv.invited_role, 'tenant_id', inv.tenant_id));
  RETURN QUERY SELECT inv.invited_role, inv.tenant_id;
END;
$function$;

-- 5. Database-backed account resolution + safe self-healing for the signed-in user
CREATE OR REPLACE FUNCTION public.resolve_my_account()
RETURNS TABLE(role text, brand_profile_id uuid, needs_manual_review boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  em text;
  existing_role app_role;
  bp_id uuid;
  orphan_count int := 0;
  orphan_id uuid;
  ambiguous boolean := false;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT lower(u.email::text) INTO em FROM auth.users u WHERE u.id = uid;

  SELECT r.role INTO existing_role FROM public.user_roles r WHERE r.user_id = uid;
  SELECT b.id INTO bp_id FROM public.brand_advertiser_profiles b WHERE b.user_id = uid;

  -- Migration fallback: link an older brand profile whose owner no longer exists,
  -- matched on email, and only when exactly one candidate exists.
  IF bp_id IS NULL AND em IS NOT NULL THEN
    SELECT count(*), min(b.id) INTO orphan_count, orphan_id
    FROM public.brand_advertiser_profiles b
    WHERE lower(b.contact_email) = em
      AND NOT EXISTS (SELECT 1 FROM auth.users u2 WHERE u2.id = b.user_id);
    IF orphan_count = 1 THEN
      UPDATE public.brand_advertiser_profiles SET user_id = uid WHERE id = orphan_id;
      bp_id := orphan_id;
    ELSIF orphan_count > 1 THEN
      ambiguous := true;
    END IF;
  END IF;

  -- Restore a missing role from the trusted profile relationships (never create data twice).
  IF existing_role IS NULL THEN
    IF EXISTS (SELECT 1 FROM public.tenant_members m WHERE m.user_id = uid AND m.member_role = 'agent') THEN
      existing_role := 'agent'::app_role;
    ELSIF EXISTS (SELECT 1 FROM public.tenant_members m WHERE m.user_id = uid AND m.member_role = 'super_admin') THEN
      existing_role := 'admin'::app_role;
    ELSIF EXISTS (SELECT 1 FROM public.admin_profiles a WHERE a.user_id = uid) THEN
      existing_role := 'admin'::app_role;
    ELSIF EXISTS (SELECT 1 FROM public.publisher_profiles p WHERE p.user_id = uid) THEN
      existing_role := 'agent'::app_role;
    ELSIF EXISTS (SELECT 1 FROM public.print_partner_profiles p WHERE p.user_id = uid) THEN
      existing_role := 'print_partner'::app_role;
    ELSIF EXISTS (SELECT 1 FROM public.talent_profiles t WHERE t.user_id = uid) THEN
      existing_role := 'talent'::app_role;
    ELSIF EXISTS (SELECT 1 FROM public.tenant_invitations i
                  WHERE lower(i.email) = em AND i.accepted_at IS NULL AND i.revoked_at IS NULL) THEN
      existing_role := NULL; -- pending invitation decides the role
    ELSE
      existing_role := 'brand_advertiser'::app_role;
    END IF;

    IF existing_role IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (uid, existing_role)
      ON CONFLICT (user_id) DO NOTHING;
      SELECT r.role INTO existing_role FROM public.user_roles r WHERE r.user_id = uid;
    END IF;
  END IF;

  RETURN QUERY SELECT existing_role::text, bp_id, ambiguous;
END;
$function$;

REVOKE ALL ON FUNCTION public.resolve_my_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_my_account() TO authenticated;