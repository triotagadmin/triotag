ALTER TABLE public.ad_spaces ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE public.ad_spaces ADD COLUMN IF NOT EXISTS longitude numeric;
COMMENT ON COLUMN public.ad_spaces.latitude IS 'Real geographic latitude of the ad space, needed for radius-based inventory search in the DSP. Existing rows registered before this migration will have null values until backfilled.';
COMMENT ON COLUMN public.ad_spaces.longitude IS 'Real geographic longitude of the ad space, needed for radius-based inventory search in the DSP. Existing rows registered before this migration will have null values until backfilled.';
CREATE INDEX IF NOT EXISTS idx_ad_spaces_lat_lng ON public.ad_spaces(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;