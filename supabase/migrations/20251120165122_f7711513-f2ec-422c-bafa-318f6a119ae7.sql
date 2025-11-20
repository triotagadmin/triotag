-- Add verification fields to advertiser_profiles
ALTER TABLE public.advertiser_profiles
ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_token text,
ADD COLUMN IF NOT EXISTS token_expires timestamp with time zone;

-- Add verification fields to publisher_profiles
ALTER TABLE public.publisher_profiles
ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_token text,
ADD COLUMN IF NOT EXISTS token_expires timestamp with time zone;

-- Update existing records to verified = true (so existing users can login)
UPDATE public.advertiser_profiles SET verified = true WHERE verified IS NULL OR verified = false;
UPDATE public.publisher_profiles SET verified = true WHERE verified IS NULL OR verified = false;