-- Add XP tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_level INTEGER DEFAULT 1;

-- Create XP transactions log for tracking all XP gains
CREATE TABLE IF NOT EXISTS public.xp_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  xp_amount INTEGER NOT NULL,
  activity_type TEXT NOT NULL,
  activity_id UUID,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create level definitions
CREATE TABLE IF NOT EXISTS public.level_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_number INTEGER NOT NULL UNIQUE,
  xp_required INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT '⭐',
  rewards TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create milestones for special achievements
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  requirement_type TEXT NOT NULL, -- 'xp_total', 'level', 'streak', 'activity_count'
  requirement_value INTEGER NOT NULL,
  requirement_activity TEXT, -- for activity_count type
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Track user milestones
CREATE TABLE IF NOT EXISTS public.user_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, milestone_id)
);

-- Create XP activity definitions
CREATE TABLE IF NOT EXISTS public.xp_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  xp_value INTEGER NOT NULL,
  daily_limit INTEGER, -- null means no limit
  icon TEXT NOT NULL DEFAULT '✨',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.level_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for xp_transactions
CREATE POLICY "Users can view their own XP transactions"
ON public.xp_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert XP transactions"
ON public.xp_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for level_definitions (public read)
CREATE POLICY "Anyone can view level definitions"
ON public.level_definitions FOR SELECT
USING (true);

