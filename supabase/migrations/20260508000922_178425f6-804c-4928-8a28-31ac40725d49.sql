CREATE OR REPLACE FUNCTION public.add_user_xp(p_user_id uuid, p_xp_amount integer, p_activity_type text, p_activity_id uuid DEFAULT NULL::uuid, p_description text DEFAULT NULL::text)
 RETURNS TABLE(new_total_xp integer, new_level integer, level_up boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_old_level INTEGER;
  v_new_level INTEGER;
  v_new_total INTEGER;
  v_valid_activity BOOLEAN;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Não autorizado: você não pode conceder XP a outros usuários';
  END IF;

  IF p_xp_amount < 1 OR p_xp_amount > 500 THEN
    RAISE EXCEPTION 'Quantidade de XP inválida (deve ser entre 1 e 500)';
  END IF;

  -- Validate activity_type against the dynamic xp_activities catalog (preferred)
  -- OR a legacy whitelist (for backwards compatibility).
  SELECT EXISTS (
    SELECT 1 FROM public.xp_activities WHERE activity_key = p_activity_type AND is_active = true
  ) INTO v_valid_activity;

  IF NOT v_valid_activity AND p_activity_type NOT IN (
    'devocional', 'quiz', 'oracao', 'testemunho', 'post',
    'comentario', 'leitura', 'checkin', 'conquista', 'milestone',
    'diario', 'rotina', 'presenca', 'celula', 'story',
    'community_post', 'community_comment', 'complete_devotional',
    'daily_login', 'discipleship_checkin', 'event_attendance',
    'first_week_streak', 'journal_entry', 'prayer_request',
    'quiz_complete', 'quiz_perfect', 'reading_complete',
    'study_chapter', 'testimony_shared'
  ) THEN
    RAISE EXCEPTION 'Tipo de atividade inválido: %', p_activity_type;
  END IF;

  SELECT current_level INTO v_old_level FROM public.profiles WHERE user_id = p_user_id;

  UPDATE public.profiles
  SET total_xp = total_xp + p_xp_amount
  WHERE user_id = p_user_id
  RETURNING total_xp INTO v_new_total;

  v_new_level := public.calculate_level_from_xp(v_new_total);

  IF v_new_level != v_old_level THEN
    UPDATE public.profiles SET current_level = v_new_level WHERE user_id = p_user_id;
  END IF;

  INSERT INTO public.xp_transactions (user_id, xp_amount, activity_type, activity_id, description)
  VALUES (p_user_id, p_xp_amount, p_activity_type, p_activity_id, p_description);

  RETURN QUERY SELECT v_new_total, v_new_level, (v_new_level > v_old_level);
END;
$function$;