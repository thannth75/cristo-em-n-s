-- Add likes, comments, and saves for stories
CREATE TABLE public.story_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.user_stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, user_id)
);

CREATE TABLE public.story_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.user_stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.saved_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.user_stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  saved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, user_id)
);

-- Add video_url to community_posts
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add likes_count to user_stories
ALTER TABLE public.user_stories ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE public.user_stories ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Add music/audio to stories
ALTER TABLE public.user_stories ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE public.user_stories ADD COLUMN IF NOT EXISTS audio_title TEXT;

-- Add tagged users to stories
ALTER TABLE public.user_stories ADD COLUMN IF NOT EXISTS tagged_users UUID[] DEFAULT '{}';

-- Enable RLS
ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_stories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for story_likes
CREATE POLICY "Approved users can view story likes" ON public.story_likes
  FOR SELECT USING (public.is_user_approved(auth.uid()));

CREATE POLICY "Users can like stories" ON public.story_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id AND public.is_user_approved(auth.uid()));

CREATE POLICY "Users can unlike stories" ON public.story_likes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for story_comments
CREATE POLICY "Approved users can view story comments" ON public.story_comments
  FOR SELECT USING (public.is_user_approved(auth.uid()));

CREATE POLICY "Users can comment on stories" ON public.story_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id AND public.is_user_approved(auth.uid()));

CREATE POLICY "Users can delete own comments" ON public.story_comments
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for saved_stories
CREATE POLICY "Users can view own saved stories" ON public.saved_stories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save stories" ON public.saved_stories
  FOR INSERT WITH CHECK (auth.uid() = user_id AND public.is_user_approved(auth.uid()));

CREATE POLICY "Users can unsave stories" ON public.saved_stories
  FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updating counts
CREATE OR REPLACE FUNCTION public.update_story_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.user_stories SET likes_count = likes_count + 1 WHERE id = NEW.story_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.user_stories SET likes_count = likes_count - 1 WHERE id = OLD.story_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_story_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.user_stories SET comments_count = comments_count + 1 WHERE id = NEW.story_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.user_stories SET comments_count = comments_count - 1 WHERE id = OLD.story_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER on_story_like_change
  AFTER INSERT OR DELETE ON public.story_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_story_likes_count();

CREATE TRIGGER on_story_comment_change
  AFTER INSERT OR DELETE ON public.story_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_story_comments_count();

-- Indexes
CREATE INDEX idx_story_likes_story ON public.story_likes(story_id);
CREATE INDEX idx_story_comments_story ON public.story_comments(story_id);
CREATE INDEX idx_saved_stories_user ON public.saved_stories(user_id);