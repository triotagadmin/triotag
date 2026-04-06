
-- 1) Ad Material Pricing table
CREATE TABLE public.ad_material_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_name TEXT NOT NULL,
  default_size TEXT NOT NULL,
  base_cost NUMERIC NOT NULL DEFAULT 0,
  selling_price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT true,
  prodigi_sku TEXT,
  prodigi_variant_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_material_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all ad material pricing"
  ON public.ad_material_pricing FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view active materials"
  ON public.ad_material_pricing FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Seed default materials
INSERT INTO public.ad_material_pricing (material_name, default_size, base_cost, selling_price, currency) VALUES
  ('Vinyl Sticker', 'A4 (210 × 297 mm)', 3.50, 8.00, 'USD'),
  ('Poster', 'A3 (297 × 420 mm)', 5.00, 12.00, 'USD'),
  ('Table Tent Card', 'A4 folded (210 × 148 mm after fold)', 4.00, 10.00, 'USD'),
  ('Acrylic Table Tent', '4 × 6 inches', 8.00, 18.00, 'USD'),
  ('Flyer', 'A5 (148 × 210 mm)', 2.00, 5.00, 'USD'),
  ('Brochure', 'A4 tri-fold', 4.50, 10.00, 'USD'),
  ('Counter Card', '5 × 7 inches', 3.00, 7.00, 'USD'),
  ('Standee', '2 × 5 ft (60 × 150 cm)', 25.00, 55.00, 'USD'),
  ('Wall Decal', '60 × 60 cm', 6.00, 14.00, 'USD');

-- 2) Add is_blocked and blocked_reason to print_partner_profiles
ALTER TABLE public.print_partner_profiles
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

-- 3) Add missing columns to existing print_partner_material_pricing
ALTER TABLE public.print_partner_material_pricing
  ADD COLUMN IF NOT EXISTS default_size TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS selling_price NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';

-- Add admin RLS policy if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'print_partner_material_pricing' AND policyname = 'Admins can manage all partner material pricing'
  ) THEN
    CREATE POLICY "Admins can manage all partner material pricing"
      ON public.print_partner_material_pricing FOR ALL
      USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- 4) Auto-seed trigger for new print partners
CREATE OR REPLACE FUNCTION public.seed_print_partner_materials()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.print_partner_material_pricing (
    partner_id, material_name, default_size, base_price, selling_price, currency
  )
  SELECT
    NEW.id, material_name, default_size, base_cost, selling_price, currency
  FROM public.ad_material_pricing
  WHERE is_active = true;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_seed_print_partner_materials ON public.print_partner_profiles;
CREATE TRIGGER trigger_seed_print_partner_materials
  AFTER INSERT ON public.print_partner_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_print_partner_materials();

-- 5) Update timestamp triggers
CREATE TRIGGER update_ad_material_pricing_updated_at
  BEFORE UPDATE ON public.ad_material_pricing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
