
-- Enum for subscription status
DO $$ BEGIN
  CREATE TYPE public.venue_subscription_status AS ENUM ('pending', 'active', 'unsubscribed', 'expired');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.venue_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_space_id UUID REFERENCES public.ad_spaces(id) ON DELETE SET NULL,
  venue_name TEXT,
  contact_person TEXT,
  email TEXT NOT NULL,
  verification_token TEXT NOT NULL UNIQUE,
  verification_sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verification_expiry TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  verified_at TIMESTAMPTZ,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  subscription_status public.venue_subscription_status NOT NULL DEFAULT 'pending',
  last_contacted_at TIMESTAMPTZ,
  campaign_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agent_id, email)
);

CREATE INDEX IF NOT EXISTS idx_venue_subscriptions_agent ON public.venue_subscriptions(agent_id);
CREATE INDEX IF NOT EXISTS idx_venue_subscriptions_email ON public.venue_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_venue_subscriptions_token ON public.venue_subscriptions(verification_token);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.venue_subscriptions TO authenticated;
GRANT ALL ON public.venue_subscriptions TO service_role;

ALTER TABLE public.venue_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents manage their own subscriptions"
  ON public.venue_subscriptions FOR ALL
  TO authenticated
  USING (agent_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (agent_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_venue_subscriptions_updated_at
BEFORE UPDATE ON public.venue_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Messages / campaign communications log
CREATE TABLE IF NOT EXISTS public.venue_subscription_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.venue_subscriptions(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'campaign_invitation',
  tracking_token TEXT NOT NULL UNIQUE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered BOOLEAN NOT NULL DEFAULT false,
  opens INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  first_opened_at TIMESTAMPTZ,
  last_opened_at TIMESTAMPTZ,
  first_clicked_at TIMESTAMPTZ,
  last_clicked_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vsm_subscription ON public.venue_subscription_messages(subscription_id);
CREATE INDEX IF NOT EXISTS idx_vsm_agent ON public.venue_subscription_messages(agent_id);
CREATE INDEX IF NOT EXISTS idx_vsm_token ON public.venue_subscription_messages(tracking_token);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.venue_subscription_messages TO authenticated;
GRANT ALL ON public.venue_subscription_messages TO service_role;

ALTER TABLE public.venue_subscription_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents manage their own venue messages"
  ON public.venue_subscription_messages FOR ALL
  TO authenticated
  USING (agent_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (agent_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
