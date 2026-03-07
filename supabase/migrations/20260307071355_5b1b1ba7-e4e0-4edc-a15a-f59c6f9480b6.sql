
-- Add push_delivered column to notifications
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS push_delivered boolean DEFAULT false;

-- Fix security on all views - ensure they respect underlying table RLS
ALTER VIEW public.public_profiles SET (security_invoker = on);
ALTER VIEW public.engagement_metrics SET (security_invoker = on);
ALTER VIEW public.member_directory SET (security_invoker = on);
ALTER VIEW public.attendance_summary SET (security_invoker = on);
ALTER VIEW public.attendance_scores SET (security_invoker = on);
