
-- 1. prospect_searches: search history + equivalent-search cache for API cost control
CREATE TABLE public.prospect_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  search_key TEXT NOT NULL UNIQUE,
  searched_by UUID NOT NULL,
  keyword TEXT NOT NULL,
  location_text TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION NOT NULL DEFAULT 5,
  min_rating DOUBLE PRECISION,
  min_reviews INTEGER,
  business_type TEXT,
  result_limit INTEGER NOT NULL DEFAULT 20,
  results_count INTEGER NOT NULL DEFAULT 0,
  website_gap_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospect_searches TO authenticated;
GRANT ALL ON public.prospect_searches TO service_role;
ALTER TABLE public.prospect_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Verified admins can manage prospect searches"
  ON public.prospect_searches FOR ALL TO authenticated
  USING (public.is_verified_admin(auth.uid()))
  WITH CHECK (public.is_verified_admin(auth.uid()));
CREATE TRIGGER update_prospect_searches_updated_at BEFORE UPDATE ON public.prospect_searches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. prospect_places: Google Place Details cache keyed by Place ID
CREATE TABLE public.prospect_places (
  google_place_id TEXT PRIMARY KEY,
  business_name TEXT NOT NULL,
  category TEXT,
  address TEXT,
  city TEXT,
  region TEXT,
  country TEXT,
  phone TEXT,
  google_rating DOUBLE PRECISION,
  review_count INTEGER,
  website_url TEXT,
  website_status TEXT NOT NULL DEFAULT 'not_listed' CHECK (website_status IN ('listed', 'not_listed')),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  google_maps_url TEXT,
  business_status TEXT,
  opportunity_score INTEGER NOT NULL DEFAULT 0,
  details_fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospect_places TO authenticated;
GRANT ALL ON public.prospect_places TO service_role;
ALTER TABLE public.prospect_places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Verified admins can manage prospect places"
  ON public.prospect_places FOR ALL TO authenticated
  USING (public.is_verified_admin(auth.uid()))
  WITH CHECK (public.is_verified_admin(auth.uid()));
CREATE TRIGGER update_prospect_places_updated_at BEFORE UPDATE ON public.prospect_places
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. business_prospects: saved leads
CREATE TABLE public.business_prospects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  google_place_id TEXT NOT NULL UNIQUE REFERENCES public.prospect_places(google_place_id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  category TEXT,
  address TEXT,
  city TEXT,
  region TEXT,
  country TEXT,
  phone TEXT,
  google_rating DOUBLE PRECISION,
  review_count INTEGER,
  website_url TEXT,
  website_status TEXT NOT NULL DEFAULT 'not_listed' CHECK (website_status IN ('listed', 'not_listed')),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  google_maps_url TEXT,
  opportunity_score INTEGER NOT NULL DEFAULT 0,
  prospect_status TEXT NOT NULL DEFAULT 'new' CHECK (prospect_status IN ('new', 'reviewed', 'contacted', 'qualified', 'proposal', 'won', 'lost')),
  notes TEXT,
  assigned_to UUID,
  source TEXT NOT NULL DEFAULT 'google_places',
  search_id UUID REFERENCES public.prospect_searches(id) ON DELETE SET NULL,
  saved_by UUID,
  discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  saved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_prospects TO authenticated;
GRANT ALL ON public.business_prospects TO service_role;
ALTER TABLE public.business_prospects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Verified admins can manage business prospects"
  ON public.business_prospects FOR ALL TO authenticated
  USING (public.is_verified_admin(auth.uid()))
  WITH CHECK (public.is_verified_admin(auth.uid()));
CREATE TRIGGER update_business_prospects_updated_at BEFORE UPDATE ON public.business_prospects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_prospect_places_fetched ON public.prospect_places(details_fetched_at);
CREATE INDEX idx_business_prospects_status ON public.business_prospects(prospect_status);
CREATE INDEX idx_business_prospects_score ON public.business_prospects(opportunity_score DESC);
