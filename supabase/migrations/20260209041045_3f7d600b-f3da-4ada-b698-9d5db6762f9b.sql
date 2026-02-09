-- ==========================================
-- PARTE 2: FUNÇÕES AUXILIARES E ESTRUTURA
-- ==========================================

-- Função para verificar se usuário é jovem
CREATE OR REPLACE FUNCTION public.is_youth(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'jovem')
$$;

-- Função para verificar se usuário é músico
CREATE OR REPLACE FUNCTION public.is_musician(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'musico')
$$;

-- Função para verificar se usuário é membro
CREATE OR REPLACE FUNCTION public.is_member(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'membro')
$$;

-- Função para obter a cidade do usuário
CREATE OR REPLACE FUNCTION public.get_user_city(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT city FROM public.profiles WHERE user_id = _user_id
$$;

-- Função para verificar se usuário pode acessar conteúdo de jovens
-- (é jovem, líder ou admin)
CREATE OR REPLACE FUNCTION public.can_access_youth_content(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'jovem') 
      OR public.has_role(_user_id, 'lider')
      OR public.has_role(_user_id, 'admin')
$$;

-- Função para verificar se líder pode gerenciar conteúdo de uma cidade
CREATE OR REPLACE FUNCTION public.can_manage_city(_user_id UUID, _city TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.has_role(_user_id, 'admin')
    OR (
      public.has_role(_user_id, 'lider') 
      AND public.get_user_city(_user_id) = _city
    )
$$;

-- Função para verificar se usuário está na mesma cidade ou é admin
CREATE OR REPLACE FUNCTION public.is_same_city_or_admin(_user_id UUID, _target_city TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.has_role(_user_id, 'admin')
    OR public.get_user_city(_user_id) = _target_city
$$;

-- ==========================================
-- ADICIONAR COLUNA CITY EM TABELAS
-- ==========================================

-- Adicionar cidade nos eventos
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS city TEXT;

-- Adicionar cidade nos estudos bíblicos
ALTER TABLE public.bible_studies ADD COLUMN IF NOT EXISTS city TEXT;

-- Adicionar cidade nos quizzes
ALTER TABLE public.bible_quizzes ADD COLUMN IF NOT EXISTS city TEXT;

-- Adicionar cidade nas provas
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS city TEXT;

-- ==========================================
-- TRIGGER PARA AUTO-PREENCHER CIDADE
-- ==========================================

CREATE OR REPLACE FUNCTION public.auto_fill_city()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.city IS NULL THEN
    NEW.city := public.get_user_city(NEW.created_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger nos eventos
DROP TRIGGER IF EXISTS auto_fill_city_events ON public.events;
CREATE TRIGGER auto_fill_city_events
  BEFORE INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_fill_city();

-- Trigger nos estudos
DROP TRIGGER IF EXISTS auto_fill_city_bible_studies ON public.bible_studies;
CREATE TRIGGER auto_fill_city_bible_studies
  BEFORE INSERT ON public.bible_studies
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_fill_city();

-- Trigger nos quizzes
DROP TRIGGER IF EXISTS auto_fill_city_bible_quizzes ON public.bible_quizzes;
CREATE TRIGGER auto_fill_city_bible_quizzes
  BEFORE INSERT ON public.bible_quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_fill_city();

-- Trigger nas provas
DROP TRIGGER IF EXISTS auto_fill_city_exams ON public.exams;
CREATE TRIGGER auto_fill_city_exams
  BEFORE INSERT ON public.exams
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_fill_city();

-- ==========================================
-- CONTROLE DE PERFIL COMPLETO
-- ==========================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_profile_complete BOOLEAN DEFAULT false;

CREATE OR REPLACE FUNCTION public.check_profile_complete()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_profile_complete := (NEW.city IS NOT NULL AND NEW.city != '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_profile_complete_trigger ON public.profiles;
CREATE TRIGGER check_profile_complete_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_profile_complete();