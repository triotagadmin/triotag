-- Create advertiser profiles table
CREATE TABLE public.advertiser_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  company_description TEXT,
  website_url TEXT,
  status approval_status NOT NULL DEFAULT 'pending'::approval_status,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  advertiser_id UUID NOT NULL REFERENCES advertiser_profiles(id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL,
  campaign_description TEXT,
  budget_amount DECIMAL(10, 2),
  budget_currency TEXT DEFAULT 'USD',
  start_date DATE,
  end_date DATE,
  target_audience TEXT,
  creative_assets JSONB,
  status approval_status NOT NULL DEFAULT 'pending'::approval_status,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  rejection_reason TEXT,
  payment_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.advertiser_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for advertiser_profiles
CREATE POLICY "Admins can view all advertiser profiles"
  ON public.advertiser_profiles
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Advertisers can view their own profile"
  ON public.advertiser_profiles
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Advertisers can insert their own profile"
  ON public.advertiser_profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Advertisers can update their own profile"
  ON public.advertiser_profiles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update all advertiser profiles"
  ON public.advertiser_profiles
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for campaigns
CREATE POLICY "Admins can view all campaigns"
  ON public.campaigns
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Advertisers can view their own campaigns"
  ON public.campaigns
  FOR SELECT
  USING (advertiser_id IN (
    SELECT id FROM advertiser_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Advertisers can insert their own campaigns"
  ON public.campaigns
  FOR INSERT
  WITH CHECK (advertiser_id IN (
    SELECT id FROM advertiser_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Advertisers can update their own campaigns"
  ON public.campaigns
  FOR UPDATE
  USING (advertiser_id IN (
    SELECT id FROM advertiser_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can update all campaigns"
  ON public.campaigns
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_advertiser_profiles_updated_at
  BEFORE UPDATE ON public.advertiser_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new advertiser
CREATE OR REPLACE FUNCTION public.handle_new_advertiser()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'user_type' = 'advertiser' THEN
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
$$;

-- Trigger for new advertiser users
CREATE TRIGGER on_advertiser_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_advertiser();