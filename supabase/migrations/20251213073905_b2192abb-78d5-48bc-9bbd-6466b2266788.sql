-- Add admin DELETE policies for tables that don't have them

-- Allow admins to delete advertiser profiles
CREATE POLICY "Admins can delete advertiser profiles"
ON public.advertiser_profiles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete admin profiles
CREATE POLICY "Admins can delete admin profiles"
ON public.admin_profiles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete verification documents
CREATE POLICY "Admins can delete verification documents"
ON public.verification_documents
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));