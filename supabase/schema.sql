-- Schema SQL Completo do Sistema ELO (v2.0) - Instituto Ádapo
-- Espelhamento de 20 tabelas e 266 colunas do Supabase Postgres (sa-east-1 / jkpmioffpsdcoitgghyo)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------
-- FUNÇÕES E TRIGGERS GLOBAIS
-- --------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar perfil automaticamente no SignUp do Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nome_completo, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'nome_completo', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'voluntario_operacional')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------------------
-- 1. PROFILES (Equipe Interna / Staff)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome_completo TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'voluntario_operacional' CHECK (role IN ('admin', 'coordenador', 'voluntario_operacional', 'voluntario_externo')),
    area_atuacao TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- --------------------------------------------------------
-- 2. BENEFICIÁRIOS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.beneficiarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_completo TEXT NOT NULL,
    data_nascimento DATE NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    rg TEXT,
    cep TEXT NOT NULL,
    rua TEXT NOT NULL,
    numero TEXT NOT NULL,
    complemento TEXT,
    bairro TEXT NOT NULL,
    comunidade TEXT,
    cidade TEXT NOT NULL,
    uf TEXT NOT NULL,
    telefone TEXT NOT NULL,
    email TEXT,
    escolaridade TEXT NOT NULL DEFAULT 'no_formal_education',
    profissao TEXT,
    cor_raca TEXT,
    estado_civil TEXT DEFAULT 'single',
    renda_familiar NUMERIC(10,2) DEFAULT 0.00,
    num_dependentes INTEGER DEFAULT 0,
    num_membros_familia INTEGER DEFAULT 1,
    contatos_emergencia JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'pendente', 'suspenso')),
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- --------------------------------------------------------
-- 3. VOLUNTÁRIOS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.voluntarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_completo TEXT NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'operacional' CHECK (tipo IN ('operacional', 'externo')),
    area_atuacao TEXT,
    funcao TEXT,
    data_inicio DATE DEFAULT CURRENT_DATE,
    data_fim DATE,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    observacoes TEXT,
    avatar_url TEXT,
    cep TEXT,
    rua TEXT,
    numero TEXT,
    bairro TEXT,
    cidade TEXT,
    uf TEXT DEFAULT 'SP',
    contato_emergencia_nome TEXT,
    contato_emergencia_parentesco TEXT,
    contato_emergencia_telefone TEXT,
    tipo_sanguineo TEXT,
    alergias TEXT,
    medicamentos_uso_continuo TEXT,
    plano_saude TEXT,
    habilidades TEXT[] DEFAULT '{}'::text[],
    horas_acumuladas INTEGER DEFAULT 0,
    cartao_sus TEXT,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- --------------------------------------------------------
-- 4. PROJETOS SOCIAIS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projetos_sociais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT NOT NULL DEFAULT 'curso' CHECK (tipo IN ('curso', 'encontro', 'palestra', 'outro')),
    data_inicio DATE NOT NULL,
    data_fim DATE,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('planejado', 'em_planejamento', 'ativo', 'concluido', 'cancelado')),
    is_pinned BOOLEAN DEFAULT FALSE,
    cor_identificacao TEXT DEFAULT '#F2632D',
    num_beneficiarios_diretos INTEGER DEFAULT 0,
    num_beneficiarios_indiretos INTEGER DEFAULT 0,
    aceita_vinculo_beneficiarios BOOLEAN DEFAULT TRUE,
    responsavel_escrita_id UUID REFERENCES public.voluntarios(id) ON DELETE SET NULL,
    apresentacao TEXT,
    justificativa TEXT,
    publico_alvo TEXT,
    ingresso_permanencia TEXT,
    localidade TEXT,
    objetivo_geral TEXT,
    objetivos_especificos TEXT,
    estrutura_objetivos JSONB DEFAULT '[]'::jsonb,
    metas TEXT,
    monitoramento_meta TEXT,
    monitoramento_procedimento TEXT,
    monitoramento_quando TEXT,
    monitoramento_responsavel TEXT,
    metodologia TEXT,
    ods_selecionadas JSONB DEFAULT '[]'::jsonb,
    acessibilidade TEXT,
    resultados_esperados TEXT,
    despesas_financeiras JSONB DEFAULT '[]'::jsonb,
    diagnostico_texto TEXT,
    diagnostico_detalhado JSONB DEFAULT '{}'::jsonb,
    avaliacao_encerramento TEXT,
    icone TEXT DEFAULT 'FolderKanban',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- --------------------------------------------------------
