
-- Create franchise_branches table
CREATE TABLE public.franchise_branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id uuid NOT NULL REFERENCES public.ad_spaces(id) ON DELETE CASCADE,
  place_name text NOT NULL,
  full_address text NOT NULL,
  latitude double precision,
  longitude double precision,
  google_place_id text,
  ad_unit_quantity integer DEFAULT 0,
  branch_photos jsonb DEFAULT '[]'::jsonb,
  branch_operating_hours text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.franchise_branches ENABLE ROW LEVEL SECURITY;

-- Publishers can manage branches for their own franchises
CREATE POLICY "Publishers can insert branches for their franchises"
ON public.franchise_branches
FOR INSERT
TO authenticated
WITH CHECK (
  franchise_id IN (
    SELECT a.id FROM public.ad_spaces a
    JOIN public.publisher_profiles p ON a.publisher_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Publishers can update branches for their franchises"
ON public.franchise_branches
FOR UPDATE
TO authenticated
USING (
  franchise_id IN (
    SELECT a.id FROM public.ad_spaces a
    JOIN public.publisher_profiles p ON a.publisher_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Publishers can delete branches for their franchises"
ON public.franchise_branches
FOR DELETE
TO authenticated
USING (
  franchise_id IN (
    SELECT a.id FROM public.ad_spaces a
    JOIN public.publisher_profiles p ON a.publisher_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Publishers can view branches for their franchises"
ON public.franchise_branches
FOR SELECT
TO authenticated
USING (
  franchise_id IN (
    SELECT a.id FROM public.ad_spaces a
    JOIN public.publisher_profiles p ON a.publisher_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

-- Anyone can view branches of approved franchises
CREATE POLICY "Anyone can view branches of approved franchises"
ON public.franchise_branches
FOR SELECT
USING (
  franchise_id IN (
    SELECT id FROM public.ad_spaces WHERE approval_status = 'approved'
  )
);

-- Admins can manage all branches
CREATE POLICY "Admins can manage all branches"
ON public.franchise_branches
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_franchise_branches_updated_at
  BEFORE UPDATE ON public.franchise_branches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for branches
ALTER PUBLICATION supabase_realtime ADD TABLE public.franchise_branches;
