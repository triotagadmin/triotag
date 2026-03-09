
-- Add listing_id to advertiser_branches
ALTER TABLE public.advertiser_branches 
  ADD COLUMN IF NOT EXISTS listing_id uuid REFERENCES public.ad_spaces(id) ON DELETE SET NULL;

-- RLS: Publishers can view advertiser branches for their listings (read-only)
CREATE POLICY "Publishers can view advertiser branches for their listings"
ON public.advertiser_branches
FOR SELECT
TO authenticated
USING (
  listing_id IN (
    SELECT a.id FROM public.ad_spaces a
    JOIN public.publisher_profiles p ON a.publisher_id = p.id
    WHERE p.user_id = auth.uid()
  )
  AND has_role(auth.uid(), 'publisher'::app_role)
);
