ALTER TABLE public.brand_campaigns
  ADD COLUMN IF NOT EXISTS campaign_type text,
  ADD COLUMN IF NOT EXISTS media_types text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS objective text,
  ADD COLUMN IF NOT EXISTS objective_notes text,
  ADD COLUMN IF NOT EXISTS audience jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS creative_mode text,
  ADD COLUMN IF NOT EXISTS creative_requirements jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS estimated_cost numeric,
  ADD COLUMN IF NOT EXISTS wizard_step integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS draft_state jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS campaign_ref text,
  ADD COLUMN IF NOT EXISTS submitted_at timestamp with time zone;

ALTER TABLE public.brand_campaigns ALTER COLUMN budget SET DEFAULT 0;

CREATE SEQUENCE IF NOT EXISTS public.brand_campaign_ref_seq START 1;

CREATE OR REPLACE FUNCTION public.set_brand_campaign_ref()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.campaign_ref IS NULL THEN
    NEW.campaign_ref := 'TRI-CAMP-' || lpad(nextval('public.brand_campaign_ref_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_brand_campaign_ref ON public.brand_campaigns;
CREATE TRIGGER trg_set_brand_campaign_ref
BEFORE INSERT ON public.brand_campaigns
FOR EACH ROW EXECUTE FUNCTION public.set_brand_campaign_ref();

UPDATE public.brand_campaigns
SET campaign_ref = 'TRI-CAMP-' || lpad(nextval('public.brand_campaign_ref_seq')::text, 6, '0')
WHERE campaign_ref IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS brand_campaigns_campaign_ref_key ON public.brand_campaigns (campaign_ref);

ALTER TABLE public.campaign_ad_space_targets
  ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS ad_format text,
  ADD COLUMN IF NOT EXISTS unit_rate numeric;

CREATE UNIQUE INDEX IF NOT EXISTS campaign_ad_space_targets_unique
  ON public.campaign_ad_space_targets (campaign_id, ad_space_id);