
-- Post reactions table for emoji reactions on posts
CREATE TABLE public.post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction text NOT NULL DEFAULT '❤️',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, reaction)
);

ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view post reactions"
  ON public.post_reactions FOR SELECT TO public
  USING (is_user_approved(auth.uid()));

CREATE POLICY "Users can add post reactions"
  ON public.post_reactions FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Users can remove their post reactions"
  ON public.post_reactions FOR DELETE TO public
  USING (auth.uid() = user_id);

CREATE INDEX idx_post_reactions_post_id ON public.post_reactions(post_id);
CREATE INDEX idx_post_reactions_user_id ON public.post_reactions(user_id);
