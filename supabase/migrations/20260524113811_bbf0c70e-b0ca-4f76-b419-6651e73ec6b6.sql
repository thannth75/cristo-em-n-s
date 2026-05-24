-- 1) Notify recipient when a birthday message is sent
CREATE OR REPLACE FUNCTION public.notify_birthday_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sender_name text;
  v_snippet text;
BEGIN
  SELECT full_name INTO v_sender_name FROM public.profiles WHERE user_id = NEW.sender_id;
  v_snippet := CASE WHEN length(NEW.message) > 80 THEN substring(NEW.message, 1, 77) || '...' ELSE NEW.message END;

  INSERT INTO public.notifications (user_id, title, message, type, action_url)
  VALUES (
    NEW.recipient_id,
    '🎉 Parabéns recebido!',
    COALESCE(v_sender_name, 'Alguém') || ': "' || v_snippet || '"',
    'birthday',
    '/comunidade'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_birthday_message_notify ON public.birthday_messages;
CREATE TRIGGER on_birthday_message_notify
AFTER INSERT ON public.birthday_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_birthday_message();

-- 2) Audit log for birth_date corrections
CREATE TABLE IF NOT EXISTS public.birth_date_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid NOT NULL,
  changed_by uuid NOT NULL,
  old_birth_date date,
  new_birth_date date,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_birth_audit_target ON public.birth_date_audit_log(target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_birth_audit_changed_by ON public.birth_date_audit_log(changed_by, created_at DESC);

ALTER TABLE public.birth_date_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read birth date audit"
ON public.birth_date_audit_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages birth audit"
ON public.birth_date_audit_log FOR ALL
USING ((auth.jwt() ->> 'role') = 'service_role')
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- 3) Admin RPC to correct birth date with history
CREATE OR REPLACE FUNCTION public.admin_update_birth_date(
  p_target_user_id uuid,
  p_new_birth_date date,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_old date;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem corrigir datas de aniversário';
  END IF;

  IF p_new_birth_date IS NULL OR p_new_birth_date > current_date OR p_new_birth_date < '1900-01-01'::date THEN
    RAISE EXCEPTION 'Data de aniversário inválida';
  END IF;

  SELECT birth_date INTO v_old FROM public.profiles WHERE user_id = p_target_user_id;
  IF v_old IS NOT DISTINCT FROM p_new_birth_date THEN
    RETURN;
  END IF;

  UPDATE public.profiles SET birth_date = p_new_birth_date WHERE user_id = p_target_user_id;

  INSERT INTO public.birth_date_audit_log (target_user_id, changed_by, old_birth_date, new_birth_date, reason)
  VALUES (p_target_user_id, auth.uid(), v_old, p_new_birth_date, NULLIF(trim(coalesce(p_reason, '')), ''));
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_birth_date(uuid, date, text) TO authenticated;