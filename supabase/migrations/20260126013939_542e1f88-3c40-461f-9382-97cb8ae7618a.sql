-- Add location fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;

-- Create index for location queries
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(state, city);

-- Create attendance history view for leaders dashboard
CREATE OR REPLACE VIEW public.attendance_summary AS
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

-- Create engagement metrics view
CREATE OR REPLACE VIEW public.engagement_metrics AS
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

-- Grant access to views for authenticated users
GRANT SELECT ON public.attendance_summary TO authenticated;
GRANT SELECT ON public.engagement_metrics TO authenticated;

-- Create RLS policies for views (views inherit from base tables)
-- Note: Views automatically use RLS from underlying tables

-- Create notification preferences table for push notifications
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  events_enabled BOOLEAN DEFAULT true,
  prayers_enabled BOOLEAN DEFAULT true,
  devotionals_enabled BOOLEAN DEFAULT true,
  achievements_enabled BOOLEAN DEFAULT true,
  community_enabled BOOLEAN DEFAULT true,
  push_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on notification_preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_preferences
CREATE POLICY "Users can manage their own preferences"
ON public.notification_preferences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();