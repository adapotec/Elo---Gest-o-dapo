-- ============================================================================
-- MIGRATION: Harden RLS on voluntarios table
-- Data: 16/10/2026
-- Objetivo:
--   1. Revogar permissão ALL para anon na tabela voluntarios.
--   2. Permitir apenas SELECT para anon em registros com status = 'ativo' (usado pela tela de login).
--   3. Garantir permissões completas (ALL) apenas para usuários autenticados.
-- ============================================================================

DROP POLICY IF EXISTS "Acesso total voluntarios" ON public.voluntarios;

CREATE POLICY "Leitura pública de voluntários ativos" ON public.voluntarios
    FOR SELECT TO anon
    USING (status = 'ativo');

CREATE POLICY "Acesso completo para voluntários autenticados" ON public.voluntarios
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);
