-- Add subscription fee fields to ad_spaces table for venue listings
ALTER TABLE public.ad_spaces 
ADD COLUMN IF NOT EXISTS monthly_subscription_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS annual_subscription_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS activation_fee numeric DEFAULT 0;

-- Add comments for clarity
COMMENT ON COLUMN public.ad_spaces.monthly_subscription_fee IS 'Monthly subscription fee for venue listing';
COMMENT ON COLUMN public.ad_spaces.annual_subscription_fee IS 'Annual subscription fee for venue listing';
COMMENT ON COLUMN public.ad_spaces.activation_fee IS 'One-time activation fee paid by advertisers to activate the venue listing';