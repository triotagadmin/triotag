
CREATE OR REPLACE FUNCTION public.set_own_role(_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_roles
  SET role = _role
  WHERE user_id = auth.uid();
END;
$$;
