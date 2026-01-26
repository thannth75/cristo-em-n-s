-- Dropar view anterior e recriar com SECURITY INVOKER
DROP VIEW IF EXISTS public.attendance_scores;

CREATE OR REPLACE VIEW public.attendance_scores
WITH (security_invoker = true)
AS
SELECT 
  p.user_id,
  p.full_name,
  p.avatar_url,
  COUNT(DISTINCT a.event_id) as events_attended,
  (SELECT COUNT(*) FROM events WHERE event_date <= CURRENT_DATE AND event_date >= CURRENT_DATE - INTERVAL '3 months') as total_events,
  CASE 
    WHEN (SELECT COUNT(*) FROM events WHERE event_date <= CURRENT_DATE AND event_date >= CURRENT_DATE - INTERVAL '3 months') = 0 THEN 0
    ELSE ROUND(
      (COUNT(DISTINCT a.event_id)::NUMERIC / 
       NULLIF((SELECT COUNT(*) FROM events WHERE event_date <= CURRENT_DATE AND event_date >= CURRENT_DATE - INTERVAL '3 months'), 0)::NUMERIC) * 100, 
      1
    )
  END as attendance_percentage,
  CASE 
    WHEN (SELECT COUNT(*) FROM events WHERE event_date <= CURRENT_DATE AND event_date >= CURRENT_DATE - INTERVAL '3 months') = 0 THEN 'sem_dados'
    WHEN (COUNT(DISTINCT a.event_id)::NUMERIC / 
          NULLIF((SELECT COUNT(*) FROM events WHERE event_date <= CURRENT_DATE AND event_date >= CURRENT_DATE - INTERVAL '3 months'), 0)::NUMERIC) >= 0.8 THEN 'excelente'
    WHEN (COUNT(DISTINCT a.event_id)::NUMERIC / 
          NULLIF((SELECT COUNT(*) FROM events WHERE event_date <= CURRENT_DATE AND event_date >= CURRENT_DATE - INTERVAL '3 months'), 0)::NUMERIC) >= 0.6 THEN 'bom'
    WHEN (COUNT(DISTINCT a.event_id)::NUMERIC / 
          NULLIF((SELECT COUNT(*) FROM events WHERE event_date <= CURRENT_DATE AND event_date >= CURRENT_DATE - INTERVAL '3 months'), 0)::NUMERIC) >= 0.4 THEN 'regular'
    ELSE 'baixa'
  END as status
FROM profiles p
LEFT JOIN attendance a ON a.user_id = p.user_id 
  AND a.checked_in_at >= CURRENT_DATE - INTERVAL '3 months'
WHERE p.is_approved = true
GROUP BY p.user_id, p.full_name, p.avatar_url;