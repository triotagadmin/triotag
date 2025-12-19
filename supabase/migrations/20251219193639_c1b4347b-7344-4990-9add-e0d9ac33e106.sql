-- Create events table for advertisers
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  advertiser_id UUID NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  venue_name TEXT,
  event_date DATE NOT NULL,
  event_time TEXT,
  banner_image_url TEXT,
  organizer_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event_tickets table for ticket types
CREATE TABLE public.event_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  ticket_name TEXT NOT NULL,
  ticket_price NUMERIC NOT NULL DEFAULT 0,
  quantity_available INTEGER NOT NULL DEFAULT 0,
  quantity_sold INTEGER NOT NULL DEFAULT 0,
  sale_start_date DATE,
  sale_end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event_purchases table for ticket purchases
CREATE TABLE public.event_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_ticket_id UUID NOT NULL REFERENCES public.event_tickets(id) ON DELETE CASCADE,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'gcash',
  payment_proof_url TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  qr_code TEXT UNIQUE,
  ticket_status TEXT NOT NULL DEFAULT 'pending',
  checked_in_at TIMESTAMP WITH TIME ZONE,
  order_code TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_events_advertiser ON public.events(advertiser_id);
CREATE INDEX idx_event_tickets_event ON public.event_tickets(event_id);
CREATE INDEX idx_event_purchases_ticket ON public.event_purchases(event_ticket_id);
CREATE INDEX idx_event_purchases_qr ON public.event_purchases(qr_code);
CREATE INDEX idx_event_purchases_order_code ON public.event_purchases(order_code);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_purchases ENABLE ROW LEVEL SECURITY;

-- Events RLS Policies
CREATE POLICY "Anyone can view published events"
ON public.events FOR SELECT
USING (status = 'published');

CREATE POLICY "Advertisers can view their own events"
ON public.events FOR SELECT
USING (advertiser_id IN (
  SELECT id FROM advertiser_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Advertisers can insert their own events"
ON public.events FOR INSERT
WITH CHECK (advertiser_id IN (
  SELECT id FROM advertiser_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Advertisers can update their own events"
ON public.events FOR UPDATE
USING (advertiser_id IN (
  SELECT id FROM advertiser_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Advertisers can delete their own events"
ON public.events FOR DELETE
USING (advertiser_id IN (
  SELECT id FROM advertiser_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can view all events"
ON public.events FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all events"
ON public.events FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all events"
ON public.events FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Event Tickets RLS Policies
CREATE POLICY "Anyone can view tickets for published events"
ON public.event_tickets FOR SELECT
USING (event_id IN (
  SELECT id FROM events WHERE status = 'published'
));

CREATE POLICY "Advertisers can view tickets for their events"
ON public.event_tickets FOR SELECT
USING (event_id IN (
  SELECT id FROM events WHERE advertiser_id IN (
    SELECT id FROM advertiser_profiles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Advertisers can insert tickets for their events"
ON public.event_tickets FOR INSERT
WITH CHECK (event_id IN (
  SELECT id FROM events WHERE advertiser_id IN (
    SELECT id FROM advertiser_profiles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Advertisers can update tickets for their events"
ON public.event_tickets FOR UPDATE
USING (event_id IN (
  SELECT id FROM events WHERE advertiser_id IN (
    SELECT id FROM advertiser_profiles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Advertisers can delete tickets for their events"
ON public.event_tickets FOR DELETE
USING (event_id IN (
  SELECT id FROM events WHERE advertiser_id IN (
    SELECT id FROM advertiser_profiles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Admins can view all event tickets"
ON public.event_tickets FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all event tickets"
ON public.event_tickets FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Event Purchases RLS Policies
CREATE POLICY "Anyone can create purchases"
ON public.event_purchases FOR INSERT
WITH CHECK (true);

CREATE POLICY "Buyers can view their own purchases by email"
ON public.event_purchases FOR SELECT
USING (buyer_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text);

CREATE POLICY "Advertisers can view purchases for their events"
ON public.event_purchases FOR SELECT
USING (event_ticket_id IN (
  SELECT et.id FROM event_tickets et
  JOIN events e ON et.event_id = e.id
  WHERE e.advertiser_id IN (
    SELECT id FROM advertiser_profiles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Advertisers can update purchases for their events"
ON public.event_purchases FOR UPDATE
USING (event_ticket_id IN (
  SELECT et.id FROM event_tickets et
  JOIN events e ON et.event_id = e.id
  WHERE e.advertiser_id IN (
    SELECT id FROM advertiser_profiles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Admins can view all purchases"
ON public.event_purchases FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all purchases"
ON public.event_purchases FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_tickets_updated_at
BEFORE UPDATE ON public.event_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_purchases_updated_at
BEFORE UPDATE ON public.event_purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for event banners and payment proofs
INSERT INTO storage.buckets (id, name, public) VALUES ('event-assets', 'event-assets', true);

-- Storage policies for event assets
CREATE POLICY "Anyone can view event assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-assets');

CREATE POLICY "Authenticated users can upload event assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own event assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'event-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own event assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'event-assets' AND auth.uid()::text = (storage.foldername(name))[1]);