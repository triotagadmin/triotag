CREATE OR REPLACE FUNCTION public.get_active_inventory_all()
RETURNS SETOF public.ad_spaces
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.*
  FROM public.ad_spaces a
  WHERE a.approval_status = 'approved'
    AND COALESCE(a.agent_disconnected, false) = false
    AND (
      (a.advertiser_id IS NOT NULL AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = a.advertiser_id))
      OR
      (a.publisher_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.publisher_profiles pp
        JOIN auth.users u ON u.id = pp.user_id
        WHERE pp.id = a.publisher_id
      ))
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_active_inventory_all() TO authenticated, anon;