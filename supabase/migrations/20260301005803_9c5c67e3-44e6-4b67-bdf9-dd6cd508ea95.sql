
-- Add editing, soft delete and reactions support to private_messages
ALTER TABLE public.private_messages 
  ADD COLUMN IF NOT EXISTS edited_at timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone DEFAULT NULL;

-- Create message reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.private_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction text NOT NULL DEFAULT '❤️',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, reaction)
);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Users can view reactions on messages they're part of
CREATE POLICY "View reactions on own messages"
  ON public.message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.private_messages pm
      WHERE pm.id = message_reactions.message_id
      AND (pm.sender_id = auth.uid() OR pm.receiver_id = auth.uid())
    )
  );

-- Users can add reactions to messages they can see
CREATE POLICY "Add reactions"
  ON public.message_reactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.private_messages pm
      WHERE pm.id = message_reactions.message_id
      AND (pm.sender_id = auth.uid() OR pm.receiver_id = auth.uid())
    )
  );

-- Users can remove their own reactions
CREATE POLICY "Remove own reactions"
  ON public.message_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Allow sender to update their own messages (for editing and soft delete)
CREATE POLICY "Sender can edit own messages"
  ON public.private_messages FOR UPDATE
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
