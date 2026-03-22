
-- Create client_checkouts table
CREATE TABLE public.client_checkouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  print_partner_id uuid NOT NULL,
  activation_id uuid REFERENCES public.activations(id),
  ad_space_id uuid,
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_company text,
  listing_title text,
  campaign_dates text,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  lease_total numeric DEFAULT 0,
  material_total numeric DEFAULT 0,
  grand_total numeric DEFAULT 0,
  currency text DEFAULT 'PHP',
  status text DEFAULT 'draft',
  paymongo_checkout_session_id text,
  payment_method text,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.client_checkouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "print_partners_manage_own" ON public.client_checkouts
  FOR ALL TO authenticated
  USING (print_partner_id = auth.uid());

CREATE POLICY "public_view_by_token" ON public.client_checkouts
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "admins_manage_all_checkouts" ON public.client_checkouts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Update trigger functions
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
    user_role := 'publisher'::app_role;
  ELSIF user_type_value = 'talent' THEN
    user_role := 'talent'::app_role;
  ELSIF user_type_value = 'print_partner' THEN
    user_role := 'print_partner'::app_role;
  ELSE
    user_role := COALESCE(
      user_type_value::app_role,
      'advertiser'::app_role
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
  IF NEW.raw_user_meta_data->>'user_type' IN ('advertiser', 'print_partner') THEN
    INSERT INTO public.advertiser_profiles (
      user_id, 
      company_name, 
      contact_name, 
      contact_email,
      contact_phone
    )
    VALUES (
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
  IF NEW.raw_user_meta_data->>'user_type' IN ('advertiser', 'print_partner') THEN
    UPDATE public.ad_spaces
    SET advertiser_id = NEW.id,
        pending_advertiser_email = NULL
    WHERE pending_advertiser_email = NEW.email
      AND advertiser_id IS NULL;
  END IF;
  RETURN NEW;
END;
$function$;

-- Update RLS policies on franchise_branches
DROP POLICY IF EXISTS "Advertisers can delete branches of their associated listings" ON public.franchise_branches;
CREATE POLICY "Advertisers can delete branches of their associated listings" ON public.franchise_branches
  FOR DELETE TO authenticated
  USING (is_advertiser_for_listing(auth.uid(), franchise_id) AND (has_role(auth.uid(), 'advertiser'::app_role) OR has_role(auth.uid(), 'print_partner'::app_role)));

DROP POLICY IF EXISTS "Advertisers can insert branches for their associated listings" ON public.franchise_branches;
CREATE POLICY "Advertisers can insert branches for their associated listings" ON public.franchise_branches
  FOR INSERT TO authenticated
  WITH CHECK (is_advertiser_for_listing(auth.uid(), franchise_id) AND (has_role(auth.uid(), 'advertiser'::app_role) OR has_role(auth.uid(), 'print_partner'::app_role)));

DROP POLICY IF EXISTS "Advertisers can update branches of their associated listings" ON public.franchise_branches;
CREATE POLICY "Advertisers can update branches of their associated listings" ON public.franchise_branches
  FOR UPDATE TO authenticated
  USING (is_advertiser_for_listing(auth.uid(), franchise_id) AND (has_role(auth.uid(), 'advertiser'::app_role) OR has_role(auth.uid(), 'print_partner'::app_role)));

DROP POLICY IF EXISTS "Advertisers can view branches of their associated listings" ON public.franchise_branches;
CREATE POLICY "Advertisers can view branches of their associated listings" ON public.franchise_branches
  FOR SELECT TO authenticated
  USING (is_advertiser_for_listing(auth.uid(), franchise_id) AND (has_role(auth.uid(), 'advertiser'::app_role) OR has_role(auth.uid(), 'print_partner'::app_role)));

-- Update QR codes RLS
DROP POLICY IF EXISTS "Advertisers and admins can create QR codes" ON public.qr_codes;
CREATE POLICY "Advertisers and admins can create QR codes" ON public.qr_codes
  FOR INSERT TO authenticated
  WITH CHECK ((created_by = auth.uid()) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'advertiser'::app_role) OR has_role(auth.uid(), 'print_partner'::app_role)));
