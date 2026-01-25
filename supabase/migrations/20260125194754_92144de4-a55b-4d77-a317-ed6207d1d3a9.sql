-- Strengthen profiles table security
-- Drop existing SELECT policies and create more restrictive ones
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Approved admins and leaders can view all profiles" ON public.profiles;

-- Users can only view their own profile if they are approved OR it's their own profile during registration
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id
);

-- Approved admins and leaders can view all approved profiles only
CREATE POLICY "Approved admins leaders view approved profiles"
ON public.profiles
FOR SELECT
USING (
  is_approved_admin_or_leader(auth.uid()) AND is_approved = true
);

-- Admins can also view unapproved profiles (for approval workflow)
CREATE POLICY "Admins can view pending profiles"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) AND is_approved = false
);

-- Strengthen private_messages table security
-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_private_messages_sender ON public.private_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_receiver ON public.private_messages(receiver_id);

-- Drop and recreate with stricter policies
DROP POLICY IF EXISTS "Approved users can view their messages" ON public.private_messages;
DROP POLICY IF EXISTS "Approved users can send private messages" ON public.private_messages;
DROP POLICY IF EXISTS "Approved users can update received messages" ON public.private_messages;

-- Only approved users who are participants can view messages
CREATE POLICY "Participants view own messages"
ON public.private_messages
FOR SELECT
USING (
  is_user_approved(auth.uid()) AND 
  (auth.uid() = sender_id OR auth.uid() = receiver_id)
);

-- Only approved users can send messages to other approved users
CREATE POLICY "Approved users send messages"
ON public.private_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND 
  is_user_approved(auth.uid()) AND 
  is_user_approved(receiver_id) AND
  sender_id != receiver_id
);

-- Only receiver can mark messages as read
CREATE POLICY "Receiver updates message status"
ON public.private_messages
FOR UPDATE
USING (
  auth.uid() = receiver_id AND 
  is_user_approved(auth.uid())
)
WITH CHECK (
  auth.uid() = receiver_id
);

-- Add delete policy - users can delete their own sent messages
CREATE POLICY "Sender can delete own messages"
ON public.private_messages
FOR DELETE
USING (
  auth.uid() = sender_id AND 
  is_user_approved(auth.uid())
);