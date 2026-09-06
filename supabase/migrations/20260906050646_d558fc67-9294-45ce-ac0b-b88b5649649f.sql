ALTER TABLE public.media_plan_requests
  ADD COLUMN IF NOT EXISTS preferred_end_date date,
  ALTER COLUMN estimated_price DROP NOT NULL;
