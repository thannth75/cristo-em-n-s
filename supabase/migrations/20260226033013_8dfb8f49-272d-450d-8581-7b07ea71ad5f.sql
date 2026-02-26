
-- Add recurrence metadata to events table (single event, auto-expanding)
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_day integer, -- 0=Sunday, 6=Saturday
ADD COLUMN IF NOT EXISTS recurrence_end_date date;
