-- ad_spaces: print_partner SELECT
CREATE POLICY "Print partners can view their owned listings"
ON public.ad_spaces FOR SELECT
USING (advertiser_id = auth.uid() AND has_role(auth.uid(), 'print_partner'::app_role));

-- ad_spaces: print_partner UPDATE
CREATE POLICY "Print partners can update their owned listings"
ON public.ad_spaces FOR UPDATE
USING (advertiser_id = auth.uid() AND has_role(auth.uid(), 'print_partner'::app_role));

-- advertiser_franchises: print_partner SELECT
CREATE POLICY "Print partners can view their own franchises"
ON public.advertiser_franchises FOR SELECT
USING (advertiser_id = auth.uid() AND has_role(auth.uid(), 'print_partner'::app_role));

-- advertiser_franchises: print_partner INSERT
CREATE POLICY "Print partners can insert their own franchises"
ON public.advertiser_franchises FOR INSERT
WITH CHECK (advertiser_id = auth.uid() AND has_role(auth.uid(), 'print_partner'::app_role));

-- advertiser_franchises: print_partner UPDATE
CREATE POLICY "Print partners can update their own franchises"
ON public.advertiser_franchises FOR UPDATE
USING (advertiser_id = auth.uid() AND has_role(auth.uid(), 'print_partner'::app_role));

-- advertiser_franchises: print_partner DELETE
CREATE POLICY "Print partners can delete their own franchises"
ON public.advertiser_franchises FOR DELETE
USING (advertiser_id = auth.uid() AND has_role(auth.uid(), 'print_partner'::app_role));

-- advertiser_branches: print_partner SELECT
CREATE POLICY "Print partners can view their own branches"
ON public.advertiser_branches FOR SELECT
USING (advertiser_id = auth.uid() AND has_role(auth.uid(), 'print_partner'::app_role));

-- advertiser_branches: print_partner INSERT
CREATE POLICY "Print partners can insert their own branches"
ON public.advertiser_branches FOR INSERT
WITH CHECK (advertiser_id = auth.uid() AND has_role(auth.uid(), 'print_partner'::app_role));

-- advertiser_branches: print_partner UPDATE
CREATE POLICY "Print partners can update their own branches"
ON public.advertiser_branches FOR UPDATE
USING (advertiser_id = auth.uid() AND has_role(auth.uid(), 'print_partner'::app_role))
WITH CHECK (advertiser_id = auth.uid() AND has_role(auth.uid(), 'print_partner'::app_role));

-- advertiser_branches: print_partner DELETE
CREATE POLICY "Print partners can delete their own branches"
ON public.advertiser_branches FOR DELETE
USING (advertiser_id = auth.uid() AND has_role(auth.uid(), 'print_partner'::app_role));