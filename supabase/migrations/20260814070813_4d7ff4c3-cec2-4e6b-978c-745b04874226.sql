-- ad_spaces: retailer-only policies, no replacement needed
DROP POLICY IF EXISTS "Advertisers can lease approved listings" ON public.ad_spaces;
DROP POLICY IF EXISTS "Advertisers can update their owned listings" ON public.ad_spaces;
DROP POLICY IF EXISTS "Advertisers can view their owned listings" ON public.ad_spaces;
DROP POLICY IF EXISTS "Leased advertisers can view their leased listings" ON public.ad_spaces;

-- branch_materials: covered by admin + publisher policies
DROP POLICY IF EXISTS "Advertisers can manage branch materials for their listings" ON public.branch_materials;

-- franchise_branches: preserve print_partner arm
DROP POLICY IF EXISTS "Advertisers can view branches of their associated listings" ON public.franchise_branches;
CREATE POLICY "Print partners can view branches of their associated listings"
ON public.franchise_branches FOR SELECT TO authenticated
USING (is_advertiser_for_listing(auth.uid(), franchise_id) AND has_role(auth.uid(), 'print_partner'::app_role));

DROP POLICY IF EXISTS "Advertisers can insert branches for their associated listings" ON public.franchise_branches;
CREATE POLICY "Print partners can insert branches for their associated listings"
ON public.franchise_branches FOR INSERT TO authenticated
WITH CHECK (is_advertiser_for_listing(auth.uid(), franchise_id) AND has_role(auth.uid(), 'print_partner'::app_role));

DROP POLICY IF EXISTS "Advertisers can update branches of their associated listings" ON public.franchise_branches;
CREATE POLICY "Print partners can update branches of their associated listings"
ON public.franchise_branches FOR UPDATE TO authenticated
USING (is_advertiser_for_listing(auth.uid(), franchise_id) AND has_role(auth.uid(), 'print_partner'::app_role));

DROP POLICY IF EXISTS "Advertisers can delete branches of their associated listings" ON public.franchise_branches;
CREATE POLICY "Print partners can delete branches of their associated listings"
ON public.franchise_branches FOR DELETE TO authenticated
USING (is_advertiser_for_listing(auth.uid(), franchise_id) AND has_role(auth.uid(), 'print_partner'::app_role));

-- qr_codes: preserve admin + print_partner arms
DROP POLICY IF EXISTS "Advertisers and admins can create QR codes" ON public.qr_codes;
CREATE POLICY "Admins and print partners can create QR codes"
ON public.qr_codes FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'print_partner'::app_role)));