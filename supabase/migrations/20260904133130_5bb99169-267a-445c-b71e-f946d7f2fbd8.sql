
-- ============ TENANTS ============
CREATE SEQUENCE IF NOT EXISTS public.tenant_code_seq;

CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  company_email text,
  contact_name text,
  contact_phone text,
  notes text,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT ALL ON public.tenants TO service_role;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- ============ WEBMASTER ============
CREATE TABLE public.webmasters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT webmaster_email_allowlist CHECK (lower(email) = 'www.triotag@gmail.com')
);
GRANT SELECT ON public.webmasters TO authenticated;
GRANT ALL ON public.webmasters TO service_role;
ALTER TABLE public.webmasters ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.enforce_single_webmaster()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.webmasters WHERE user_id <> NEW.user_id) THEN
    RAISE EXCEPTION 'A webmaster already exists';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_single_webmaster BEFORE INSERT OR UPDATE ON public.webmasters
FOR EACH ROW EXECUTE FUNCTION public.enforce_single_webmaster();

CREATE OR REPLACE FUNCTION public.is_webmaster(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.webmasters WHERE user_id = _user_id);
$$;

-- ============ TENANT MEMBERS ============
CREATE TABLE public.tenant_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_role text NOT NULL CHECK (member_role IN ('super_admin','agent')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  full_name text,
  email text,
  invited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.tenant_members TO authenticated;
GRANT ALL ON public.tenant_members TO service_role;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tenant_id FROM public.tenant_members
  WHERE user_id = auth.uid() AND status = 'active';
$$;

CREATE OR REPLACE FUNCTION public.current_tenant_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT member_role FROM public.tenant_members
  WHERE user_id = auth.uid() AND status = 'active';
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_super_admin(_user_id uuid, _tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE user_id = _user_id AND tenant_id = _tenant_id
      AND member_role = 'super_admin' AND status = 'active'
  );
$$;

-- ============ INVITATIONS ============
CREATE TABLE public.tenant_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  invited_role text NOT NULL CHECK (invited_role IN ('super_admin','agent')),
  token text NOT NULL UNIQUE,
  invited_by uuid,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.tenant_invitations TO authenticated;
GRANT ALL ON public.tenant_invitations TO service_role;
ALTER TABLE public.tenant_invitations ENABLE ROW LEVEL SECURITY;

-- ============ AUDIT LOGS ============
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  tenant_id uuid,
  actor_role text,
  action text NOT NULL,
  record_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.log_audit(_action text, _record_id uuid, _details jsonb DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, tenant_id, actor_role, action, record_id, details)
  VALUES (
    auth.uid(),
    public.current_tenant_id(),
    CASE WHEN public.is_webmaster(auth.uid()) THEN 'webmaster' ELSE public.current_tenant_role() END,
    _action, _record_id, COALESCE(_details, '{}'::jsonb)
  );
END;
$$;

-- ============ POLICIES ============
CREATE POLICY "Webmaster manages tenants" ON public.tenants FOR ALL TO authenticated
  USING (public.is_webmaster(auth.uid())) WITH CHECK (public.is_webmaster(auth.uid()));
CREATE POLICY "Members view own tenant" ON public.tenants FOR SELECT TO authenticated
  USING (id = public.current_tenant_id());

CREATE POLICY "Webmaster views webmaster row" ON public.webmasters FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Webmaster manages members" ON public.tenant_members FOR ALL TO authenticated
  USING (public.is_webmaster(auth.uid())) WITH CHECK (public.is_webmaster(auth.uid()));
CREATE POLICY "Members view own tenant members" ON public.tenant_members FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());
CREATE POLICY "Super admin toggles own tenant agents" ON public.tenant_members FOR UPDATE TO authenticated
  USING (member_role = 'agent' AND public.is_tenant_super_admin(auth.uid(), tenant_id))
  WITH CHECK (member_role = 'agent' AND public.is_tenant_super_admin(auth.uid(), tenant_id));

CREATE POLICY "Webmaster manages invitations" ON public.tenant_invitations FOR ALL TO authenticated
  USING (public.is_webmaster(auth.uid())) WITH CHECK (public.is_webmaster(auth.uid()));
