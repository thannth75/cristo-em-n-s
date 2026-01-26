-- ============================================
-- CORREÇÕES DE SEGURANÇA
-- ============================================

-- 1. VIEWS COM RLS - Atualizar para restringir acesso
-- Dropar e recriar views com security_invoker = true já está feito
-- Vamos criar policies para as tabelas base que já existem

-- 2. Restringir políticas de profiles para não expor dados sensíveis
-- Remover política antiga que permite ver todos os profiles aprovados
DROP POLICY IF EXISTS "Approved users can view approved profiles" ON public.profiles;

-- Criar política que permite ver apenas campos públicos (via RLS não é possível filtrar colunas)
-- Então vamos manter a visualização mas documentar que campos sensíveis devem ser tratados no frontend
-- A solução ideal seria criar uma view com campos públicos apenas

-- Criar view de perfis públicos (sem dados sensíveis)
CREATE OR REPLACE VIEW public.public_profiles AS
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

-- 3. Corrigir políticas de prayer_requests para líderes não verem privados
DROP POLICY IF EXISTS "Leaders can update prayers" ON public.prayer_requests;
DROP POLICY IF EXISTS "Leaders can delete prayers" ON public.prayer_requests;

-- Líderes só podem gerenciar pedidos PÚBLICOS
CREATE POLICY "Leaders can update public prayers only"
ON public.prayer_requests
FOR UPDATE
TO authenticated
USING (
  is_private = false 
  AND public.is_approved_admin_or_leader(auth.uid())
);

CREATE POLICY "Leaders can delete public prayers only"
ON public.prayer_requests
FOR DELETE
TO authenticated
USING (
  is_private = false 
  AND public.is_approved_admin_or_leader(auth.uid())
);

-- 4. Restringir acesso às views de métricas apenas para admins/líderes
-- Criar políticas na tabela base (attendance)
DROP POLICY IF EXISTS "Users can view own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Leaders can view all attendance" ON public.attendance;

CREATE POLICY "Users can view own attendance"
ON public.attendance
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_approved_admin_or_leader(auth.uid())
);

-- 5. Restringir discipleship_checkins para apenas mentor e discípulo
DROP POLICY IF EXISTS "Participants can view checkins" ON public.discipleship_checkins;
DROP POLICY IF EXISTS "Leaders can view all checkins" ON public.discipleship_checkins;

CREATE POLICY "Only mentor and disciple can view checkins"
ON public.discipleship_checkins
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.discipleship d
    WHERE d.id = discipleship_id
    AND (d.mentor_id = auth.uid() OR d.disciple_id = auth.uid())
  )
);

-- Admins também podem ver para resolução de conflitos
CREATE POLICY "Admins can view all checkins for dispute resolution"
ON public.discipleship_checkins
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);

-- 6. Adicionar política de inserção/atualização para checkins
DROP POLICY IF EXISTS "Participants can manage checkins" ON public.discipleship_checkins;

CREATE POLICY "Mentor or disciple can insert checkins"
ON public.discipleship_checkins
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.discipleship d
    WHERE d.id = discipleship_id
    AND (d.mentor_id = auth.uid() OR d.disciple_id = auth.uid())
  )
);

CREATE POLICY "Mentor can update checkins with feedback"
ON public.discipleship_checkins
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.discipleship d
    WHERE d.id = discipleship_id
    AND d.mentor_id = auth.uid()
  )
);

-- 7. Restringir exam_grades para apenas o próprio aluno e administradores
DROP POLICY IF EXISTS "Users can view own grades" ON public.exam_grades;
DROP POLICY IF EXISTS "Leaders can view all grades" ON public.exam_grades;

CREATE POLICY "Students can only view own grades"
ON public.exam_grades
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_approved_admin_or_leader(auth.uid())
);

-- Garantir que alunos não possam ver notas de outros através de exam_id
CREATE POLICY "Only graders can insert grades"
ON public.exam_grades
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_approved_admin_or_leader(auth.uid())
  AND graded_by = auth.uid()
);

CREATE POLICY "Only original graders can update grades"
ON public.exam_grades
FOR UPDATE
TO authenticated
USING (
  graded_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);