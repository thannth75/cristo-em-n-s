
DROP TRIGGER IF EXISTS trg_post_likes_count_ins ON public.post_likes;
DROP TRIGGER IF EXISTS trg_post_likes_count_del ON public.post_likes;
DROP TRIGGER IF EXISTS trg_post_comments_count_ins ON public.post_comments;
DROP TRIGGER IF EXISTS trg_post_comments_count_del ON public.post_comments;
DROP FUNCTION IF EXISTS public.tg_post_likes_count();
DROP FUNCTION IF EXISTS public.tg_post_comments_count();

-- Reconcile counters (in case double-counting happened between migrations)
UPDATE public.community_posts cp
   SET likes_count = COALESCE(sub.c, 0)
  FROM (SELECT post_id, COUNT(*)::int AS c FROM public.post_likes GROUP BY post_id) sub
 WHERE cp.id = sub.post_id;
UPDATE public.community_posts SET likes_count = 0
 WHERE likes_count > 0 AND id NOT IN (SELECT DISTINCT post_id FROM public.post_likes);

UPDATE public.community_posts cp
   SET comments_count = COALESCE(sub.c, 0)
  FROM (SELECT post_id, COUNT(*)::int AS c FROM public.post_comments GROUP BY post_id) sub
 WHERE cp.id = sub.post_id;
UPDATE public.community_posts SET comments_count = 0
 WHERE comments_count > 0 AND id NOT IN (SELECT DISTINCT post_id FROM public.post_comments);
