
-- Add advertiser_id and pending_advertiser_email to ad_spaces
ALTER TABLE public.ad_spaces 
  ADD COLUMN IF NOT EXISTS advertiser_id uuid,
  ADD COLUMN IF NOT EXISTS pending_advertiser_email text;

-- Migrate existing listings:
-- Listing 1: contact_email = lemarortiz.ai@gmail.com → advertiser user_id = 221eb4d4
UPDATE public.ad_spaces 
SET advertiser_id = '221eb4d4-b2a9-49c6-a20d-5065d745804f'
WHERE id = '4f9e8cf4-7df9-437a-8fe2-251957b5cafe';

-- Listing 2: contact_email = info.caelumco@gmail.com → no account yet, store as pending
UPDATE public.ad_spaces 
SET pending_advertiser_email = 'info.caelumco@gmail.com'
WHERE id = 'a366875e-36f0-4534-9cec-5bad28728d7e';

-- Drop the old email-based RLS policy
DROP POLICY IF EXISTS "Advertisers can view listings linked by email" ON public.ad_spaces;

-- New RLS: Advertisers can view listings where they are the owner (advertiser_id)
CREATE POLICY "Advertisers can view their owned listings"
ON public.ad_spaces
FOR SELECT
TO authenticated
USING (
  advertiser_id = auth.uid()
  AND has_role(auth.uid(), 'advertiser'::app_role)
);

-- Advertisers can update their owned listings
CREATE POLICY "Advertisers can update their owned listings"
ON public.ad_spaces
FOR UPDATE
TO authenticated
USING (
  advertiser_id = auth.uid()
  AND has_role(auth.uid(), 'advertiser'::app_role)
);

-- Update is_advertiser_for_listing to use advertiser_id column
CREATE OR REPLACE FUNCTION public.is_advertiser_for_listing(_user_id uuid, _ad_space_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.ad_spaces a
    WHERE a.id = _ad_space_id
      AND a.advertiser_id = _user_id
  )
$$;

-- Auto-link pending listings when an advertiser signs up
CREATE OR REPLACE FUNCTION public.link_pending_listings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'user_type' = 'advertiser' THEN
    UPDATE public.ad_spaces
    SET advertiser_id = NEW.id,
        pending_advertiser_email = NULL
    WHERE pending_advertiser_email = NEW.email
      AND advertiser_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users for auto-linking
DROP TRIGGER IF EXISTS on_auth_user_created_link_listings ON auth.users;
CREATE TRIGGER on_auth_user_created_link_listings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.link_pending_listings();
