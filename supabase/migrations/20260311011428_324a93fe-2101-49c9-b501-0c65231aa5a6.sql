-- Add kids_leader and kids roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'kids_leader';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'kids';