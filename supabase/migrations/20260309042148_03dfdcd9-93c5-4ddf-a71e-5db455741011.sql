-- Create community polls tables
CREATE TABLE public.community_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL DEFAULT '{}',
  is_multiple_choice BOOLEAN DEFAULT false,
  ends_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES public.community_polls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(poll_id, user_id, option_index)
);

ALTER TABLE public.community_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view polls"
  ON public.community_polls FOR SELECT TO authenticated
  USING (public.is_user_approved(auth.uid()));

CREATE POLICY "Post owner can create poll"
  ON public.community_polls FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.community_posts WHERE id = post_id AND user_id = auth.uid())
  );

CREATE POLICY "Approved users can view votes"
  ON public.poll_votes FOR SELECT TO authenticated
  USING (public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can vote"
  ON public.poll_votes FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND public.is_user_approved(auth.uid())
  );

CREATE POLICY "Users can delete own votes"
  ON public.poll_votes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_poll_votes_poll_id ON public.poll_votes(poll_id);
CREATE INDEX idx_community_polls_post_id ON public.community_polls(post_id);