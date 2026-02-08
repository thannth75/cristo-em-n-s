
-- PARTE 4: Corrigir política permissiva em auto_devotional_log
DROP POLICY IF EXISTS "Service role can insert auto devotional log" ON auto_devotional_log;

-- PARTE 5: Corrigir política de seguimento (user_follows) que está pública
-- Verificar se existe e corrigir
DROP POLICY IF EXISTS "Anyone can see follows" ON user_follows;

CREATE POLICY "Approved users can view follows"
ON public.user_follows FOR SELECT
USING (is_user_approved(auth.uid()));

-- PARTE 6: Adicionar triggers para contadores de posts
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS post_likes_counter_trigger ON post_likes;
CREATE TRIGGER post_likes_counter_trigger
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_likes_count();

-- Trigger para comentários
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS post_comments_counter_trigger ON post_comments;
CREATE TRIGGER post_comments_counter_trigger
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_comments_count();

-- Trigger para reposts
CREATE OR REPLACE FUNCTION public.update_post_reposts_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts SET reposts_count = reposts_count + 1 WHERE id = NEW.original_post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts SET reposts_count = GREATEST(0, reposts_count - 1) WHERE id = OLD.original_post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS post_reposts_counter_trigger ON post_reposts;
CREATE TRIGGER post_reposts_counter_trigger
  AFTER INSERT OR DELETE ON post_reposts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_reposts_count();
