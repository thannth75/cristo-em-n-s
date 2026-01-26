-- =============================================
-- SISTEMA DE DISCIPULADO
-- =============================================

-- Tabela de relacionamentos de discipulado
CREATE TABLE IF NOT EXISTS public.discipleship (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL,
  disciple_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(mentor_id, disciple_id)
);

-- Metas de discipulado
CREATE TABLE IF NOT EXISTS public.discipleship_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discipleship_id UUID NOT NULL REFERENCES public.discipleship(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Check-ins semanais de discipulado
CREATE TABLE IF NOT EXISTS public.discipleship_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discipleship_id UUID NOT NULL REFERENCES public.discipleship(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  spiritual_health INTEGER CHECK (spiritual_health >= 1 AND spiritual_health <= 5),
  bible_reading BOOLEAN DEFAULT false,
  prayer_life BOOLEAN DEFAULT false,
  community_involvement BOOLEAN DEFAULT false,
  challenges TEXT,
  victories TEXT,
  prayer_requests TEXT,
  mentor_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.discipleship ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discipleship_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discipleship_checkins ENABLE ROW LEVEL SECURITY;

-- Políticas para discipleship
CREATE POLICY "Líderes podem ver discipulados" ON public.discipleship
  FOR SELECT USING (
    mentor_id = auth.uid() OR 
    disciple_id = auth.uid() OR
    public.is_approved_admin_or_leader(auth.uid())
  );

CREATE POLICY "Líderes podem criar discipulados" ON public.discipleship
  FOR INSERT WITH CHECK (
    public.is_approved_admin_or_leader(auth.uid())
  );

CREATE POLICY "Líderes podem atualizar discipulados" ON public.discipleship
  FOR UPDATE USING (
    mentor_id = auth.uid() OR
    public.is_approved_admin_or_leader(auth.uid())
  );

-- Políticas para goals
CREATE POLICY "Participantes podem ver metas" ON public.discipleship_goals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.discipleship d 
      WHERE d.id = discipleship_id 
      AND (d.mentor_id = auth.uid() OR d.disciple_id = auth.uid())
    ) OR public.is_approved_admin_or_leader(auth.uid())
  );

CREATE POLICY "Mentores podem gerenciar metas" ON public.discipleship_goals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.discipleship d 
      WHERE d.id = discipleship_id 
      AND d.mentor_id = auth.uid()
    ) OR public.is_approved_admin_or_leader(auth.uid())
  );

-- Políticas para checkins
CREATE POLICY "Participantes podem ver checkins" ON public.discipleship_checkins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.discipleship d 
      WHERE d.id = discipleship_id 
      AND (d.mentor_id = auth.uid() OR d.disciple_id = auth.uid())
    ) OR public.is_approved_admin_or_leader(auth.uid())
  );

CREATE POLICY "Participantes podem criar checkins" ON public.discipleship_checkins
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.discipleship d 
      WHERE d.id = discipleship_id 
      AND (d.mentor_id = auth.uid() OR d.disciple_id = auth.uid())
    )
  );

CREATE POLICY "Participantes podem atualizar checkins" ON public.discipleship_checkins
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.discipleship d 
      WHERE d.id = discipleship_id 
      AND (d.mentor_id = auth.uid() OR d.disciple_id = auth.uid())
    )
  );

-- =============================================
-- ONBOARDING
-- =============================================

-- Tabela para rastrear progresso do onboarding
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  completed_at TIMESTAMP WITH TIME ZONE,
  step_profile BOOLEAN DEFAULT false,
  step_location BOOLEAN DEFAULT false,
  step_notifications BOOLEAN DEFAULT false,
  step_tutorial BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Usuários podem ver próprio onboarding" ON public.onboarding_progress
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Usuários podem inserir próprio onboarding" ON public.onboarding_progress
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuários podem atualizar próprio onboarding" ON public.onboarding_progress
  FOR UPDATE USING (user_id = auth.uid());

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_discipleship_mentor ON public.discipleship(mentor_id);
CREATE INDEX IF NOT EXISTS idx_discipleship_disciple ON public.discipleship(disciple_id);
CREATE INDEX IF NOT EXISTS idx_discipleship_active ON public.discipleship(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_discipleship_goals_discipleship ON public.discipleship_goals(discipleship_id);
CREATE INDEX IF NOT EXISTS idx_discipleship_checkins_discipleship ON public.discipleship_checkins(discipleship_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_user ON public.onboarding_progress(user_id);