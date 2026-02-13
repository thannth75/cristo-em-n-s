
-- Drop existing view and recreate with safe columns only
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT
  user_id,
  full_name,
  avatar_url,
  cover_url,
  bio,
  city,
  state,
  current_level,
  total_xp,
  last_seen,
  created_at,
  is_approved
FROM public.profiles
WHERE is_approved = true;

-- Grant access to authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;
