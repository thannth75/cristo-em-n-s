-- Corrigir view public_profiles para usar SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT 
  user_id,
  full_name,
  avatar_url,
  current_level,
  total_xp,
  is_approved,
  last_seen
FROM public.profiles
WHERE is_approved = true;

-- Restaurar política de profiles para aprovados poderem ver outros aprovados
-- (necessário para funcionalidades da comunidade)
CREATE POLICY "Approved users can view approved profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Usuário pode ver seu próprio perfil
  user_id = auth.uid()
  -- OU usuários aprovados podem ver outros aprovados
  OR (
    public.is_user_approved(auth.uid())
    AND is_approved = true
  )
);