-- Fix the user role trigger to properly map publisher types
-- The issue: venue/digital/agent were being inserted as roles, but they should map to 'publisher'
-- The specific publisher type (venue/digital/agent) is handled separately in publisher_profiles table

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
  -- Get user_type from metadata
  user_type_value := NEW.raw_user_meta_data->>'user_type';
  
  -- Map publisher types (venue, digital, agent) to 'publisher' role
  -- All other values pass through (advertiser, admin, etc.)
  IF user_type_value IN ('venue', 'digital', 'agent') THEN
    user_role := 'publisher'::app_role;
  ELSE
    user_role := COALESCE(
      user_type_value::app_role,
      'advertiser'::app_role
    );
  END IF;
  
  -- Insert the role for the new user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$function$;