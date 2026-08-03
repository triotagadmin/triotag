CREATE OR REPLACE FUNCTION public.handle_new_agent()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.raw_user_meta_data->>'user_type' = 'agent' THEN
    INSERT INTO public.publisher_profiles (
      user_id,
      publisher_type,
      business_name,
      contact_email,
      contact_phone,
      location,
      verification_status,
      verified
    ) VALUES (
      NEW.id,
      'agent'::publisher_type,
      COALESCE(NEW.raw_user_meta_data->>'business_name', NEW.raw_user_meta_data->>'full_name', ''),
      NEW.email,
      NEW.raw_user_meta_data->>'contact_phone',
      NEW.raw_user_meta_data->>'location',
      'pending'::approval_status,
      false
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_agent failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created_agent ON auth.users;
CREATE TRIGGER on_auth_user_created_agent
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_agent();