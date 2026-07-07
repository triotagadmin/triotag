
CREATE TABLE public.brand_creative_set_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_set_id uuid NOT NULL REFERENCES public.brand_creative_sets(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size_bytes integer NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_brand_creative_set_files_set ON public.brand_creative_set_files(creative_set_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_creative_set_files TO authenticated;
GRANT ALL ON public.brand_creative_set_files TO service_role;

ALTER TABLE public.brand_creative_set_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand advertisers manage own creative set files"
ON public.brand_creative_set_files
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.brand_creative_sets s
    JOIN public.brand_advertiser_profiles p ON p.id = s.brand_advertiser_id
    WHERE s.id = brand_creative_set_files.creative_set_id
      AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.brand_creative_sets s
    JOIN public.brand_advertiser_profiles p ON p.id = s.brand_advertiser_id
    WHERE s.id = brand_creative_set_files.creative_set_id
      AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Admins full access to creative set files"
ON public.brand_creative_set_files
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
