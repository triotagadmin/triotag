
ALTER TABLE public.advertiser_print_orders
ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS paymongo_checkout_session_id text,
ADD COLUMN IF NOT EXISTS total_cost numeric DEFAULT 0;
