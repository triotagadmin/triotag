CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE public.tenant_invitations
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS position text,
  ADD COLUMN IF NOT EXISTS token_hash text,
  ADD COLUMN IF NOT EXISTS last_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS send_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS tenant_invitations_token_hash_idx ON public.tenant_invitations (token_hash);

ALTER TABLE public.tenant_members
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz,
  ADD COLUMN IF NOT EXISTS removed_at timestamptz,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS position text;

DROP POLICY IF EXISTS "Super admin creates own tenant agent invitations" ON public.tenant_invitations;
CREATE POLICY "Super admin creates own tenant agent invitations"
ON public.tenant_invitations FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = public.current_tenant_id()
  AND public.current_tenant_role() = 'super_admin'
  AND invited_role = 'agent'
);