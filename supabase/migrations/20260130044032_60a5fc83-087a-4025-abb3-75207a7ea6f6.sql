-- 1. Drop existing policies for profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Approved users can view approved profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and leaders can view all profiles" ON public.profiles;

-- 2. Create restrictive policies for profiles (only own profile or admin/leader)
CREATE POLICY "Users see own full profile"
ON public.profiles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Leaders see all profiles"
ON public.profiles FOR SELECT
USING (public.is_approved_admin_or_leader(auth.uid()));

-- 3. Fix public_profiles view - recreate with security_invoker
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT 
  user_id,
  full_name,
  avatar_url,
  cover_url,
  bio,
  current_level,
  total_xp,
  is_approved,
  last_seen,
  created_at
FROM public.profiles
WHERE is_approved = true;

GRANT SELECT ON public.public_profiles TO authenticated;

-- 4. Create safe member directory view
DROP VIEW IF EXISTS public.member_directory;

CREATE VIEW public.member_directory
WITH (security_invoker = true) AS
SELECT 
  p.user_id,
  p.full_name,
  p.avatar_url,
  p.current_level,
  p.is_approved
FROM public.profiles p
WHERE p.is_approved = true;

GRANT SELECT ON public.member_directory TO authenticated;

-- 5. Fix attendance_summary - restrict to admins only
DROP VIEW IF EXISTS public.attendance_summary;

CREATE VIEW public.attendance_summary
WITH (security_invoker = true) AS
SELECT 
  p.user_id,
  p.full_name,
  p.city,
  p.state,
  COUNT(a.id) as total_attendance,
  MAX(a.checked_in_at) as last_attendance
FROM public.profiles p
LEFT JOIN public.attendance a ON a.user_id = p.user_id
WHERE p.is_approved = true
  AND public.is_approved_admin_or_leader(auth.uid())
GROUP BY p.user_id, p.full_name, p.city, p.state;

GRANT SELECT ON public.attendance_summary TO authenticated;