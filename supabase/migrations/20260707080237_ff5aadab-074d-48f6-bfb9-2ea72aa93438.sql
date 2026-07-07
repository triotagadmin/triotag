DO $$
DECLARE
  _uid uuid := '7c27c8ea-6a3a-485b-b1b3-b6ad4bfa902e';
  _ad  uuid := '3ebbf4aa-db70-4df8-8d04-584bf26bec21';
BEGIN
  DELETE FROM public.ad_spaces WHERE id = _ad;
  DELETE FROM public.ad_spaces WHERE publisher_id IN (SELECT id FROM public.publisher_profiles WHERE user_id = _uid);
  DELETE FROM public.ad_spaces WHERE advertiser_id = _uid;
  DELETE FROM public.publisher_profiles WHERE user_id = _uid;
  DELETE FROM public.advertiser_profiles WHERE user_id = _uid;
  DELETE FROM public.print_partner_profiles WHERE user_id = _uid;
  DELETE FROM public.user_roles WHERE user_id = _uid;
  DELETE FROM auth.users WHERE id = _uid;
END $$;