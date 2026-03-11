
-- Create branch_materials table for per-branch material quantities
CREATE TABLE public.branch_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES public.franchise_branches(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.ad_spaces(id) ON DELETE CASCADE,
  material_type TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (branch_id, material_type)
);

-- Enable RLS
ALTER TABLE public.branch_materials ENABLE ROW LEVEL SECURITY;

-- Admins can manage all
CREATE POLICY "Admins can manage all branch materials"
  ON public.branch_materials
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Publishers can manage materials for their listings' branches
CREATE POLICY "Publishers can manage branch materials for their franchises"
  ON public.branch_materials
  FOR ALL
  TO authenticated
  USING (
    listing_id IN (
      SELECT a.id FROM public.ad_spaces a
      JOIN public.publisher_profiles p ON a.publisher_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Advertisers can manage materials for their associated listings' branches
CREATE POLICY "Advertisers can manage branch materials for their listings"
  ON public.branch_materials
  FOR ALL
  TO authenticated
  USING (
    is_advertiser_for_listing(auth.uid(), listing_id)
    AND has_role(auth.uid(), 'advertiser'::app_role)
  );

-- Anyone can view branch materials for approved listings
CREATE POLICY "Anyone can view branch materials for approved listings"
  ON public.branch_materials
  FOR SELECT
  TO public
  USING (
    listing_id IN (
      SELECT id FROM public.ad_spaces WHERE approval_status = 'approved'
    )
  );

-- Updated at trigger
CREATE TRIGGER update_branch_materials_updated_at
  BEFORE UPDATE ON public.branch_materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
