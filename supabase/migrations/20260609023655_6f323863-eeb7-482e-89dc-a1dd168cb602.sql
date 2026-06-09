
-- 1) community_posts INSERT: require approval
DROP POLICY IF EXISTS "Users can create posts" ON public.community_posts;
CREATE POLICY "Users can create posts"
ON public.community_posts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_user_approved(auth.uid()));

-- 2) post_likes INSERT: require approval
DROP POLICY IF EXISTS "Users can like posts" ON public.post_likes;
CREATE POLICY "Users can like posts"
ON public.post_likes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_user_approved(auth.uid()));

-- 3) post_reposts DELETE: require approval
DROP POLICY IF EXISTS "Users can delete own reposts" ON public.post_reposts;
CREATE POLICY "Users can delete own reposts"
ON public.post_reposts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND public.is_user_approved(auth.uid()));

-- 4) user_achievements INSERT: use approved admin/leader check
DROP POLICY IF EXISTS "System can grant achievements" ON public.user_achievements;
CREATE POLICY "System can grant achievements"
ON public.user_achievements
FOR INSERT
TO authenticated
WITH CHECK (public.is_approved_admin_or_leader(auth.uid()));

-- 5) storage chat-media INSERT: require approval
DROP POLICY IF EXISTS "Users can upload chat media" ON storage.objects;
CREATE POLICY "Users can upload chat media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-media'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND public.is_user_approved(auth.uid())
);
