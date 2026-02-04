-- Tabela para planos guiados de Rotina com Deus
CREATE TABLE IF NOT EXISTS public.spiritual_routine_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL DEFAULT 7,
  category TEXT DEFAULT 'geral', -- jejum, oracao, leitura, etc
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Dias/etapas do plano
CREATE TABLE IF NOT EXISTS public.spiritual_routine_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.spiritual_routine_plans(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  bible_reading TEXT, -- ex: "João 1"
  reflection_prompt TEXT,
  action_item TEXT, -- ação prática do dia
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Progresso do usuário no plano
CREATE TABLE IF NOT EXISTS public.user_routine_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.spiritual_routine_plans(id) ON DELETE CASCADE,
  current_day INTEGER NOT NULL DEFAULT 1,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, plan_id, is_active)
);

-- Check-ins diários do usuário
CREATE TABLE IF NOT EXISTS public.routine_daily_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  routine_day_id UUID NOT NULL REFERENCES public.spiritual_routine_days(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reflection_notes TEXT,
  UNIQUE(user_id, routine_day_id)
);

-- RLS
ALTER TABLE public.spiritual_routine_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spiritual_routine_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_routine_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_daily_checkins ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura para usuários aprovados
CREATE POLICY "Approved users can view routine plans"
  ON public.spiritual_routine_plans FOR SELECT
  USING (public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can view routine days"
  ON public.spiritual_routine_days FOR SELECT
  USING (public.is_user_approved(auth.uid()));

-- Políticas de progresso do usuário
CREATE POLICY "Users can view own routine progress"
  ON public.user_routine_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own routine progress"
  ON public.user_routine_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own routine progress"
  ON public.user_routine_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Políticas de check-ins
CREATE POLICY "Users can view own checkins"
  ON public.routine_daily_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins"
  ON public.routine_daily_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins podem gerenciar planos
CREATE POLICY "Admins can manage routine plans"
  ON public.spiritual_routine_plans FOR ALL
  USING (public.is_admin_or_leader(auth.uid()));

CREATE POLICY "Admins can manage routine days"
  ON public.spiritual_routine_days FOR ALL
  USING (public.is_admin_or_leader(auth.uid()));

-- Inserir planos iniciais
INSERT INTO public.spiritual_routine_plans (name, description, duration_days, category) VALUES
('7 Dias com Deus', 'Uma semana de intimidade com o Pai através de oração e leitura', 7, 'geral'),
('21 Dias de Oração', 'Transforme sua vida de oração em 21 dias', 21, 'oracao'),
('30 Dias no Evangelho de João', 'Conheça Jesus profundamente em 30 dias', 30, 'leitura');

-- Inserir dias do plano de 7 dias
INSERT INTO public.spiritual_routine_days (plan_id, day_number, title, description, bible_reading, reflection_prompt, action_item)
SELECT 
  p.id,
  d.day_number,
  d.title,
  d.description,
  d.bible_reading,
  d.reflection_prompt,
  d.action_item
FROM public.spiritual_routine_plans p
CROSS JOIN (VALUES
  (1, 'Criação e Propósito', 'Descubra o propósito de Deus para você', 'Gênesis 1:1-31', 'Por que Deus me criou?', 'Agradeça a Deus por 5 coisas específicas da criação'),
  (2, 'Comunhão com Deus', 'Aprenda a andar com Deus como Enoque', 'Gênesis 5:21-24', 'Como posso andar mais perto de Deus?', 'Dedique 15 minutos extras em oração hoje'),
  (3, 'Fé em Ação', 'A fé de Abraão que move montanhas', 'Hebreus 11:1-6', 'Onde preciso exercer mais fé?', 'Identifique uma área que exige fé e ore especificamente'),
  (4, 'Renovação', 'Deixando o velho para viver o novo', '2 Coríntios 5:17', 'O que preciso deixar para trás?', 'Escreva o que deseja que Deus renove em você'),
  (5, 'Força na Fraqueza', 'O poder de Deus se aperfeiçoa na fraqueza', '2 Coríntios 12:9-10', 'Onde estou tentando fazer sozinho?', 'Entregue suas fraquezas a Deus em oração'),
  (6, 'Servir ao Próximo', 'Jesus veio para servir', 'Marcos 10:45', 'Como posso servir alguém hoje?', 'Faça uma ação de serviço para alguém'),
  (7, 'Gratidão e Louvor', 'Encerre a semana com adoração', 'Salmos 100', 'Pelo que sou grato esta semana?', 'Escreva uma oração de gratidão')
) AS d(day_number, title, description, bible_reading, reflection_prompt, action_item)
WHERE p.name = '7 Dias com Deus';