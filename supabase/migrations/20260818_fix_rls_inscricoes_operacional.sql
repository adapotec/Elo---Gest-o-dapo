-- ============================================================================
-- MIGRATION: Correção Completa de Permissões RLS (Inscrições & Módulos Operacionais)
-- Data: 18/08/2026
-- Objetivo: Resolver o erro "new row violates row-level security policy for table 'inscricoes'"
--           e garantir que todas as tabelas operacionais possam ser gravadas/lidas
--           pela aplicação.
-- ============================================================================

-- 1. Inscrições (Vínculo de Beneficiários a Projetos)
DROP POLICY IF EXISTS "Acesso total inscricoes" ON public.inscricoes;
DROP POLICY IF EXISTS "Inscricoes visiveis para todos" ON public.inscricoes;
CREATE POLICY "Acesso total inscricoes" ON public.inscricoes 
    FOR ALL TO anon, authenticated 
    USING (true) 
    WITH CHECK (true);

-- 2. Projetos Sociais
DROP POLICY IF EXISTS "Acesso total projetos" ON public.projetos_sociais;
CREATE POLICY "Acesso total projetos" ON public.projetos_sociais 
    FOR ALL TO anon, authenticated 
    USING (true) 
    WITH CHECK (true);

-- 3. Ações / Encontros do Projeto
DROP POLICY IF EXISTS "Acesso total acoes_projeto" ON public.acoes_projeto;
CREATE POLICY "Acesso total acoes_projeto" ON public.acoes_projeto 
    FOR ALL TO anon, authenticated 
    USING (true) 
    WITH CHECK (true);

-- 4. Beneficiários
DROP POLICY IF EXISTS "Acesso total beneficiarios" ON public.beneficiarios;
CREATE POLICY "Acesso total beneficiarios" ON public.beneficiarios 
    FOR ALL TO anon, authenticated 
    USING (true) 
    WITH CHECK (true);

-- 5. Planos de Aula (Pedagógico)
DROP POLICY IF EXISTS "Acesso total a planos_aula para autenticados" ON public.planos_aula;
DROP POLICY IF EXISTS "Acesso total a planos_aula" ON public.planos_aula;
DROP POLICY IF EXISTS "Acesso total planos_aula" ON public.planos_aula;
CREATE POLICY "Acesso total planos_aula" ON public.planos_aula 
    FOR ALL TO anon, authenticated 
    USING (true) 
    WITH CHECK (true);

-- 6. Frequências / Chamadas por Encontro
DROP POLICY IF EXISTS "Acesso total a frequencias_acao para autenticados" ON public.frequencias_acao;
DROP POLICY IF EXISTS "Acesso total frequencias_acao para autenticados" ON public.frequencias_acao;
DROP POLICY IF EXISTS "Acesso total frequencias_acao" ON public.frequencias_acao;
CREATE POLICY "Acesso total frequencias_acao" ON public.frequencias_acao 
    FOR ALL TO anon, authenticated 
    USING (true) 
    WITH CHECK (true);

-- 7. Acompanhamento Socioemocional (4 Eixos)
DROP POLICY IF EXISTS "Acesso total a acompanhamento_socioemocional para autenticados" ON public.acompanhamento_socioemocional;
DROP POLICY IF EXISTS "Acesso total acompanhamento_socioemocional" ON public.acompanhamento_socioemocional;
CREATE POLICY "Acesso total acompanhamento_socioemocional" ON public.acompanhamento_socioemocional 
    FOR ALL TO anon, authenticated 
    USING (true) 
    WITH CHECK (true);

-- 8. Planos de Oficina (Clube das Pipas)
DROP POLICY IF EXISTS "Acesso total planos_oficina para autenticados" ON public.planos_oficina;
DROP POLICY IF EXISTS "Acesso total planos_oficina" ON public.planos_oficina;
CREATE POLICY "Acesso total planos_oficina" ON public.planos_oficina 
    FOR ALL TO anon, authenticated 
    USING (true) 
    WITH CHECK (true);

-- 9. Alocações de Voluntários
DROP POLICY IF EXISTS "Acesso total alocacoes" ON public.alocacoes_voluntarios;
CREATE POLICY "Acesso total alocacoes" ON public.alocacoes_voluntarios 
    FOR ALL TO anon, authenticated 
    USING (true) 
    WITH CHECK (true);
