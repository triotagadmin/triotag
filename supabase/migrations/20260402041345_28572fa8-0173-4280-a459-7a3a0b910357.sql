
-- Print Partner Profiles
CREATE TABLE public.print_partner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  company_name text NOT NULL DEFAULT '',
  contact_person text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  contact_phone text,
  business_address text,
  service_areas text[],
  logo_url text,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  approved_at timestamptz,
  approved_by uuid,
  verified boolean DEFAULT false,
  verification_token text,
  token_expires timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.print_partner_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile select" ON public.print_partner_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Own profile insert" ON public.print_partner_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own profile update" ON public.print_partner_profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admin all" ON public.print_partner_profiles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Print Partner Clients
CREATE TABLE public.print_partner_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.print_partner_profiles(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  contact_person text,
  email text,
  phone text,
  billing_address text,
  notes text,
  status text NOT NULL DEFAULT 'active',
  lifetime_spend numeric DEFAULT 0,
  completed_jobs integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.print_partner_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own clients select" ON public.print_partner_clients FOR SELECT USING (partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Own clients insert" ON public.print_partner_clients FOR INSERT WITH CHECK (partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Own clients update" ON public.print_partner_clients FOR UPDATE USING (partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Own clients delete" ON public.print_partner_clients FOR DELETE USING (partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Admin clients" ON public.print_partner_clients FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Print Partner Campaigns
CREATE TABLE public.print_partner_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.print_partner_profiles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.print_partner_clients(id) ON DELETE SET NULL,
  campaign_name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft',
  start_date date,
  end_date date,
  internal_notes text,
  total_estimated_cost numeric DEFAULT 0,
  payment_status text DEFAULT 'unpaid',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.print_partner_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own campaigns select" ON public.print_partner_campaigns FOR SELECT USING (partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Own campaigns insert" ON public.print_partner_campaigns FOR INSERT WITH CHECK (partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Own campaigns update" ON public.print_partner_campaigns FOR UPDATE USING (partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Own campaigns delete" ON public.print_partner_campaigns FOR DELETE USING (partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Admin campaigns" ON public.print_partner_campaigns FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Print Partner Campaign Locations
CREATE TABLE public.print_partner_campaign_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.print_partner_campaigns(id) ON DELETE CASCADE,
  branch_name text NOT NULL,
  recipient_name text,
  contact_number text,
  full_address text NOT NULL,
  city text,
  region text,
  delivery_notes text,
  materials jsonb DEFAULT '[]'::jsonb,
  quantities jsonb DEFAULT '{}'::jsonb,
  delivery_fee numeric DEFAULT 0,
  subtotal numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.print_partner_campaign_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own locations select" ON public.print_partner_campaign_locations FOR SELECT USING (campaign_id IN (SELECT id FROM public.print_partner_campaigns WHERE partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Own locations insert" ON public.print_partner_campaign_locations FOR INSERT WITH CHECK (campaign_id IN (SELECT id FROM public.print_partner_campaigns WHERE partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Own locations update" ON public.print_partner_campaign_locations FOR UPDATE USING (campaign_id IN (SELECT id FROM public.print_partner_campaigns WHERE partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Own locations delete" ON public.print_partner_campaign_locations FOR DELETE USING (campaign_id IN (SELECT id FROM public.print_partner_campaigns WHERE partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Admin locations" ON public.print_partner_campaign_locations FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Print Partner Material Pricing
CREATE TABLE public.print_partner_material_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.print_partner_profiles(id) ON DELETE CASCADE,
  material_name text NOT NULL,
  unit_type text DEFAULT 'piece',
  base_price numeric NOT NULL DEFAULT 0,
  min_quantity integer DEFAULT 1,
  bulk_tiers jsonb DEFAULT '[]'::jsonb,
  rush_fee numeric DEFAULT 0,
  design_fee numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.print_partner_material_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own pricing select" ON public.print_partner_material_pricing FOR SELECT USING (partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Own pricing insert" ON public.print_partner_material_pricing FOR INSERT WITH CHECK (partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Own pricing update" ON public.print_partner_material_pricing FOR UPDATE USING (partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Own pricing delete" ON public.print_partner_material_pricing FOR DELETE USING (partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Admin pricing" ON public.print_partner_material_pricing FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Print Partner Checkout Links
CREATE TABLE public.print_partner_checkout_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.print_partner_profiles(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.print_partner_campaigns(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  status text NOT NULL DEFAULT 'active',
  expires_at timestamptz,
  paymongo_checkout_session_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.print_partner_checkout_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own links select" ON public.print_partner_checkout_links FOR SELECT USING (partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Own links insert" ON public.print_partner_checkout_links FOR INSERT WITH CHECK (partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Own links update" ON public.print_partner_checkout_links FOR UPDATE USING (partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Own links delete" ON public.print_partner_checkout_links FOR DELETE USING (partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Public token lookup" ON public.print_partner_checkout_links FOR SELECT USING (true);
CREATE POLICY "Admin links" ON public.print_partner_checkout_links FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Print Partner Jobs
CREATE TABLE public.print_partner_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.print_partner_profiles(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.print_partner_campaigns(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.print_partner_clients(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'awaiting_payment',
  payment_status text DEFAULT 'unpaid',
  total_value numeric DEFAULT 0,
  deadline date,
  priority text DEFAULT 'normal',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.print_partner_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own jobs select" ON public.print_partner_jobs FOR SELECT USING (partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Own jobs insert" ON public.print_partner_jobs FOR INSERT WITH CHECK (partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Own jobs update" ON public.print_partner_jobs FOR UPDATE USING (partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Own jobs delete" ON public.print_partner_jobs FOR DELETE USING (partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Admin jobs" ON public.print_partner_jobs FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Print Partner Branch Jobs
CREATE TABLE public.print_partner_branch_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.print_partner_jobs(id) ON DELETE CASCADE,
  location_id uuid REFERENCES public.print_partner_campaign_locations(id) ON DELETE SET NULL,
  branch_name text,
  full_address text,
  materials jsonb DEFAULT '[]'::jsonb,
  quantities jsonb DEFAULT '{}'::jsonb,
  delivery_fee numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.print_partner_branch_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own branch jobs select" ON public.print_partner_branch_jobs FOR SELECT USING (job_id IN (SELECT id FROM public.print_partner_jobs WHERE partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Own branch jobs insert" ON public.print_partner_branch_jobs FOR INSERT WITH CHECK (job_id IN (SELECT id FROM public.print_partner_jobs WHERE partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Own branch jobs update" ON public.print_partner_branch_jobs FOR UPDATE USING (job_id IN (SELECT id FROM public.print_partner_jobs WHERE partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Own branch jobs delete" ON public.print_partner_branch_jobs FOR DELETE USING (job_id IN (SELECT id FROM public.print_partner_jobs WHERE partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Admin branch jobs" ON public.print_partner_branch_jobs FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Print Partner Proofs
CREATE TABLE public.print_partner_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.print_partner_profiles(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.print_partner_jobs(id) ON DELETE SET NULL,
  branch_job_id uuid REFERENCES public.print_partner_branch_jobs(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.print_partner_campaigns(id) ON DELETE SET NULL,
  file_url text NOT NULL,
  file_type text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.print_partner_proofs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own proofs select" ON public.print_partner_proofs FOR SELECT USING (partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Own proofs insert" ON public.print_partner_proofs FOR INSERT WITH CHECK (partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Own proofs delete" ON public.print_partner_proofs FOR DELETE USING (partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Admin proofs" ON public.print_partner_proofs FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Print Partner Files
CREATE TABLE public.print_partner_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.print_partner_profiles(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.print_partner_campaigns(id) ON DELETE SET NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text,
  tags text[],
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.print_partner_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own files select" ON public.print_partner_files FOR SELECT USING (partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Own files insert" ON public.print_partner_files FOR INSERT WITH CHECK (partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Own files delete" ON public.print_partner_files FOR DELETE USING (partner_id IN (SELECT id FROM public.print_partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Admin files" ON public.print_partner_files FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Update triggers for updated_at
CREATE TRIGGER update_print_partner_profiles_updated_at BEFORE UPDATE ON public.print_partner_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_print_partner_clients_updated_at BEFORE UPDATE ON public.print_partner_clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_print_partner_campaigns_updated_at BEFORE UPDATE ON public.print_partner_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_print_partner_campaign_locations_updated_at BEFORE UPDATE ON public.print_partner_campaign_locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_print_partner_material_pricing_updated_at BEFORE UPDATE ON public.print_partner_material_pricing FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_print_partner_checkout_links_updated_at BEFORE UPDATE ON public.print_partner_checkout_links FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_print_partner_jobs_updated_at BEFORE UPDATE ON public.print_partner_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_print_partner_branch_jobs_updated_at BEFORE UPDATE ON public.print_partner_branch_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update the handle_new_user_role trigger to handle print_partner signup with profile creation
CREATE OR REPLACE FUNCTION public.handle_new_print_partner()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.raw_user_meta_data->>'user_type' = 'print_partner' THEN
    INSERT INTO public.print_partner_profiles (
      user_id,
      company_name,
      contact_person,
      contact_email,
      contact_phone,
      business_address
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'contact_name', ''),
      NEW.email,
      NEW.raw_user_meta_data->>'contact_phone',
      NEW.raw_user_meta_data->>'business_address'
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger on auth.users for print partner profile creation
CREATE TRIGGER on_auth_user_created_print_partner
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_print_partner();

-- Storage bucket for print partner files
INSERT INTO storage.buckets (id, name, public) VALUES ('print-partner-files', 'print-partner-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Print partners can upload files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'print-partner-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Print partners can view their files" ON storage.objects FOR SELECT USING (bucket_id = 'print-partner-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Print partners can delete their files" ON storage.objects FOR DELETE USING (bucket_id = 'print-partner-files' AND auth.uid()::text = (storage.foldername(name))[1]);
