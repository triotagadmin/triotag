-- Add RLS policy to allow publishers to delete their own ad spaces
CREATE POLICY "Publishers can delete their own ad spaces"
ON public.ad_spaces
FOR DELETE
USING (publisher_id IN (
  SELECT id FROM publisher_profiles WHERE user_id = auth.uid()
));

-- Add RLS policy to allow agents to delete their own services
CREATE POLICY "Agents can delete their own services"
ON public.agent_services
FOR DELETE
USING (publisher_id IN (
  SELECT id FROM publisher_profiles WHERE user_id = auth.uid()
));

-- Add RLS policy to allow advertisers to delete their own campaigns
CREATE POLICY "Advertisers can delete their own campaigns"
ON public.campaigns
FOR DELETE
USING (advertiser_id IN (
  SELECT id FROM advertiser_profiles WHERE user_id = auth.uid()
));