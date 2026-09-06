CREATE OR REPLACE VIEW public.marketplace_inventory AS
SELECT
  a.id,
  a.title,
  a.description,
  a.location,
  a.latitude,
  a.longitude,
  a.media_urls,
  (COALESCE(a.specifications, '{}'::jsonb)
     - 'contact_email' - 'contact_phone' - 'contact_name' - 'owner_email'
     - 'owner_phone' - 'admin_notes' - 'internal_notes') AS specifications,
  a.pricing,
  a.availability_status,
  a.media_type,
  a.media_types,
  a.total_ad_units,
  a.campaign_start_date,
  a.campaign_end_date,
  a.campaign_duration_days,
  a.monthly_subscription_fee,
  a.annual_subscription_fee,
  a.activation_fee,
  a.media_owner_name,
  a.tenant_id,
  a.agent_id,
  a.publisher_id,
  a.contact_verified_at,
  a.platform_verification_status,
  a.created_at
FROM public.ad_spaces a
WHERE a.approval_status = 'approved'
  AND COALESCE(a.availability_status, 'available') = 'available'
  AND COALESCE(a.agent_disconnected, false) = false;

GRANT SELECT ON public.marketplace_inventory TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.advertiser_saved_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  ad_space_id uuid NOT NULL REFERENCES public.ad_spaces(id) ON DELETE CASCADE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, ad_space_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.advertiser_saved_inventory TO authenticated;
GRANT ALL ON public.advertiser_saved_inventory TO service_role;

ALTER TABLE public.advertiser_saved_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own saved inventory"
  ON public.advertiser_saved_inventory FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_advertiser_saved_inventory_updated_at
  BEFORE UPDATE ON public.advertiser_saved_inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();