-- Add location and campaign_type fields to campaigns table for filtering
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS campaign_type text;

-- Add index for better search performance
CREATE INDEX IF NOT EXISTS idx_campaigns_location ON public.campaigns(location);
CREATE INDEX IF NOT EXISTS idx_campaigns_campaign_type ON public.campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);