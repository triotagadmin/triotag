-- Create agent_service_files table for agent portfolio photos
CREATE TABLE IF NOT EXISTS public.agent_service_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_service_files ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Agents can upload their own service files
CREATE POLICY "agents can upload their own service files"
ON public.agent_service_files
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- RLS Policy: Agents can view their own service files
CREATE POLICY "agents can view their own service files"
ON public.agent_service_files
FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

-- RLS Policy: Agents can delete their own service files
CREATE POLICY "agents can delete their own service files"
ON public.agent_service_files
FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

-- RLS Policy: Admins can view all service files
CREATE POLICY "admins can view all service files"
ON public.agent_service_files
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to limit agent photos to 30
CREATE OR REPLACE FUNCTION public.limit_agent_photos()
RETURNS trigger AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.agent_service_files
      WHERE owner_id = NEW.owner_id) >= 30 THEN
    RAISE EXCEPTION 'Maximum 30 photos allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to enforce 30 photo limit
CREATE TRIGGER agent_service_photo_limit
BEFORE INSERT ON public.agent_service_files
FOR EACH ROW EXECUTE FUNCTION public.limit_agent_photos();

-- Index for faster queries
CREATE INDEX idx_agent_service_files_owner ON public.agent_service_files(owner_id);