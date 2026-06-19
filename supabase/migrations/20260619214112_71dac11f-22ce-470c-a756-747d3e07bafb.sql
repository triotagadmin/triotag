CREATE TABLE IF NOT EXISTS public.media_plan_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_name text NOT NULL,
  campaign_type text NOT NULL,
  center_lat numeric NOT NULL,
  center_lng numeric NOT NULL,
  radius_meters integer NOT NULL,
  venue_count integer NOT NULL,
  estimated_price numeric NOT NULL,
  preferred_start_date date,
  budget_confirmation numeric,
  notes text,
  status text NOT NULL DEFAULT 'pending_review',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_plan_requests TO authenticated;
GRANT ALL ON public.media_plan_requests TO service_role;

ALTER TABLE public.media_plan_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own media plan requests"
  ON public.media_plan_requests
  FOR ALL
  TO authenticated
  USING (auth.uid() = advertiser_id)
  WITH CHECK (auth.uid() = advertiser_id);

CREATE POLICY "Admins view all media plan requests"
  ON public.media_plan_requests
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_media_plan_requests_updated_at
  BEFORE UPDATE ON public.media_plan_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
