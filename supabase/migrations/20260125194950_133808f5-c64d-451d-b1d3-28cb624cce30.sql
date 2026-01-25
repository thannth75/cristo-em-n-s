-- Fix prayer_requests is_private NOT NULL constraint
ALTER TABLE public.prayer_requests 
ALTER COLUMN is_private SET NOT NULL,
ALTER COLUMN is_private SET DEFAULT true;

-- Add DELETE policy for chat_messages (within 24 hours)
CREATE POLICY "Users can delete recent messages"
ON public.chat_messages
FOR DELETE
USING (
  auth.uid() = user_id AND 
  created_at > (now() - interval '24 hours')
);

-- Add UPDATE policy for chat_messages (within 5 minutes for corrections)
CREATE POLICY "Users can edit recent messages"
ON public.chat_messages
FOR UPDATE
USING (
  auth.uid() = user_id AND 
  created_at > (now() - interval '5 minutes')
)
WITH CHECK (
  auth.uid() = user_id
);

-- Strengthen user_roles - prevent self-elevation
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Admins can manage OTHER users' roles (not their own)
CREATE POLICY "Admins can manage other user roles"
ON public.user_roles
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) AND 
  user_id != auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) AND 
  user_id != auth.uid()
);

-- Add audit trigger for admin_config changes
CREATE OR REPLACE FUNCTION public.log_admin_config_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log to notifications for all admins
  INSERT INTO public.notifications (user_id, title, message, type)
  SELECT 
    ur.user_id,
    '⚙️ Configuração Alterada',
    'A configuração "' || COALESCE(NEW.config_key, OLD.config_key) || '" foi modificada.',
    'system'
  FROM public.user_roles ur
  WHERE ur.role = 'admin';
  
  RETURN NEW;
END;
$$;

-- Drop if exists and recreate
DROP TRIGGER IF EXISTS admin_config_audit_trigger ON public.admin_config;
CREATE TRIGGER admin_config_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.admin_config
FOR EACH ROW
EXECUTE FUNCTION public.log_admin_config_changes();

-- Add indexes for performance on large tables
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON public.attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_event ON public.attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user ON public.journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_user ON public.prayer_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_user ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages(created_at);