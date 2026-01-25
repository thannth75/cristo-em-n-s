-- =====================================================
-- MIGRAÇÃO COMPLETA: TODOS OS MÓDULOS - VIDA EM CRISTO
-- =====================================================

-- 1. TABELA DE EVENTOS (Agenda)
CREATE TABLE public.events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL DEFAULT 'culto', -- culto, ensaio, estudo, reuniao, outro
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    location TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Eventos podem ser vistos por usuários aprovados
CREATE POLICY "Approved users can view events"
ON public.events FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND is_approved = TRUE
    )
);

-- Apenas líderes/admin podem criar/editar/deletar
CREATE POLICY "Leaders and admins can manage events"
ON public.events FOR ALL
USING (is_admin_or_leader(auth.uid()));

-- 2. TABELA DE PRESENÇA
CREATE TABLE public.attendance (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    checked_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    checked_by UUID REFERENCES auth.users(id),
    notes TEXT,
    UNIQUE(event_id, user_id)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Usuários aprovados podem ver presença
CREATE POLICY "Approved users can view attendance"
ON public.attendance FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND is_approved = TRUE
    )
);

-- Líderes/admin podem registrar presença
CREATE POLICY "Leaders and admins can manage attendance"
ON public.attendance FOR ALL
USING (is_admin_or_leader(auth.uid()));

-- 3. TABELA DE MÚSICOS (instrumentos/habilidades)
CREATE TABLE public.musicians (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    instruments TEXT[] NOT NULL DEFAULT '{}',
    skill_level TEXT DEFAULT 'iniciante', -- iniciante, intermediario, avancado
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.musicians ENABLE ROW LEVEL SECURITY;

-- Músicos podem ver todos os músicos (se aprovados)
CREATE POLICY "Approved users can view musicians"
ON public.musicians FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND is_approved = TRUE
    )
);

-- Músicos podem editar seu próprio perfil
CREATE POLICY "Musicians can update their own profile"
ON public.musicians FOR UPDATE
USING (auth.uid() = user_id);

-- Líderes/admin podem gerenciar músicos
CREATE POLICY "Leaders and admins can manage musicians"
ON public.musicians FOR ALL
USING (is_admin_or_leader(auth.uid()));

-- 4. TABELA DE ESCALAS MUSICAIS
CREATE TABLE public.music_scales (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.music_scales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view scales"
ON public.music_scales FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND is_approved = TRUE
    )
);

CREATE POLICY "Leaders and admins can manage scales"
ON public.music_scales FOR ALL
USING (is_admin_or_leader(auth.uid()));

-- 5. TABELA DE MÚSICOS NA ESCALA
CREATE TABLE public.scale_musicians (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    scale_id UUID NOT NULL REFERENCES public.music_scales(id) ON DELETE CASCADE,
    musician_id UUID NOT NULL REFERENCES public.musicians(id) ON DELETE CASCADE,
    instrument TEXT NOT NULL,
    role TEXT DEFAULT 'musico', -- musico, lider_louvor, backing_vocal
    confirmed BOOLEAN DEFAULT FALSE,
    UNIQUE(scale_id, musician_id, instrument)
);

ALTER TABLE public.scale_musicians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view scale musicians"
ON public.scale_musicians FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND is_approved = TRUE
    )
);

CREATE POLICY "Leaders and admins can manage scale musicians"
ON public.scale_musicians FOR ALL
USING (is_admin_or_leader(auth.uid()));

-- Músicos podem confirmar sua presença
CREATE POLICY "Musicians can confirm their participation"
ON public.scale_musicians FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.musicians 
        WHERE id = scale_musicians.musician_id AND user_id = auth.uid()
    )
);

-- 6. TABELA DE REPERTÓRIO
CREATE TABLE public.songs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT,
    key TEXT, -- tom
    tempo INTEGER,
    lyrics_url TEXT,
    chords_url TEXT,
    youtube_url TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view songs"
ON public.songs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND is_approved = TRUE
    )
);

CREATE POLICY "Leaders and admins can manage songs"
ON public.songs FOR ALL
USING (is_admin_or_leader(auth.uid()));

-- 7. MÚSICAS NA ESCALA
CREATE TABLE public.scale_songs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    scale_id UUID NOT NULL REFERENCES public.music_scales(id) ON DELETE CASCADE,
    song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
    order_position INTEGER NOT NULL DEFAULT 0,
    key_override TEXT, -- tom diferente para este culto
    UNIQUE(scale_id, song_id)
);

ALTER TABLE public.scale_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view scale songs"
ON public.scale_songs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND is_approved = TRUE
    )
);

CREATE POLICY "Leaders and admins can manage scale songs"
ON public.scale_songs FOR ALL
USING (is_admin_or_leader(auth.uid()));

-- 8. PEDIDOS DE ORAÇÃO
CREATE TABLE public.prayer_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_private BOOLEAN NOT NULL DEFAULT TRUE, -- privado = só líderes veem
    is_answered BOOLEAN DEFAULT FALSE,
    answered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;

