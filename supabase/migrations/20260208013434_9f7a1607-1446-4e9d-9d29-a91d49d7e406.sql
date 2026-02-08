
-- Recriar views restantes com security_invoker = true

-- View engagement_metrics - com nome de tabela correto
DROP VIEW IF EXISTS engagement_metrics;
CREATE VIEW engagement_metrics WITH (security_invoker = true) AS
SELECT 
  p.user_id,
  p.full_name,
  p.is_approved,
  p.city,
  p.state,
  COALESCE((SELECT COUNT(*) FROM devotional_progress dp WHERE dp.user_id = p.user_id), 0) AS devotionals_completed,
  COALESCE((SELECT COUNT(*) FROM user_quiz_attempts qa WHERE qa.user_id = p.user_id), 0) AS quizzes_completed,
  COALESCE((SELECT COUNT(*) FROM daily_reading_checkins drc WHERE drc.user_id = p.user_id), 0) AS study_chapters_completed,
  COALESCE((SELECT COUNT(*) FROM testimonies t WHERE t.user_id = p.user_id), 0) AS testimonies_count,
  COALESCE((SELECT COUNT(*) FROM prayer_requests pr WHERE pr.user_id = p.user_id), 0) AS prayers_count,
  COALESCE((SELECT COUNT(*) FROM community_posts cp WHERE cp.user_id = p.user_id), 0) AS posts_count
FROM profiles p
WHERE p.is_approved = true;

-- View member_directory - recriar com security_invoker
DROP VIEW IF EXISTS member_directory;
CREATE VIEW member_directory WITH (security_invoker = true) AS
SELECT 
  user_id,
  full_name,
  avatar_url,
  current_level,
  is_approved
FROM profiles
WHERE is_approved = true;

-- View public_profiles - recriar com security_invoker e apenas campos públicos (sem email/telefone)
DROP VIEW IF EXISTS public_profiles;
CREATE VIEW public_profiles WITH (security_invoker = true) AS
SELECT 
  user_id,
  full_name,
  avatar_url,
  bio,
  total_xp,
  current_level,
  last_seen,
  created_at
FROM profiles
WHERE is_approved = true;

-- View attendance_summary - recriar com security_invoker
DROP VIEW IF EXISTS attendance_summary;
CREATE VIEW attendance_summary WITH (security_invoker = true) AS
SELECT 
  p.user_id,
  p.full_name,
  p.city,
  p.state,
  COUNT(a.id) AS total_attendance,
  MAX(a.checked_in_at) AS last_attendance
FROM profiles p
LEFT JOIN attendance a ON a.user_id = p.user_id
WHERE p.is_approved = true
GROUP BY p.user_id, p.full_name, p.city, p.state;
