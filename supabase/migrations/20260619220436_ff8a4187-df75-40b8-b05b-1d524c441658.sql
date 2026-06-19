alter table public.media_plan_requests
  add column if not exists ooh_units integer default 0,
  add column if not exists dooh_units integer default 0,
  add column if not exists aooh_units integer default 0;