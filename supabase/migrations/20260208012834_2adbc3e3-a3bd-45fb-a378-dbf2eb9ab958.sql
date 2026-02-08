
-- Trigger para likes de testemunhos
CREATE OR REPLACE FUNCTION public.update_testimony_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.testimonies SET likes_count = likes_count + 1 WHERE id = NEW.testimony_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.testimonies SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.testimony_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS testimony_likes_counter_trigger ON testimony_likes;
CREATE TRIGGER testimony_likes_counter_trigger
  AFTER INSERT OR DELETE ON testimony_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_testimony_likes_count();
