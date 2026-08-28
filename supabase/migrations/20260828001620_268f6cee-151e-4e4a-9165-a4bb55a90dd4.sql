CREATE TABLE public.social_scanner_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  company_name text NOT NULL,
  normalized_name text NOT NULL,
  website_url text,
  website_domain text,
  industry text,
  location text,
  facebook_url text,
  instagram_url text,
  tiktok_url text,
  tiktok_shop_url text,
  linkedin_url text,
  public_email text,
  public_phone text,
  lead_score integer NOT NULL DEFAULT 0,
  opportunity_level text NOT NULL DEFAULT 'low',
  lead_reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommended_services jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  search_industry text,
  search_location text,
  search_keywords text,
  search_criteria text,
  status text NOT NULL DEFAULT 'new',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX social_scanner_leads_domain_uniq
  ON public.social_scanner_leads (website_domain)
  WHERE website_domain IS NOT NULL;

CREATE UNIQUE INDEX social_scanner_leads_name_loc_uniq
  ON public.social_scanner_leads (normalized_name, coalesce(lower(location), ''));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_scanner_leads TO authenticated;
GRANT ALL ON public.social_scanner_leads TO service_role;

ALTER TABLE public.social_scanner_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view social scanner leads"
  ON public.social_scanner_leads FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert social scanner leads"
  ON public.social_scanner_leads FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid());

CREATE POLICY "Admins can update social scanner leads"
  ON public.social_scanner_leads FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete social scanner leads"
  ON public.social_scanner_leads FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_social_scanner_leads_updated_at
  BEFORE UPDATE ON public.social_scanner_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();