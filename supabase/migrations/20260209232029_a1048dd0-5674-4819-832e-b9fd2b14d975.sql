-- Drop the overly permissive INSERT policy
DROP POLICY "Anyone can create QR codes" ON public.qr_codes;

-- Only allow verified advertisers and admins to create QR codes
CREATE POLICY "Advertisers and admins can create QR codes"
ON public.qr_codes
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid() AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'advertiser'::app_role)
  )
);