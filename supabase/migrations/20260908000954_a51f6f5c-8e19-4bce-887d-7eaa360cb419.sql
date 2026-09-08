ALTER TYPE public.approval_status ADD VALUE IF NOT EXISTS 'suspended';

ALTER TABLE public.brand_advertiser_profiles
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_by uuid,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz;

DROP POLICY IF EXISTS "Admins can update brand advertiser profiles" ON public.brand_advertiser_profiles;

DROP POLICY IF EXISTS "Webmaster can view brand advertiser profiles" ON public.brand_advertiser_profiles;
CREATE POLICY "Webmaster can view brand advertiser profiles"
ON public.brand_advertiser_profiles FOR SELECT TO authenticated
USING (public.is_webmaster(auth.uid()));

DROP POLICY IF EXISTS "Webmaster can update brand advertiser profiles" ON public.brand_advertiser_profiles;
CREATE POLICY "Webmaster can update brand advertiser profiles"
ON public.brand_advertiser_profiles FOR UPDATE TO authenticated
USING (public.is_webmaster(auth.uid()))
WITH CHECK (public.is_webmaster(auth.uid()));

CREATE OR REPLACE FUNCTION public.guard_brand_approval_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.approval_status IS DISTINCT FROM 'pending'::public.approval_status
       AND NOT public.is_webmaster(auth.uid()) THEN
      NEW.approval_status := 'pending'::public.approval_status;
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
    IF auth.uid() IS NOT NULL AND NOT public.is_webmaster(auth.uid()) THEN
      RAISE EXCEPTION 'Only the global Webmaster can change brand advertiser approval status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_brand_approval_status_trg ON public.brand_advertiser_profiles;
CREATE TRIGGER guard_brand_approval_status_trg
BEFORE INSERT OR UPDATE ON public.brand_advertiser_profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_brand_approval_status();