-- Create function to automatically create publisher profiles on signup
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
      verification_status
    )
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data->>'user_type')::publisher_type,
      'Pending',
      NEW.email,
      false,
      'pending'::approval_status
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to run after user creation
DROP TRIGGER IF EXISTS on_auth_publisher_created ON auth.users;
CREATE TRIGGER on_auth_publisher_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_publisher();