
CREATE POLICY "Public read partner portfolio files" ON storage.objects
  FOR SELECT USING (bucket_id = 'partner-portfolio');
CREATE POLICY "Users upload own partner portfolio files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'partner-portfolio' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users update own partner portfolio files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'partner-portfolio' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own partner portfolio files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'partner-portfolio' AND (storage.foldername(name))[1] = auth.uid()::text);
