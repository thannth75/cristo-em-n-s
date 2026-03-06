
-- Fix community_groups: drop broken UPDATE policy, add correct UPDATE and DELETE
DROP POLICY IF EXISTS "Group admins can update groups" ON public.community_groups;
DROP POLICY IF EXISTS "Members can view their private groups" ON public.community_groups;

CREATE POLICY "Group admins can update groups" ON public.community_groups
FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.group_members gm
  WHERE gm.group_id = community_groups.id AND gm.user_id = auth.uid() AND gm.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.group_members gm
  WHERE gm.group_id = community_groups.id AND gm.user_id = auth.uid() AND gm.role = 'admin'
));

CREATE POLICY "Members can view their private groups" ON public.community_groups
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = community_groups.id AND gm.user_id = auth.uid()
  ) AND is_user_approved(auth.uid())
);

CREATE POLICY "Group creator can delete groups" ON public.community_groups
FOR DELETE TO authenticated
USING (auth.uid() = created_by);

-- Fix group_messages: drop broken SELECT/INSERT policies, recreate
DROP POLICY IF EXISTS "Members can view group messages" ON public.group_messages;
DROP POLICY IF EXISTS "Members can send messages" ON public.group_messages;

CREATE POLICY "Members can view group messages" ON public.group_messages
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.group_members gm
  WHERE gm.group_id = group_messages.group_id AND gm.user_id = auth.uid()
));

CREATE POLICY "Members can send messages" ON public.group_messages
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_messages.group_id AND gm.user_id = auth.uid()
  )
);

-- Fix group_members: drop broken INSERT policies, recreate
DROP POLICY IF EXISTS "Users can join public groups" ON public.group_members;
DROP POLICY IF EXISTS "Admins can add members to private groups" ON public.group_members;

CREATE POLICY "Users can join public groups" ON public.group_members
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id AND is_user_approved(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM public.community_groups g
    WHERE g.id = group_members.group_id AND g.is_public = true
  )
);

CREATE POLICY "Admins can add members to private groups" ON public.group_members
FOR INSERT TO authenticated
WITH CHECK (
  is_user_approved(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.role IN ('admin', 'moderator')
  )
);

-- Allow group creator to delete messages when deleting group
CREATE POLICY "Group admin can delete all messages" ON public.group_messages
FOR DELETE TO authenticated
USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_messages.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
  )
);

-- Drop old delete policy that only allowed own messages
DROP POLICY IF EXISTS "Users can delete own messages" ON public.group_messages;

-- Allow group admin to delete members when deleting group
CREATE POLICY "Group admin can remove members" ON public.group_members
FOR DELETE TO authenticated
USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.group_members gm2
    WHERE gm2.group_id = group_members.group_id AND gm2.user_id = auth.uid() AND gm2.role = 'admin'
  )
);

-- Drop old leave policy
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;

-- Allow group admin to delete reactions when deleting group
DROP POLICY IF EXISTS "Users can remove own group reactions" ON public.group_message_reactions;
CREATE POLICY "Users can remove group reactions" ON public.group_message_reactions
FOR DELETE TO authenticated
USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.group_members gm
    JOIN public.group_messages msg ON msg.group_id = gm.group_id
    WHERE msg.id = group_message_reactions.message_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
  )
);

-- Fix group_message_reactions SELECT policy  
DROP POLICY IF EXISTS "Members can view group message reactions" ON public.group_message_reactions;
CREATE POLICY "Members can view group message reactions" ON public.group_message_reactions
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.group_messages gm
  JOIN public.group_members gmem ON gmem.group_id = gm.group_id
  WHERE gm.id = group_message_reactions.message_id AND gmem.user_id = auth.uid()
));

-- Fix group_message_reactions INSERT policy
DROP POLICY IF EXISTS "Members can add reactions" ON public.group_message_reactions;
CREATE POLICY "Members can add reactions" ON public.group_message_reactions
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.group_messages gm
    JOIN public.group_members gmem ON gmem.group_id = gm.group_id
    WHERE gm.id = group_message_reactions.message_id AND gmem.user_id = auth.uid()
  )
);
