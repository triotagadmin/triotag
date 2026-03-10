
CREATE OR REPLACE FUNCTION public.get_listing_branch_cities(_listing_ids uuid[])
RETURNS TABLE(listing_id uuid, city text, country text, branch_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT combined.listing_id, combined.city, combined.country, SUM(combined.cnt)::bigint as branch_count
  FROM (
    -- franchise_branches: extract city and country from full_address
    SELECT 
      fb.franchise_id as listing_id,
      COALESCE(
        NULLIF(trim(split_part(fb.full_address, ',', greatest(array_length(string_to_array(fb.full_address, ','), 1) - 1, 1))), ''),
        'Unknown'
      ) as city,
      COALESCE(
        NULLIF(trim(split_part(fb.full_address, ',', array_length(string_to_array(fb.full_address, ','), 1))), ''),
        'Unknown'
      ) as country,
      1::bigint as cnt
    FROM public.franchise_branches fb
    JOIN public.ad_spaces a ON a.id = fb.franchise_id
    WHERE fb.franchise_id = ANY(_listing_ids)
      AND lower(trim(fb.full_address)) != lower(trim(COALESCE(a.location, '')))

    UNION ALL

    -- advertiser_branches: use city column directly, extract country from full_address
    SELECT 
      ab.listing_id,
      COALESCE(ab.city, 'Unknown') as city,
      COALESCE(
        NULLIF(trim(split_part(ab.full_address, ',', array_length(string_to_array(ab.full_address, ','), 1))), ''),
        'Unknown'
      ) as country,
      1::bigint as cnt
    FROM public.advertiser_branches ab
    JOIN public.ad_spaces a ON a.id = ab.listing_id
    WHERE ab.listing_id = ANY(_listing_ids)
      AND ab.is_ad_space_listing = true
      AND lower(trim(ab.full_address)) != lower(trim(COALESCE(a.location, '')))
  ) combined
  GROUP BY combined.listing_id, combined.city, combined.country;
$$;
