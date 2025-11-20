-- Create agent-service-photos storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('agent-service-photos', 'agent-service-photos', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for agent-service-photos bucket
CREATE POLICY "Agents can upload their own service photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'agent-service-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Agents can view their own service photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'agent-service-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Agents can delete their own service photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'agent-service-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all agent service photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'agent-service-photos' 
  AND has_role(auth.uid(), 'admin')
);