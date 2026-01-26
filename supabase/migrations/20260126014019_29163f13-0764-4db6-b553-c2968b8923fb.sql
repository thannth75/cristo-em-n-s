-- Fix Security Definer Views by recreating with SECURITY INVOKER
-- Drop and recreate views with proper security context

DROP VIEW IF EXISTS public.attendance_summary;
DROP VIEW IF EXISTS public.engagement_metrics;

-- Recreate attendance_summary as SECURITY INVOKER (default, but explicit)
CREATE VIEW public.attendance_summary 
WITH (security_invoker = true)
AS
SELECT 
  a.user_id,
  p.full_name,
  p.city,
  p.state,
  COUNT(a.id) as total_attendances,
  COUNT(DISTINCT e.id) as events_attended,
  MAX(a.checked_in_at) as last_attendance,
  DATE_TRUNC('month', a.checked_in_at) as month
FROM public.attendance a
JOIN public.profiles p ON p.user_id = a.user_id
JOIN public.events e ON e.id = a.event_id
GROUP BY a.user_id, p.full_name, p.city, p.state, DATE_TRUNC('month', a.checked_in_at);

-- Recreate engagement_metrics as SECURITY INVOKER
CREATE VIEW public.engagement_metrics 
WITH (security_invoker = true)
AS
SELECT 
  p.user_id,
  p.full_name,
  p.city,
  p.state,
  p.is_approved,
  COALESCE(posts.post_count, 0) as posts_count,
  COALESCE(prayers.prayer_count, 0) as prayers_count,
  COALESCE(testimonies.testimony_count, 0) as testimonies_count,
  COALESCE(studies.study_progress, 0) as study_chapters_completed,
  COALESCE(devotionals.devotional_count, 0) as devotionals_completed,
  COALESCE(quizzes.quiz_count, 0) as quizzes_completed
FROM public.profiles p
LEFT JOIN (
  SELECT user_id, COUNT(*) as post_count FROM public.community_posts GROUP BY user_id
) posts ON posts.user_id = p.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) as prayer_count FROM public.prayer_requests GROUP BY user_id
) prayers ON prayers.user_id = p.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) as testimony_count FROM public.testimonies WHERE is_approved = true GROUP BY user_id
) testimonies ON testimonies.user_id = p.user_id
LEFT JOIN (
  SELECT user_id, SUM(array_length(chapters_completed, 1)) as study_progress FROM public.study_progress GROUP BY user_id
) studies ON studies.user_id = p.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) as devotional_count FROM public.devotional_progress GROUP BY user_id
) devotionals ON devotionals.user_id = p.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) as quiz_count FROM public.user_quiz_attempts GROUP BY user_id
) quizzes ON quizzes.user_id = p.user_id;

-- Grant access to views
GRANT SELECT ON public.attendance_summary TO authenticated;
GRANT SELECT ON public.engagement_metrics TO authenticated;