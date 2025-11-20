-- Add admin verification status tracking
CREATE TYPE admin_status AS ENUM ('pending', 'verified', 'rejected');

-- Create admin_profiles table to track admin verification
CREATE TABLE public.admin_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone_number text,
  status admin_status NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  verified_at timestamp with time zone,
  verified_by uuid REFERENCES auth.users(id),
  rejection_reason text
);

-- Enable RLS on admin_profiles
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Admins can view all admin profiles
CREATE POLICY "Admins can view all admin profiles"
ON public.admin_profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own admin profile
CREATE POLICY "Users can view their own admin profile"
ON public.admin_profiles
FOR SELECT
USING (user_id = auth.uid());

-- System can insert admin profiles
CREATE POLICY "System can insert admin profiles"
ON public.admin_profiles
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Verified admins can update admin profiles
CREATE POLICY "Verified admins can update admin profiles"
ON public.admin_profiles
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE user_id = auth.uid() AND status = 'verified'
  )
);

-- Create function to check if user is verified admin
CREATE OR REPLACE FUNCTION public.is_verified_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_profiles ap
    JOIN public.user_roles ur ON ur.user_id = ap.user_id
    WHERE ap.user_id = _user_id
      AND ur.role = 'admin'
      AND ap.status = 'verified'
  )
$$;

-- Create trigger to handle new admin user
CREATE OR REPLACE FUNCTION public.handle_new_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert admin profile for new admin users
  IF NEW.raw_user_meta_data->>'user_type' = 'admin' THEN
    INSERT INTO public.admin_profiles (user_id, full_name, phone_number)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NEW.raw_user_meta_data->>'phone_number'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for new admin users
CREATE TRIGGER on_admin_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.raw_user_meta_data->>'user_type' = 'admin')
  EXECUTE FUNCTION public.handle_new_admin();