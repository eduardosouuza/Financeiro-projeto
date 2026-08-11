/*
# Fix security warnings on handle_new_user function

## Changes
- Set explicit search_path on handle_new_user to prevent search_path injection
- Revoke EXECUTE from anon and authenticated roles (function is only called by trigger, not via API)
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.settings (user_id, theme) VALUES (NEW.id, 'light');
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;