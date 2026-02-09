-- ==========================================
-- PARTE 1: ADICIONAR NOVOS PAPÉIS AO ENUM
-- ==========================================

-- Adicionar os novos papéis ao enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'membro';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'musico';