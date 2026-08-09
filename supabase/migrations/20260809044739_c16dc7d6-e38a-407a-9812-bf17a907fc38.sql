
-- 1. Extend qr_codes
ALTER TABLE public.qr_codes
  ADD COLUMN IF NOT EXISTS qr_type text NOT NULL DEFAULT 'STANDARD',
  ADD COLUMN IF NOT EXISTS qr_ref text UNIQUE,
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS advertiser_id uuid,
  ADD COLUMN IF NOT EXISTS ad_space_id uuid REFERENCES public.ad_spaces(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS placement_label text,
  ADD COLUMN IF NOT EXISTS landing_title text,
  ADD COLUMN IF NOT EXISTS offer_cta text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS background_url text,
  ADD COLUMN IF NOT EXISTS brand_name text,
  ADD COLUMN IF NOT EXISTS terms_text text,
  ADD COLUMN IF NOT EXISTS privacy_policy_url text,
  ADD COLUMN IF NOT EXISTS privacy_policy_version text DEFAULT 'v1',
  ADD COLUMN IF NOT EXISTS terms_version text DEFAULT 'v1',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS qr_codes_qr_type_idx ON public.qr_codes(qr_type);
CREATE INDEX IF NOT EXISTS qr_codes_campaign_idx ON public.qr_codes(campaign_id);

DROP TRIGGER IF EXISTS update_qr_codes_updated_at ON public.qr_codes;
CREATE TRIGGER update_qr_codes_updated_at BEFORE UPDATE ON public.qr_codes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE SEQUENCE IF NOT EXISTS public.mobile_qr_ref_seq START 1;

CREATE OR REPLACE FUNCTION public.next_mobile_qr_ref()
RETURNS text LANGUAGE sql VOLATILE SET search_path = public AS $$
  SELECT 'MQR-' || lpad(nextval('public.mobile_qr_ref_seq')::text, 6, '0');
$$;
GRANT EXECUTE ON FUNCTION public.next_mobile_qr_ref() TO authenticated, service_role;

-- Admins manage all QR codes
DROP POLICY IF EXISTS "Admins manage all qr codes" ON public.qr_codes;
CREATE POLICY "Admins manage all qr codes" ON public.qr_codes
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.qr_codes TO authenticated;
GRANT ALL ON public.qr_codes TO service_role;

-- 2. Events
CREATE TABLE IF NOT EXISTS public.mobile_qr_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_id uuid NOT NULL REFERENCES public.qr_codes(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('scan','landing_view','form_start','form_submit','otp_sent','otp_verified','lead_created','offer_redeemed')),
  session_id text,
  user_agent text,
  referrer text,
  landing_page text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mobile_qr_events_qr_idx ON public.mobile_qr_events(qr_id);
CREATE INDEX IF NOT EXISTS mobile_qr_events_campaign_idx ON public.mobile_qr_events(campaign_id);
CREATE INDEX IF NOT EXISTS mobile_qr_events_type_idx ON public.mobile_qr_events(event_type);
CREATE INDEX IF NOT EXISTS mobile_qr_events_created_idx ON public.mobile_qr_events(created_at);
CREATE INDEX IF NOT EXISTS mobile_qr_events_session_idx ON public.mobile_qr_events(session_id);

GRANT SELECT ON public.mobile_qr_events TO authenticated;
GRANT ALL ON public.mobile_qr_events TO service_role;
ALTER TABLE public.mobile_qr_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all mobile qr events" ON public.mobile_qr_events
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners view their mobile qr events" ON public.mobile_qr_events
FOR SELECT TO authenticated USING (
  qr_id IN (SELECT id FROM public.qr_codes WHERE created_by = auth.uid() OR advertiser_id = auth.uid())
);

-- 3. Leads
CREATE TABLE IF NOT EXISTS public.mobile_qr_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_id uuid NOT NULL REFERENCES public.qr_codes(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  advertiser_id uuid,
  mobile_number text NOT NULL,
  mobile_verified boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  otp_provider text,
  consent_marketing boolean NOT NULL DEFAULT false,
  consent_timestamp timestamptz,
  privacy_policy_version text,
  terms_version text,
  source text DEFAULT 'mobile_qr',
  session_id text,
  offer_redeemed_at timestamptz,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, qr_id, mobile_number)
);
CREATE INDEX IF NOT EXISTS mobile_qr_leads_campaign_idx ON public.mobile_qr_leads(campaign_id);
CREATE INDEX IF NOT EXISTS mobile_qr_leads_qr_idx ON public.mobile_qr_leads(qr_id);
CREATE INDEX IF NOT EXISTS mobile_qr_leads_advertiser_idx ON public.mobile_qr_leads(advertiser_id);
CREATE INDEX IF NOT EXISTS mobile_qr_leads_number_idx ON public.mobile_qr_leads(mobile_number);
CREATE INDEX IF NOT EXISTS mobile_qr_leads_created_idx ON public.mobile_qr_leads(created_at);
CREATE INDEX IF NOT EXISTS mobile_qr_leads_verified_idx ON public.mobile_qr_leads(mobile_verified);

GRANT SELECT, DELETE ON public.mobile_qr_leads TO authenticated;
GRANT ALL ON public.mobile_qr_leads TO service_role;
ALTER TABLE public.mobile_qr_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all mobile leads" ON public.mobile_qr_leads
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete mobile leads" ON public.mobile_qr_leads
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Advertisers view their campaign leads" ON public.mobile_qr_leads
FOR SELECT TO authenticated USING (
  advertiser_id = auth.uid()
  OR campaign_id IN (SELECT id FROM public.campaigns WHERE advertiser_id = auth.uid())
);

DROP TRIGGER IF EXISTS update_mobile_qr_leads_updated_at ON public.mobile_qr_leads;
CREATE TRIGGER update_mobile_qr_leads_updated_at BEFORE UPDATE ON public.mobile_qr_leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Public landing-page lookup (exposes only presentation fields)
CREATE OR REPLACE FUNCTION public.get_mobile_qr_public(_qr_ref text)
RETURNS TABLE(
  id uuid, qr_ref text, name text, brand_name text, landing_title text,
  offer_cta text, description text, logo_url text, background_url text,
  terms_text text, privacy_policy_url text, privacy_policy_version text,
  terms_version text, destination_url text, status text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT q.id, q.qr_ref, q.name, q.brand_name, q.landing_title, q.offer_cta,
         q.description, q.logo_url, q.background_url, q.terms_text,
         q.privacy_policy_url, q.privacy_policy_version, q.terms_version,
         q.destination_url, q.status
  FROM public.qr_codes q
  WHERE q.qr_ref = _qr_ref
    AND q.qr_type = 'MOBILE_QR'
    AND q.status = 'active'
    AND (q.start_date IS NULL OR q.start_date <= current_date)
    AND (q.end_date IS NULL OR q.end_date >= current_date)
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_mobile_qr_public(text) TO anon, authenticated, service_role;
