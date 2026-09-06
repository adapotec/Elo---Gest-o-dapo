-- Migração para módulo de Reuniões, Pautas, Atas e Governança do Instituto Ádapo
-- Data: 2026-09-06

CREATE TABLE IF NOT EXISTS public.reunioes_institucional (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  horario_fim TIMESTAMP WITH TIME ZONE,
  duracao_estimada_min INTEGER DEFAULT 60,
  tipo VARCHAR(50) DEFAULT 'ordinaria',
  modalidade VARCHAR(20) DEFAULT 'presencial',
  local_reuniao TEXT DEFAULT 'Sede do Instituto Ádapo',
  link_virtual TEXT,
  pauta TEXT,
  pautas_topicos JSONB DEFAULT '[]'::jsonb,
  ata TEXT,
  deliberacoes TEXT,
  encaminhamentos JSONB DEFAULT '[]'::jsonb,
  participantes TEXT[] DEFAULT '{}',
  presentes TEXT[] DEFAULT '{}',
  ausentes TEXT[] DEFAULT '{}',
  secretario TEXT,
  presidente TEXT,
  status VARCHAR(30) DEFAULT 'agendada',
  projeto_id UUID REFERENCES public.projetos_sociais(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar colunas se a tabela já existia anteriormente
ALTER TABLE public.reunioes_institucional
  ADD COLUMN IF NOT EXISTS horario_fim TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS duracao_estimada_min INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS modalidade VARCHAR(20) DEFAULT 'presencial',
  ADD COLUMN IF NOT EXISTS link_virtual TEXT,
  ADD COLUMN IF NOT EXISTS pautas_topicos JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS deliberacoes TEXT,
  ADD COLUMN IF NOT EXISTS encaminhamentos JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS presentes TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ausentes TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS secretario TEXT,
  ADD COLUMN IF NOT EXISTS presidente TEXT,
  ADD COLUMN IF NOT EXISTS projeto_id UUID REFERENCES public.projetos_sociais(id) ON DELETE SET NULL;

-- Índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_reunioes_institucional_data_hora ON public.reunioes_institucional(data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_reunioes_institucional_projeto_id ON public.reunioes_institucional(projeto_id);
CREATE INDEX IF NOT EXISTS idx_reunioes_institucional_status ON public.reunioes_institucional(status);

-- Habilitar RLS
ALTER TABLE public.reunioes_institucional ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para usuários autenticados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reunioes_institucional' AND policyname = 'reunioes_institucional_select_policy'
  ) THEN
    CREATE POLICY reunioes_institucional_select_policy ON public.reunioes_institucional
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reunioes_institucional' AND policyname = 'reunioes_institucional_all_policy'
  ) THEN
    CREATE POLICY reunioes_institucional_all_policy ON public.reunioes_institucional
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
