-- Add delete policies for admins on marketplace tables
CREATE POLICY "Admins can delete campaigns"
ON public.campaigns
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ad spaces"
ON public.ad_spaces
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete agent services"
ON public.agent_services
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));