
-- Allow advertisers to view ad_spaces where the contact_email in specifications matches their email
CREATE POLICY "Advertisers can view listings linked by email"
ON public.ad_spaces FOR SELECT
TO authenticated
USING (
  specifications->>'contact_email' = (
    SELECT email::text FROM auth.users WHERE id = auth.uid()
  )
  AND has_role(auth.uid(), 'advertiser'::app_role)
);
