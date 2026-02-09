
-- Update search_nearby_listings default radius from 50 to 10
CREATE OR REPLACE FUNCTION public.search_nearby_listings(user_lat double precision, user_lng double precision, radius_km double precision DEFAULT 10)
 RETURNS TABLE(id uuid, title text, description text, location text, latitude double precision, longitude double precision, category text, distance_km double precision, media_urls json, specifications json, publisher_business_name text, pricing json, service_type text, activation_fee double precision, annual_subscription_fee double precision, monthly_subscription_fee double precision, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT * FROM (
    -- Search ad_spaces (venues)
    SELECT 
      a.id,
      a.title,
      a.description,
      a.location,
      a.latitude,
      a.longitude,
      'venue'::text as category,
      (6371 * acos(LEAST(1.0, GREATEST(-1.0,
        cos(radians(user_lat)) * cos(radians(a.latitude)) *
        cos(radians(a.longitude) - radians(user_lng)) +
        sin(radians(user_lat)) * sin(radians(a.latitude))
      )))) as distance_km,
      a.media_urls,
      a.specifications,
      p.business_name as publisher_business_name,
      a.pricing,
      NULL::text as service_type,
      a.activation_fee,
      a.annual_subscription_fee,
      a.monthly_subscription_fee,
      a.created_at
    FROM public.ad_spaces a
    LEFT JOIN public.publisher_profiles p ON a.publisher_id = p.id
    WHERE a.approval_status = 'approved'
      AND a.latitude IS NOT NULL
      AND a.longitude IS NOT NULL

    UNION ALL

    -- Search agent_services
    SELECT 
      s.id,
      s.title,
      s.description,
      s.location,
      s.latitude,
      s.longitude,
      'agent'::text as category,
      (6371 * acos(LEAST(1.0, GREATEST(-1.0,
        cos(radians(user_lat)) * cos(radians(s.latitude)) *
        cos(radians(s.longitude) - radians(user_lng)) +
        sin(radians(user_lat)) * sin(radians(s.latitude))
      )))) as distance_km,
      s.media_urls,
      s.specifications,
      p.business_name as publisher_business_name,
      s.pricing,
      s.service_type,
      NULL::double precision as activation_fee,
      NULL::double precision as annual_subscription_fee,
      NULL::double precision as monthly_subscription_fee,
      s.created_at
    FROM public.agent_services s
    LEFT JOIN public.publisher_profiles p ON s.publisher_id = p.id
    WHERE s.approval_status = 'approved'
      AND s.latitude IS NOT NULL
      AND s.longitude IS NOT NULL
  ) combined
  WHERE combined.distance_km <= radius_km
  ORDER BY combined.distance_km ASC;
$function$;
