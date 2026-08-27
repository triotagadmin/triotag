CREATE POLICY "Agents can manage prospect searches"
  ON public.prospect_searches FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'agent'))
  WITH CHECK (public.has_role(auth.uid(), 'agent'));

CREATE POLICY "Agents can view prospect places"
  ON public.prospect_places FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'agent'));

CREATE POLICY "Agents can manage business prospects"
  ON public.business_prospects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'agent'))
  WITH CHECK (public.has_role(auth.uid(), 'agent'));