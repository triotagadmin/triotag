-- Fix notifications table RLS policy: Replace open INSERT with service role check
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Only allow inserts from authenticated users for their own notifications OR service role
CREATE POLICY "Authenticated users and service can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    auth.uid() = user_id OR 
    has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Fix admin_profiles RLS: Add policy to prevent unauthorized access to sensitive data
-- First, let's ensure only admins and profile owners can view sensitive fields
DROP POLICY IF EXISTS "Admins can view all admin profiles" ON public.admin_profiles;
DROP POLICY IF EXISTS "Users can view their own admin profile" ON public.admin_profiles;

-- Only verified admins can view all admin profiles
CREATE POLICY "Verified admins can view all admin profiles" 
ON public.admin_profiles 
FOR SELECT 
USING (
  is_verified_admin(auth.uid()) OR user_id = auth.uid()
);