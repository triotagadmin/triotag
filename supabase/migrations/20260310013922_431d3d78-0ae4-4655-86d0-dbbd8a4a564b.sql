ALTER TABLE public.advertiser_branches
  ADD COLUMN IF NOT EXISTS is_ad_space_listing boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS city text;