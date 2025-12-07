-- Drop and recreate the ad_spaces policy to include anon role
DROP POLICY IF EXISTS "Anyone can view approved ad spaces" ON public.ad_spaces;
CREATE POLICY "Anyone can view approved ad spaces" 
ON public.ad_spaces 
FOR SELECT 
TO public
USING (approval_status = 'approved'::approval_status);

-- Drop and recreate the publisher_profiles policy to include anon role
DROP POLICY IF EXISTS "Anyone can view approved profiles" ON public.publisher_profiles;
CREATE POLICY "Anyone can view approved profiles" 
ON public.publisher_profiles 
FOR SELECT 
TO public
USING (verification_status = 'approved'::approval_status);