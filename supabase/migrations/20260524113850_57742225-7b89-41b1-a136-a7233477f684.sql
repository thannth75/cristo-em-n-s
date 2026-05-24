CREATE OR REPLACE FUNCTION public.send_daily_birthday_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_today_day int := EXTRACT(day FROM current_date)::int;
  v_today_month int := EXTRACT(month FROM current_date)::int;
  v_month_name text := to_char(current_date, 'TMMonth');
  v_birthday RECORD;
  v_count int;
BEGIN
  -- Today's birthday people get a personal notification
  FOR v_birthday IN
    SELECT user_id, full_name FROM public.profiles
    WHERE is_approved = true
      AND birth_date IS NOT NULL
      AND EXTRACT(day FROM birth_date)::int = v_today_day
      AND EXTRACT(month FROM birth_date)::int = v_today_month
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, action_url)
    VALUES (
      v_birthday.user_id,
      '🎂 Feliz Aniversário!',
      'Hoje é seu dia, ' || split_part(v_birthday.full_name, ' ', 1) || '! Que Deus te abençoe ricamente. 🎉',
      'birthday',
      '/comunidade'
    );

    -- Notify the community
    INSERT INTO public.notifications (user_id, title, message, type, action_url)
    SELECT p.user_id,
      '🎉 Aniversariante do dia',
      v_birthday.full_name || ' está aniversariando hoje. Envie uma mensagem de parabéns!',
      'birthday',
      '/aniversariantes'
    FROM public.profiles p
    WHERE p.is_approved = true AND p.user_id <> v_birthday.user_id;
  END LOOP;

  -- On the 1st of the month, send a monthly summary
  IF v_today_day = 1 THEN
    SELECT count(*) INTO v_count FROM public.profiles
    WHERE is_approved = true AND birth_date IS NOT NULL
      AND EXTRACT(month FROM birth_date)::int = v_today_month;
    IF v_count > 0 THEN
      INSERT INTO public.notifications (user_id, title, message, type, action_url)
      SELECT p.user_id,
        '🎂 Aniversariantes de ' || v_month_name,
        'Este mês temos ' || v_count || ' aniversariante' || CASE WHEN v_count>1 THEN 's' ELSE '' END || '. Veja a lista e parabenize!',
        'birthday',
        '/aniversariantes'
      FROM public.profiles p
      WHERE p.is_approved = true;
    END IF;
  END IF;
END;
$$;