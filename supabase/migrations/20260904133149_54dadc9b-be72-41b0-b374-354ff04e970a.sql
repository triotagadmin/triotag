
REVOKE EXECUTE ON FUNCTION public.enforce_single_webmaster() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.assign_tenant_ownership() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.log_audit(text, uuid, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_tenant_super_admin(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_webmaster(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.current_tenant_id() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.current_tenant_role() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.claim_webmaster() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.create_tenant(text, text, text, text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.invite_member(text, text, uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.accept_invitation(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_invitation_preview(text) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.is_tenant_super_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_webmaster(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_tenant_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_webmaster() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_tenant(text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.invite_member(text, text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_invitation_preview(text) TO authenticated;
