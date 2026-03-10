
CREATE OR REPLACE FUNCTION public.get_listing_branch_counts(_listing_ids uuid[])
RETURNS TABLE(listing_id uuid, branch_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT combined.listing_id, SUM(combined.cnt)::bigint as branch_count
  FROM (
    -- Count franchise_branches (exclude primary address by matching against ad_spaces.location)
    SELECT fb.franchise_id as listing_id, COUNT(*)::bigint as cnt
    FROM public.franchise_branches fb
    JOIN public.ad_spaces a ON a.id = fb.franchise_id
    WHERE fb.franchise_id = ANY(_listing_ids)
      AND lower(trim(fb.full_address)) != lower(trim(COALESCE(a.location, '')))
    GROUP BY fb.franchise_id

    UNION ALL

    -- Count advertiser_branches marked as ad space listings (exclude primary address)
    SELECT ab.listing_id, COUNT(*)::bigint as cnt
    FROM public.advertiser_branches ab
    JOIN public.ad_spaces a ON a.id = ab.listing_id
    WHERE ab.listing_id = ANY(_listing_ids)
      AND ab.is_ad_space_listing = true
      AND lower(trim(ab.full_address)) != lower(trim(COALESCE(a.location, '')))
    GROUP BY ab.listing_id
  ) combined
  GROUP BY combined.listing_id;
$$;
