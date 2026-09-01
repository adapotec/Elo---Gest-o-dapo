-- Migração: Criação do Módulo de Comunicação & Mídia do Instituto Ádapo

-- 1. Tabela de Campanhas de Comunicação (10 Blocos Estratégicos)
CREATE TABLE IF NOT EXISTS public.campanhas_comunicacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    projeto_id UUID REFERENCES public.projetos_sociais(id) ON DELETE SET NULL,
    responsavel_id UUID REFERENCES public.voluntarios(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'planejamento' CHECK (status IN ('planejamento', 'em_andamento', 'concluida', 'pausada')),
    data_inicio DATE,
    data_fim DATE,
    resumo TEXT,
    diagnostico_contexto TEXT,
    personas_publico JSONB DEFAULT '{}'::jsonb,
    objetivos JSONB DEFAULT '{}'::jsonb,
    estrategia_narrativa JSONB DEFAULT '{}'::jsonb,
    gatilhos_persuasao TEXT,
    canais_ferramentas TEXT[],
    recursos_equipe UUID[],
    indicadores_esperados JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela do Calendário Editorial (Conteúdos e Postagens)
CREATE TABLE IF NOT EXISTS public.conteudos_comunicacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    data_publicacao TIMESTAMPTZ NOT NULL,
    tipo_conteudo TEXT NOT NULL DEFAULT 'reels' CHECK (tipo_conteudo IN ('reels', 'carrossel', 'stories', 'estatico', 'video_longo', 'artigo')),
    descricao TEXT,
    campanha_id UUID REFERENCES public.campanhas_comunicacao(id) ON DELETE SET NULL,
    projeto_id UUID REFERENCES public.projetos_sociais(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'nao_iniciado' CHECK (status IN ('nao_iniciado', 'producao', 'analise', 'em_atraso', 'publicado', 'cancelado')),
    responsavel_id UUID REFERENCES public.voluntarios(id) ON DELETE SET NULL,
    categoria TEXT NOT NULL DEFAULT 'engajamento' CHECK (categoria IN ('engajamento', 'informacao', 'cta', 'institucional', 'avulso', 'depoimento')),
    link_producao TEXT,
    metricas JSONB DEFAULT '{"curtidas": 0, "alcance": 0, "salvamentos": 0, "compartilhamentos": 0}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela da Galeria de Mídias de Ações (Google Drive)
CREATE TABLE IF NOT EXISTS public.galeria_midia_acoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    projeto_id UUID REFERENCES public.projetos_sociais(id) ON DELETE SET NULL,
    acao_id UUID REFERENCES public.acoes_projeto(id) ON DELETE SET NULL,
    data_evento DATE NOT NULL,
    link_drive TEXT NOT NULL,
    fotografo_voluntario_id UUID REFERENCES public.voluntarios(id) ON DELETE SET NULL,
    descricao TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Métricas e Configuração da Meta / Instagram
CREATE TABLE IF NOT EXISTS public.metricas_redes_sociais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mes INT NOT NULL,
    ano INT NOT NULL,
    seguidores INT DEFAULT 0,
    alcance_mensal INT DEFAULT 0,
    impressoes INT DEFAULT 0,
    taxa_engajamento NUMERIC DEFAULT 0,
    visualizacoes_reels INT DEFAULT 0,
    cliques_bio INT DEFAULT 0,
    novos_seguidores INT DEFAULT 0,
    fonte TEXT DEFAULT 'manual' CHECK (fonte IN ('manual', 'meta_api')),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(mes, ano)
);

CREATE TABLE IF NOT EXISTS public.meta_integracao_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instagram_account_id TEXT,
    access_token TEXT,
    ultima_sincronizacao TIMESTAMPTZ,
    status_conexao TEXT DEFAULT 'desconectado',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.campanhas_comunicacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conteudos_comunicacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galeria_midia_acoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricas_redes_sociais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_integracao_config ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campanhas_comunicacao') THEN
        CREATE POLICY "Permitir leitura campanhas para autenticados" ON public.campanhas_comunicacao FOR SELECT TO authenticated USING (true);
        CREATE POLICY "Permitir insercao campanhas para autenticados" ON public.campanhas_comunicacao FOR INSERT TO authenticated WITH CHECK (true);
        CREATE POLICY "Permitir atualizacao campanhas para autenticados" ON public.campanhas_comunicacao FOR UPDATE TO authenticated USING (true);
        CREATE POLICY "Permitir exclusao campanhas para autenticados" ON public.campanhas_comunicacao FOR DELETE TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conteudos_comunicacao') THEN
        CREATE POLICY "Permitir leitura conteudos para autenticados" ON public.conteudos_comunicacao FOR SELECT TO authenticated USING (true);
        CREATE POLICY "Permitir insercao conteudos para autenticados" ON public.conteudos_comunicacao FOR INSERT TO authenticated WITH CHECK (true);
        CREATE POLICY "Permitir atualizacao conteudos para autenticados" ON public.conteudos_comunicacao FOR UPDATE TO authenticated USING (true);
        CREATE POLICY "Permitir exclusao conteudos para autenticados" ON public.conteudos_comunicacao FOR DELETE TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'galeria_midia_acoes') THEN
        CREATE POLICY "Permitir leitura galeria para autenticados" ON public.galeria_midia_acoes FOR SELECT TO authenticated USING (true);
        CREATE POLICY "Permitir insercao galeria para autenticados" ON public.galeria_midia_acoes FOR INSERT TO authenticated WITH CHECK (true);
        CREATE POLICY "Permitir atualizacao galeria para autenticados" ON public.galeria_midia_acoes FOR UPDATE TO authenticated USING (true);
        CREATE POLICY "Permitir exclusao galeria para autenticados" ON public.galeria_midia_acoes FOR DELETE TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'metricas_redes_sociais') THEN
        CREATE POLICY "Permitir tudo metricas para autenticados" ON public.metricas_redes_sociais FOR ALL TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meta_integracao_config') THEN
        CREATE POLICY "Permitir tudo meta config para autenticados" ON public.meta_integracao_config FOR ALL TO authenticated USING (true);
    END IF;
END $$;
