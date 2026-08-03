
-- Taxonomy: categories
CREATE TABLE public.partner_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.partner_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.partner_categories TO authenticated;
GRANT ALL ON public.partner_categories TO service_role;
ALTER TABLE public.partner_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read partner categories" ON public.partner_categories FOR SELECT USING (true);
CREATE POLICY "Admins manage partner categories" ON public.partner_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_partner_categories_updated_at BEFORE UPDATE ON public.partner_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Taxonomy: specializations + capabilities (kind distinguishes them)
CREATE TABLE public.partner_specializations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.partner_categories(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'specialization',
  slug text NOT NULL,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, kind, slug)
);
GRANT SELECT ON public.partner_specializations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.partner_specializations TO authenticated;
GRANT ALL ON public.partner_specializations TO service_role;
ALTER TABLE public.partner_specializations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read partner specializations" ON public.partner_specializations FOR SELECT USING (true);
CREATE POLICY "Admins manage partner specializations" ON public.partner_specializations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_partner_specializations_updated_at BEFORE UPDATE ON public.partner_specializations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Profile expansion
ALTER TABLE public.print_partner_profiles
  ADD COLUMN IF NOT EXISTS business_registration_name text,
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS partner_category text,
  ADD COLUMN IF NOT EXISTS specializations text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS capabilities text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS company_description text,
  ADD COLUMN IF NOT EXISTS years_in_operation integer,
  ADD COLUMN IF NOT EXISTS team_size text,
  ADD COLUMN IF NOT EXISTS service_coverage text,
  ADD COLUMN IF NOT EXISTS coverage_regions text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS coverage_provinces text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS coverage_cities text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS coverage_countries text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS certifications jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS notable_clients text,
  ADD COLUMN IF NOT EXISTS industries_served text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS years_experience integer,
  ADD COLUMN IF NOT EXISTS availability text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

-- Public directory read access for approved + verified partners
DROP POLICY IF EXISTS "Public can view approved media partners" ON public.print_partner_profiles;
CREATE POLICY "Public can view approved media partners" ON public.print_partner_profiles
  FOR SELECT USING (verified = true AND status = 'active' AND is_blocked = false);
GRANT SELECT ON public.print_partner_profiles TO anon;

-- Portfolio items
CREATE TABLE public.partner_portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.print_partner_profiles(id) ON DELETE CASCADE,
  item_type text NOT NULL DEFAULT 'link',
  platform text,
  title text,
  url text,
  file_path text,
  mime_type text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.partner_portfolio_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_portfolio_items TO authenticated;
GRANT ALL ON public.partner_portfolio_items TO service_role;
ALTER TABLE public.partner_portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view approved partner portfolio" ON public.partner_portfolio_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.print_partner_profiles p
    WHERE p.id = partner_id AND p.verified = true AND p.status = 'active' AND p.is_blocked = false
  ));
CREATE POLICY "Partners manage own portfolio" ON public.partner_portfolio_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.print_partner_profiles p WHERE p.id = partner_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.print_partner_profiles p WHERE p.id = partner_id AND p.user_id = auth.uid()));
CREATE POLICY "Admins manage all portfolio items" ON public.partner_portfolio_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_partner_portfolio_items_updated_at BEFORE UPDATE ON public.partner_portfolio_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed taxonomy
INSERT INTO public.partner_categories (slug, name, description, sort_order) VALUES
  ('production', 'Production Partners', 'Video, film, audio and creative production studios', 1),
  ('print', 'Print Partners', 'Commercial, large format and packaging printing', 2),
  ('talent', 'Talent Partners', 'Influencers, creators, models and hosts', 3);

INSERT INTO public.partner_specializations (category_id, kind, slug, name, sort_order)
SELECT c.id, 'specialization', s.slug, s.name, s.ord
FROM public.partner_categories c
JOIN (VALUES
  ('production','video-production','Video Production',1),
  ('production','film-production','Film Production',2),
  ('production','photography','Photography',3),
  ('production','drone-operations','Drone Operations',4),
  ('production','livestream-production','Livestream Production',5),
  ('production','cgi-animation','CGI & Animation',6),
  ('production','music-production','Music Production',7),
  ('production','sound-design','Sound Design',8),
  ('production','voice-over-studio','Voice-over Studio',9),
  ('production','podcast-production','Podcast Production',10),
  ('production','radio-commercial-production','Radio Commercial Production',11),
  ('production','graphic-design','Graphic Design',12),
  ('print','commercial-printing','Commercial Printing',1),
  ('print','large-format-printing','Large Format Printing',2),
  ('print','packaging-printing','Packaging Printing',3),
  ('print','promotional-materials','Promotional Materials',4),
  ('print','signage-fabrication','Signage Fabrication',5),
  ('talent','influencer','Influencer',1),
  ('talent','content-creator','Content Creator',2),
  ('talent','model','Model',3),
  ('talent','actor-actress','Actor / Actress',4),
  ('talent','photographer','Photographer',5),
  ('talent','presenter','Presenter',6),
  ('talent','event-host-emcee','Event Host / Emcee',7)
) AS s(cat, slug, name, ord) ON s.cat = c.slug;

INSERT INTO public.partner_specializations (category_id, kind, slug, name, sort_order)
SELECT c.id, 'capability', s.slug, s.name, s.ord
FROM public.partner_categories c
JOIN (VALUES
  ('production','multi-camera-production','Multi-camera Production',1),
  ('production','4k-8k-production','4K / 8K Production',2),
  ('production','aerial-drone-coverage','Aerial Drone Coverage',3),
  ('production','studio-photography','Studio Photography',4),
  ('production','event-photography','Event Photography',5),
  ('production','product-photography','Product Photography',6),
  ('production','live-streaming','Live Streaming',7),
  ('production','motion-graphics','Motion Graphics',8),
  ('production','animation','Animation',9),
  ('production','audio-recording','Audio Recording',10),
  ('production','mixing-mastering','Mixing & Mastering',11),
  ('production','graphic-design','Graphic Design',12),
  ('print','commercial-printing','Commercial Printing',1),
  ('print','packaging-production','Packaging Production',2),
  ('print','signage-installation','Signage Installation',3),
  ('print','large-format-output','Large Format Output',4),
  ('print','graphic-design','Graphic Design',5),
  ('talent','talent-management','Talent Management',1),
  ('talent','hosting','Hosting',2),
  ('talent','brand-ambassadorship','Brand Ambassadorship',3),
  ('talent','content-creation','Content Creation',4),
  ('talent','live-streaming','Live Streaming',5)
) AS s(cat, slug, name, ord) ON s.cat = c.slug;
