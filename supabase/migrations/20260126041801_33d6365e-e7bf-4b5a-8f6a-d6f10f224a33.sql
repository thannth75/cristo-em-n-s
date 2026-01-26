-- Adicionar policy para usuários aprovados verem perfis de outros usuários aprovados
-- Isso corrige o problema de posts e mensagens aparecerem como "Anônimo" e "Usuário"

CREATE POLICY "Approved users can view other approved profiles"
ON public.profiles FOR SELECT
USING (
  is_user_approved(auth.uid()) 
  AND is_approved = true
);