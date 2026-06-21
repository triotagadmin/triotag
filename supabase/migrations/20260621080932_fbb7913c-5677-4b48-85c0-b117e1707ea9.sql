-- Backfill user_roles for brand_advertiser users created during the broken-trigger window
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'brand_advertiser'::app_role
FROM auth.users u
WHERE u.raw_user_meta_data->>'user_type' = 'brand_advertiser'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id
  )
ON CONFLICT (user_id, role) DO NOTHING;

-- Also backfill from brand_advertiser_profiles in case any exist without a role
INSERT INTO public.user_roles (user_id, role)
SELECT bap.user_id, 'brand_advertiser'::app_role
FROM public.brand_advertiser_profiles bap
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = bap.user_id
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Creative sets table for Brand Advertiser DSP
CREATE TABLE IF NOT EXISTS public.brand_creative_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_advertiser_id uuid NOT NULL REFERENCES public.brand_advertiser_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  creative_format text NOT NULL,
  creative_count integer NOT NULL DEFAULT 0,
  file_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_creative_sets TO authenticated;
GRANT ALL ON public.brand_creative_sets TO service_role;

ALTER TABLE public.brand_creative_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own creative sets"
ON public.brand_creative_sets
FOR ALL
TO authenticated
USING (
  brand_advertiser_id IN (
    SELECT id FROM public.brand_advertiser_profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  brand_advertiser_id IN (
    SELECT id FROM public.brand_advertiser_profiles WHERE user_id = auth.uid()
  )
);

CREATE TRIGGER update_brand_creative_sets_updated_at
BEFORE UPDATE ON public.brand_creative_sets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Lightweight changelog table for brand campaigns
CREATE TABLE IF NOT EXISTS public.brand_campaign_changelog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_advertiser_id uuid NOT NULL REFERENCES public.brand_advertiser_profiles(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.brand_campaigns(id) ON DELETE SET NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  campaign_name text,
  action text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.brand_campaign_changelog TO authenticated;
GRANT ALL ON public.brand_campaign_changelog TO service_role;

ALTER TABLE public.brand_campaign_changelog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own changelog"
ON public.brand_campaign_changelog
FOR SELECT
TO authenticated
USING (
  brand_advertiser_id IN (
    SELECT id FROM public.brand_advertiser_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "users insert own changelog"
ON public.brand_campaign_changelog
FOR INSERT
TO authenticated
WITH CHECK (
  brand_advertiser_id IN (
    SELECT id FROM public.brand_advertiser_profiles WHERE user_id = auth.uid()
  )
);