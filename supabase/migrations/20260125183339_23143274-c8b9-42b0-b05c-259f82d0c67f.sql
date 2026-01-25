-- Fix attendance table RLS policy to restrict visibility
-- Users should only see their own attendance records, while leaders can see all

-- First drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Approved users can view attendance" ON public.attendance;

-- Create new policy: Users can only view their own attendance
CREATE POLICY "Users can view their own attendance" 
ON public.attendance 
FOR SELECT 
USING (auth.uid() = user_id);

-- Note: Leaders already have access via "Leaders and admins can manage attendance" policy