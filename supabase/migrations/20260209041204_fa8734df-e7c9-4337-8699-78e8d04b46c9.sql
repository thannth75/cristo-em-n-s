-- Corrigir search_path na função check_profile_complete
CREATE OR REPLACE FUNCTION public.check_profile_complete()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_profile_complete := (NEW.city IS NOT NULL AND NEW.city != '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;