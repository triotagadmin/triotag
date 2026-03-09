
-- Add leased_advertiser_ids array column to ad_spaces
ALTER TABLE public.ad_spaces 
  ADD COLUMN IF NOT EXISTS leased_advertiser_ids uuid[] NOT NULL DEFAULT '{}';

-- RLS: Leased advertisers can view listings they lease
CREATE POLICY "Leased advertisers can view their leased listings"
ON public.ad_spaces
FOR SELECT
TO authenticated
USING (
  auth.uid() = ANY(leased_advertiser_ids)
  AND has_role(auth.uid(), 'advertiser'::app_role)
);

-- RLS: Advertisers can lease listings (update only leased_advertiser_ids)
-- They need update access to add themselves
CREATE POLICY "Advertisers can lease approved listings"
ON public.ad_spaces
FOR UPDATE
TO authenticated
USING (
  approval_status = 'approved'
  AND has_role(auth.uid(), 'advertiser'::app_role)
);

-- Update is_advertiser_for_listing to also check leased advertisers
CREATE OR REPLACE FUNCTION public.is_advertiser_for_listing(_user_id uuid, _ad_space_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.ad_spaces a
    WHERE a.id = _ad_space_id
      AND (
        a.advertiser_id = _user_id
        OR _user_id = ANY(a.leased_advertiser_ids)
      )
  )
$$;
