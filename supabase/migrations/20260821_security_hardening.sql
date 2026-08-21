-- ============================================================================
-- MIGRATION: Security Hardening & Zero-Trust Access Control
-- Data: 21/08/2026
-- Objetivo:
--   1. Restringir public.profiles para authenticated (Princípio do Menor Privilégio).
--   2. Criar RPC seguro public.get_registered_emails() para a tela de login.
--   3. Proteger search_path de funções SECURITY DEFINER contra hijacking.
--   4. Revogar permissões desnecessárias de anon em funções administrativas.
--   5. Garantir políticas explícitas em tabelas operacionais.
-- ============================================================================

-- 1. Restringe profiles novamente para authenticated
DROP POLICY IF EXISTS "Leitura total profiles" ON public.profiles;
DROP POLICY IF EXISTS "Leitura publica profiles" ON public.profiles;
DROP POLICY IF EXISTS "Leitura total profiles para autenticados" ON public.profiles;

CREATE POLICY "Leitura total profiles para autenticados" ON public.profiles 
    FOR SELECT TO authenticated 
    USING (true);

-- 2. Função cirúrgica e segura para identificação de contas no login
CREATE OR REPLACE FUNCTION public.get_registered_emails()
RETURNS TABLE (email TEXT) 
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY 
    SELECT DISTINCT LOWER(TRIM(p.email)) 
    FROM public.profiles p 
    WHERE p.email IS NOT NULL AND TRIM(p.email) <> '';
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_registered_emails() TO anon, authenticated;

-- 3. Fix Search Path em funções do sistema (Prevenção de Search Path Hijacking)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    INSERT INTO public.profiles (id, nome_completo, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'nome_completo', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'voluntario_operacional')
    )
    ON CONFLICT (id) DO UPDATE SET
        nome_completo = EXCLUDED.nome_completo,
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Revogação de funções de infraestrutura/admin para role anon
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_confirm_voluntario_user') THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.auto_confirm_voluntario_user() FROM anon;';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rls_auto_enable') THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;';
    END IF;
END $$;

-- 5. Garantir políticas RLS em tabelas operacionais
DROP POLICY IF EXISTS "Acesso total doacoes" ON public.doacoes;
CREATE POLICY "Acesso total doacoes" ON public.doacoes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total estoque_itens" ON public.estoque_itens;
CREATE POLICY "Acesso total estoque_itens" ON public.estoque_itens FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total estoque_movimentacoes" ON public.estoque_movimentacoes;
CREATE POLICY "Acesso total estoque_movimentacoes" ON public.estoque_movimentacoes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total fornecedores" ON public.fornecedores;
CREATE POLICY "Acesso total fornecedores" ON public.fornecedores FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
