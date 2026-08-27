-- ============================================================================
-- MIGRATION: Criação da tabela fichas_monitoramento (Gestão Pedagógica)
-- Data: 27/08/2026
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.fichas_monitoramento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiario_id UUID NOT NULL REFERENCES public.beneficiarios(id) ON DELETE CASCADE,
    projeto_id UUID REFERENCES public.projetos_sociais(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'desligado')),
    motivo_desligamento TEXT,
    dados_gerais JSONB DEFAULT '{}'::jsonb,
    dados_escola JSONB DEFAULT '{}'::jsonb,
    classificacao_socioeconomica JSONB DEFAULT '{}'::jsonb,
    observacoes_adicionais TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (beneficiario_id, projeto_id)
);

ALTER TABLE public.fichas_monitoramento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso total fichas_monitoramento" ON public.fichas_monitoramento;
CREATE POLICY "Acesso total fichas_monitoramento" ON public.fichas_monitoramento FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
