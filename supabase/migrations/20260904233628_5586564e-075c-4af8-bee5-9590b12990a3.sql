
REVOKE ALL ON FUNCTION public.set_own_role(public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_own_role(public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.upsert_franchise_branch(uuid, text, text, double precision, double precision, integer, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_franchise_branch(uuid, text, text, double precision, double precision, integer, text, text) TO authenticated, service_role;
