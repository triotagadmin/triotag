-- Fix RLS policies for ad-space-media storage bucket
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload to their own folder in ad-space-media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ad-space-media' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM publisher_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can read from ad-space-media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'ad-space-media');

CREATE POLICY "Users can update their own files in ad-space-media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ad-space-media'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM publisher_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own files in ad-space-media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'ad-space-media'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM publisher_profiles WHERE user_id = auth.uid()
  )
);

-- Create agent_services table for agent service submissions
CREATE TABLE IF NOT EXISTS public.agent_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id UUID NOT NULL REFERENCES public.publisher_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  service_type TEXT NOT NULL, -- guerrilla, influencer, model, artist
  location TEXT,
  pricing JSONB,
  media_urls JSONB,
  specifications JSONB,
  approval_status approval_status NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  rejection_reason TEXT,
  availability_status TEXT DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_services
CREATE POLICY "Agents can insert their own services"
ON public.agent_services
FOR INSERT
TO authenticated
WITH CHECK (
  publisher_id IN (
    SELECT id FROM publisher_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Agents can view their own services"
ON public.agent_services
FOR SELECT
TO authenticated
USING (
  publisher_id IN (
    SELECT id FROM publisher_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Agents can update their own services"
ON public.agent_services
FOR UPDATE
TO authenticated
USING (
  publisher_id IN (
    SELECT id FROM publisher_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all agent services"
ON public.agent_services
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all agent services"
ON public.agent_services
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view approved agent services"
ON public.agent_services
FOR SELECT
TO public
USING (approval_status = 'approved');

-- Trigger for updated_at
CREATE TRIGGER update_agent_services_updated_at
  BEFORE UPDATE ON public.agent_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();