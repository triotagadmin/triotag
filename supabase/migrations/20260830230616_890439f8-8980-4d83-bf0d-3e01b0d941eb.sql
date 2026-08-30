ALTER TABLE public.social_scanner_leads
  ADD COLUMN IF NOT EXISTS formatted_address text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS location_status text,
  ADD COLUMN IF NOT EXISTS location_confidence integer,
  ADD COLUMN IF NOT EXISTS location_evidence_url text,
  ADD COLUMN IF NOT EXISTS is_philippines boolean,
  ADD COLUMN IF NOT EXISTS ph_evidence jsonb NOT NULL DEFAULT '[]'::jsonb;