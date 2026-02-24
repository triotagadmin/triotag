
CREATE OR REPLACE FUNCTION public.handle_new_publisher()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Create publisher profile for venue users (all publisher accounts are venue type)
  IF NEW.raw_user_meta_data->>'user_type' IN ('venue', 'digital', 'agent') THEN
    INSERT INTO public.publisher_profiles (
      user_id,
      publisher_type,
      business_name,
      contact_email,
      verified,
      verification_status
    )
    VALUES (
      NEW.id,
      'venue'::publisher_type,
      'Pending',
      NEW.email,
      false,
      'pending'::approval_status
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Also update handle_new_user_role to map all publisher subtypes to publisher role
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_role app_role;
  user_type_value text;
BEGIN
  user_type_value := NEW.raw_user_meta_data->>'user_type';
  
  IF user_type_value IN ('venue', 'digital', 'agent') THEN
    user_role := 'publisher'::app_role;
  ELSE
    user_role := COALESCE(
      user_type_value::app_role,
      'advertiser'::app_role
    );
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$function$;
