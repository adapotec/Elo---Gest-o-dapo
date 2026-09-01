-- Migração: Criação da tabela de disponibilidades e escalas de voluntários
CREATE TABLE IF NOT EXISTS public.disponibilidades_voluntarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voluntario_id UUID REFERENCES public.voluntarios(id) ON DELETE CASCADE,
    data_escala DATE NOT NULL,
    periodo TEXT NOT NULL DEFAULT 'integral' CHECK (periodo IN ('manha', 'tarde', 'noite', 'integral')),
    status_disponibilidade TEXT NOT NULL DEFAULT 'disponivel' CHECK (status_disponibilidade IN ('disponivel', 'indisponivel', 'parcial')),
    observacao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(voluntario_id, data_escala)
);

-- RLS
ALTER TABLE public.disponibilidades_voluntarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Disponibilidades são visíveis por todos os autenticados"
ON public.disponibilidades_voluntarios FOR SELECT TO authenticated USING (true);

CREATE POLICY "Disponibilidades podem ser criadas por autenticados"
ON public.disponibilidades_voluntarios FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Disponibilidades podem ser atualizadas por autenticados"
ON public.disponibilidades_voluntarios FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Disponibilidades podem ser excluídas por autenticados"
ON public.disponibilidades_voluntarios FOR DELETE TO authenticated USING (true);
