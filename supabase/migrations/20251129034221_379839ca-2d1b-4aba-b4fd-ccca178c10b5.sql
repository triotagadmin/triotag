-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Publishers can upload verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Publishers can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Publishers can delete their own documents" ON storage.objects;

-- Add RLS policies for verification-documents storage bucket

-- Publishers can upload documents to their own folder
CREATE POLICY "Publishers can upload verification documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-documents' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM publisher_profiles WHERE user_id = auth.uid()
  )
);

-- Publishers can view their own documents
CREATE POLICY "Publishers can view their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM publisher_profiles WHERE user_id = auth.uid()
  )
);

-- Admins can view all verification documents
CREATE POLICY "Admins can view all verification documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Publishers can delete their own documents
CREATE POLICY "Publishers can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'verification-documents' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM publisher_profiles WHERE user_id = auth.uid()
  )
);