-- Adicionar campos para presença online e aniversariantes
-- last_seen para status online/último visto (como WhatsApp)
-- birth_date já existe, vamos usar para aniversariantes

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_seen timestamp with time zone DEFAULT now();

-- Criar índice para consultas de aniversariantes
CREATE INDEX IF NOT EXISTS idx_profiles_birth_date ON public.profiles USING btree (birth_date);

-- Criar índice para consultas de último visto
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles USING btree (last_seen DESC);