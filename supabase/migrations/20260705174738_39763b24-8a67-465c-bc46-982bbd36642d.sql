ALTER TABLE public.publisher_profiles ADD COLUMN IF NOT EXISTS is_house_account boolean NOT NULL DEFAULT false;

CREATE TABLE public.campaign_ad_space_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.brand_campaigns(id) ON DELETE CASCADE,
  ad_space_id uuid NOT NULL REFERENCES public.ad_spaces(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, ad_space_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_ad_space_targets TO authenticated;
GRANT ALL ON public.campaign_ad_space_targets TO service_role;

ALTER TABLE public.campaign_ad_space_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand advertisers manage own campaign targets"
  ON public.campaign_ad_space_targets
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.brand_campaigns bc
      JOIN public.brand_advertiser_profiles bap ON bap.id = bc.brand_advertiser_id
      WHERE bc.id = campaign_ad_space_targets.campaign_id
        AND bap.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.brand_campaigns bc
      JOIN public.brand_advertiser_profiles bap ON bap.id = bc.brand_advertiser_id
      WHERE bc.id = campaign_ad_space_targets.campaign_id
        AND bap.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to campaign targets"
  ON public.campaign_ad_space_targets
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));