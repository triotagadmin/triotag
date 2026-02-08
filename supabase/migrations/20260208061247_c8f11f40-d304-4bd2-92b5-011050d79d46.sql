
-- Function to notify all verified admins when a new print order is created
CREATE OR REPLACE FUNCTION public.notify_admins_new_print_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Loop through all verified admins and insert a notification for each
  FOR admin_user_id IN
    SELECT ap.user_id
    FROM public.admin_profiles ap
    WHERE ap.status = 'verified'
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      admin_user_id,
      'New Ad Order Received',
      'A new print order for "' || NEW.product_name || '" (Order #' || UPPER(LEFT(NEW.id::text, 8)) || ') has been submitted and is awaiting your review.',
      'new_print_order'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger on print_orders table
CREATE TRIGGER on_new_print_order_notify_admins
AFTER INSERT ON public.print_orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_new_print_order();
