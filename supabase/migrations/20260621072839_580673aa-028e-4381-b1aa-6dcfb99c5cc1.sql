
-- Add brand_advertiser to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'brand_advertiser';

-- Brand Advertiser profiles
CREATE TABLE IF NOT EXISTS public.brand_advertiser_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  company_name text,
  contact_name text,
  contact_email text,
  contact_phone text,
  industry text,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_advertiser_profiles TO authenticated;
GRANT ALL ON public.brand_advertiser_profiles TO service_role;

ALTER TABLE public.brand_advertiser_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own brand advertiser profile"
  ON public.brand_advertiser_profiles
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Brand campaigns
CREATE TABLE IF NOT EXISTS public.brand_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_advertiser_id uuid REFERENCES public.brand_advertiser_profiles(id) ON DELETE CASCADE NOT NULL,
  campaign_name text NOT NULL,
  budget numeric NOT NULL,
  start_date date,
  end_date date,
  environments text[] DEFAULT '{}',
  countries text[] DEFAULT '{}',
  target_age_min integer,
  target_age_max integer,
  target_gender text,
  creative_format text,
  notes text,
  status text DEFAULT 'pending_review',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_campaigns TO authenticated;
GRANT ALL ON public.brand_campaigns TO service_role;

ALTER TABLE public.brand_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own brand campaigns"
  ON public.brand_campaigns
  FOR ALL
  USING (
    brand_advertiser_id IN (
      SELECT id FROM public.brand_advertiser_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    brand_advertiser_id IN (
      SELECT id FROM public.brand_advertiser_profiles WHERE user_id = auth.uid()
    )
  );

-- Update handle_new_user_role to support brand_advertiser
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
  ELSIF user_type_value = 'brand_advertiser' THEN
    user_role := 'brand_advertiser'::app_role;
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

-- Updated_at triggers
CREATE TRIGGER brand_advertiser_profiles_updated_at
  BEFORE UPDATE ON public.brand_advertiser_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER brand_campaigns_updated_at
  BEFORE UPDATE ON public.brand_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
