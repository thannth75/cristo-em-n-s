
-- Atomic counters via DB triggers for community feed
-- Fixes: likes_count not updating from post_likes, comments_count race conditions

-- ============ POST LIKES ============
CREATE OR REPLACE FUNCTION public.tg_post_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts
       SET likes_count = GREATEST(0, COALESCE(likes_count,0) + 1)
     WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts
       SET likes_count = GREATEST(0, COALESCE(likes_count,0) - 1)
     WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;

DROP TRIGGER IF EXISTS trg_post_likes_count_ins ON public.post_likes;
DROP TRIGGER IF EXISTS trg_post_likes_count_del ON public.post_likes;
CREATE TRIGGER trg_post_likes_count_ins AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.tg_post_likes_count();
CREATE TRIGGER trg_post_likes_count_del AFTER DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.tg_post_likes_count();

-- ============ POST COMMENTS ============
CREATE OR REPLACE FUNCTION public.tg_post_comments_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts
       SET comments_count = GREATEST(0, COALESCE(comments_count,0) + 1)
     WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts
       SET comments_count = GREATEST(0, COALESCE(comments_count,0) - 1)
     WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;

DROP TRIGGER IF EXISTS trg_post_comments_count_ins ON public.post_comments;
DROP TRIGGER IF EXISTS trg_post_comments_count_del ON public.post_comments;
CREATE TRIGGER trg_post_comments_count_ins AFTER INSERT ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.tg_post_comments_count();
CREATE TRIGGER trg_post_comments_count_del AFTER DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.tg_post_comments_count();

-- ============ RECONCILE EXISTING COUNTS ============
UPDATE public.community_posts cp
   SET likes_count = COALESCE(sub.c, 0)
  FROM (SELECT post_id, COUNT(*)::int AS c FROM public.post_likes GROUP BY post_id) sub
 WHERE cp.id = sub.post_id;

UPDATE public.community_posts SET likes_count = 0
 WHERE likes_count > 0
   AND id NOT IN (SELECT DISTINCT post_id FROM public.post_likes);

UPDATE public.community_posts cp
   SET comments_count = COALESCE(sub.c, 0)
  FROM (SELECT post_id, COUNT(*)::int AS c FROM public.post_comments GROUP BY post_id) sub
 WHERE cp.id = sub.post_id;

UPDATE public.community_posts SET comments_count = 0
 WHERE comments_count > 0
   AND id NOT IN (SELECT DISTINCT post_id FROM public.post_comments);

-- ============ HELPFUL INDEXES ============
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON public.community_posts(created_at DESC);
