-- 1. Drop old duplicate trigger
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;

-- 2. Recreate role-assignment function with safe fallback + exception handler
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
  ELSIF user_type_value = 'admin' THEN
    user_role := 'admin'::app_role;
  ELSE
    user_role := 'retailer'::app_role;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user_role failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- 3. Single consolidated trigger
DROP TRIGGER IF EXISTS on_auth_user_created_role_v2 ON auth.users;
CREATE TRIGGER on_auth_user_created_role_v2
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- 4. Wrap per-role triggers in EXCEPTION WHEN OTHERS

CREATE OR REPLACE FUNCTION public.handle_new_publisher()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'user_type' IN ('venue', 'digital', 'agent') THEN
    INSERT INTO public.publisher_profiles (
      user_id, publisher_type, business_name, contact_email, verified, verification_status
    )
    VALUES (
      NEW.id, 'venue'::publisher_type, 'Pending', NEW.email, false, 'pending'::approval_status
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_publisher failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_advertiser()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'user_type' IN ('advertiser', 'retailer', 'print_partner') THEN
    INSERT INTO public.advertiser_profiles (
      user_id, company_name, contact_name, contact_email, contact_phone
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'contact_name', ''),
      NEW.email,
      NEW.raw_user_meta_data->>'contact_phone'
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_advertiser failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'user_type' = 'admin' THEN
    INSERT INTO public.admin_profiles (user_id, full_name, phone_number)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NEW.raw_user_meta_data->>'phone_number'
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_admin failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_print_partner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'user_type' = 'print_partner' THEN
    INSERT INTO public.print_partner_profiles (
      user_id, company_name, contact_person, contact_email, contact_phone, business_address, status
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
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_print_partner failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;