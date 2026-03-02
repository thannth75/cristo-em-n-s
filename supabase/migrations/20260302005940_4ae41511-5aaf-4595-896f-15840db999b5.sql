
-- Add edit/delete support to group_messages
ALTER TABLE public.group_messages 
  ADD COLUMN IF NOT EXISTS edited_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text';

-- Allow members to update their own group messages (for edit/soft delete)
CREATE POLICY "Members can edit own messages"
ON public.group_messages
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create group message reactions table
CREATE TABLE IF NOT EXISTS public.group_message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.group_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction text NOT NULL DEFAULT '❤️',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, reaction)
);

ALTER TABLE public.group_message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS: Members of the group can view reactions
CREATE POLICY "Members can view group message reactions"
ON public.group_message_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_messages gm
    JOIN group_members gmem ON gmem.group_id = gm.group_id
    WHERE gm.id = group_message_reactions.message_id
    AND gmem.user_id = auth.uid()
  )
);

-- RLS: Members can add reactions
CREATE POLICY "Members can add reactions"
ON public.group_message_reactions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM group_messages gm
    JOIN group_members gmem ON gmem.group_id = gm.group_id
    WHERE gm.id = group_message_reactions.message_id
    AND gmem.user_id = auth.uid()
  )
);

-- RLS: Users can remove their own reactions
CREATE POLICY "Users can remove own group reactions"
ON public.group_message_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for group message reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_message_reactions;
