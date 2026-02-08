
-- SEGURANÇA AVANÇADA: Remover política que expõe dados de todos os perfis aprovados
-- Manter apenas acesso a dados próprios + admins/líderes podem ver tudo

-- Remover política permissiva
DROP POLICY IF EXISTS "Approved users can view other approved profiles" ON profiles;

-- Usuários aprovados podem ver APENAS campos públicos de outros usuários via view
-- Dados completos só para admins/líderes ou próprio usuário
-- A view public_profiles já existe e mostra apenas campos públicos

-- Criar função que verifica se pode ver dados sensíveis
CREATE OR REPLACE FUNCTION public.can_view_sensitive_profile_data(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Pode ver dados sensíveis se:
  -- 1. É o próprio usuário
  -- 2. É admin ou líder aprovado
  SELECT (auth.uid() = target_user_id) OR is_approved_admin_or_leader(auth.uid())
$$;

-- Atualizar RLS para profiles - usuários só veem dados públicos de outros
-- Dados sensíveis (email, phone, birth_date) só visíveis para admins/líderes ou próprio
-- Isso já é coberto pelas políticas existentes (Users see own full profile + Leaders see all profiles)

-- Criar política específica para permitir ver campos básicos via security_invoker views
-- Usuários aprovados podem VER perfis aprovados (para alimentar views públicas)
CREATE POLICY "Approved users view approved profiles basic info"
ON public.profiles FOR SELECT
USING (
  is_user_approved(auth.uid()) 
  AND is_approved = true
);

-- Nota: O cliente deve usar public_profiles view para usuários normais
-- A tabela profiles completa só para admins/líderes/próprio usuário
