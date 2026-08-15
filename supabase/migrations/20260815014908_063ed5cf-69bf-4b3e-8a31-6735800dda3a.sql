-- Guard: abort if any retailer rows remain
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role::text = 'retailer') THEN
    RAISE EXCEPTION 'retailer rows still exist in user_roles';
  END IF;
END $$;

-- 1. Snapshot every policy (they will be cascaded away with has_role)
CREATE TEMP TABLE _policy_snapshot ON COMMIT DROP AS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname IN ('public','storage');

-- 2. Drop functions whose signatures depend on the old enum (cascades policies)
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role) CASCADE;
DROP FUNCTION IF EXISTS public.set_own_role(public.app_role) CASCADE;

-- 3. Recreate the enum without 'retailer'
ALTER TYPE public.app_role RENAME TO app_role_old;
CREATE TYPE public.app_role AS ENUM ('admin','publisher','advertiser','talent','print_partner','agent','brand_advertiser');
ALTER TABLE public.user_roles ALTER COLUMN role TYPE public.app_role USING role::text::public.app_role;
DROP TYPE public.app_role_old;

-- 4. Recreate the role helper functions against the new enum
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.set_own_role(_role public.app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.user_roles SET role = _role WHERE user_id = auth.uid();
END;
$function$;

-- Rebind SQL functions whose bodies referenced the old enum
CREATE OR REPLACE FUNCTION public.is_verified_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_profiles ap
    JOIN public.user_roles ur ON ur.user_id = ap.user_id
    WHERE ap.user_id = _user_id
      AND ur.role = 'admin'
      AND ap.status = 'verified'
  )
$function$;

-- 5. Replay every snapshotted policy that no longer exists
DO $$
DECLARE
  p record;
  stmt text;
BEGIN
  FOR p IN SELECT * FROM _policy_snapshot s
           WHERE NOT EXISTS (
             SELECT 1 FROM pg_policies x
             WHERE x.schemaname = s.schemaname AND x.tablename = s.tablename AND x.policyname = s.policyname
           )
  LOOP
    stmt := format('CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s',
      p.policyname, p.schemaname, p.tablename,
      CASE WHEN p.permissive = 'PERMISSIVE' THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
      p.cmd,
      array_to_string(p.roles, ', '));
    IF p.qual IS NOT NULL THEN
      stmt := stmt || ' USING (' || replace(p.qual, 'app_role_old', 'app_role') || ')';
    END IF;
    IF p.with_check IS NOT NULL THEN
      stmt := stmt || ' WITH CHECK (' || replace(p.with_check, 'app_role_old', 'app_role') || ')';
    END IF;
    EXECUTE stmt;
  END LOOP;
END $$;