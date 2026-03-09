
-- Create advertiser_branches table
CREATE TABLE public.advertiser_branches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  advertiser_id uuid NOT NULL,
  branch_name text,
  full_address text NOT NULL,
  contact_name text,
  contact_email text,
  contact_phone text,
  latitude double precision,
  longitude double precision,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create advertiser_print_orders table
CREATE TABLE public.advertiser_print_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  advertiser_id uuid NOT NULL,
  branch_ids uuid[] NOT NULL DEFAULT '{}',
  materials jsonb NOT NULL DEFAULT '[]',
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.advertiser_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertiser_print_orders ENABLE ROW LEVEL SECURITY;

-- RLS for advertiser_branches
CREATE POLICY "Advertisers can view their own branches"
  ON public.advertiser_branches FOR SELECT
  USING (advertiser_id = auth.uid());

CREATE POLICY "Advertisers can insert their own branches"
  ON public.advertiser_branches FOR INSERT
  WITH CHECK (advertiser_id = auth.uid());

CREATE POLICY "Advertisers can update their own branches"
  ON public.advertiser_branches FOR UPDATE
  USING (advertiser_id = auth.uid())
  WITH CHECK (advertiser_id = auth.uid());

CREATE POLICY "Advertisers can delete their own branches"
  ON public.advertiser_branches FOR DELETE
  USING (advertiser_id = auth.uid());

CREATE POLICY "Admins can manage all branches"
  ON public.advertiser_branches FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS for advertiser_print_orders
CREATE POLICY "Advertisers can view their own print orders"
  ON public.advertiser_print_orders FOR SELECT
  USING (advertiser_id = auth.uid());

CREATE POLICY "Advertisers can insert their own print orders"
  ON public.advertiser_print_orders FOR INSERT
  WITH CHECK (advertiser_id = auth.uid());

CREATE POLICY "Advertisers can update their own print orders"
  ON public.advertiser_print_orders FOR UPDATE
  USING (advertiser_id = auth.uid());

CREATE POLICY "Admins can manage all print orders"
  ON public.advertiser_print_orders FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at on advertiser_branches
CREATE TRIGGER update_advertiser_branches_updated_at
  BEFORE UPDATE ON public.advertiser_branches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on advertiser_print_orders
CREATE TRIGGER update_advertiser_print_orders_updated_at
  BEFORE UPDATE ON public.advertiser_print_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Notify admins on new print order
CREATE OR REPLACE FUNCTION public.notify_admins_new_advertiser_print_order()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  FOR admin_user_id IN
    SELECT ap.user_id FROM public.admin_profiles ap WHERE ap.status = 'verified'
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      admin_user_id,
      'New Advertiser Print Order',
      'A new print order (Order #' || UPPER(LEFT(NEW.id::text, 8)) || ') has been submitted by an advertiser.',
      'advertiser_print_order'
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_advertiser_print_order
  AFTER INSERT ON public.advertiser_print_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_advertiser_print_order();