CREATE POLICY "Super admin views own tenant invitations" ON public.tenant_invitations FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.current_tenant_role() = 'super_admin');
CREATE POLICY "Super admin revokes own tenant invitations" ON public.tenant_invitations FOR UPDATE TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.current_tenant_role() = 'super_admin' AND invited_role = 'agent')
  WITH CHECK (tenant_id = public.current_tenant_id() AND invited_role = 'agent');

CREATE POLICY "Webmaster views all audit logs" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_webmaster(auth.uid()));
CREATE POLICY "Tenant members view own tenant audit logs" ON public.audit_logs FOR SELECT TO authenticated
  USING (tenant_id IS NOT NULL AND tenant_id = public.current_tenant_id());
CREATE POLICY "Users insert own audit logs" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============ WEBMASTER CLAIM ============
CREATE OR REPLACE FUNCTION public.claim_webmaster()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE em text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT lower(email::text) INTO em FROM auth.users WHERE id = auth.uid();
  IF em IS DISTINCT FROM 'www.triotag@gmail.com' THEN
    RAISE EXCEPTION 'Access denied: this account is not authorized as webmaster';
  END IF;
  INSERT INTO public.webmasters (user_id, email) VALUES (auth.uid(), em)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN true;
END;
$$;

-- ============ TENANT CREATION ============
CREATE OR REPLACE FUNCTION public.create_tenant(
  _name text, _company_email text DEFAULT NULL, _contact_name text DEFAULT NULL,
  _contact_phone text DEFAULT NULL, _notes text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_id uuid;
BEGIN
  IF NOT public.is_webmaster(auth.uid()) THEN RAISE EXCEPTION 'Only the webmaster can create tenants'; END IF;
  IF coalesce(trim(_name),'') = '' THEN RAISE EXCEPTION 'Tenant name is required'; END IF;
  INSERT INTO public.tenants (code, name, company_email, contact_name, contact_phone, notes, created_by)
  VALUES ('T' || lpad(nextval('public.tenant_code_seq')::text, 3, '0'),
          trim(_name), _company_email, _contact_name, _contact_phone, _notes, auth.uid())
  RETURNING id INTO new_id;
  PERFORM public.log_audit('tenant.created', new_id, jsonb_build_object('name', _name));
  RETURN new_id;
END;
$$;

-- ============ INVITATIONS ============
CREATE OR REPLACE FUNCTION public.invite_member(
  _email text, _role text, _tenant_id uuid DEFAULT NULL, _full_name text DEFAULT NULL)
RETURNS TABLE(invitation_id uuid, token text, tenant_id uuid) 
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target_tenant uuid; new_token text; new_id uuid;
BEGIN
  IF coalesce(trim(_email),'') = '' THEN RAISE EXCEPTION 'Email is required'; END IF;
  IF _role = 'super_admin' THEN
    IF NOT public.is_webmaster(auth.uid()) THEN RAISE EXCEPTION 'Only the webmaster can invite super admins'; END IF;
    IF _tenant_id IS NULL THEN RAISE EXCEPTION 'A tenant must be selected'; END IF;
    target_tenant := _tenant_id;
  ELSIF _role = 'agent' THEN
    IF public.is_webmaster(auth.uid()) THEN
      IF _tenant_id IS NULL THEN RAISE EXCEPTION 'A tenant must be selected'; END IF;
      target_tenant := _tenant_id;
    ELSE
      target_tenant := public.current_tenant_id();
      IF target_tenant IS NULL OR public.current_tenant_role() <> 'super_admin' THEN
        RAISE EXCEPTION 'Only a super admin can invite agents';
      END IF;
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid role';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.tenant_members tm
    JOIN auth.users u ON u.id = tm.user_id
    WHERE lower(u.email::text) = lower(trim(_email))
  ) THEN
    RAISE EXCEPTION 'That email already belongs to a tenant account';
  END IF;

  new_token := encode(gen_random_bytes(24), 'hex');
  INSERT INTO public.tenant_invitations (tenant_id, email, full_name, invited_role, token, invited_by)
  VALUES (target_tenant, lower(trim(_email)), _full_name, _role, new_token, auth.uid())
  RETURNING id INTO new_id;
  PERFORM public.log_audit('invitation.created', new_id,
    jsonb_build_object('email', lower(trim(_email)), 'role', _role, 'tenant_id', target_tenant));
  RETURN QUERY SELECT new_id, new_token, target_tenant;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_invitation_preview(_token text)
