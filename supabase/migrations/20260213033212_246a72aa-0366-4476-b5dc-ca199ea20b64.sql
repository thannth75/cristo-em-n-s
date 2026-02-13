
-- Make all prayer requests visible to all approved users (public by default)
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own prayers" ON public.prayer_requests;
DROP POLICY IF EXISTS "Leaders can view public prayers" ON public.prayer_requests;

-- New policy: All approved users can view all prayer requests
CREATE POLICY "Approved users can view all prayers"
ON public.prayer_requests
FOR SELECT
USING (is_user_approved(auth.uid()));
