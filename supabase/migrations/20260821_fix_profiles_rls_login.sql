-- ============================================================================
-- MIGRATION: Permitir Leitura Pública de Profiles na Tela de Login
-- Data: 21/08/2026
-- Objetivo: Permitir que a tela de login identifique corretamente quem já
--           criou senha / possui conta ativa, evitando que o usuário caia em
--           "Primeiro Acesso" repetidas vezes após deslogar.
-- ============================================================================

DROP POLICY IF EXISTS "Leitura total profiles para autenticados" ON public.profiles;
DROP POLICY IF EXISTS "Leitura publica profiles" ON public.profiles;

CREATE POLICY "Leitura publica profiles" ON public.profiles 
    FOR SELECT TO anon, authenticated 
    USING (true);
