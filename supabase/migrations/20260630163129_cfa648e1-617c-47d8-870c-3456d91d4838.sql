
-- 1. PROFILES: drop broad cross-user policy
DROP POLICY IF EXISTS "Approved users view other approved profiles" ON public.profiles;

-- 2. PUBLIC_PROFILES view: change to security_definer (no security_invoker) so it bypasses RLS,
--    exposing ONLY safe columns to approved members.
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT user_id, full_name, avatar_url, cover_url, bio, city, state,
       current_level, total_xp, last_seen, created_at, is_approved
FROM public.profiles
WHERE is_approved = true;

GRANT SELECT ON public.public_profiles TO authenticated;

-- 3. READING PLANS: require approved user
DROP POLICY IF EXISTS "Anyone can view reading plans" ON public.reading_plans;
CREATE POLICY "Approved users can view reading plans"
ON public.reading_plans FOR SELECT TO authenticated
USING (public.is_user_approved(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view plan days" ON public.reading_plan_days;
CREATE POLICY "Approved users can view plan days"
ON public.reading_plan_days FOR SELECT TO authenticated
USING (public.is_user_approved(auth.uid()));

-- 4. STORAGE: drop broad SELECT policies that allow listing public buckets.
--    Files in public buckets remain reachable via direct public URL.
DROP POLICY IF EXISTS "Anyone can view post images" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Chat media is publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Cover images are publicly accessible" ON storage.objects;

-- 5. REVOKE EXECUTE from anon on all public functions; revoke from authenticated for
--    functions that should never be RPC-callable (returns another user's email).
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_email(uuid) FROM authenticated, PUBLIC;

-- 6. CRON SECRET config + community birthdays RPC
INSERT INTO public.admin_config (config_key, config_value)
VALUES ('cron_secret', 'o1uq2OCCl2eNi-m_QH2k8OC3Zjl-ZV36NerVMzKv8upeVpY_')
ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value;

CREATE OR REPLACE FUNCTION public.get_community_birthdays()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  avatar_url text,
  birth_day int,
  birth_month int
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.full_name, p.avatar_url,
         EXTRACT(day FROM p.birth_date)::int  AS birth_day,
         EXTRACT(month FROM p.birth_date)::int AS birth_month
  FROM public.profiles p
  WHERE p.is_approved = true
    AND p.birth_date IS NOT NULL
    AND public.is_user_approved(auth.uid())
$$;

REVOKE EXECUTE ON FUNCTION public.get_community_birthdays() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_community_birthdays() TO authenticated;

-- 7. Update push-relay trigger to include x-cron-secret header
CREATE OR REPLACE FUNCTION public.trigger_push_relay()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cron_secret text;
BEGIN
  IF NEW.push_delivered = false THEN
    SELECT config_value INTO v_cron_secret
    FROM public.admin_config WHERE config_key = 'cron_secret' LIMIT 1;

    PERFORM net.http_post(
      url := 'https://ackbxokwnkagolepezmp.supabase.co/functions/v1/push-relay',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFja2J4b2t3bmthZ29sZXBlem1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNTc2MDYsImV4cCI6MjA4NDkzMzYwNn0.paz8BEtRM1nrcZOaKznnqXHtlzCSPxQC2KE7kLduwkY',
        'x-cron-secret', COALESCE(v_cron_secret, '')
      ),
      body := jsonb_build_object(
        'user_id', NEW.user_id,
        'title', NEW.title,
        'body', NEW.message,
        'url', COALESCE(NEW.action_url, '/'),
        'tag', 'notif-' || NEW.id::text
      )
    );
  END IF;
  RETURN NEW;
END;
$$;
