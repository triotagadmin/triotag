-- Fix the SECURITY DEFINER view issue by explicitly setting SECURITY INVOKER
DROP VIEW IF EXISTS public.publisher_profiles_public;

CREATE VIEW public.publisher_profiles_public 
WITH (security_invoker = true) AS
SELECT 
  id,
  user_id,
  publisher_type,
  agent_role,
  verification_status,
  business_name,
  location,
  description,
  social_media,
  portfolio_media,
  metrics,
  created_at,
  updated_at
FROM public.publisher_profiles
WHERE verification_status = 'approved';

-- Re-grant access to the view
GRANT SELECT ON public.publisher_profiles_public TO anon, authenticated;