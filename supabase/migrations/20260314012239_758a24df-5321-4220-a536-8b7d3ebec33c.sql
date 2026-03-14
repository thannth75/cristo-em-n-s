
-- Tabela de posts salvos/favoritos
CREATE TABLE public.saved_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  saved_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their saved posts"
  ON public.saved_posts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save posts"
  ON public.saved_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Users can unsave posts"
  ON public.saved_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_saved_posts_user ON public.saved_posts(user_id);
