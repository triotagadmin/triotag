-- Create storage bucket for ticket images
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-images', 'ticket-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their ticket images
CREATE POLICY "Users can upload ticket images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'ticket-images' 
  AND auth.uid() IS NOT NULL
);

-- Allow public read access to ticket images
CREATE POLICY "Public can view ticket images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'ticket-images');

-- Allow users to delete their own ticket images
CREATE POLICY "Users can delete their own ticket images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'ticket-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add image_urls column to tickets table if it doesn't exist (for multiple images)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tickets' 
    AND column_name = 'image_urls'
  ) THEN
    ALTER TABLE public.tickets ADD COLUMN image_urls TEXT[] DEFAULT '{}';
  END IF;
END $$;