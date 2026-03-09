
-- Create a SECURITY DEFINER function to get the current user's email
-- This avoids "permission denied for table users" errors in RLS policies
CREATE OR REPLACE FUNCTION public.get_auth_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT email::text FROM auth.users WHERE id = auth.uid()
$$;

-- Drop the broken policy that references auth.users inline
DROP POLICY IF EXISTS "Advertisers can view listings linked by email" ON public.ad_spaces;

-- Recreate using the SECURITY DEFINER function
CREATE POLICY "Advertisers can view listings linked by email"
ON public.ad_spaces
FOR SELECT
TO authenticated
USING (
  (specifications->>'contact_email' = public.get_auth_email())
  AND has_role(auth.uid(), 'advertiser'::app_role)
);
