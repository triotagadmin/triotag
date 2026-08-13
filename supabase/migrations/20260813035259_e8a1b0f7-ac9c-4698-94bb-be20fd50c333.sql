CREATE TABLE public.local_listing_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  address text,
  phone text,
  website text,
  category text,
  business_hours text,
  description text,
  gbp_status text NOT NULL DEFAULT 'not_started',
  notes text,
  assigned_admin_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.local_listing_clients TO authenticated;
GRANT ALL ON public.local_listing_clients TO service_role;

ALTER TABLE public.local_listing_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage local listing clients"
ON public.local_listing_clients FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_local_listing_clients_updated_at
BEFORE UPDATE ON public.local_listing_clients
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();