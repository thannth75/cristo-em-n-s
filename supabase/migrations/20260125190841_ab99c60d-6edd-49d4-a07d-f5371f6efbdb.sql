
-- Fix the overly permissive INSERT policy on profiles
-- The handle_new_user trigger runs as SECURITY DEFINER so it can insert
-- We need to restrict this policy to only allow service role or trigger

DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;

-- No direct INSERT policy needed - the trigger handles profile creation
-- If we need direct inserts, they should come from the handle_new_user trigger only
