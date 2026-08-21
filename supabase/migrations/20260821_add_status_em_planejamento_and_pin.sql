-- ============================================================================
-- MIGRATION: Adicionar Status 'em_planejamento' e Coluna 'is_pinned' em Projetos Sociais
-- Data: 21/08/2026
-- Objetivo:
--   1. Permitir o status 'em_planejamento' em projetos_sociais.
--   2. Adicionar suporte a fixar projetos no topo (is_pinned).
-- ============================================================================

ALTER TABLE public.projetos_sociais 
    DROP CONSTRAINT IF EXISTS projetos_sociais_status_check;

ALTER TABLE public.projetos_sociais 
    ADD CONSTRAINT projetos_sociais_status_check 
    CHECK (status IN ('planejado', 'em_planejamento', 'ativo', 'concluido', 'cancelado'));

ALTER TABLE public.projetos_sociais 
    ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
