-- ======================================
-- SISTEMA DE COMUNIDADE COMPLETO
-- Grupos, Status, Marcações e Reposts
-- ======================================

-- 1. TABELA DE GRUPOS (estilo Discord/WhatsApp)
CREATE TABLE public.community_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  member_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- 2. MEMBROS DOS GRUPOS
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- 3. MENSAGENS DOS GRUPOS
CREATE TABLE public.group_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  reply_to_id UUID REFERENCES public.group_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. STATUS/STORIES (24 horas)
CREATE TABLE public.user_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT,
  image_url TEXT,
  background_color TEXT DEFAULT '#1a472a',
  text_color TEXT DEFAULT '#ffffff',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  views_count INTEGER DEFAULT 0
);

-- 5. VISUALIZAÇÕES DE STATUS
CREATE TABLE public.story_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.user_stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

-- 6. MARCAÇÕES EM POSTS (@mentions)
CREATE TABLE public.post_mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, mentioned_user_id)
);

-- 7. REPOSTS
CREATE TABLE public.post_reposts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(original_post_id, user_id)
);

-- 8. Adicionar contador de reposts na tabela de posts
ALTER TABLE public.community_posts 
ADD COLUMN IF NOT EXISTS reposts_count INTEGER DEFAULT 0;

-- Habilitar RLS
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reposts ENABLE ROW LEVEL SECURITY;

-- Políticas para GRUPOS
CREATE POLICY "Approved users can view public groups"
  ON public.community_groups FOR SELECT
  USING (
    is_public = true 
    AND public.is_user_approved(auth.uid())
  );

CREATE POLICY "Members can view their private groups"
  ON public.community_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = id AND gm.user_id = auth.uid()
    )
    AND public.is_user_approved(auth.uid())
  );

CREATE POLICY "Approved users can create groups"
  ON public.community_groups FOR INSERT
  WITH CHECK (
    auth.uid() = created_by 
    AND public.is_user_approved(auth.uid())
  );

CREATE POLICY "Group admins can update groups"
  ON public.community_groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = id AND gm.user_id = auth.uid() AND gm.role = 'admin'
    )
  );

-- Políticas para MEMBROS DOS GRUPOS
CREATE POLICY "Approved users can view group members"
  ON public.group_members FOR SELECT
  USING (public.is_user_approved(auth.uid()));

CREATE POLICY "Users can join public groups"
  ON public.group_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND public.is_user_approved(auth.uid())
    AND (
      EXISTS (SELECT 1 FROM public.community_groups g WHERE g.id = group_id AND g.is_public = true)
      OR EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid())
    )
  );

CREATE POLICY "Admins can add members to private groups"
  ON public.group_members FOR INSERT
  WITH CHECK (
    public.is_user_approved(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Users can leave groups"
  ON public.group_members FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para MENSAGENS DOS GRUPOS
CREATE POLICY "Members can view group messages"
  ON public.group_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can send messages"
  ON public.group_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own messages"
  ON public.group_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para STATUS/STORIES
CREATE POLICY "Approved users can view non-expired stories"
  ON public.user_stories FOR SELECT
  USING (
    expires_at > now() 
    AND public.is_user_approved(auth.uid())
  );

CREATE POLICY "Users can create own stories"
  ON public.user_stories FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND public.is_user_approved(auth.uid())
  );

CREATE POLICY "Users can delete own stories"
  ON public.user_stories FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para VISUALIZAÇÕES DE STORIES
CREATE POLICY "Story owners can view their story views"
  ON public.story_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_stories s
      WHERE s.id = story_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Approved users can mark stories as viewed"
  ON public.story_views FOR INSERT
  WITH CHECK (
    auth.uid() = viewer_id 
    AND public.is_user_approved(auth.uid())
  );

-- Políticas para MARCAÇÕES
CREATE POLICY "Approved users can view mentions"
  ON public.post_mentions FOR SELECT
  USING (public.is_user_approved(auth.uid()));

CREATE POLICY "Post authors can create mentions"
  ON public.post_mentions FOR INSERT
  WITH CHECK (
    public.is_user_approved(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.community_posts p
      WHERE p.id = post_id AND p.user_id = auth.uid()
    )
  );

-- Políticas para REPOSTS
CREATE POLICY "Approved users can view reposts"
  ON public.post_reposts FOR SELECT
  USING (public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can repost"
  ON public.post_reposts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND public.is_user_approved(auth.uid())
  );

CREATE POLICY "Users can delete own reposts"
  ON public.post_reposts FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para adicionar criador como admin do grupo
CREATE OR REPLACE FUNCTION public.auto_add_group_creator()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER add_creator_to_group
  AFTER INSERT ON public.community_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_group_creator();

-- Trigger para atualizar contagem de membros
CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_member_count_trigger
  AFTER INSERT OR DELETE ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_group_member_count();

-- Trigger para incrementar views de story
CREATE OR REPLACE FUNCTION public.increment_story_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_stories SET views_count = views_count + 1 WHERE id = NEW.story_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER increment_views_trigger
  AFTER INSERT ON public.story_views
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_story_views();

-- Trigger para incrementar reposts
CREATE OR REPLACE FUNCTION public.update_repost_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts SET reposts_count = reposts_count + 1 WHERE id = NEW.original_post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts SET reposts_count = reposts_count - 1 WHERE id = OLD.original_post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_repost_count_trigger
  AFTER INSERT OR DELETE ON public.post_reposts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_repost_count();

-- Habilitar realtime para as novas tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_stories;

-- Índices para performance
CREATE INDEX idx_group_messages_group ON public.group_messages(group_id);
CREATE INDEX idx_group_messages_created ON public.group_messages(created_at DESC);
CREATE INDEX idx_group_members_user ON public.group_members(user_id);
CREATE INDEX idx_stories_expires ON public.user_stories(expires_at);
CREATE INDEX idx_stories_user ON public.user_stories(user_id);
CREATE INDEX idx_mentions_user ON public.post_mentions(mentioned_user_id);
CREATE INDEX idx_reposts_user ON public.post_reposts(user_id);