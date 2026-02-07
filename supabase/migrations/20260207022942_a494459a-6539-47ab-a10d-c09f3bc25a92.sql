
-- PARTE 2: Corrigir função add_user_xp com validações de segurança
CREATE OR REPLACE FUNCTION public.add_user_xp(
  p_user_id UUID, 
  p_xp_amount INTEGER, 
  p_activity_type TEXT, 
  p_activity_id UUID DEFAULT NULL, 
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE(new_total_xp INTEGER, new_level INTEGER, level_up BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_level INTEGER;
  v_new_level INTEGER;
  v_new_total INTEGER;
BEGIN
  -- VALIDAÇÃO CRÍTICA: Usuário só pode dar XP a si mesmo (exceto sistema)
  -- Se auth.uid() é NULL (chamada do sistema/service role), permite
  -- Se auth.uid() está definido, deve coincidir com p_user_id
  IF auth.uid() IS NOT NULL AND p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Não autorizado: você não pode conceder XP a outros usuários';
  END IF;
  
  -- VALIDAÇÃO: XP deve ser positivo e com limite razoável por transação
  IF p_xp_amount < 1 OR p_xp_amount > 500 THEN
    RAISE EXCEPTION 'Quantidade de XP inválida (deve ser entre 1 e 500)';
  END IF;
  
  -- VALIDAÇÃO: activity_type deve ser válido
  IF p_activity_type NOT IN (
    'devocional', 'quiz', 'oracao', 'testemunho', 'post', 
    'comentario', 'leitura', 'checkin', 'conquista', 'milestone',
    'diario', 'rotina', 'presenca', 'celula', 'story'
  ) THEN
    RAISE EXCEPTION 'Tipo de atividade inválido';
  END IF;

  -- Obter nível atual
  SELECT current_level INTO v_old_level FROM public.profiles WHERE user_id = p_user_id;
  
  -- Atualizar XP
  UPDATE public.profiles 
  SET total_xp = total_xp + p_xp_amount
  WHERE user_id = p_user_id
  RETURNING total_xp INTO v_new_total;
  
  -- Calcular novo nível
  v_new_level := public.calculate_level_from_xp(v_new_total);
  
  -- Atualizar nível se mudou
  IF v_new_level != v_old_level THEN
    UPDATE public.profiles SET current_level = v_new_level WHERE user_id = p_user_id;
  END IF;
  
  -- Registrar transação
  INSERT INTO public.xp_transactions (user_id, xp_amount, activity_type, activity_id, description)
  VALUES (p_user_id, p_xp_amount, p_activity_type, p_activity_id, p_description);
  
  RETURN QUERY SELECT v_new_total, v_new_level, (v_new_level > v_old_level);
END;
$$;

-- PARTE 3: Criar trigger para proteger campos sensíveis em profiles
CREATE OR REPLACE FUNCTION public.check_profile_protected_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Se não é admin/líder, bloqueia alteração de campos protegidos
  IF NOT public.is_admin_or_leader(auth.uid()) THEN
    -- Impedir alteração de XP e nível
    IF NEW.total_xp IS DISTINCT FROM OLD.total_xp THEN
      RAISE EXCEPTION 'Não autorizado: você não pode alterar total_xp diretamente';
    END IF;
    IF NEW.current_level IS DISTINCT FROM OLD.current_level THEN
      RAISE EXCEPTION 'Não autorizado: você não pode alterar current_level diretamente';
    END IF;
    -- Impedir auto-aprovação
    IF NEW.is_approved IS DISTINCT FROM OLD.is_approved THEN
      RAISE EXCEPTION 'Não autorizado: você não pode alterar is_approved';
    END IF;
    IF NEW.approved_by IS DISTINCT FROM OLD.approved_by THEN
      RAISE EXCEPTION 'Não autorizado: você não pode alterar approved_by';
    END IF;
    IF NEW.approved_at IS DISTINCT FROM OLD.approved_at THEN
      RAISE EXCEPTION 'Não autorizado: você não pode alterar approved_at';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para validação
DROP TRIGGER IF EXISTS check_profile_protected_fields_trigger ON profiles;
CREATE TRIGGER check_profile_protected_fields_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_profile_protected_fields();
