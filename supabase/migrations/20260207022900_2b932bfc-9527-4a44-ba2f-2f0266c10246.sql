
-- PARTE 1: Criar tabela de auditoria de segurança
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  user_id UUID,
  target_table TEXT,
  target_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS para audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Política: apenas admins podem ver
CREATE POLICY "Admins view audit logs"
ON public.security_audit_log FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_security_audit_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_created_at ON public.security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_action_type ON public.security_audit_log(action_type);

-- Função de auditoria
CREATE OR REPLACE FUNCTION public.log_security_audit(
  p_action_type TEXT,
  p_target_table TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    action_type, user_id, target_table, target_id, old_values, new_values
  ) VALUES (
    p_action_type, auth.uid(), p_target_table, p_target_id, p_old_values, p_new_values
  );
END;
$$;
