ALTER TABLE public.ad_spaces
  ADD COLUMN IF NOT EXISTS submitted_by_agent uuid,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS media_owner_name text,
  ADD COLUMN IF NOT EXISTS media_owner_contact_person text,
  ADD COLUMN IF NOT EXISTS media_owner_email text,
  ADD COLUMN IF NOT EXISTS media_owner_phone text,
  ADD COLUMN IF NOT EXISTS total_ad_units integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS campaign_duration_days integer,
  ADD COLUMN IF NOT EXISTS campaign_start_date date,
  ADD COLUMN IF NOT EXISTS campaign_end_date date,
  ADD COLUMN IF NOT EXISTS proof_urls jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_ad_spaces_submitted_by_agent ON public.ad_spaces (submitted_by_agent);
CREATE INDEX IF NOT EXISTS idx_ad_spaces_approval_status ON public.ad_spaces (approval_status);

CREATE TABLE IF NOT EXISTS public.inventory_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_space_id uuid NOT NULL REFERENCES public.ad_spaces(id) ON DELETE CASCADE,
  action text NOT NULL,
  reason text,
  reviewer_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.inventory_reviews TO authenticated;
GRANT ALL ON public.inventory_reviews TO service_role;

ALTER TABLE public.inventory_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all inventory reviews"
  ON public.inventory_reviews FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Suppliers can view their own inventory reviews"
  ON public.inventory_reviews FOR SELECT TO authenticated
  USING (
    ad_space_id IN (
      SELECT a.id FROM public.ad_spaces a
      WHERE a.submitted_by_agent = auth.uid()
         OR a.publisher_id IN (
              SELECT p.id FROM public.publisher_profiles p
              WHERE p.user_id = auth.uid() OR p.managed_by_agent_id = auth.uid()
            )
    )
  );

CREATE POLICY "Admins can insert inventory reviews"
  ON public.inventory_reviews FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND reviewer_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_inventory_reviews_ad_space ON public.inventory_reviews (ad_space_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.guard_ad_space_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
BEGIN
  is_admin := public.has_role(auth.uid(), 'admin');

  IF is_admin THEN
    IF NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
      NEW.approved_by := auth.uid();
      NEW.approved_at := CASE WHEN NEW.approval_status = 'approved' THEN now() ELSE NULL END;
      INSERT INTO public.inventory_reviews (ad_space_id, action, reason, reviewer_id)
      VALUES (NEW.id, NEW.approval_status::text, NEW.rejection_reason, auth.uid());
    END IF;
    RETURN NEW;
  END IF;

  -- Non-admins may never set approval fields themselves.
  NEW.approval_status := OLD.approval_status;
  NEW.approved_by := OLD.approved_by;
  NEW.approved_at := OLD.approved_at;
  NEW.submitted_by_agent := COALESCE(OLD.submitted_by_agent, NEW.submitted_by_agent);

  -- Editing already-approved supply sends it back for admin re-review.
  IF OLD.approval_status = 'approved' THEN
    NEW.approval_status := 'pending';
    NEW.approved_at := NULL;
    NEW.availability_status := 'unavailable';
    INSERT INTO public.inventory_reviews (ad_space_id, action, reason, reviewer_id)
    VALUES (NEW.id, 'resubmitted', 'Supplier edited approved inventory; returned to pending review', auth.uid());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_ad_space_approval ON public.ad_spaces;
CREATE TRIGGER trg_guard_ad_space_approval
  BEFORE UPDATE ON public.ad_spaces
  FOR EACH ROW EXECUTE FUNCTION public.guard_ad_space_approval();

CREATE OR REPLACE FUNCTION public.log_ad_space_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.submitted_by_agent IS NULL THEN
    NEW.submitted_by_agent := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_ad_space_submission ON public.ad_spaces;
CREATE TRIGGER trg_log_ad_space_submission
  BEFORE INSERT ON public.ad_spaces
  FOR EACH ROW EXECUTE FUNCTION public.log_ad_space_submission();