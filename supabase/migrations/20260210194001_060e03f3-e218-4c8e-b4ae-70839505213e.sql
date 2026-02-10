-- Drop the problematic unique constraint that prevents users from restarting plans
ALTER TABLE public.user_routine_progress DROP CONSTRAINT user_routine_progress_user_id_plan_id_is_active_key;

-- Add XP activities for routine feature
INSERT INTO public.xp_activities (activity_key, name, xp_value, daily_limit, icon, is_active)
VALUES 
  ('rotina', 'Check-in Rotina com Deus', 15, 1, '🙏', true)
ON CONFLICT (activity_key) DO NOTHING;