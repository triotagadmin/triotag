ALTER TABLE public.ad_spaces ADD COLUMN IF NOT EXISTS media_types public.media_type[] NOT NULL DEFAULT '{}';

UPDATE public.ad_spaces
SET media_types = ARRAY[media_type]
WHERE media_types = '{}' AND media_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ad_spaces_media_types ON public.ad_spaces USING GIN (media_types);

COMMENT ON COLUMN public.ad_spaces.media_types IS 'Holds ALL formats this listing offers (a venue can be OOH + DOOH + AOOH at once). The singular media_type column is kept as the primary format for backward compatibility and should always be kept in sync with media_types[1] on create/update.';