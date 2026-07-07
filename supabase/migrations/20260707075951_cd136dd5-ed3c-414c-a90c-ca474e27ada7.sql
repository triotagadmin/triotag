CREATE OR REPLACE FUNCTION public.ad_space_owner_exists(_publisher_id uuid, _advertiser_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (_advertiser_id IS NOT NULL AND EXISTS (SELECT 1 FROM auth.users WHERE id = _advertiser_id))
    OR
    (_publisher_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.publisher_profiles pp
      JOIN auth.users u ON u.id = pp.user_id
      WHERE pp.id = _publisher_id
    ));
$$;

GRANT EXECUTE ON FUNCTION public.ad_space_owner_exists(uuid, uuid) TO authenticated, anon;