-- 5. AÇÕES DE PROJETO
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.acoes_projeto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto_id UUID REFERENCES public.projetos_sociais(id) ON DELETE CASCADE,
    data_hora TIMESTAMPTZ NOT NULL,
    nome_acao TEXT NOT NULL,
    descricao TEXT,
    documento_estruturador TEXT DEFAULT 'Plano de Aula',
    programacao_itens JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- 6. INSCRIÇÕES (Beneficiário <-> Projeto)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inscricoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiario_id UUID NOT NULL REFERENCES public.beneficiarios(id) ON DELETE CASCADE,
    projeto_id UUID NOT NULL REFERENCES public.projetos_sociais(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'concluido', 'desligado')),
    data_inscricao TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_beneficiario_projeto UNIQUE (beneficiario_id, projeto_id)
);

-- --------------------------------------------------------
-- 7. ALOCAÇÕES DE VOLUNTÁRIOS (Voluntário <-> Projeto / Ação)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.alocacoes_voluntarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voluntario_id UUID NOT NULL REFERENCES public.voluntarios(id) ON DELETE CASCADE,
    projeto_id UUID NOT NULL REFERENCES public.projetos_sociais(id) ON DELETE CASCADE,
    funcao_no_projeto TEXT,
    data_inicio DATE DEFAULT CURRENT_DATE,
    data_fim DATE,
    acao_id UUID REFERENCES public.acoes_projeto(id) ON DELETE SET NULL,
    CONSTRAINT unique_voluntario_projeto UNIQUE (voluntario_id, projeto_id)
);

-- --------------------------------------------------------
-- 8. FORNECEDORES (Doadores / Fornecedores)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fornecedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    tipo_pessoa TEXT NOT NULL DEFAULT 'PJ' CHECK (tipo_pessoa IN ('PF', 'PJ')),
    tax_id TEXT UNIQUE,
    cep TEXT,
    rua TEXT,
    numero TEXT,
    complemento TEXT,
    bairro TEXT,
    cidade TEXT,
    uf TEXT,
    telefone TEXT,
    email TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- 9. ESTOQUE ITENS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.estoque_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    categoria TEXT,
    quantidade INTEGER NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
    quantidade_minima INTEGER DEFAULT 10,
    unidade_medida TEXT DEFAULT 'unidade',
    localizacao TEXT DEFAULT 'Depósito Principal',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- 10. ESTOQUE MOVIMENTAÇÕES (com geração automática de lote)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.estoque_movimentacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.estoque_itens(id) ON DELETE CASCADE,
    fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL,
    projeto_id UUID REFERENCES public.projetos_sociais(id) ON DELETE SET NULL,
    lote BIGSERIAL,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    data_movimentacao TIMESTAMPTZ DEFAULT NOW(),
    is_available BOOLEAN DEFAULT TRUE,
    observacao TEXT,
    validade DATE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- --------------------------------------------------------
