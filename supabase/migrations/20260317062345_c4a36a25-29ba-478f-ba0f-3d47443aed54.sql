-- Allow any authenticated user to read advertiser_branches that are public ad space listing locations
CREATE POLICY "Anyone can view public listing branches"
ON public.advertiser_branches
FOR SELECT
TO authenticated
USING (is_ad_space_listing = true);