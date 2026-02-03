-- Tabela para rastrear devocionais gerados automaticamente
CREATE TABLE IF NOT EXISTS public.auto_devotional_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  devotional_id UUID REFERENCES public.daily_devotionals(id) ON DELETE CASCADE,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  model_used TEXT,
  prompt_used TEXT
);

-- Permitir leitura para todos os usuários aprovados
ALTER TABLE public.auto_devotional_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view auto devotional log"
  ON public.auto_devotional_log FOR SELECT
  USING (public.is_user_approved(auth.uid()));

-- Permitir insert apenas para service role (edge function)
CREATE POLICY "Service role can insert auto devotional log"
  ON public.auto_devotional_log FOR INSERT
  WITH CHECK (true);

-- Adicionar campo para marcar devocionais como auto-gerados
ALTER TABLE public.daily_devotionals
ADD COLUMN IF NOT EXISTS is_auto_generated BOOLEAN DEFAULT false;

-- Criar índice para buscar por data
CREATE INDEX IF NOT EXISTS idx_daily_devotionals_date ON public.daily_devotionals(devotional_date DESC);