
-- 1. Add unique constraint on franchise_branches to prevent duplicate addresses per listing
CREATE UNIQUE INDEX IF NOT EXISTS uq_franchise_branch_address
  ON public.franchise_branches (franchise_id, lower(trim(full_address)));

-- 2. Add unique constraint on advertiser_branches to prevent duplicate addresses per advertiser
CREATE UNIQUE INDEX IF NOT EXISTS uq_advertiser_branch_address
  ON public.advertiser_branches (advertiser_id, lower(trim(full_address)));

-- 3. Create a dedup-aware branch upsert function for franchise branches
CREATE OR REPLACE FUNCTION public.upsert_franchise_branch(
  _franchise_id uuid,
  _place_name text,
  _full_address text,
  _latitude double precision DEFAULT NULL,
  _longitude double precision DEFAULT NULL,
  _ad_unit_quantity integer DEFAULT 0,
  _branch_operating_hours text DEFAULT NULL,
  _notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _branch_id uuid;
BEGIN
  -- Check if branch already exists for this listing (by normalized address)
  SELECT id INTO _branch_id
  FROM public.franchise_branches
  WHERE franchise_id = _franchise_id
    AND lower(trim(full_address)) = lower(trim(_full_address));

  IF _branch_id IS NOT NULL THEN
    -- Branch exists, update non-null fields
    UPDATE public.franchise_branches
    SET
      place_name = COALESCE(_place_name, place_name),
      latitude = COALESCE(_latitude, latitude),
      longitude = COALESCE(_longitude, longitude),
      ad_unit_quantity = COALESCE(_ad_unit_quantity, ad_unit_quantity),
      branch_operating_hours = COALESCE(_branch_operating_hours, branch_operating_hours),
      notes = COALESCE(_notes, notes),
      updated_at = now()
    WHERE id = _branch_id;
  ELSE
    -- Create new branch
    INSERT INTO public.franchise_branches (
      franchise_id, place_name, full_address, latitude, longitude,
      ad_unit_quantity, branch_operating_hours, notes
    ) VALUES (
      _franchise_id, _place_name, _full_address, _latitude, _longitude,
      _ad_unit_quantity, _branch_operating_hours, _notes
    )
    RETURNING id INTO _branch_id;
  END IF;

  RETURN _branch_id;
END;
$$;

-- 4. Create a dedup-aware branch upsert function for advertiser branches
CREATE OR REPLACE FUNCTION public.upsert_advertiser_branch(
  _advertiser_id uuid,
  _full_address text,
  _branch_name text DEFAULT NULL,
  _contact_name text DEFAULT NULL,
  _contact_email text DEFAULT NULL,
  _contact_phone text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _branch_id uuid;
BEGIN
  -- Check if branch already exists for this advertiser (by normalized address)
  SELECT id INTO _branch_id
  FROM public.advertiser_branches
  WHERE advertiser_id = _advertiser_id
    AND lower(trim(full_address)) = lower(trim(_full_address));

  IF _branch_id IS NOT NULL THEN
    -- Branch exists, update fields
    UPDATE public.advertiser_branches
    SET
      branch_name = COALESCE(_branch_name, branch_name),
      contact_name = COALESCE(_contact_name, contact_name),
      contact_email = COALESCE(_contact_email, contact_email),
      contact_phone = COALESCE(_contact_phone, contact_phone),
      updated_at = now()
    WHERE id = _branch_id;
  ELSE
    INSERT INTO public.advertiser_branches (
      advertiser_id, full_address, branch_name, contact_name, contact_email, contact_phone
    ) VALUES (
      _advertiser_id, _full_address, _branch_name, _contact_name, _contact_email, _contact_phone
    )
    RETURNING id INTO _branch_id;
  END IF;

  RETURN _branch_id;
END;
$$;

-- 5. Cross-check function: when advertiser adds a branch, check if it already exists as a franchise branch
CREATE OR REPLACE FUNCTION public.check_cross_branch_duplicate(
  _user_id uuid,
  _full_address text
)
RETURNS TABLE(
  exists_in text,
  branch_id uuid,
  listing_title text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Check franchise_branches for associated listings
  SELECT
    'franchise'::text as exists_in,
    fb.id as branch_id,
    a.title as listing_title
  FROM public.franchise_branches fb
  JOIN public.ad_spaces a ON a.id = fb.franchise_id
  WHERE lower(trim(fb.full_address)) = lower(trim(_full_address))
    AND (
      -- User is the publisher
      a.publisher_id IN (SELECT id FROM public.publisher_profiles WHERE user_id = _user_id)
      OR
      -- User is the advertiser linked by email
      a.specifications->>'contact_email' = (SELECT email::text FROM auth.users WHERE id = _user_id)
    )

  UNION ALL

  -- Check advertiser_branches
  SELECT
    'advertiser'::text as exists_in,
    ab.id as branch_id,
    NULL::text as listing_title
  FROM public.advertiser_branches ab
  WHERE lower(trim(ab.full_address)) = lower(trim(_full_address))
    AND ab.advertiser_id = _user_id;
$$;
