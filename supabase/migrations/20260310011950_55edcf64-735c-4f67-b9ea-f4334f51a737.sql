
ALTER TABLE public.advertiser_franchises
  ADD COLUMN marketplace_status text NOT NULL DEFAULT 'inactive';
