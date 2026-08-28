-- Migração para suporte a Habilidades, Horas Acumuladas e Prontuário no Voluntariado
ALTER TABLE IF EXISTS public.voluntarios 
ADD COLUMN IF NOT EXISTS habilidades TEXT[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS horas_acumuladas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cartao_sus TEXT;
