-- Fix security definer view warning by using SECURITY INVOKER
DROP VIEW IF EXISTS public.advertiser_profiles_public;

CREATE VIEW public.advertiser_profiles_public 
WITH (security_invoker = true) AS
SELECT 
  id,
  user_id,
  status,
  company_name,
  company_description,
  website_url,
  created_at,
  updated_at
FROM public.advertiser_profiles
WHERE status = 'approved';

COMMENT ON VIEW public.advertiser_profiles_public IS 'Public view of advertiser profiles excluding sensitive contact information (email, phone)';