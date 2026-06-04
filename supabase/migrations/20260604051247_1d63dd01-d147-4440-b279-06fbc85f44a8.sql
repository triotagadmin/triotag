DROP POLICY IF EXISTS public_view_by_token ON public.client_checkouts;

CREATE OR REPLACE FUNCTION public.get_client_checkout_by_token(_token text)
RETURNS SETOF public.client_checkouts
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT * FROM public.client_checkouts WHERE token = _token LIMIT 1; $$;
REVOKE ALL ON FUNCTION public.get_client_checkout_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_client_checkout_by_token(text) TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can view guest bookings" ON public.guest_bookings;
DROP POLICY IF EXISTS "Anyone can update guest booking payment status" ON public.guest_bookings;
DROP POLICY IF EXISTS "Anyone can view guest booking locations" ON public.guest_booking_locations;

CREATE POLICY "Guests can view their own bookings by email"
ON public.guest_bookings FOR SELECT TO authenticated
USING (guest_email = (SELECT email::text FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Guests can view their booking locations by email"
ON public.guest_booking_locations FOR SELECT TO authenticated
USING (guest_booking_id IN (
  SELECT id FROM public.guest_bookings
  WHERE guest_email = (SELECT email::text FROM auth.users WHERE id = auth.uid())
));

CREATE OR REPLACE FUNCTION public.set_guest_booking_session(_booking_id uuid, _session_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.guest_bookings
     SET paymongo_checkout_session_id = _session_id,
         booking_status = 'awaiting_payment',
         updated_at = now()
   WHERE id = _booking_id
     AND booking_status = 'pending'
     AND payment_status = 'pending';
END;
$$;
REVOKE ALL ON FUNCTION public.set_guest_booking_session(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_guest_booking_session(uuid, text) TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can view by checkout session" ON public.listing_submissions;

DROP POLICY IF EXISTS "Public can view tickets by id and token for validation" ON public.publisher_tickets;

DROP POLICY IF EXISTS "Public can view tickets by unique_code" ON public.venue_tickets;

CREATE OR REPLACE FUNCTION public.get_venue_ticket_by_code(_unique_code uuid)
RETURNS TABLE (
  id uuid, event_id uuid, unique_code uuid, status text,
  customer_email text, customer_name text,
  scanned_at timestamptz, scanned_by uuid, created_at timestamptz,
  event_title text, venue_owner_id uuid
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT t.id, t.event_id, t.unique_code, t.status::text,
         t.customer_email, t.customer_name, t.scanned_at, t.scanned_by, t.created_at,
         e.title, v.owner_id
  FROM public.venue_tickets t
  LEFT JOIN public.venue_events e ON e.id = t.event_id
  LEFT JOIN public.venues v ON v.id = e.venue_id
  WHERE t.unique_code = _unique_code
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_venue_ticket_by_code(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_venue_ticket_by_code(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS "Users can view scans for their QR codes" ON public.qr_code_scans;
CREATE POLICY "Users can view scans for their QR codes"
ON public.qr_code_scans FOR SELECT TO authenticated
USING (qr_code_id IN (SELECT id FROM public.qr_codes WHERE created_by = auth.uid()));

ALTER TABLE public.ad_spaces
  ADD COLUMN IF NOT EXISTS has_pending_advertiser boolean
  GENERATED ALWAYS AS (pending_advertiser_email IS NOT NULL) STORED;

REVOKE SELECT (pending_advertiser_email) ON public.ad_spaces FROM anon;

DROP POLICY IF EXISTS "retailer_payout_details_restrict_select" ON public.retailer_payout_details;
CREATE POLICY "retailer_payout_details_restrict_select"
ON public.retailer_payout_details AS RESTRICTIVE FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR publisher_id IN (SELECT id FROM public.publisher_profiles WHERE user_id = auth.uid())
);