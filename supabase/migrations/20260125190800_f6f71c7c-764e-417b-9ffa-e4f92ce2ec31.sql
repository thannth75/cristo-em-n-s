
-- =====================================================
-- FIX: Resolve infinite recursion in profiles RLS
-- The problem: policies check profiles.is_approved which 
-- triggers the same policy, causing infinite recursion
-- Solution: Use SECURITY DEFINER functions to bypass RLS
-- =====================================================

-- Create helper function to check if user is approved (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_user_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_approved FROM public.profiles WHERE user_id = _user_id LIMIT 1),
    false
  )
$$;

-- Create helper function to check if user is approved admin or leader
CREATE OR REPLACE FUNCTION public.is_approved_admin_or_leader(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.is_admin_or_leader(_user_id) 
    AND public.is_user_approved(_user_id)
$$;

-- =====================================================
-- PROFILES TABLE: Fix RLS policies
-- =====================================================

-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Approved admins and leaders can view all profiles" ON public.profiles;

-- Users can always view their own profile (no recursion - direct user_id check)
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Approved admins/leaders can view all profiles using SECURITY DEFINER function
CREATE POLICY "Approved admins and leaders can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_approved_admin_or_leader(auth.uid()));

-- =====================================================
-- PRIVATE_MESSAGES TABLE: Fix RLS policies
-- =====================================================

-- Drop problematic policies
DROP POLICY IF EXISTS "Approved users can view their messages" ON public.private_messages;
DROP POLICY IF EXISTS "Approved users can send private messages" ON public.private_messages;
DROP POLICY IF EXISTS "Approved users can update received messages" ON public.private_messages;

-- Approved users can view their messages
CREATE POLICY "Approved users can view their messages"
ON public.private_messages
FOR SELECT
USING (
  (auth.uid() = sender_id OR auth.uid() = receiver_id)
  AND public.is_user_approved(auth.uid())
);

-- Approved users can send messages to approved receivers
CREATE POLICY "Approved users can send private messages"
ON public.private_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND public.is_user_approved(auth.uid())
  AND public.is_user_approved(receiver_id)
);

-- Approved receivers can update (mark as read)
CREATE POLICY "Approved users can update received messages"
ON public.private_messages
FOR UPDATE
USING (
  auth.uid() = receiver_id
  AND public.is_user_approved(auth.uid())
);

-- =====================================================
-- Ensure UPDATE policy exists for profiles
-- =====================================================
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- Ensure INSERT policy exists for profiles (for registration)
-- =====================================================
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Service role can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (true);
