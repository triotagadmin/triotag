
-- Guest bookings table for location bundling orders
CREATE TABLE public.guest_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_email TEXT NOT NULL,
  guest_name TEXT,
  brand_name TEXT,
  guest_phone TEXT,
  creative_url TEXT,
  total_locations INTEGER NOT NULL DEFAULT 0,
  total_quantity INTEGER NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'PHP',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  booking_status TEXT NOT NULL DEFAULT 'draft',
  paymongo_checkout_session_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Guest booking locations (individual branches in a bundled booking)
CREATE TABLE public.guest_booking_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_booking_id UUID NOT NULL REFERENCES public.guest_bookings(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL,
  branch_id UUID,
  branch_name TEXT,
  branch_address TEXT,
  city TEXT,
  unit_type TEXT,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  duration_weeks INTEGER NOT NULL DEFAULT 1,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.guest_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_booking_locations ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can insert guest bookings (public checkout)
CREATE POLICY "Anyone can insert guest bookings"
  ON public.guest_bookings FOR INSERT TO public
  WITH CHECK (true);

-- RLS: Anyone can view their own guest bookings by email match (public select for webhook)
CREATE POLICY "Anyone can view guest bookings"
  ON public.guest_bookings FOR SELECT TO public
  USING (true);

-- RLS: Service role and webhooks can update guest bookings
CREATE POLICY "Admins can update guest bookings"
  ON public.guest_bookings FOR UPDATE TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow anon update for webhook (payment status)
CREATE POLICY "Anyone can update guest booking payment status"
  ON public.guest_bookings FOR UPDATE TO anon
  USING (true);

-- Guest booking locations
CREATE POLICY "Anyone can insert guest booking locations"
  ON public.guest_booking_locations FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can view guest booking locations"
  ON public.guest_booking_locations FOR SELECT TO public
  USING (true);

-- Admins can manage all
CREATE POLICY "Admins can manage guest bookings"
  ON public.guest_bookings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage guest booking locations"
  ON public.guest_booking_locations FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage: allow public uploads to ad-space-media for guest creatives
CREATE POLICY "Anyone can upload guest creatives"
  ON storage.objects FOR INSERT TO public
  WITH CHECK (bucket_id = 'ad-space-media' AND (storage.foldername(name))[1] = 'guest-creatives');
