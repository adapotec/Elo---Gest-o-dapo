-- Adiciona colunas para Descrição/Observações e Roteiro/Legenda nos conteúdos de comunicação
ALTER TABLE public.conteudos_comunicacao 
ADD COLUMN IF NOT EXISTS observacoes TEXT,
ADD COLUMN IF NOT EXISTS roteiro_legenda TEXT;
