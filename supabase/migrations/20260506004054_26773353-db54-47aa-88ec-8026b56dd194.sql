
-- ============ retailer_creatives ============
CREATE TABLE public.retailer_creatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id uuid NOT NULL REFERENCES public.publisher_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  creative_type text NOT NULL CHECK (creative_type IN ('image','video','audio')),
  file_url text NOT NULL,
  thumbnail_url text,
  file_name text,
  file_size_bytes integer,
  file_format text,
  duration_sec integer,
  width_px integer,
  height_px integer,
  aspect_ratio text,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  used_in_count integer NOT NULL DEFAULT 0,
  last_deployed_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.retailer_creatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Retailers manage own creatives"
  ON public.retailer_creatives FOR ALL
  TO authenticated
  USING (publisher_id IN (SELECT id FROM public.publisher_profiles WHERE user_id = auth.uid()))
  WITH CHECK (publisher_id IN (SELECT id FROM public.publisher_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins full access creatives"
  ON public.retailer_creatives FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_retailer_creatives_publisher ON public.retailer_creatives(publisher_id);
CREATE INDEX idx_retailer_creatives_status ON public.retailer_creatives(status);

CREATE TRIGGER update_retailer_creatives_updated_at
  BEFORE UPDATE ON public.retailer_creatives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ house_ad_schedules ============
CREATE TABLE public.house_ad_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id uuid NOT NULL REFERENCES public.publisher_profiles(id) ON DELETE CASCADE,
  creative_id uuid NOT NULL REFERENCES public.retailer_creatives(id) ON DELETE CASCADE,
  ad_space_id uuid NOT NULL REFERENCES public.ad_spaces(id) ON DELETE CASCADE,
  player_session_id uuid,
  media_type text NOT NULL CHECK (media_type IN ('dooh','aooh')),
  title text,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  dayparts jsonb NOT NULL DEFAULT '["morning","afternoon","evening","late_night"]'::jsonb,
  priority integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','ended')),
  play_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.house_ad_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Retailers manage own schedules"
  ON public.house_ad_schedules FOR ALL
  TO authenticated
  USING (publisher_id IN (SELECT id FROM public.publisher_profiles WHERE user_id = auth.uid()))
  WITH CHECK (publisher_id IN (SELECT id FROM public.publisher_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins full access schedules"
  ON public.house_ad_schedules FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public read active schedules for players"
  ON public.house_ad_schedules FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

CREATE INDEX idx_house_ad_schedules_ad_space ON public.house_ad_schedules(ad_space_id);
CREATE INDEX idx_house_ad_schedules_publisher ON public.house_ad_schedules(publisher_id);

CREATE TRIGGER update_house_ad_schedules_updated_at
  BEFORE UPDATE ON public.house_ad_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ dooh_player_sessions ============
CREATE TABLE public.dooh_player_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.publisher_profiles(id) ON DELETE CASCADE,
  ad_space_id uuid REFERENCES public.ad_spaces(id) ON DELETE CASCADE,
  access_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  label text,
  resolution text,
  last_active_at timestamptz,
  is_online boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dooh_player_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publishers view own dooh sessions"
  ON public.dooh_player_sessions FOR SELECT
  TO authenticated
  USING (venue_id IN (SELECT id FROM public.publisher_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Publishers manage own dooh sessions"
  ON public.dooh_player_sessions FOR ALL
  TO authenticated
  USING (venue_id IN (SELECT id FROM public.publisher_profiles WHERE user_id = auth.uid()))
  WITH CHECK (venue_id IN (SELECT id FROM public.publisher_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins manage dooh sessions"
  ON public.dooh_player_sessions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============ dooh_play_logs ============
CREATE TABLE public.dooh_play_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_session_id uuid REFERENCES public.dooh_player_sessions(id) ON DELETE CASCADE,
  ad_space_id uuid REFERENCES public.ad_spaces(id) ON DELETE CASCADE,
  creative_source text NOT NULL DEFAULT 'paid' CHECK (creative_source IN ('paid','house')),
  source_id uuid,
  duration_sec integer,
  completed boolean NOT NULL DEFAULT false,
  played_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dooh_play_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publishers view own dooh play logs"
  ON public.dooh_play_logs FOR SELECT
  TO authenticated
  USING (ad_space_id IN (
    SELECT id FROM public.ad_spaces a
    WHERE a.publisher_id IN (SELECT id FROM public.publisher_profiles WHERE user_id = auth.uid())
  ));

CREATE POLICY "Admins view dooh play logs"
  ON public.dooh_play_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role insert play logs"
  ON public.dooh_play_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX idx_dooh_play_logs_ad_space ON public.dooh_play_logs(ad_space_id);
CREATE INDEX idx_dooh_play_logs_played_at ON public.dooh_play_logs(played_at);

-- ============ retailer_audience_data ============
CREATE TABLE public.retailer_audience_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id uuid NOT NULL UNIQUE REFERENCES public.publisher_profiles(id) ON DELETE CASCADE,
  daily_visitors integer,
  peak_hours jsonb NOT NULL DEFAULT '[]'::jsonb,
  demographics jsonb NOT NULL DEFAULT '{"professionals":0,"students":0,"tourists":0,"residents":0,"other":0}'::jsonb,
  gender_split jsonb NOT NULL DEFAULT '{"male":50,"female":50}'::jsonb,
  age_ranges jsonb NOT NULL DEFAULT '[]'::jsonb,
  visibility_score integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.retailer_audience_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Retailers manage own audience data"
  ON public.retailer_audience_data FOR ALL
  TO authenticated
  USING (publisher_id IN (SELECT id FROM public.publisher_profiles WHERE user_id = auth.uid()))
  WITH CHECK (publisher_id IN (SELECT id FROM public.publisher_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins manage audience data"
  ON public.retailer_audience_data FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_retailer_audience_data_updated_at
  BEFORE UPDATE ON public.retailer_audience_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ retailer_payout_details ============
CREATE TABLE public.retailer_payout_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id uuid NOT NULL UNIQUE REFERENCES public.publisher_profiles(id) ON DELETE CASCADE,
  account_name text,
  bank_name text,
  account_number text,
  revenue_share_pct numeric NOT NULL DEFAULT 70,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.retailer_payout_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Retailers manage own payout details"
  ON public.retailer_payout_details FOR ALL
  TO authenticated
  USING (publisher_id IN (SELECT id FROM public.publisher_profiles WHERE user_id = auth.uid()))
  WITH CHECK (publisher_id IN (SELECT id FROM public.publisher_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins manage payout details"
  ON public.retailer_payout_details FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_retailer_payout_details_updated_at
  BEFORE UPDATE ON public.retailer_payout_details
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Storage bucket ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('retailer-creatives', 'retailer-creatives', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read retailer creatives"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'retailer-creatives');

CREATE POLICY "Retailers upload own creatives"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'retailer-creatives'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.publisher_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Retailers update own creatives"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'retailer-creatives'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.publisher_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Retailers delete own creatives"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'retailer-creatives'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.publisher_profiles WHERE user_id = auth.uid()
    )
  );
