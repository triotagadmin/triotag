CREATE TABLE public.guest_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  email_verified boolean NOT NULL DEFAULT false,
  campaign_name text NOT NULL,
  campaign_type text NOT NULL,
  location text,
  start_date date,
  end_date date,
  budget_amount numeric,
  budget_currency text DEFAULT 'PHP',
  campaign_description text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.guest_campaigns TO anon;
GRANT SELECT, INSERT, UPDATE ON public.guest_campaigns TO authenticated;
GRANT ALL ON public.guest_campaigns TO service_role;

ALTER TABLE public.guest_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit guest campaigns"
  ON public.guest_campaigns FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view verified public guest campaigns"
  ON public.guest_campaigns FOR SELECT
  TO anon, authenticated
  USING (email_verified = true AND status IN ('pending', 'approved'));

CREATE POLICY "Admins manage guest campaigns"
  ON public.guest_campaigns FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_guest_campaigns_updated_at
  BEFORE UPDATE ON public.guest_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();