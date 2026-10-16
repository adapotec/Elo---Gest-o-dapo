-- ============================================================================
-- MIGRATION: Adicionar data_nascimento à tabela voluntarios
-- Data: 16/10/2026
-- Objetivo: Permitir exibir aniversariantes voluntários na Home do Dashboard
-- ============================================================================

ALTER TABLE public.voluntarios 
ADD COLUMN IF NOT EXISTS data_nascimento DATE;
