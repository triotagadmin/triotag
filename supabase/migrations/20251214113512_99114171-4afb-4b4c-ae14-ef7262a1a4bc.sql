-- Create tickets table for event ticket marketplace
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('advertiser', 'publisher')),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TEXT,
  location TEXT NOT NULL,
  venue_name TEXT,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  quantity_available INTEGER NOT NULL DEFAULT 0,
  quantity_sold INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID
);

-- Enable Row Level Security
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Create policies for tickets
CREATE POLICY "Anyone can view approved tickets" 
ON public.tickets 
FOR SELECT 
USING (status = 'approved');

CREATE POLICY "Owners can view their own tickets" 
ON public.tickets 
FOR SELECT 
USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can insert tickets" 
ON public.tickets 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own tickets" 
ON public.tickets 
FOR UPDATE 
USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their own tickets" 
ON public.tickets 
FOR DELETE 
USING (owner_id = auth.uid());

CREATE POLICY "Admins can view all tickets" 
ON public.tickets 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all tickets" 
ON public.tickets 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all tickets" 
ON public.tickets 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create ticket_orders table for purchases
CREATE TABLE public.ticket_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  buyer_email TEXT NOT NULL,
  buyer_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  order_code TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security for orders
ALTER TABLE public.ticket_orders ENABLE ROW LEVEL SECURITY;

-- Create policies for ticket orders
CREATE POLICY "Anyone can create orders" 
ON public.ticket_orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Buyers can view their own orders" 
ON public.ticket_orders 
FOR SELECT 
USING (buyer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Ticket owners can view orders for their tickets" 
ON public.ticket_orders 
FOR SELECT 
USING (ticket_id IN (SELECT id FROM public.tickets WHERE owner_id = auth.uid()));

CREATE POLICY "Admins can view all orders" 
ON public.ticket_orders 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tickets_updated_at
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();