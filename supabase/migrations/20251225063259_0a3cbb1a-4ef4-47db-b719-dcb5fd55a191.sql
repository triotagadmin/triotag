-- Add currency column to tickets table
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'PHP';

-- Create ticket_sales table for successful PayMongo purchases
CREATE TABLE IF NOT EXISTS public.ticket_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  buyer_name text NOT NULL,
  buyer_email text NOT NULL,
  buyer_phone text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  total_amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'PHP',
  payment_method text NOT NULL DEFAULT 'paymongo',
  paymongo_checkout_session_id text,
  paymongo_payment_id text,
  payment_status text NOT NULL DEFAULT 'pending',
  qr_code text UNIQUE,
  serial_number text UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on ticket_sales
ALTER TABLE public.ticket_sales ENABLE ROW LEVEL SECURITY;

-- Admins can view all ticket sales
CREATE POLICY "Admins can view all ticket sales"
ON public.ticket_sales
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update ticket sales
CREATE POLICY "Admins can update ticket sales"
ON public.ticket_sales
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Buyers can view their own ticket sales by email
CREATE POLICY "Buyers can view their own ticket sales"
ON public.ticket_sales
FOR SELECT
USING (buyer_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text);

-- Anyone can insert ticket sales (webhook will do this)
CREATE POLICY "Anyone can insert ticket sales"
ON public.ticket_sales
FOR INSERT
WITH CHECK (true);

-- Ticket owners can view sales for their tickets
CREATE POLICY "Ticket owners can view sales for their tickets"
ON public.ticket_sales
FOR SELECT
USING (ticket_id IN (SELECT id FROM public.tickets WHERE owner_id = auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_ticket_sales_updated_at
BEFORE UPDATE ON public.ticket_sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for ticket_sales
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_sales;