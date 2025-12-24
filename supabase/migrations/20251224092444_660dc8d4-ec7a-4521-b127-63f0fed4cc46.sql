-- Create enum for print order status
CREATE TYPE public.print_order_status AS ENUM ('pending_admin', 'in_production', 'shipped', 'delivered');

-- Create print_orders table
CREATE TABLE public.print_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activation_id UUID REFERENCES public.activations(id) ON DELETE CASCADE,
  advertiser_id UUID NOT NULL,
  order_status public.print_order_status NOT NULL DEFAULT 'pending_admin',
  product_sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_specs JSONB,
  quantity INTEGER NOT NULL DEFAULT 1,
  design_url TEXT NOT NULL,
  shipping_address JSONB NOT NULL,
  shipping_country TEXT NOT NULL DEFAULT 'PH',
  total_price DECIMAL(10,2),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.print_orders ENABLE ROW LEVEL SECURITY;

-- Advertisers can view their own orders
CREATE POLICY "Advertisers can view their own print orders"
ON public.print_orders FOR SELECT
USING (advertiser_id = auth.uid());

-- Advertisers can insert their own orders
CREATE POLICY "Advertisers can insert their own print orders"
ON public.print_orders FOR INSERT
WITH CHECK (advertiser_id = auth.uid());

-- Advertisers can update their own pending orders
CREATE POLICY "Advertisers can update their own pending print orders"
ON public.print_orders FOR UPDATE
USING (advertiser_id = auth.uid() AND order_status = 'pending_admin');

-- Admins can view all orders
CREATE POLICY "Admins can view all print orders"
ON public.print_orders FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update all orders
CREATE POLICY "Admins can update all print orders"
ON public.print_orders FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete orders
CREATE POLICY "Admins can delete print orders"
ON public.print_orders FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_print_orders_updated_at
BEFORE UPDATE ON public.print_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add to realtime for admin notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.print_orders;