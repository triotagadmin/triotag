-- Allow anyone to view approved campaigns (similar to ad_spaces policy)
CREATE POLICY "Anyone can view approved campaigns"
ON public.campaigns
FOR SELECT
TO public
USING (status = 'approved'::approval_status);