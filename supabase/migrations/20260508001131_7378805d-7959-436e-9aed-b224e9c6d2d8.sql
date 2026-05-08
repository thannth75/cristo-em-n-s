
-- 1) profiles: revoke column-level SELECT on sensitive fields from anon/authenticated
REVOKE SELECT (email, phone, birth_date) ON public.profiles FROM anon, authenticated;

-- 2) push_subscriptions: require authenticated role for INSERT
DROP POLICY IF EXISTS "Users can create their own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can create their own subscriptions"
ON public.push_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- 3) auto_devotional_log: restrict SELECT to admins/leaders
DROP POLICY IF EXISTS "Approved users can view auto devotional log" ON public.auto_devotional_log;
CREATE POLICY "Admins and leaders can view auto devotional log"
ON public.auto_devotional_log
FOR SELECT
TO authenticated
USING (is_approved_admin_or_leader(auth.uid()));

-- 4) prayer_comments: allow approved users to comment on public prayer requests
CREATE POLICY "Approved users can comment on public prayers"
ON public.prayer_comments
FOR INSERT
TO authenticated
WITH CHECK (
  is_user_approved(auth.uid())
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.prayer_requests pr
    WHERE pr.id = prayer_comments.prayer_id
      AND COALESCE(pr.is_private, false) = false
  )
);
