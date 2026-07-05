ALTER TABLE public.publisher_profiles
  ADD COLUMN IF NOT EXISTS is_external_source boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS external_source_name text;

ALTER TABLE public.external_inventory
  ADD COLUMN IF NOT EXISTS published_ad_space_id uuid REFERENCES public.ad_spaces(id) ON DELETE SET NULL;