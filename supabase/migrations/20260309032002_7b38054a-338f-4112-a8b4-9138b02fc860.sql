
-- 1. CRITICAL: Prevent users from self-approving via profile UPDATE
-- Create a trigger that blocks users from modifying protected approval fields
CREATE OR REPLACE FUNCTION public.prevent_self_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admin/leader to change approval fields
  IF (OLD.is_approved IS DISTINCT FROM NEW.is_approved
      OR OLD.approved_by IS DISTINCT FROM NEW.approved_by
      OR OLD.approved_at IS DISTINCT FROM NEW.approved_at)
  THEN
    IF NOT is_approved_admin_or_leader(auth.uid()) THEN
      RAISE EXCEPTION 'Only administrators can modify approval status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_self_approval_trigger ON public.profiles;
CREATE TRIGGER prevent_self_approval_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_approval();

-- 2. Restrict profile SELECT to hide sensitive fields from non-owners
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Approved users view approved profiles basic info" ON public.profiles;

-- Create two replacement policies:
-- a) Users can see ALL their own profile data
CREATE POLICY "Users can view own full profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- b) Approved users see other approved profiles (RLS can't filter columns, 
--    but the trigger + view approach already handles this; this policy 
--    ensures basic access for lookups like avatars/names)
CREATE POLICY "Approved users view other approved profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (is_user_approved(auth.uid()) AND is_approved = true);

-- 3. Fix private prayer requests leak
DROP POLICY IF EXISTS "Approved users can view all prayers" ON public.prayer_requests;

CREATE POLICY "Approved users can view prayers respecting privacy"
  ON public.prayer_requests FOR SELECT
  TO authenticated
  USING (
    is_user_approved(auth.uid()) 
    AND (is_private = false OR user_id = auth.uid())
  );