-- Usuários veem seus próprios pedidos
CREATE POLICY "Users can view their own prayers"
ON public.prayer_requests FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem criar pedidos
CREATE POLICY "Users can create prayers"
ON public.prayer_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuários podem editar seus pedidos
CREATE POLICY "Users can update their own prayers"
ON public.prayer_requests FOR UPDATE
USING (auth.uid() = user_id);

-- Líderes podem ver todos os pedidos
CREATE POLICY "Leaders can view all prayers"
ON public.prayer_requests FOR SELECT
USING (is_admin_or_leader(auth.uid()));

-- Líderes podem comentar (update is_answered)
CREATE POLICY "Leaders can update prayers"
ON public.prayer_requests FOR UPDATE
USING (is_admin_or_leader(auth.uid()));

-- 9. COMENTÁRIOS EM PEDIDOS DE ORAÇÃO
CREATE TABLE public.prayer_comments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    prayer_id UUID NOT NULL REFERENCES public.prayer_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prayer_comments ENABLE ROW LEVEL SECURITY;

-- Usuário vê comentários dos seus pedidos
CREATE POLICY "Users can view comments on their prayers"
ON public.prayer_comments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.prayer_requests 
        WHERE id = prayer_comments.prayer_id AND user_id = auth.uid()
    )
);

-- Líderes podem ver e criar comentários
CREATE POLICY "Leaders can view all comments"
ON public.prayer_comments FOR SELECT
USING (is_admin_or_leader(auth.uid()));

CREATE POLICY "Leaders can create comments"
ON public.prayer_comments FOR INSERT
WITH CHECK (is_admin_or_leader(auth.uid()));

-- 10. DIÁRIO ESPIRITUAL
CREATE TABLE public.journal_entries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    mood TEXT, -- grato, reflexivo, alegre, triste, esperancoso
    bible_verse TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Diário é 100% privado
CREATE POLICY "Users can manage their own journal"
ON public.journal_entries FOR ALL
USING (auth.uid() = user_id);

-- 11. ESTUDOS BÍBLICOS
CREATE TABLE public.bible_studies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    book TEXT NOT NULL, -- livro da Bíblia
    chapters TEXT, -- ex: "1-5" ou "1,3,7"
    start_date DATE,
    end_date DATE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bible_studies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view studies"
ON public.bible_studies FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND is_approved = TRUE
    )
);

CREATE POLICY "Leaders can manage studies"
ON public.bible_studies FOR ALL
USING (is_admin_or_leader(auth.uid()));

-- 12. PROGRESSO NOS ESTUDOS
CREATE TABLE public.study_progress (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    study_id UUID NOT NULL REFERENCES public.bible_studies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chapters_completed TEXT[] DEFAULT '{}',
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(study_id, user_id)
);

ALTER TABLE public.study_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own progress"
ON public.study_progress FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Leaders can view all progress"
ON public.study_progress FOR SELECT
USING (is_admin_or_leader(auth.uid()));

-- 13. CONQUISTAS/BADGES
CREATE TABLE public.achievements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon TEXT NOT NULL, -- emoji ou nome do ícone
    category TEXT DEFAULT 'geral', -- geral, presenca, estudo, musico
    points INTEGER DEFAULT 10
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements"
ON public.achievements FOR SELECT
USING (true);

CREATE POLICY "Admins can manage achievements"
ON public.achievements FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- 14. CONQUISTAS DO USUÁRIO
CREATE TABLE public.user_achievements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their achievements"
ON public.user_achievements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view all earned achievements"
ON public.user_achievements FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND is_approved = TRUE
    )
);

CREATE POLICY "System can grant achievements"
ON public.user_achievements FOR INSERT
WITH CHECK (is_admin_or_leader(auth.uid()));

-- TRIGGERS DE UPDATED_AT
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_musicians_updated_at BEFORE UPDATE ON public.musicians
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_music_scales_updated_at BEFORE UPDATE ON public.music_scales
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prayer_requests_updated_at BEFORE UPDATE ON public.prayer_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON public.journal_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- INSERIR CONQUISTAS INICIAIS
INSERT INTO public.achievements (name, description, icon, category, points) VALUES
('Primeiro Passo', 'Completou o primeiro estudo bíblico', '📖', 'estudo', 10),
('Fiel', 'Presença em 10 cultos', '⛪', 'presenca', 25),
('Estudioso', 'Completou 5 estudos bíblicos', '🎓', 'estudo', 50),
('Adorador', 'Participou de 5 escalas musicais', '🎵', 'musico', 30),
('Intercessor', 'Enviou 10 pedidos de oração', '🙏', 'geral', 20),
('Diário de Fé', 'Escreveu 30 entradas no diário', '✍️', 'geral', 40),
('Bem-vindo!', 'Primeiro login no app', '👋', 'geral', 5);