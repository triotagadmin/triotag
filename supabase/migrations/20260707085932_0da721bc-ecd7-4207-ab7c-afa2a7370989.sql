ALTER TABLE public.brand_campaigns
  ADD COLUMN IF NOT EXISTS location_count integer,
  ADD COLUMN IF NOT EXISTS location_types text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS scope_name text;