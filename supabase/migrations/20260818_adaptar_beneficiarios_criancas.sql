-- ============================================================================
-- MIGRATION: Adaptação da tabela beneficiarios para Crianças e Adolescentes
-- Data: 18/08/2026
-- ============================================================================

-- 1. Tornar campos de adultos/documentos opcionais para crianças
ALTER TABLE public.beneficiarios ALTER COLUMN cpf DROP NOT NULL;
ALTER TABLE public.beneficiarios ALTER COLUMN cep DROP NOT NULL;
ALTER TABLE public.beneficiarios ALTER COLUMN rua DROP NOT NULL;
ALTER TABLE public.beneficiarios ALTER COLUMN numero DROP NOT NULL;
ALTER TABLE public.beneficiarios ALTER COLUMN bairro DROP NOT NULL;
ALTER TABLE public.beneficiarios ALTER COLUMN cidade DROP NOT NULL;
ALTER TABLE public.beneficiarios ALTER COLUMN uf DROP NOT NULL;
ALTER TABLE public.beneficiarios ALTER COLUMN telefone DROP NOT NULL;
ALTER TABLE public.beneficiarios ALTER COLUMN escolaridade DROP NOT NULL;

-- 2. Adicionar novos campos específicos para o público infantil e seus responsáveis
ALTER TABLE public.beneficiarios ADD COLUMN IF NOT EXISTS genero TEXT;
ALTER TABLE public.beneficiarios ADD COLUMN IF NOT EXISTS nome_responsavel TEXT;
ALTER TABLE public.beneficiarios ADD COLUMN IF NOT EXISTS telefone_responsavel TEXT;
ALTER TABLE public.beneficiarios ADD COLUMN IF NOT EXISTS parentesco_responsavel TEXT;

-- 3. Atualizar política RLS para garantir acesso completo
DROP POLICY IF EXISTS "Acesso total beneficiarios" ON public.beneficiarios;
CREATE POLICY "Acesso total beneficiarios" ON public.beneficiarios FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
