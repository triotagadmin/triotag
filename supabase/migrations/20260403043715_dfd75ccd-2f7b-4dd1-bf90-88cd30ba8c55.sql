
CREATE OR REPLACE FUNCTION public.handle_new_print_partner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'user_type' = 'print_partner' THEN
    INSERT INTO public.print_partner_profiles (
      user_id,
      company_name,
      contact_person,
      contact_email,
      contact_phone,
      business_address,
      status
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'contact_name', ''),
      NEW.email,
      NEW.raw_user_meta_data->>'contact_phone',
      NEW.raw_user_meta_data->>'business_address',
      'active'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Also update any existing pending print partner profiles to active
UPDATE public.print_partner_profiles SET status = 'active' WHERE status = 'pending';
