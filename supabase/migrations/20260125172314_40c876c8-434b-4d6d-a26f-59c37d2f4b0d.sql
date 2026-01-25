-- Add DELETE policy for prayer_requests
CREATE POLICY "Users can delete their own prayers" 
ON public.prayer_requests 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add DELETE policy for leaders on prayer_requests
CREATE POLICY "Leaders can delete prayers" 
ON public.prayer_requests 
FOR DELETE 
USING (is_admin_or_leader(auth.uid()));