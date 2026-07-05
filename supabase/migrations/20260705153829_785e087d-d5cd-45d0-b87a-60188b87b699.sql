
CREATE TABLE public.external_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supply_source text NOT NULL,
  venue_name text NOT NULL,
  location text,
  latitude numeric,
  longitude numeric,
  media_type text NOT NULL CHECK (media_type IN ('dooh','aooh')),
  screen_count integer DEFAULT 1,
  base_cpm numeric,
  min_spot_seconds integer,
  max_spot_seconds integer,
  notes text,
  contact_name text,
  contact_info text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','pending_verification')),
  added_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.external_inventory TO authenticated;
GRANT ALL ON public.external_inventory TO service_role;

ALTER TABLE public.external_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all external inventory"
  ON public.external_inventory FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Brand advertisers can view active external inventory"
  ON public.external_inventory FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'brand_advertiser') AND status = 'active');

CREATE POLICY "Admins can insert external inventory"
  ON public.external_inventory FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update external inventory"
  ON public.external_inventory FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete external inventory"
  ON public.external_inventory FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_external_inventory_updated_at
  BEFORE UPDATE ON public.external_inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
