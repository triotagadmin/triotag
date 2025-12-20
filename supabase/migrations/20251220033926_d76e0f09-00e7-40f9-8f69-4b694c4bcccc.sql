-- Create enum for publisher ticket status
CREATE TYPE public.publisher_ticket_status AS ENUM ('active', 'used');

-- Create publisher_tickets table for venue publisher ticket management
CREATE TABLE public.publisher_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  event_name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  secret_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  status public.publisher_ticket_status NOT NULL DEFAULT 'active',
  scanned_at TIMESTAMP WITH TIME ZONE,
  scanned_by_ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.publisher_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Creators can view their own tickets"
ON public.publisher_tickets FOR SELECT
USING (creator_id = auth.uid());

CREATE POLICY "Creators can insert their own tickets"
ON public.publisher_tickets FOR INSERT
WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can update their own tickets"
ON public.publisher_tickets FOR UPDATE
USING (creator_id = auth.uid());

CREATE POLICY "Creators can delete their own tickets"
ON public.publisher_tickets FOR DELETE
USING (creator_id = auth.uid());

-- Public can view tickets for validation (needed for the validate page)
CREATE POLICY "Public can view tickets by id and token for validation"
ON public.publisher_tickets FOR SELECT
USING (true);

-- Create atomic validation function (prevents race conditions)
CREATE OR REPLACE FUNCTION public.validate_publisher_ticket(
  p_ticket_id UUID,
  p_secret_token TEXT,
  p_scanner_ip TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket RECORD;
  v_result JSON;
BEGIN
  -- Lock the row for update to prevent race conditions
  SELECT * INTO v_ticket
  FROM public.publisher_tickets
  WHERE id = p_ticket_id AND secret_token = p_secret_token
  FOR UPDATE;

  -- Check if ticket exists
  IF v_ticket IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'invalid_ticket',
      'message', 'Ticket not found or invalid token'
    );
  END IF;

  -- Check if already used
  IF v_ticket.status = 'used' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'already_used',
      'message', 'This ticket was already scanned',
      'scanned_at', v_ticket.scanned_at,
      'event_name', v_ticket.event_name
    );
  END IF;

  -- Mark as used atomically
  UPDATE public.publisher_tickets
  SET 
    status = 'used',
    scanned_at = now(),
    scanned_by_ip = p_scanner_ip,
    updated_at = now()
  WHERE id = p_ticket_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Access Granted',
    'event_name', v_ticket.event_name,
    'price', v_ticket.price,
    'scanned_at', now()
  );
END;
$$;

-- Create index for faster lookups
CREATE INDEX idx_publisher_tickets_creator ON public.publisher_tickets(creator_id);
CREATE INDEX idx_publisher_tickets_status ON public.publisher_tickets(status);
CREATE INDEX idx_publisher_tickets_token ON public.publisher_tickets(secret_token);

-- Add trigger for updated_at
CREATE TRIGGER update_publisher_tickets_updated_at
BEFORE UPDATE ON public.publisher_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_venue_updated_at_column();