-- 11. PROGRAMAS DE CAPTAÇÃO
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.programas_captacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto_id UUID REFERENCES public.projetos_sociais(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT DEFAULT 'recorrente',
    gateway TEXT DEFAULT 'asaas',
    status TEXT DEFAULT 'ativo',
    meta_mensal NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- 12. DOAÇÕES
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.doacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiario_id UUID REFERENCES public.beneficiarios(id) ON DELETE SET NULL,
    movimentacao_estoque_id UUID REFERENCES public.estoque_movimentacoes(id) ON DELETE SET NULL,
    programa_captacao_id UUID REFERENCES public.programas_captacao(id) ON DELETE SET NULL,
    tipo TEXT NOT NULL DEFAULT 'financeira' CHECK (tipo IN ('financeira', 'item')),
    valor NUMERIC(10,2),
    descricao TEXT,
    mes_referencia INTEGER NOT NULL CHECK (mes_referencia BETWEEN 1 AND 12),
    ano_referencia INTEGER NOT NULL,
    data_doacao DATE DEFAULT CURRENT_DATE,
    nome_doador TEXT,
    cpf_cnpj_doador TEXT,
    telefone_doador TEXT,
    email_doador TEXT,
    categoria TEXT DEFAULT 'Geral',
    forma_pagamento TEXT DEFAULT 'Pix',
    comprovante_url TEXT,
    observacoes TEXT,
    item_quantidade INTEGER DEFAULT 1,
    item_unidade TEXT DEFAULT 'un',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- --------------------------------------------------------
-- 13. PLANS (Planos de Assinatura Asaas)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    programa_captacao_id UUID REFERENCES public.programas_captacao(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    cycle TEXT DEFAULT 'MONTHLY',
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- 14. SUBSCRIBERS (Assinantes Asaas)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    phone TEXT,
    asaas_customer_id TEXT UNIQUE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- 15. SUBSCRIPTIONS (Assinaturas Ativas)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscriber_id UUID NOT NULL REFERENCES public.subscribers(id) ON DELETE CASCADE,
    asaas_subscription_id TEXT UNIQUE,
    payment_method TEXT NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    next_due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- 16. EXCLUSIVE CONTENT (Conteúdo por Nível)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exclusive_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    storage_path TEXT,
    url TEXT,
    published_at TIMESTAMPTZ,
    min_plan_amount NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- 17. WEBHOOK LOGS (Logs Asaas)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event TEXT NOT NULL,
    asaas_payment_id TEXT,
    asaas_subscription_id TEXT,
    asaas_customer_id TEXT,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- 18. RELATÓRIOS DE MONITORAMENTO E AVALIAÇÃO (MROSC)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.relatorios_monitoramento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto_id UUID REFERENCES public.projetos_sociais(id) ON DELETE CASCADE,
    mes_referencia TEXT NOT NULL,
    resumo_avanco TEXT,
    metas_atingidas TEXT,
    dificuldades_encontradas TEXT,
    numero_processo TEXT,
    numero_instrumento TEXT,
    tipo_instrumento TEXT DEFAULT 'Termo de Fomento',
    periodo_inicio DATE,
    periodo_fim DATE,
    gestor_monitoramento_id UUID REFERENCES public.voluntarios(id),
    gestor_nome_externo TEXT,
    documentos_avaliados JSONB DEFAULT '[]'::jsonb,
    introducao_texto TEXT,
    avaliacao_acoes JSONB DEFAULT '[]'::jsonb,
    avaliacao_metas JSONB DEFAULT '[]'::jsonb,
    status_transparencia TEXT DEFAULT 'conforme',
    justificativa_transparencia TEXT,
    parecer_conclusao TEXT DEFAULT 'continuidade_regular',
    ressalvas_conclusao JSONB DEFAULT '[]'::jsonb,
    justificativa_conclusao TEXT,
    valor_desembolsado NUMERIC(10,2) DEFAULT 0.00,
    local_data_emissao TEXT DEFAULT 'São Luís - MA',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- 19. DADOS DO INSTITUTO (Singleton)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dados_instituto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    razao_social TEXT DEFAULT 'Instituto Ádapo',
    cnpj TEXT DEFAULT '00.000.000/0001-00',
    endereco TEXT DEFAULT 'Rua do Instituto, 100 - São Paulo, SP',
    telefone TEXT DEFAULT '(11) 99999-9999',
    email TEXT DEFAULT 'contato@institutoadapo.org.br',
    presidente TEXT DEFAULT 'Diretoria Executiva',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- 20. REQUISIÇÕES DE MATERIAL
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.requisicoes_material (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto_id UUID NOT NULL REFERENCES public.projetos_sociais(id) ON DELETE CASCADE,
    estoque_item_id UUID REFERENCES public.estoque_itens(id) ON DELETE SET NULL,
    respondido_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    item_nome TEXT NOT NULL,
    categoria TEXT,
    quantidade_solicitada INTEGER NOT NULL DEFAULT 1,
    quantidade_liberada INTEGER DEFAULT 0,
    valor_unitario NUMERIC(10,2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pendente',
    observacao_estoque TEXT,
    respondido_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- 21. RECESSOS DE VOLUNTÁRIOS (Ádapo Cuidar)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recessos_voluntarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voluntario_id UUID NOT NULL REFERENCES public.voluntarios(id) ON DELETE CASCADE,
    data_folga DATE NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'individual' CHECK (tipo IN ('coletiva', 'individual')),
    motivo TEXT,
    status TEXT NOT NULL DEFAULT 'aprovada' CHECK (status IN ('pendente', 'aprovada', 'recusada')),
    aprovado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    mes_referencia INTEGER NOT NULL,
    ano_referencia INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_voluntario_folga UNIQUE (voluntario_id, data_folga)
);

-- --------------------------------------------------------
-- 22. CONFIGURAÇÕES DE RECESSO (Toggle Dia da Família)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.configuracoes_recesso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mes INTEGER NOT NULL,
    ano INTEGER NOT NULL,
    dia_familia_ativo BOOLEAN DEFAULT TRUE,
    motivo_desativacao TEXT,
    alterado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_config_mes_ano UNIQUE (mes, ano)
);

-- --------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) & POLÍTICAS DE ACESSO
-- --------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voluntarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projetos_sociais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acoes_projeto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscricoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alocacoes_voluntarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programas_captacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exclusive_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorios_monitoramento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dados_instituto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requisicoes_material ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recessos_voluntarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_recesso ENABLE ROW LEVEL SECURITY;

-- Permissões de Usuários/Perfis
CREATE POLICY "Leitura total profiles" ON public.profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Atualização própria de profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Permissões operacionais internas
CREATE POLICY "Acesso total beneficiarios" ON public.beneficiarios FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total voluntarios" ON public.voluntarios FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total projetos" ON public.projetos_sociais FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total acoes_projeto" ON public.acoes_projeto FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total inscricoes" ON public.inscricoes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total alocacoes" ON public.alocacoes_voluntarios FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total fornecedores" ON public.fornecedores FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total estoque_itens" ON public.estoque_itens FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total estoque_movimentacoes" ON public.estoque_movimentacoes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total programas_captacao" ON public.programas_captacao FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total doacoes" ON public.doacoes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total relatorios_monitoramento" ON public.relatorios_monitoramento FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total dados_instituto" ON public.dados_instituto FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total requisicoes_material" ON public.requisicoes_material FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total recessos" ON public.recessos_voluntarios FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total config_recesso" ON public.configuracoes_recesso FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Permissões para captação recorrente e assinantes
CREATE POLICY "Planos visiveis para todos" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Assinante ve proprios dados" ON public.subscribers FOR SELECT TO authenticated USING (auth_user_id = auth.uid());
CREATE POLICY "Assinante ve proprias assinaturas" ON public.subscriptions FOR SELECT TO authenticated USING (
    subscriber_id IN (SELECT id FROM public.subscribers WHERE auth_user_id = auth.uid())
);

-- --------------------------------------------------------
-- 21. PLANOS DE AULA (Documento Estruturador Pedagógico)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.planos_aula (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acao_id UUID NOT NULL REFERENCES public.acoes_projeto(id) ON DELETE CASCADE,
    projeto_id UUID NOT NULL REFERENCES public.projetos_sociais(id) ON DELETE CASCADE,
    objetivos_pedagogicos TEXT,
    conteudo_programatico TEXT,
    metodologia_ativa TEXT,
    recursos_materiais TEXT,
    avaliacao_educador TEXT,
    diario_ocorrencias TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT unique_plano_acao UNIQUE (acao_id)
);

-- --------------------------------------------------------
-- 22. PROGRAMAÇÕES DE AÇÃO (Roteiro / Ritmo / Rotina - Gestão de Projetos)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.programacoes_acao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acao_id UUID NOT NULL REFERENCES public.acoes_projeto(id) ON DELETE CASCADE,
    projeto_id UUID NOT NULL REFERENCES public.projetos_sociais(id) ON DELETE CASCADE,
    roteiro_items JSONB DEFAULT '[]'::jsonb,
    materiais_necessarios TEXT,
    observacoes_gerais TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT unique_programacao_acao UNIQUE (acao_id)
);

