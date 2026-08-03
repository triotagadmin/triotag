GRANT INSERT ON public.media_plan_requests TO anon;

CREATE POLICY "Guests can submit media plan requests"
  ON public.media_plan_requests FOR INSERT TO anon
  WITH CHECK (advertiser_id IS NULL);

CREATE POLICY "Authenticated users can submit media plan requests"
  ON public.media_plan_requests FOR INSERT TO authenticated
  WITH CHECK (advertiser_id IS NULL OR advertiser_id = auth.uid());