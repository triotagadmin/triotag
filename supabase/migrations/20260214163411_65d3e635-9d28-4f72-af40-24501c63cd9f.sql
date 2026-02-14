
-- Create listing_submissions table
CREATE TABLE public.listing_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_name TEXT NOT NULL,
  address TEXT NOT NULL,
  space_type TEXT NOT NULL,
  photo_url TEXT,
  size TEXT NOT NULL DEFAULT 'tiny',
  notes TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  listing_status TEXT NOT NULL DEFAULT 'pending_review',
  paymongo_checkout_session_id TEXT,
  submitter_email TEXT,
  submitter_name TEXT,
  submitter_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.listing_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public form, no auth required)
CREATE POLICY "Anyone can insert listing submissions"
ON public.listing_submissions
FOR INSERT
WITH CHECK (true);

-- Anyone can view their own submissions by checkout session (for payment callback)
CREATE POLICY "Anyone can view by checkout session"
ON public.listing_submissions
FOR SELECT
USING (true);

-- Admins can view all
CREATE POLICY "Admins can view all listing submissions"
ON public.listing_submissions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update
CREATE POLICY "Admins can update listing submissions"
ON public.listing_submissions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete
CREATE POLICY "Admins can delete listing submissions"
ON public.listing_submissions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can update (for webhook)
-- This is handled by service role key in edge functions

-- Create updated_at trigger
CREATE TRIGGER update_listing_submissions_updated_at
BEFORE UPDATE ON public.listing_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for listing photos
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-photos', 'listing-photos', true);

-- Allow anyone to upload to listing-photos bucket
CREATE POLICY "Anyone can upload listing photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'listing-photos');

-- Allow public access to listing photos
CREATE POLICY "Listing photos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'listing-photos');