ALTER TABLE public.planos_aula ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programacoes_acao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso total a planos_aula" ON public.planos_aula FOR ALL TO anon, authenticated USING (true);
CREATE POLICY "Acesso total a programacoes_acao" ON public.programacoes_acao FOR ALL TO anon, authenticated USING (true);

-- --------------------------------------------------------
-- 23. ACOMPANHAMENTO SOCIOEMOCIONAL (4 EIXOS ÁDAPO)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.acompanhamento_socioemocional (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiario_id UUID NOT NULL REFERENCES public.beneficiarios(id) ON DELETE CASCADE,
    projeto_id UUID NOT NULL REFERENCES public.projetos_sociais(id) ON DELETE CASCADE,
    data_registro DATE NOT NULL DEFAULT CURRENT_DATE,
    mes_referencia TEXT,
    responsavel_preenchimento TEXT,
    idade_referencia INTEGER,
    tipo_registro TEXT DEFAULT 'monitoramento_mensal',
    eixo1_expressao_opinioes TEXT,
    eixo1_enfrentamento_desafios TEXT,
    eixo1_autoimagem TEXT,
    eixo2_resolucao_conflitos TEXT,
    eixo2_trabalho_equipe TEXT,
    eixo2_cuidado_espaco TEXT,
    eixo3_respeito_tempo_ritmo TEXT,
    eixo3_escuta_ativa TEXT,
    eixo3_apoio_mutuo TEXT,
    eixo4_evolucao_observada TEXT,
    eixo4_pontos_atencao TEXT,
    eixo4_intervencao_proposta TEXT,
    ficha_detalhada JSONB DEFAULT '{}'::jsonb,
    autoestima_expressao TEXT,
    regulacao_emocional TEXT,
    vinculos_afetivos TEXT,
    contexto_familiar_territorial TEXT,
    acesso_direitos_encaminhamentos TEXT,
    nivel_desenvolvimento TEXT DEFAULT 'em_desenvolvimento',
    observacoes_equipe TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- --------------------------------------------------------
-- 24. RODAS DE CONVERSA PSICOSSOCIAIS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rodas_conversa_psicossocial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto_id UUID NOT NULL REFERENCES public.projetos_sociais(id) ON DELETE CASCADE,
    data_roda DATE NOT NULL DEFAULT CURRENT_DATE,
    tema_abordado TEXT NOT NULL,
    facilitador TEXT,
    resumo_dinamica TEXT,
    percepcoes_grupo TEXT,
    participantes_destaque TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.acompanhamento_socioemocional ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rodas_conversa_psicossocial ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso total acompanhamento_socioemocional para autenticados" ON public.acompanhamento_socioemocional FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso total rodas_conversa_psicossocial para autenticados" ON public.rodas_conversa_psicossocial FOR ALL TO authenticated USING (true);

-- --------------------------------------------------------
-- 25. CONTEÚDOS & POSTAGENS DE COMUNICAÇÃO (CALENDÁRIO EDITORIAL)
-- --------------------------------------------------------
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

ALTER TABLE public.conteudos_comunicacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total conteudos_comunicacao" ON public.conteudos_comunicacao FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- --------------------------------------------------------
-- 26. PARCEIROS & FINANCIADORES DE PROJETO
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.parceiros_projeto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto_id UUID NOT NULL REFERENCES public.projetos_sociais(id) ON DELETE CASCADE,
    fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL,
    nome_parceiro TEXT NOT NULL,
    tipo_parceria TEXT DEFAULT 'financeira',
    valor_comprometido NUMERIC(10,2) DEFAULT 0.00,
    vigencia_inicio DATE,
    vigencia_fim DATE,
    contrapartidas TEXT,
    status TEXT DEFAULT 'ativo',
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.parceiros_projeto ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total parceiros_projeto" ON public.parceiros_projeto FOR ALL TO anon, authenticated USING (true);

-- --------------------------------------------------------
-- 27. FREQUÊNCIAS POR AÇÃO / ENCONTRO (CHAMADA)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.frequencias_acao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acao_id UUID NOT NULL REFERENCES public.acoes_projeto(id) ON DELETE CASCADE,
    projeto_id UUID NOT NULL REFERENCES public.projetos_sociais(id) ON DELETE CASCADE,
    beneficiario_id UUID NOT NULL REFERENCES public.beneficiarios(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'presente' CHECK (status IN ('presente', 'falta', 'justificada')),
    justificativa TEXT,
    observacao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_acao_beneficiario UNIQUE (acao_id, beneficiario_id)
);

ALTER TABLE public.frequencias_acao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total frequencias_acao" ON public.frequencias_acao FOR ALL TO anon, authenticated USING (true);

-- --------------------------------------------------------
-- 28. PLANOS DE OFICINA (CLUBE DAS PIPAS)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.planos_oficina (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto_id UUID NOT NULL REFERENCES public.projetos_sociais(id) ON DELETE CASCADE,
    acao_id UUID REFERENCES public.acoes_projeto(id) ON DELETE SET NULL,
    titulo TEXT NOT NULL,
    oficineiro TEXT NOT NULL,
    data_oficina DATE DEFAULT CURRENT_DATE,
    descricao TEXT,
    objetivos TEXT,
    meta_projeto_id TEXT,
    atividades_dirigidas TEXT,
    brincadeiras_livres TEXT,
    recursos_materiais TEXT,
    avaliacao_encontro TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.planos_oficina ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total planos_oficina" ON public.planos_oficina FOR ALL TO anon, authenticated USING (true);




