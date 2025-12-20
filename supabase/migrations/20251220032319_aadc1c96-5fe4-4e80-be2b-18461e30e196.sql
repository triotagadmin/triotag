-- Create ticket_status enum for venue tickets
CREATE TYPE public.venue_ticket_status AS ENUM ('valid', 'used');

-- Create venues table for venue owners
CREATE TABLE public.venues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create venue_events table linked to venues
CREATE TABLE public.venue_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TEXT,
  ticket_price NUMERIC NOT NULL DEFAULT 0,
  total_tickets INTEGER NOT NULL DEFAULT 100,
  tickets_sold INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create venue_tickets table with unique_code, status enum, scanned_at
CREATE TABLE public.venue_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.venue_events(id) ON DELETE CASCADE,
  unique_code UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  status public.venue_ticket_status NOT NULL DEFAULT 'valid',
  customer_email TEXT,
  customer_name TEXT,
  scanned_at TIMESTAMP WITH TIME ZONE,
  scanned_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_tickets ENABLE ROW LEVEL SECURITY;

-- Venues RLS Policies
CREATE POLICY "Venue owners can view their own venues"
ON public.venues FOR SELECT
USING (owner_id = auth.uid());

CREATE POLICY "Venue owners can insert their own venues"
ON public.venues FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Venue owners can update their own venues"
ON public.venues FOR UPDATE
USING (owner_id = auth.uid());

CREATE POLICY "Venue owners can delete their own venues"
ON public.venues FOR DELETE
USING (owner_id = auth.uid());

CREATE POLICY "Anyone can view venues"
ON public.venues FOR SELECT
USING (true);

-- Venue Events RLS Policies
CREATE POLICY "Venue owners can view their own events"
ON public.venue_events FOR SELECT
USING (venue_id IN (SELECT id FROM public.venues WHERE owner_id = auth.uid()));

CREATE POLICY "Venue owners can insert events for their venues"
ON public.venue_events FOR INSERT
WITH CHECK (venue_id IN (SELECT id FROM public.venues WHERE owner_id = auth.uid()));

CREATE POLICY "Venue owners can update their own events"
ON public.venue_events FOR UPDATE
USING (venue_id IN (SELECT id FROM public.venues WHERE owner_id = auth.uid()));

CREATE POLICY "Venue owners can delete their own events"
ON public.venue_events FOR DELETE
USING (venue_id IN (SELECT id FROM public.venues WHERE owner_id = auth.uid()));

CREATE POLICY "Anyone can view published events"
ON public.venue_events FOR SELECT
USING (status = 'published');

-- Venue Tickets RLS Policies
CREATE POLICY "Venue owners can view tickets for their events"
ON public.venue_tickets FOR SELECT
USING (event_id IN (
  SELECT ve.id FROM public.venue_events ve
  JOIN public.venues v ON ve.venue_id = v.id
  WHERE v.owner_id = auth.uid()
));

CREATE POLICY "Venue owners can insert tickets for their events"
ON public.venue_tickets FOR INSERT
WITH CHECK (event_id IN (
  SELECT ve.id FROM public.venue_events ve
  JOIN public.venues v ON ve.venue_id = v.id
  WHERE v.owner_id = auth.uid()
));

CREATE POLICY "Venue owners can update tickets for their events"
ON public.venue_tickets FOR UPDATE
USING (event_id IN (
  SELECT ve.id FROM public.venue_events ve
  JOIN public.venues v ON ve.venue_id = v.id
  WHERE v.owner_id = auth.uid()
));

CREATE POLICY "Anyone can view their own tickets by email"
ON public.venue_tickets FOR SELECT
USING (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text);

CREATE POLICY "Public can view tickets by unique_code"
ON public.venue_tickets FOR SELECT
USING (true);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_venue_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_venues_updated_at
BEFORE UPDATE ON public.venues
FOR EACH ROW
EXECUTE FUNCTION public.update_venue_updated_at_column();

CREATE TRIGGER update_venue_events_updated_at
BEFORE UPDATE ON public.venue_events
FOR EACH ROW
EXECUTE FUNCTION public.update_venue_updated_at_column();

CREATE TRIGGER update_venue_tickets_updated_at
BEFORE UPDATE ON public.venue_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_venue_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_venue_tickets_unique_code ON public.venue_tickets(unique_code);
CREATE INDEX idx_venue_tickets_event_id ON public.venue_tickets(event_id);
CREATE INDEX idx_venue_events_venue_id ON public.venue_events(venue_id);

-- Enable realtime for tickets table
ALTER PUBLICATION supabase_realtime ADD TABLE public.venue_tickets;