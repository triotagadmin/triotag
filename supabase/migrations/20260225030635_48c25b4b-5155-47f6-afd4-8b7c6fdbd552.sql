
-- Add 'talent' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'talent';

-- Create skill_type enum
CREATE TYPE public.skill_type AS ENUM ('promoter', 'artist', 'creator');

-- Create talent_status enum  
CREATE TYPE public.talent_status AS ENUM ('pending', 'approved', 'rejected');

-- Create booking_status enum
CREATE TYPE public.booking_status AS ENUM ('pending', 'accepted', 'declined', 'completed', 'cancelled');

-- Create talent_profiles table
CREATE TABLE public.talent_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  location TEXT NOT NULL,
  skill_type public.skill_type NOT NULL,
  bio TEXT,
  portfolio_urls JSONB DEFAULT '[]'::jsonb,
  availability TEXT,
  status public.talent_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.talent_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for talent_profiles
CREATE POLICY "Talent can view their own profile"
ON public.talent_profiles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Talent can insert their own profile"
ON public.talent_profiles FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Talent can update their own profile"
ON public.talent_profiles FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all talent profiles"
ON public.talent_profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all talent profiles"
ON public.talent_profiles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view approved talent profiles"
ON public.talent_profiles FOR SELECT
USING (status = 'approved');

-- Create talent_bookings table
CREATE TABLE public.talent_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  talent_id UUID NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  advertiser_id UUID NOT NULL,
  campaign_type TEXT,
  duration TEXT,
  notes TEXT,
  status public.booking_status NOT NULL DEFAULT 'pending',
  proof_urls JSONB DEFAULT '[]'::jsonb,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.talent_bookings ENABLE ROW LEVEL SECURITY;

-- RLS for talent_bookings
CREATE POLICY "Talent can view their own bookings"
ON public.talent_bookings FOR SELECT
USING (talent_id IN (SELECT id FROM public.talent_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Talent can update their own bookings"
ON public.talent_bookings FOR UPDATE
USING (talent_id IN (SELECT id FROM public.talent_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Advertisers can view their own bookings"
ON public.talent_bookings FOR SELECT
USING (advertiser_id = auth.uid());

CREATE POLICY "Advertisers can insert bookings"
ON public.talent_bookings FOR INSERT
WITH CHECK (advertiser_id = auth.uid());

CREATE POLICY "Advertisers can update their own bookings"
ON public.talent_bookings FOR UPDATE
USING (advertiser_id = auth.uid());

CREATE POLICY "Admins can view all bookings"
ON public.talent_bookings FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all bookings"
ON public.talent_bookings FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create talent_reviews table
CREATE TABLE public.talent_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.talent_bookings(id) ON DELETE CASCADE UNIQUE,
  talent_id UUID NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.talent_reviews ENABLE ROW LEVEL SECURITY;

-- RLS for talent_reviews
CREATE POLICY "Anyone can view reviews"
ON public.talent_reviews FOR SELECT
USING (true);

CREATE POLICY "Advertisers can insert reviews for their bookings"
ON public.talent_reviews FOR INSERT
WITH CHECK (reviewer_id = auth.uid() AND booking_id IN (
  SELECT id FROM public.talent_bookings WHERE advertiser_id = auth.uid() AND status = 'completed'
));

CREATE POLICY "Admins can manage all reviews"
ON public.talent_reviews FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for talent portfolio
INSERT INTO storage.buckets (id, name, public) VALUES ('talent-portfolio', 'talent-portfolio', true);

CREATE POLICY "Anyone can view talent portfolio files"
ON storage.objects FOR SELECT
USING (bucket_id = 'talent-portfolio');

CREATE POLICY "Talent can upload their own portfolio files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'talent-portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Talent can update their own portfolio files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'talent-portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Talent can delete their own portfolio files"
ON storage.objects FOR DELETE
USING (bucket_id = 'talent-portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger for updated_at
CREATE TRIGGER update_talent_profiles_updated_at
BEFORE UPDATE ON public.talent_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_talent_bookings_updated_at
BEFORE UPDATE ON public.talent_bookings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update handle_new_user_role to support talent type
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
