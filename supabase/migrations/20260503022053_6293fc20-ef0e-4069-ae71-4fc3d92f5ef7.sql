-- Media type enum
DO $$ BEGIN
  CREATE TYPE public.media_type AS ENUM ('OOH','DOOH','AOOH');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.ad_spaces
  ADD COLUMN IF NOT EXISTS media_type public.media_type NOT NULL DEFAULT 'OOH';

CREATE INDEX IF NOT EXISTS idx_ad_spaces_media_type ON public.ad_spaces(media_type);

-- AOOH Campaigns
CREATE TABLE IF NOT EXISTS public.aooh_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  advertiser_id uuid REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
  campaign_name text NOT NULL,
  audio_file_url text NOT NULL,
  audio_file_name text,
  audio_duration_sec integer,
  spot_duration text,
  script_notes text,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  start_date date,
  end_date date,
  play_frequency_min integer DEFAULT 30,
  max_plays_per_day integer DEFAULT 20,
  dayparts jsonb DEFAULT '["morning","afternoon","evening"]'::jsonb,
  total_plays integer NOT NULL DEFAULT 0,
  total_venues integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.aooh_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Advertisers manage own AOOH campaigns" ON public.aooh_campaigns
  FOR ALL TO authenticated
  USING (advertiser_id IN (SELECT id FROM public.advertiser_profiles WHERE user_id = auth.uid()))
  WITH CHECK (advertiser_id IN (SELECT id FROM public.advertiser_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins manage all AOOH campaigns" ON public.aooh_campaigns
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- AOOH Venue Assignments
CREATE TABLE IF NOT EXISTS public.aooh_venue_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aooh_campaign_id uuid NOT NULL REFERENCES public.aooh_campaigns(id) ON DELETE CASCADE,
  ad_space_id uuid NOT NULL REFERENCES public.ad_spaces(id) ON DELETE CASCADE,
  venue_id uuid REFERENCES public.publisher_profiles(id) ON DELETE SET NULL,
  play_frequency_min integer DEFAULT 30,
  max_plays_per_day integer DEFAULT 20,
  dayparts jsonb DEFAULT '["morning","afternoon","evening"]'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  assigned_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.aooh_venue_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Advertisers manage own assignments" ON public.aooh_venue_assignments
  FOR ALL TO authenticated
  USING (aooh_campaign_id IN (SELECT id FROM public.aooh_campaigns WHERE advertiser_id IN (SELECT id FROM public.advertiser_profiles WHERE user_id = auth.uid())))
  WITH CHECK (aooh_campaign_id IN (SELECT id FROM public.aooh_campaigns WHERE advertiser_id IN (SELECT id FROM public.advertiser_profiles WHERE user_id = auth.uid())));

CREATE POLICY "Publishers view own venue assignments" ON public.aooh_venue_assignments
  FOR SELECT TO authenticated
  USING (ad_space_id IN (SELECT id FROM public.ad_spaces WHERE publisher_id IN (SELECT id FROM public.publisher_profiles WHERE user_id = auth.uid())));

CREATE POLICY "Admins manage all assignments" ON public.aooh_venue_assignments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- AOOH Play Logs
CREATE TABLE IF NOT EXISTS public.aooh_play_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aooh_campaign_id uuid NOT NULL REFERENCES public.aooh_campaigns(id) ON DELETE CASCADE,
  venue_id uuid REFERENCES public.publisher_profiles(id) ON DELETE SET NULL,
  ad_space_id uuid REFERENCES public.ad_spaces(id) ON DELETE SET NULL,
  played_at timestamptz NOT NULL DEFAULT now(),
  duration_sec integer,
  completed boolean NOT NULL DEFAULT false,
  player_session_id text,
  device_info jsonb
);
ALTER TABLE public.aooh_play_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Advertisers view own play logs" ON public.aooh_play_logs
  FOR SELECT TO authenticated
  USING (aooh_campaign_id IN (SELECT id FROM public.aooh_campaigns WHERE advertiser_id IN (SELECT id FROM public.advertiser_profiles WHERE user_id = auth.uid())));

CREATE POLICY "Publishers view own play logs" ON public.aooh_play_logs
  FOR SELECT TO authenticated
  USING (ad_space_id IN (SELECT id FROM public.ad_spaces WHERE publisher_id IN (SELECT id FROM public.publisher_profiles WHERE user_id = auth.uid())));

CREATE POLICY "Admins view all play logs" ON public.aooh_play_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- AOOH Player Sessions
CREATE TABLE IF NOT EXISTS public.aooh_player_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.publisher_profiles(id) ON DELETE CASCADE,
  ad_space_id uuid REFERENCES public.ad_spaces(id) ON DELETE CASCADE,
  access_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  label text,
  last_active_at timestamptz,
  is_online boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.aooh_player_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage player sessions" ON public.aooh_player_sessions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Publishers view own player sessions" ON public.aooh_player_sessions
  FOR SELECT TO authenticated
  USING (venue_id IN (SELECT id FROM public.publisher_profiles WHERE user_id = auth.uid()));

-- Storage bucket for audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('aooh-audio', 'aooh-audio', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "AOOH audio is publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'aooh-audio');

CREATE POLICY "Authenticated users can upload AOOH audio"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'aooh-audio');

CREATE POLICY "Authenticated users can update own AOOH audio"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'aooh-audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can delete own AOOH audio"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'aooh-audio' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Updated_at trigger for aooh_campaigns
CREATE TRIGGER aooh_campaigns_updated_at
  BEFORE UPDATE ON public.aooh_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();