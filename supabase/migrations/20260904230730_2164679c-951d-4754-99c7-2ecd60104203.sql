
REVOKE EXECUTE ON FUNCTION public.webmaster_set_tenant_status(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.webmaster_set_member_status(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.webmaster_cancel_invitation(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.webmaster_reissue_invitation(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.webmaster_verify_inventory(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.webmaster_set_tenant_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.webmaster_set_member_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.webmaster_cancel_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.webmaster_reissue_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.webmaster_verify_inventory(uuid, text, text) TO authenticated;
