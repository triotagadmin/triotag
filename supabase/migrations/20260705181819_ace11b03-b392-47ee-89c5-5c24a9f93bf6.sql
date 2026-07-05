ALTER TABLE public.ad_spaces ADD COLUMN IF NOT EXISTS external_ref_id text;
COMMENT ON COLUMN public.ad_spaces.external_ref_id IS 'SSP/exchange own identifier for this screen/placement (e.g. Broadsign screen ID). Used to match incoming OpenRTB bid request dooh.id back to the correct ad_spaces row. Null for TrioTag house inventory and retailer/agent-registered inventory without an external RTB exchange.';

ALTER TABLE public.external_inventory ADD COLUMN IF NOT EXISTS external_ref_id text;
COMMENT ON COLUMN public.external_inventory.external_ref_id IS 'SSP/exchange own identifier for this screen/placement (e.g. Broadsign screen ID). Used to match incoming OpenRTB bid request dooh.id back to the correct external_inventory row before publishing.';

CREATE INDEX IF NOT EXISTS idx_ad_spaces_external_ref_id ON public.ad_spaces(external_ref_id) WHERE external_ref_id IS NOT NULL;