RETURNS TABLE(email text, invited_role text, tenant_name text, expires_at timestamptz, accepted boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT i.email, i.invited_role, t.name, i.expires_at, (i.accepted_at IS NOT NULL)
  FROM public.tenant_invitations i JOIN public.tenants t ON t.id = i.tenant_id
  WHERE i.token = _token AND i.revoked_at IS NULL
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.accept_invitation(_token text)
RETURNS TABLE(member_role text, tenant_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
  END IF;

  UPDATE public.tenant_invitations
  SET accepted_at = now(), accepted_by = auth.uid() WHERE id = inv.id;

  PERFORM public.log_audit('invitation.accepted', inv.id,
    jsonb_build_object('role', inv.invited_role, 'tenant_id', inv.tenant_id));
  RETURN QUERY SELECT inv.invited_role, inv.tenant_id;
END;
$$;

-- ============ TENANT OWNERSHIP ON RECORDS ============
ALTER TABLE public.ad_spaces
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS agent_id uuid;
ALTER TABLE public.publisher_profiles
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS agent_id uuid;

CREATE OR REPLACE FUNCTION public.assign_tenant_ownership()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t uuid; r text;
BEGIN
  SELECT tenant_id, member_role INTO t, r FROM public.tenant_members
  WHERE user_id = auth.uid() AND status = 'active';

  IF TG_OP = 'INSERT' THEN
    IF t IS NOT NULL THEN
      NEW.tenant_id := t;
      IF NEW.agent_id IS NULL THEN NEW.agent_id := auth.uid(); END IF;
    ELSIF NOT public.is_webmaster(auth.uid()) THEN
      NEW.tenant_id := NULL;
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE: only the webmaster may change tenant ownership
  IF NOT public.is_webmaster(auth.uid()) THEN
    NEW.tenant_id := OLD.tenant_id;
    NEW.agent_id := OLD.agent_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ad_spaces_tenant_ownership BEFORE INSERT OR UPDATE ON public.ad_spaces
FOR EACH ROW EXECUTE FUNCTION public.assign_tenant_ownership();
CREATE TRIGGER trg_publisher_profiles_tenant_ownership BEFORE INSERT OR UPDATE ON public.publisher_profiles
FOR EACH ROW EXECUTE FUNCTION public.assign_tenant_ownership();

CREATE POLICY "Webmaster views all ad spaces" ON public.ad_spaces FOR SELECT TO authenticated
  USING (public.is_webmaster(auth.uid()));
CREATE POLICY "Webmaster updates all ad spaces" ON public.ad_spaces FOR UPDATE TO authenticated
  USING (public.is_webmaster(auth.uid())) WITH CHECK (public.is_webmaster(auth.uid()));
CREATE POLICY "Tenant members view own tenant ad spaces" ON public.ad_spaces FOR SELECT TO authenticated
  USING (tenant_id IS NOT NULL AND tenant_id = public.current_tenant_id());
CREATE POLICY "Tenant super admin updates own tenant ad spaces" ON public.ad_spaces FOR UPDATE TO authenticated
  USING (tenant_id IS NOT NULL AND tenant_id = public.current_tenant_id() AND public.current_tenant_role() = 'super_admin')
  WITH CHECK (tenant_id IS NOT NULL AND tenant_id = public.current_tenant_id());

CREATE POLICY "Webmaster views all publisher profiles" ON public.publisher_profiles FOR SELECT TO authenticated
  USING (public.is_webmaster(auth.uid()));
CREATE POLICY "Tenant members view own tenant publisher profiles" ON public.publisher_profiles FOR SELECT TO authenticated
  USING (tenant_id IS NOT NULL AND tenant_id = public.current_tenant_id());

-- ============ HARDEN SELF-SERVICE ROLE FUNCTION ============
CREATE OR REPLACE FUNCTION public.set_own_role(_role app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _role NOT IN ('talent'::app_role, 'brand_advertiser'::app_role) THEN
    RAISE EXCEPTION 'This role cannot be self-assigned';
  END IF;
  IF EXISTS (SELECT 1 FROM public.tenant_members WHERE user_id = auth.uid())
     OR public.is_webmaster(auth.uid()) THEN
    RAISE EXCEPTION 'Privileged accounts cannot change their own role';
  END IF;
  UPDATE public.user_roles SET role = _role WHERE user_id = auth.uid();
END;
$$;

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tenant_members_updated_at BEFORE UPDATE ON public.tenant_members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
