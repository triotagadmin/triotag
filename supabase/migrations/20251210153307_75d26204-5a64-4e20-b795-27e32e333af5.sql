-- Fix 1: publisher_profiles - Create view for public access without sensitive data
-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view approved profiles" ON public.publisher_profiles;

-- Create a secure view that excludes sensitive contact information
CREATE OR REPLACE VIEW public.publisher_profiles_public AS
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
  -- Explicitly excluding: contact_email, contact_phone, verification_token, token_expires
FROM public.publisher_profiles
WHERE verification_status = 'approved';

-- Grant access to the view for authenticated and anon users
GRANT SELECT ON public.publisher_profiles_public TO anon, authenticated;

-- Fix 2: newsletter_subscribers - Remove overly permissive UPDATE policy
DROP POLICY IF EXISTS "Subscribers can update their own subscription" ON public.newsletter_subscribers;

-- Create restricted UPDATE policy - only admins can update subscriptions
CREATE POLICY "Admins can update newsletter subscribers" 
ON public.newsletter_subscribers 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Note: DELETE policy already exists for admins only, which is correct