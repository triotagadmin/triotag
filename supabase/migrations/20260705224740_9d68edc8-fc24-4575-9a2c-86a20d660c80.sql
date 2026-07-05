CREATE TABLE public.campaign_spend_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.brand_campaigns(id) ON DELETE CASCADE,
  ad_space_id uuid NOT NULL REFERENCES public.ad_spaces(id) ON DELETE CASCADE,
  bid_id text NOT NULL,
  amount numeric NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('win', 'billed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.campaign_spend_ledger TO authenticated;
GRANT ALL ON public.campaign_spend_ledger TO service_role;

ALTER TABLE public.campaign_spend_ledger ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_campaign_spend_ledger_campaign ON public.campaign_spend_ledger(campaign_id, event_type);

CREATE POLICY "Brand advertisers can view their own spend"
  ON public.campaign_spend_ledger
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.brand_campaigns bc
      JOIN public.brand_advertiser_profiles bap ON bap.id = bc.brand_advertiser_id
      WHERE bc.id = campaign_spend_ledger.campaign_id
        AND bap.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to spend ledger"
  ON public.campaign_spend_ledger
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));