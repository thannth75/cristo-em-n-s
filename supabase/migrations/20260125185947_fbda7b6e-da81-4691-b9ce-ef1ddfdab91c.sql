-- =====================================================
-- FIX 1: Strengthen profiles table RLS policies
-- Ensure only approved users can view other profiles
-- =====================================================

-- Drop existing policies on profiles
DROP POLICY IF EXISTS "Admins and leaders can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Recreate with approval checks
-- Users can always view their own profile (needed for pending approval page)
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Only approved admins/leaders can view all profiles
CREATE POLICY "Approved admins and leaders can view all profiles"
ON public.profiles
FOR SELECT
USING (
  is_admin_or_leader(auth.uid()) 
  AND EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.is_approved = true
  )
);

-- =====================================================
-- FIX 2: Strengthen private_messages RLS policies
-- Add approval check and prevent ID enumeration
-- =====================================================

-- Drop existing policies on private_messages
DROP POLICY IF EXISTS "Users can view their messages" ON public.private_messages;
DROP POLICY IF EXISTS "Users can send private messages" ON public.private_messages;
DROP POLICY IF EXISTS "Users can update received messages" ON public.private_messages;

-- Only approved users can view their messages
CREATE POLICY "Approved users can view their messages"
ON public.private_messages
FOR SELECT
USING (
  (auth.uid() = sender_id OR auth.uid() = receiver_id)
  AND EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.is_approved = true
  )
);

-- Only approved users can send messages
CREATE POLICY "Approved users can send private messages"
ON public.private_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.is_approved = true
  )
  -- Ensure receiver exists and is approved (prevents enumeration)
  AND EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = receiver_id 
    AND p.is_approved = true
  )
);

-- Only approved receivers can update (mark as read)
CREATE POLICY "Approved users can update received messages"
ON public.private_messages
FOR UPDATE
USING (
  auth.uid() = receiver_id
  AND EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.is_approved = true
  )
);

-- =====================================================
-- FIX 3: Fix prayer_requests RLS to respect is_private
-- Private prayers should only be visible to the owner
-- =====================================================

-- Drop existing SELECT policies on prayer_requests
DROP POLICY IF EXISTS "Leaders can view all prayers" ON public.prayer_requests;
DROP POLICY IF EXISTS "Users can view their own prayers" ON public.prayer_requests;

-- Users can always view their own prayers (private or not)
CREATE POLICY "Users can view their own prayers"
ON public.prayer_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Leaders can view PUBLIC prayers only (is_private = false)
CREATE POLICY "Leaders can view public prayers"
ON public.prayer_requests
FOR SELECT
USING (
  is_admin_or_leader(auth.uid())
  AND is_private = false
);

-- Note: Leaders can still UPDATE and DELETE all prayers for moderation
-- The existing update/delete policies remain in place