alter table public.media_plan_requests
  add column if not exists paymongo_checkout_id text,
  add column if not exists paid_at timestamptz,
  add column if not exists requester_email text;