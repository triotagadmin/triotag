
-- Create advertiser_franchises table
CREATE TABLE public.advertiser_franchises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id uuid NOT NULL,
  franchise_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add franchise_id to advertiser_branches
ALTER TABLE public.advertiser_branches
  ADD COLUMN advertiser_franchise_id uuid REFERENCES public.advertiser_franchises(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.advertiser_franchises ENABLE ROW LEVEL SECURITY;

-- RLS policies for advertiser_franchises
CREATE POLICY "Advertisers can view their own franchises"
  ON public.advertiser_franchises FOR SELECT TO authenticated
  USING (advertiser_id = auth.uid());

CREATE POLICY "Advertisers can insert their own franchises"
  ON public.advertiser_franchises FOR INSERT TO authenticated
  WITH CHECK (advertiser_id = auth.uid());

CREATE POLICY "Advertisers can update their own franchises"
  ON public.advertiser_franchises FOR UPDATE TO authenticated
  USING (advertiser_id = auth.uid());

CREATE POLICY "Advertisers can delete their own franchises"
  ON public.advertiser_franchises FOR DELETE TO authenticated
  USING (advertiser_id = auth.uid());

CREATE POLICY "Admins can manage all franchises"
  ON public.advertiser_franchises FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Updated_at trigger
CREATE TRIGGER update_advertiser_franchises_updated_at
  BEFORE UPDATE ON public.advertiser_franchises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
