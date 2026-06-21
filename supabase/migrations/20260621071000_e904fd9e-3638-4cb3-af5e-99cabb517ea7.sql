
-- 1) Migrate existing data
UPDATE public.user_roles SET role = 'agent'    WHERE role = 'publisher';
UPDATE public.user_roles SET role = 'retailer' WHERE role = 'advertiser';

-- 2) Recreate RLS policies referencing the old role values

-- ad_spaces
DROP POLICY IF EXISTS "Advertisers can view their owned listings" ON public.ad_spaces;
CREATE POLICY "Advertisers can view their owned listings" ON public.ad_spaces
  FOR SELECT USING ((advertiser_id = auth.uid()) AND has_role(auth.uid(), 'retailer'::app_role));

DROP POLICY IF EXISTS "Advertisers can update their owned listings" ON public.ad_spaces;
CREATE POLICY "Advertisers can update their owned listings" ON public.ad_spaces
  FOR UPDATE USING ((advertiser_id = auth.uid()) AND has_role(auth.uid(), 'retailer'::app_role));

DROP POLICY IF EXISTS "Leased advertisers can view their leased listings" ON public.ad_spaces;
CREATE POLICY "Leased advertisers can view their leased listings" ON public.ad_spaces
  FOR SELECT USING ((auth.uid() = ANY (leased_advertiser_ids)) AND has_role(auth.uid(), 'retailer'::app_role));

DROP POLICY IF EXISTS "Advertisers can lease approved listings" ON public.ad_spaces;
CREATE POLICY "Advertisers can lease approved listings" ON public.ad_spaces
  FOR UPDATE USING ((approval_status = 'approved'::approval_status) AND has_role(auth.uid(), 'retailer'::app_role));

-- advertiser_branches
DROP POLICY IF EXISTS "Publishers can view advertiser branches for their listings" ON public.advertiser_branches;
CREATE POLICY "Publishers can view advertiser branches for their listings" ON public.advertiser_branches
  FOR SELECT USING (
    (listing_id IN (
      SELECT a.id FROM public.ad_spaces a
      JOIN public.publisher_profiles p ON a.publisher_id = p.id
      WHERE p.user_id = auth.uid()
    )) AND has_role(auth.uid(), 'agent'::app_role)
  );

-- branch_materials
DROP POLICY IF EXISTS "Advertisers can manage branch materials for their listings" ON public.branch_materials;
CREATE POLICY "Advertisers can manage branch materials for their listings" ON public.branch_materials
  FOR ALL USING (is_advertiser_for_listing(auth.uid(), listing_id) AND has_role(auth.uid(), 'retailer'::app_role))
  WITH CHECK (is_advertiser_for_listing(auth.uid(), listing_id) AND has_role(auth.uid(), 'retailer'::app_role));

-- franchise_branches
DROP POLICY IF EXISTS "Advertisers can delete branches of their associated listings" ON public.franchise_branches;
CREATE POLICY "Advertisers can delete branches of their associated listings" ON public.franchise_branches
  FOR DELETE USING (is_advertiser_for_listing(auth.uid(), franchise_id) AND (has_role(auth.uid(), 'retailer'::app_role) OR has_role(auth.uid(), 'print_partner'::app_role)));

DROP POLICY IF EXISTS "Advertisers can insert branches for their associated listings" ON public.franchise_branches;
CREATE POLICY "Advertisers can insert branches for their associated listings" ON public.franchise_branches
  FOR INSERT WITH CHECK (is_advertiser_for_listing(auth.uid(), franchise_id) AND (has_role(auth.uid(), 'retailer'::app_role) OR has_role(auth.uid(), 'print_partner'::app_role)));

DROP POLICY IF EXISTS "Advertisers can update branches of their associated listings" ON public.franchise_branches;
CREATE POLICY "Advertisers can update branches of their associated listings" ON public.franchise_branches
  FOR UPDATE USING (is_advertiser_for_listing(auth.uid(), franchise_id) AND (has_role(auth.uid(), 'retailer'::app_role) OR has_role(auth.uid(), 'print_partner'::app_role)));

DROP POLICY IF EXISTS "Advertisers can view branches of their associated listings" ON public.franchise_branches;
CREATE POLICY "Advertisers can view branches of their associated listings" ON public.franchise_branches
  FOR SELECT USING (is_advertiser_for_listing(auth.uid(), franchise_id) AND (has_role(auth.uid(), 'retailer'::app_role) OR has_role(auth.uid(), 'print_partner'::app_role)));

-- qr_codes
DROP POLICY IF EXISTS "Advertisers and admins can create QR codes" ON public.qr_codes;
CREATE POLICY "Advertisers and admins can create QR codes" ON public.qr_codes
  FOR INSERT WITH CHECK ((created_by = auth.uid()) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'retailer'::app_role) OR has_role(auth.uid(), 'print_partner'::app_role)));

-- 3) Update DB trigger functions to write the new role values for new sign-ups
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role app_role;
  user_type_value text;
BEGIN
  user_type_value := NEW.raw_user_meta_data->>'user_type';

  IF user_type_value IN ('venue', 'digital', 'agent') THEN
    user_role := 'agent'::app_role;
  ELSIF user_type_value = 'talent' THEN
    user_role := 'talent'::app_role;
  ELSIF user_type_value = 'print_partner' THEN
    user_role := 'print_partner'::app_role;
  ELSIF user_type_value IN ('advertiser', 'retailer') THEN
    user_role := 'retailer'::app_role;
  ELSE
    user_role := COALESCE(
      user_type_value::app_role,
      'retailer'::app_role
    );
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_advertiser()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.raw_user_meta_data->>'user_type' IN ('advertiser', 'retailer', 'print_partner') THEN
    INSERT INTO public.advertiser_profiles (
      user_id, company_name, contact_name, contact_email, contact_phone
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'contact_name', ''),
      NEW.email,
      NEW.raw_user_meta_data->>'contact_phone'
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.link_pending_listings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.raw_user_meta_data->>'user_type' IN ('advertiser', 'retailer', 'print_partner') THEN
    UPDATE public.ad_spaces
    SET advertiser_id = NEW.id,
        pending_advertiser_email = NULL
    WHERE pending_advertiser_email = NEW.email
      AND advertiser_id IS NULL;
  END IF;
  RETURN NEW;
END;
$function$;
