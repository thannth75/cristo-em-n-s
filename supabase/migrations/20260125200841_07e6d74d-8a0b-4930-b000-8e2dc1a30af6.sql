-- Tabela para Testemunhos (Histórias de vida com Deus)
CREATE TABLE public.testimonies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'geral',
    is_anonymous BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para likes de testemunhos
CREATE TABLE public.testimony_likes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    testimony_id UUID NOT NULL REFERENCES public.testimonies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(testimony_id, user_id)
);

-- Tabela para Devocional Diário (criado por líderes)
CREATE TABLE public.daily_devotionals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    bible_verse TEXT NOT NULL,
    bible_reference TEXT NOT NULL,
    reflection_questions TEXT[] DEFAULT '{}',
    prayer_focus TEXT,
    devotional_date DATE NOT NULL UNIQUE,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para progresso do devocional diário
CREATE TABLE public.devotional_progress (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    devotional_id UUID NOT NULL REFERENCES public.daily_devotionals(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    personal_reflection TEXT,
    UNIQUE(user_id, devotional_id)
);

-- Tabela para lembretes de oração personalizados
CREATE TABLE public.prayer_reminders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    reminder_time TIME NOT NULL,
    reminder_type TEXT NOT NULL DEFAULT 'diario', -- diario, manha, tarde, noite
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.testimonies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimony_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_devotionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devotional_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_reminders ENABLE ROW LEVEL SECURITY;

-- RLS para Testemunhos
CREATE POLICY "Approved users can view approved testimonies"
    ON public.testimonies FOR SELECT
    USING (is_user_approved(auth.uid()) AND (is_approved = true OR user_id = auth.uid()));

CREATE POLICY "Users can create testimonies"
    ON public.testimonies FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own testimonies"
    ON public.testimonies FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own testimonies"
    ON public.testimonies FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Leaders can manage all testimonies"
    ON public.testimonies FOR ALL
    USING (is_admin_or_leader(auth.uid()));

-- RLS para likes de testemunhos
CREATE POLICY "Approved users can view testimony likes"
    ON public.testimony_likes FOR SELECT
    USING (is_user_approved(auth.uid()));

CREATE POLICY "Users can like testimonies"
    ON public.testimony_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike testimonies"
    ON public.testimony_likes FOR DELETE
    USING (auth.uid() = user_id);

-- RLS para Devocionais
CREATE POLICY "Approved users can view devotionals"
    ON public.daily_devotionals FOR SELECT
    USING (is_user_approved(auth.uid()));

CREATE POLICY "Leaders can manage devotionals"
    ON public.daily_devotionals FOR ALL
    USING (is_admin_or_leader(auth.uid()));

-- RLS para progresso do devocional
CREATE POLICY "Users can manage their devotional progress"
    ON public.devotional_progress FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Leaders can view all devotional progress"
    ON public.devotional_progress FOR SELECT
    USING (is_admin_or_leader(auth.uid()));

-- RLS para lembretes de oração
CREATE POLICY "Users can manage their prayer reminders"
    ON public.prayer_reminders FOR ALL
    USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_testimonies_user_id ON public.testimonies(user_id);
CREATE INDEX idx_testimonies_approved ON public.testimonies(is_approved);
CREATE INDEX idx_devotionals_date ON public.daily_devotionals(devotional_date);
CREATE INDEX idx_devotional_progress_user_id ON public.devotional_progress(user_id);
CREATE INDEX idx_prayer_reminders_user_id ON public.prayer_reminders(user_id);

-- Enable realtime for testimonies
ALTER PUBLICATION supabase_realtime ADD TABLE public.testimonies;