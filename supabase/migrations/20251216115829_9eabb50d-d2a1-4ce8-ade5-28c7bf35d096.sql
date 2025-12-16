-- Create a public view for advertiser_profiles that excludes sensitive contact info
CREATE OR REPLACE VIEW public.advertiser_profiles_public AS
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

-- Drop the existing permissive policy that exposes contact info
DROP POLICY IF EXISTS "Anyone can view approved advertiser profiles" ON public.advertiser_profiles;

-- Create a new restrictive policy - only admins and the profile owner can see full details including contact info
-- Admins already have a SELECT policy, and advertisers already have "Advertisers can view their own profile"
-- So we don't need to add new policies, just remove the public one

COMMENT ON VIEW public.advertiser_profiles_public IS 'Public view of advertiser profiles excluding sensitive contact information (email, phone)';