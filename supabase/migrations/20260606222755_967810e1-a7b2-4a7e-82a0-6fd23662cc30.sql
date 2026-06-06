CREATE TABLE IF NOT EXISTS public.campaign_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id text NOT NULL,
  email text NOT NULL,
  subscribed boolean NOT NULL DEFAULT false,
  subscribe_token text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, email)
);

GRANT ALL ON public.campaign_subscriptions TO service_role;

ALTER TABLE public.campaign_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only_all" ON public.campaign_subscriptions
  FOR ALL USING (false) WITH CHECK (false);