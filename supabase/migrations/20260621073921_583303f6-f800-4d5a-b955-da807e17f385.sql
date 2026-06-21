CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_type_value text;
  user_role app_role;
BEGIN
  user_type_value := NEW.raw_user_meta_data->>'user_type';

  IF user_type_value IN ('venue', 'digital', 'agent') THEN
    user_role := 'agent'::app_role;
  ELSIF user_type_value = 'talent' THEN
    user_role := 'talent'::app_role;
  ELSIF user_type_value = 'print_partner' THEN
    user_role := 'print_partner'::app_role;
  ELSIF user_type_value = 'brand_advertiser' THEN
    user_role := 'brand_advertiser'::app_role;
  ELSIF user_type_value IN ('advertiser', 'retailer') THEN
    user_role := 'retailer'::app_role;
  ELSE
    user_role := COALESCE(user_type_value::app_role, 'retailer'::app_role);
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;