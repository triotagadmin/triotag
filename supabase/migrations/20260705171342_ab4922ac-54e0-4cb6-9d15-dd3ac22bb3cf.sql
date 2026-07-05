CREATE POLICY "Agents can view managed clients' activations"
  ON public.activations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.publisher_profiles pp
      WHERE pp.id = activations.publisher_id
        AND pp.managed_by_agent_id = auth.uid()
    )
  );

CREATE POLICY "Agents can update managed clients' activations"
  ON public.activations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.publisher_profiles pp
      WHERE pp.id = activations.publisher_id
        AND pp.managed_by_agent_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.publisher_profiles pp
      WHERE pp.id = activations.publisher_id
        AND pp.managed_by_agent_id = auth.uid()
    )
  );