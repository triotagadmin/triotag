
ALTER TABLE public.ad_spaces
  ADD COLUMN IF NOT EXISTS platform_verification_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS platform_review_notes text,
  ADD COLUMN IF NOT EXISTS platform_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS platform_verified_by uuid;

-- Webmaster global read access across platform supply and operations
DROP POLICY IF EXISTS "Webmaster manages all ad spaces" ON public.ad_spaces;
CREATE POLICY "Webmaster manages all ad spaces" ON public.ad_spaces
  FOR ALL TO authenticated USING (public.is_webmaster(auth.uid())) WITH CHECK (public.is_webmaster(auth.uid()));

DROP POLICY IF EXISTS "Webmaster views all publisher profiles" ON public.publisher_profiles;
CREATE POLICY "Webmaster views all publisher profiles" ON public.publisher_profiles
  FOR SELECT TO authenticated USING (public.is_webmaster(auth.uid()));

DROP POLICY IF EXISTS "Webmaster views all media plan requests" ON public.media_plan_requests;
CREATE POLICY "Webmaster views all media plan requests" ON public.media_plan_requests
  FOR SELECT TO authenticated USING (public.is_webmaster(auth.uid()));

DROP POLICY IF EXISTS "Webmaster views all client checkouts" ON public.client_checkouts;
CREATE POLICY "Webmaster views all client checkouts" ON public.client_checkouts
  FOR SELECT TO authenticated USING (public.is_webmaster(auth.uid()));

DROP POLICY IF EXISTS "Webmaster views all campaigns" ON public.campaigns;
CREATE POLICY "Webmaster views all campaigns" ON public.campaigns
  FOR SELECT TO authenticated USING (public.is_webmaster(auth.uid()));

DROP POLICY IF EXISTS "Webmaster views all inventory reviews" ON public.inventory_reviews;
CREATE POLICY "Webmaster views all inventory reviews" ON public.inventory_reviews
  FOR SELECT TO authenticated USING (public.is_webmaster(auth.uid()));

-- Tenant status control
CREATE OR REPLACE FUNCTION public.webmaster_set_tenant_status(_tenant_id uuid, _status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_webmaster(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _status NOT IN ('active','suspended') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  UPDATE public.tenants SET status = _status, updated_at = now() WHERE id = _tenant_id;
  PERFORM public.log_audit('tenant.' || CASE WHEN _status = 'active' THEN 'reactivated' ELSE 'suspended' END,
    _tenant_id, jsonb_build_object('status', _status));
END; $$;

-- Member (super admin / agent) status control
CREATE OR REPLACE FUNCTION public.webmaster_set_member_status(_member_id uuid, _status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE m record;
BEGIN
  IF NOT public.is_webmaster(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _status NOT IN ('active','disabled') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  SELECT * INTO m FROM public.tenant_members WHERE id = _member_id;
  IF m IS NULL THEN RAISE EXCEPTION 'Member not found'; END IF;
  UPDATE public.tenant_members SET status = _status, updated_at = now() WHERE id = _member_id;
  PERFORM public.log_audit(m.member_role || '.' || CASE WHEN _status = 'active' THEN 'reactivated' ELSE 'disabled' END,
    _member_id, jsonb_build_object('user_id', m.user_id, 'tenant_id', m.tenant_id, 'email', m.email));
END; $$;

-- Invitation lifecycle
CREATE OR REPLACE FUNCTION public.webmaster_cancel_invitation(_invitation_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_webmaster(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.tenant_invitations SET revoked_at = now()
  WHERE id = _invitation_id AND accepted_at IS NULL;
  PERFORM public.log_audit('invitation.cancelled', _invitation_id, '{}'::jsonb);
END; $$;

CREATE OR REPLACE FUNCTION public.webmaster_reissue_invitation(_invitation_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE inv record;
BEGIN
  IF NOT public.is_webmaster(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO inv FROM public.tenant_invitations WHERE id = _invitation_id FOR UPDATE;
  IF inv IS NULL THEN RAISE EXCEPTION 'Invitation not found'; END IF;
  IF inv.accepted_at IS NOT NULL THEN RAISE EXCEPTION 'This invitation was already accepted'; END IF;
  UPDATE public.tenant_invitations
  SET token = encode(gen_random_bytes(24), 'hex'),
      expires_at = now() + interval '7 days',
      revoked_at = NULL
  WHERE id = _invitation_id;
  PERFORM public.log_audit('invitation.reissued', _invitation_id, jsonb_build_object('email', inv.email));
  RETURN _invitation_id;
END; $$;

-- Final platform-level inventory verification (webmaster only)
CREATE OR REPLACE FUNCTION public.webmaster_verify_inventory(_ad_space_id uuid, _decision text, _notes text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_webmaster(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _decision NOT IN ('approved','rejected','revision_required','pending') THEN RAISE EXCEPTION 'Invalid decision'; END IF;
  UPDATE public.ad_spaces
  SET platform_verification_status = _decision,
      platform_review_notes = _notes,
      platform_verified_at = now(),
      platform_verified_by = auth.uid()
  WHERE id = _ad_space_id;
  PERFORM public.log_audit('inventory.' || _decision, _ad_space_id, jsonb_build_object('notes', _notes));
END; $$;

REVOKE EXECUTE ON FUNCTION public.webmaster_set_tenant_status(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.webmaster_set_member_status(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.webmaster_cancel_invitation(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.webmaster_reissue_invitation(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.webmaster_verify_inventory(uuid, text, text) FROM anon;
