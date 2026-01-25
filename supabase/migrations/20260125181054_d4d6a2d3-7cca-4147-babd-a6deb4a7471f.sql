-- =============================================
-- PLANO DE LEITURA BÍBLICA COMPLETO
-- =============================================

-- Tabela de planos de leitura (cronológico, sequencial, etc)
CREATE TABLE public.reading_plans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    plan_type TEXT NOT NULL DEFAULT 'sequential', -- 'sequential' or 'chronological'
    total_days INTEGER NOT NULL DEFAULT 365,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela com os dias/leituras de cada plano
CREATE TABLE public.reading_plan_days (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_id UUID NOT NULL REFERENCES public.reading_plans(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    title TEXT NOT NULL, -- Ex: "Dia 1 - Criação"
    readings TEXT[] NOT NULL, -- Ex: ['Gênesis 1', 'Gênesis 2', 'Gênesis 3']
    book TEXT, -- Livro principal do dia
    chapter_start INTEGER,
    chapter_end INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Progresso do usuário no plano
CREATE TABLE public.user_reading_progress (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    plan_id UUID NOT NULL REFERENCES public.reading_plans(id) ON DELETE CASCADE,
    current_day INTEGER NOT NULL DEFAULT 1,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, plan_id)
);

-- Check-ins diários de leitura
CREATE TABLE public.daily_reading_checkins (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    plan_day_id UUID NOT NULL REFERENCES public.reading_plan_days(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    notes TEXT,
    UNIQUE(user_id, plan_day_id)
);

-- =============================================
-- SISTEMA DE QUIZ
-- =============================================

CREATE TABLE public.bible_quizzes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    book TEXT, -- Livro da Bíblia relacionado
    difficulty TEXT DEFAULT 'medium', -- easy, medium, hard
    points_reward INTEGER DEFAULT 10,
    created_by UUID NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.quiz_questions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID NOT NULL REFERENCES public.bible_quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options TEXT[] NOT NULL, -- Array de opções
    correct_answer INTEGER NOT NULL, -- Índice da resposta correta (0-based)
    explanation TEXT, -- Explicação da resposta
    points INTEGER DEFAULT 10,
    order_position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.user_quiz_attempts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    quiz_id UUID NOT NULL REFERENCES public.bible_quizzes(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- DIÁRIO INTERATIVO COM VERSÍCULOS POR HUMOR
-- =============================================

CREATE TABLE public.mood_verses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    mood TEXT NOT NULL, -- triste, ansioso, grato, feliz, preocupado, etc
    verse_reference TEXT NOT NULL,
    verse_text TEXT NOT NULL,
    prayer_suggestion TEXT, -- Sugestão de oração
    encouragement TEXT, -- Mensagem de encorajamento
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- COMUNIDADE - POSTS E CHAT
-- =============================================

CREATE TABLE public.community_posts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.post_likes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(post_id, user_id)
);

CREATE TABLE public.post_comments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat em grupo
CREATE TABLE public.chat_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text', -- text, image, verse
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Mensagens privadas
CREATE TABLE public.private_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- CONTEÚDO EDUCACIONAL SOBRE LIVROS DA BÍBLIA
-- =============================================

CREATE TABLE public.bible_book_content (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    book_name TEXT NOT NULL UNIQUE,
    book_order INTEGER NOT NULL,
    testament TEXT NOT NULL, -- 'old' or 'new'
    category TEXT, -- Lei, História, Poesia, Profetas, Evangelhos, Cartas, etc
    author TEXT,
    approximate_date TEXT,
    chapters_count INTEGER NOT NULL,
    summary TEXT NOT NULL,
    key_themes TEXT[],
    key_verses TEXT[],
    historical_context TEXT,
    application TEXT, -- Aplicação prática
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- STORAGE BUCKET PARA FOTOS DE PERFIL
-- =============================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Reading Plans - públicos para visualização
ALTER TABLE public.reading_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reading plans" ON public.reading_plans FOR SELECT USING (true);
CREATE POLICY "Admins can manage reading plans" ON public.reading_plans FOR ALL USING (is_admin_or_leader(auth.uid()));

-- Reading Plan Days - públicos
ALTER TABLE public.reading_plan_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view plan days" ON public.reading_plan_days FOR SELECT USING (true);
CREATE POLICY "Admins can manage plan days" ON public.reading_plan_days FOR ALL USING (is_admin_or_leader(auth.uid()));

-- User Reading Progress
ALTER TABLE public.user_reading_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their progress" ON public.user_reading_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Leaders can view all progress" ON public.user_reading_progress FOR SELECT USING (is_admin_or_leader(auth.uid()));

-- Daily Reading Checkins
ALTER TABLE public.daily_reading_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their checkins" ON public.daily_reading_checkins FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Leaders can view all checkins" ON public.daily_reading_checkins FOR SELECT USING (is_admin_or_leader(auth.uid()));

-- Bible Quizzes
ALTER TABLE public.bible_quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved users can view quizzes" ON public.bible_quizzes FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.is_approved = true));
CREATE POLICY "Leaders can manage quizzes" ON public.bible_quizzes FOR ALL USING (is_admin_or_leader(auth.uid()));

-- Quiz Questions
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved users can view questions" ON public.quiz_questions FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.is_approved = true));
CREATE POLICY "Leaders can manage questions" ON public.quiz_questions FOR ALL USING (is_admin_or_leader(auth.uid()));

-- User Quiz Attempts
ALTER TABLE public.user_quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their attempts" ON public.user_quiz_attempts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Leaders can view all attempts" ON public.user_quiz_attempts FOR SELECT USING (is_admin_or_leader(auth.uid()));

-- Mood Verses - públicos
ALTER TABLE public.mood_verses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view mood verses" ON public.mood_verses FOR SELECT USING (true);
CREATE POLICY "Admins can manage mood verses" ON public.mood_verses FOR ALL USING (is_admin_or_leader(auth.uid()));

-- Community Posts
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved users can view posts" ON public.community_posts FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.is_approved = true));
CREATE POLICY "Users can create posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their posts" ON public.community_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their posts" ON public.community_posts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Leaders can manage all posts" ON public.community_posts FOR ALL USING (is_admin_or_leader(auth.uid()));

-- Post Likes
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved users can view likes" ON public.post_likes FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.is_approved = true));
CREATE POLICY "Users can like posts" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- Post Comments
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved users can view comments" ON public.post_comments FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.is_approved = true));
CREATE POLICY "Users can create comments" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their comments" ON public.post_comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Leaders can manage comments" ON public.post_comments FOR ALL USING (is_admin_or_leader(auth.uid()));

-- Chat Messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved users can view chat" ON public.chat_messages FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.is_approved = true));
CREATE POLICY "Users can send messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Private Messages
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their messages" ON public.private_messages FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send private messages" ON public.private_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update received messages" ON public.private_messages FOR UPDATE USING (auth.uid() = receiver_id);

-- Bible Book Content - público
ALTER TABLE public.bible_book_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view book content" ON public.bible_book_content FOR SELECT USING (true);
CREATE POLICY "Admins can manage book content" ON public.bible_book_content FOR ALL USING (is_admin_or_leader(auth.uid()));

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for chat and community
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.private_messages;