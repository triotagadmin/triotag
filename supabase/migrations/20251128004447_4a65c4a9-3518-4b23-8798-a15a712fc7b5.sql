-- Fix handle_new_publisher to satisfy check constraint
CREATE OR REPLACE FUNCTION public.handle_new_publisher()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create publisher profile for venue, digital, or agent users
  IF NEW.raw_user_meta_data->>'user_type' IN ('venue', 'digital', 'agent') THEN
    INSERT INTO public.publisher_profiles (
      user_id,
      publisher_type,
      business_name,
      contact_email,
      verified,
      verification_status,
      agent_role
    )
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data->>'user_type')::publisher_type,
      'Pending',
      NEW.email,
      false,
      'pending'::approval_status,
      -- Set default agent_role for agents to satisfy check constraint
      CASE 
        WHEN NEW.raw_user_meta_data->>'user_type' = 'agent' THEN 'guerrilla'::agent_role
        ELSE NULL
      END
    );
  END IF;
  RETURN NEW;
END;
$$;