CREATE POLICY "Admins can manage level definitions"
ON public.level_definitions FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for milestones (public read)
CREATE POLICY "Anyone can view milestones"
ON public.milestones FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage milestones"
ON public.milestones FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_milestones
CREATE POLICY "Users can view their own milestones"
ON public.user_milestones FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert user milestones"
ON public.user_milestones FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for xp_activities (public read)
CREATE POLICY "Anyone can view XP activities"
ON public.xp_activities FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage XP activities"
ON public.xp_activities FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON public.xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created ON public.xp_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_milestones_user ON public.user_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON public.profiles(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_level ON public.profiles(current_level DESC);

-- Insert default level definitions
INSERT INTO public.level_definitions (level_number, xp_required, title, icon, description, rewards) VALUES
(1, 0, 'Iniciante', '🌱', 'Começando a jornada espiritual', ARRAY['Acesso ao app']),
(2, 100, 'Aprendiz', '📖', 'Buscando conhecimento', ARRAY['Badge Aprendiz']),
(3, 300, 'Praticante', '🙏', 'Desenvolvendo hábitos espirituais', ARRAY['Badge Praticante']),
(4, 600, 'Dedicado', '⭐', 'Comprometido com o crescimento', ARRAY['Badge Dedicado', 'Destaque no ranking']),
(5, 1000, 'Fiel', '💫', 'Fiel nas práticas diárias', ARRAY['Badge Fiel', 'Tema especial']),
(6, 1500, 'Discípulo', '🔥', 'Caminhando com propósito', ARRAY['Badge Discípulo']),
(7, 2200, 'Líder Espiritual', '👑', 'Inspirando outros', ARRAY['Badge Líder', 'Menção especial']),
(8, 3000, 'Mestre', '🏆', 'Exemplo de fé e dedicação', ARRAY['Badge Mestre', 'Reconhecimento público']),
(9, 4000, 'Sábio', '📜', 'Profundo conhecimento bíblico', ARRAY['Badge Sábio']),
(10, 5500, 'Guardião da Fé', '🛡️', 'Pilar da comunidade', ARRAY['Badge Guardião', 'Status lendário'])
ON CONFLICT (level_number) DO NOTHING;

-- Insert default XP activities
INSERT INTO public.xp_activities (activity_key, name, description, xp_value, daily_limit, icon) VALUES
('daily_login', 'Login Diário', 'Acessar o app todos os dias', 10, 1, '📅'),
('complete_devotional', 'Devocional Completo', 'Completar o devocional do dia', 25, 1, '📖'),
('journal_entry', 'Entrada no Diário', 'Escrever no diário espiritual', 15, 3, '✍️'),
('prayer_request', 'Pedido de Oração', 'Compartilhar um pedido de oração', 10, 2, '🙏'),
('community_post', 'Post na Comunidade', 'Publicar na comunidade', 15, 3, '💬'),
('community_comment', 'Comentário', 'Comentar em um post', 5, 10, '💭'),
('quiz_complete', 'Quiz Completo', 'Completar um quiz bíblico', 30, null, '🎯'),
('quiz_perfect', 'Quiz Perfeito', 'Acertar todas no quiz', 50, null, '🏆'),
('reading_complete', 'Leitura Completa', 'Completar leitura do plano', 20, 1, '📚'),
('study_chapter', 'Capítulo Estudado', 'Estudar um capítulo bíblico', 15, 5, '🔍'),
('event_attendance', 'Presença em Evento', 'Participar de um evento', 40, null, '🎪'),
('first_week_streak', 'Sequência Semanal', '7 dias consecutivos', 100, null, '🔥'),
('testimony_shared', 'Testemunho Compartilhado', 'Compartilhar um testemunho', 50, 1, '✨'),
('discipleship_checkin', 'Check-in Discipulado', 'Registrar check-in semanal', 25, 1, '👥')
ON CONFLICT (activity_key) DO NOTHING;

-- Insert default milestones
INSERT INTO public.milestones (name, description, icon, xp_reward, requirement_type, requirement_value, requirement_activity) VALUES
('Primeiro Passo', 'Ganhe seus primeiros 100 XP', '🎯', 25, 'xp_total', 100, null),
('Centurião', 'Alcance 500 XP total', '💯', 50, 'xp_total', 500, null),
('Milhar', 'Alcance 1000 XP total', '🌟', 100, 'xp_total', 1000, null),
('Nível 5', 'Alcance o nível 5', '⭐', 75, 'level', 5, null),
('Nível 10', 'Alcance o nível máximo', '👑', 200, 'level', 10, null),
('Leitor Assíduo', 'Complete 10 leituras diárias', '📖', 50, 'activity_count', 10, 'reading_complete'),
('Escritor Fiel', 'Escreva 20 entradas no diário', '✍️', 75, 'activity_count', 20, 'journal_entry'),
('Mestre dos Quizzes', 'Complete 10 quizzes', '🧠', 100, 'activity_count', 10, 'quiz_complete'),
('Intercessor', 'Faça 25 pedidos de oração', '🙏', 75, 'activity_count', 25, 'prayer_request'),
('Influenciador', 'Faça 50 posts na comunidade', '📢', 100, 'activity_count', 50, 'community_post');

-- Function to calculate level from XP
CREATE OR REPLACE FUNCTION public.calculate_level_from_xp(xp_total INTEGER)
RETURNS INTEGER
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT level_number FROM public.level_definitions 
     WHERE xp_required <= xp_total 
     ORDER BY xp_required DESC 
     LIMIT 1),
    1
  )
$$;

-- Function to add XP and update level
CREATE OR REPLACE FUNCTION public.add_user_xp(
  p_user_id UUID,
  p_xp_amount INTEGER,
  p_activity_type TEXT,
  p_activity_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE(new_total_xp INTEGER, new_level INTEGER, level_up BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_level INTEGER;
  v_new_level INTEGER;
  v_new_total INTEGER;
BEGIN
  -- Get current level
  SELECT current_level INTO v_old_level FROM public.profiles WHERE user_id = p_user_id;
  
  -- Update XP
  UPDATE public.profiles 
  SET total_xp = total_xp + p_xp_amount
  WHERE user_id = p_user_id
  RETURNING total_xp INTO v_new_total;
  
  -- Calculate new level
  v_new_level := public.calculate_level_from_xp(v_new_total);
  
  -- Update level if changed
  IF v_new_level != v_old_level THEN
    UPDATE public.profiles SET current_level = v_new_level WHERE user_id = p_user_id;
  END IF;
  
  -- Log transaction
  INSERT INTO public.xp_transactions (user_id, xp_amount, activity_type, activity_id, description)
  VALUES (p_user_id, p_xp_amount, p_activity_type, p_activity_id, p_description);
  
  RETURN QUERY SELECT v_new_total, v_new_level, (v_new_level > v_old_level);
END;
$$;