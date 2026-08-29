-- Migração para suporte a período de recesso de 15 dias e controle de aprovações
ALTER TABLE IF EXISTS public.recessos_voluntarios
ADD COLUMN IF NOT EXISTS data_fim DATE,
ADD COLUMN IF NOT EXISTS dias_qtd INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS motivo_recusa TEXT;

-- Atualiza a constraint de tipo para suportar recesso_15_dias se necessário
ALTER TABLE IF EXISTS public.recessos_voluntarios DROP CONSTRAINT IF EXISTS recessos_voluntarios_tipo_check;
ALTER TABLE IF EXISTS public.recessos_voluntarios ADD CONSTRAINT recessos_voluntarios_tipo_check CHECK (tipo IN ('coletiva', 'individual', 'recesso_15_dias'));
