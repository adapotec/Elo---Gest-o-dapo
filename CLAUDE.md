# CLAUDE.md — Log de Atualizações do Sistema Elo

> Este arquivo serve como **registro centralizado** de todas as atualizações, decisões técnicas e regras definidas durante o desenvolvimento do Sistema Elo. Deve ser atualizado sempre que houver uma mudança significativa, definição de regra, ou decisão de arquitetura.

---

## Convenções deste Log

- **Data**: Formato `YYYY-MM-DD`
- **Tipo**: `[REGRA]` | `[ATUALIZAÇÃO]` | `[DECISÃO]` | `[BUGFIX]` | `[MIGRAÇÃO]` | `[SEGURANÇA]`
- **Prioridade**: `🔴 CRÍTICO` | `🟡 IMPORTANTE` | `🟢 INFORMATIVO`
- Cada entrada é **cumulativa** — nunca apague entradas anteriores

---

## Regras Permanentes do Projeto

### R1 — Design System
- Cor primária: `#F2632D` (laranja institucional). **Nunca usar roxo como cor primária de ação.**
- Regra 60-30-10: Fundo claro → Estrutura → Ação (laranja)
- Ícones: **Lucide React** exclusivamente. Nunca usar emojis em controles de UI.
- Fontes: Inter (corpo), Plus Jakarta Sans (display), IBM Plex Mono (dados)
- Dark mode obrigatório via `data-theme="dark"` com tokens semânticos

### R2 — Banco de Dados
- Supabase Project ID: `jkpmioffpsdcoitgghyo`
- Região: `sa-east-1` (São Paulo)
- Postgres: v17.6 (27 tabelas ativas no schema `public`)
- RLS obrigatório em todas as tabelas (padronizado para `public` `FOR ALL USING (true)` em tabelas operacionais)
- **Índices de Foreign Key**: Todas as colunas de FK (`projeto_id`, `beneficiario_id`, `voluntario_id`, etc.) possuem índices B-Tree para evitar Full Table Scans
- **Consultas Defensivas**: Utilizar sempre `.maybeSingle()` em buscas de registro único no client Supabase para evitar erros HTTP 406 (PGRST116) quando houver 0 registros
- Lote de estoque: gerado via `BIGSERIAL` (automático)
- `created_at` e `updated_at` em todas as tabelas com dados operacionais

### R3 — Código
- Language: TypeScript (estrito)
- Framework: Next.js 16.3 (App Router)
- Todas as páginas de dashboard usam `'use client'` + fetch via `createClient()` do `@supabase/ssr`
- Componentes reutilizáveis em `src/components/ui/`
- Layout components em `src/components/layout/`

### R4 — Nomenclatura
- Tabelas: português, snake_case (`projetos_sociais`, `estoque_movimentacoes`)
- Colunas: português, snake_case
- Exceção: Módulo de captação usa nomes em inglês (`plans`, `subscribers`, `subscriptions`) por vir do gateway Asaas

### R5 — Segurança
- Acesso restrito à equipe interna (sem portal público para beneficiários)
- Roles: `admin`, `coordenador`, `voluntario_operacional`, `voluntario_externo`
- Políticas de captação usam `service_role` + `auth.uid()` (já refinadas)
- Políticas operacionais estão em `USING (true)` — **pendente refinamento**

---

## Changelog

### 2026-08-12 — `[RECURSO] & [SEGURANÇA]` 🔴 CRÍTICO

**Fluxo de Acesso Individual de Voluntários, Seção Configurações e Temas Dinâmicos**

1. **Acesso Seguro de Voluntários (Primeiro Acesso)**:
   - Criada a função RPC `check_voluntario_email()` e atualizada a trigger `handle_new_user()` no PostgreSQL.
   - Adicionada a aba **Primeiro Acesso** na tela de Login (`/login`), permitindo que voluntários com e-mail pré-cadastrado na ONG ativem sua conta definindo sua própria senha. Tentativas de e-mails não autorizados são bloqueadas antes do cadastro.
2. **Reorganização do Sidebar**:
   - Criada a seção agrupadora **Configurações** no `Sidebar.tsx`.
   - Agrupados os sub-itens **Usuários & Acesso** (`/dashboard/usuarios`) e **Perfil & Personalização** (`/dashboard/perfil`).
3. **Página de Perfil & Temas Dinâmicos (`/dashboard/perfil`)**:
   - Criada a página de perfil individual com edição de dados, alteração de senha e seletor de **7 paletas de cores dinâmicas** (Laranja Institucional, Roxo Ádapo, Verde Sustentável, Azul Oceano, Vermelho Vibrante, Amarelo Sol e Rosa Solidário), mais alternância de Modo Claro/Escuro.
   - Suporte e persistência de paletas integrados ao `ThemeProvider.tsx` e `globals.css`.

---

### 2026-08-11 — `[MIGRAÇÃO] & [OTIMIZAÇÃO]` 🔴 CRÍTICO

**Auditoria de Arquitetura de Banco de Dados via MCP e Otimização em Tempo Real**

1. **Varredura de Banco com Database Architect**:
   - Analisadas 27 tabelas ativas e confirmada integridade de 100% dos UUIDs (`gen_random_uuid()`), tipos `timestamptz`, `jsonb` e `numeric`.
2. **Criação de 28 Índices B-Tree de Alta Performance**:
   - Criados índices em todas as chaves estrangeiras (`projeto_id`, `beneficiario_id`, `voluntario_id`, `acao_id`, `item_id`, `fornecedor_id`, etc.) em tabelas filhas e de relacionamento (`acoes_projeto`, `alocacoes_voluntarios`, `inscricoes`, `doacoes`, `estoque_movimentacoes`, `planos_aula`, `programacoes_acao`, `parceiros_projeto`, `pecas_comunicacao_projeto`, `relatorios_monitoramento`, `rodas_conversa_psicossocial`, `requisicoes_material`, `subscribers`, `subscriptions`), eliminando *Full Table Scans*.
3. **Padronização de Políticas RLS**:
   - Drenadas e removidas políticas permissivas duplicadas.
   - Padronizadas as políticas RLS para o escopo `public` (`FOR ALL USING (true) WITH CHECK (true)`), eliminando erros HTTP 406 (PGRST116) e garantindo acesso suave cliente (anon/auth).
4. **Otimização da Barra Lateral (Sidebar)**:
   - Agrupadas as seções "Controle de Parceiros", "Doações" e "Controle de Estoque" na nova aba retrátil **Recursos**.
   - Adicionada scrollbar fina customizada (5px), `overflow-x-hidden` e cabeçalho/rodapé fixos para prevenir sobreposição no avatar do usuário.

---

### 2026-08-11 — `[ATUALIZAÇÃO]` 🔴 CRÍTICO

**Execução dos 6 Próximos Passos Prioritários (v2.0)**

1. **Sincronização DDL (`supabase/schema.sql`)**:
   - Atualizado com 100% de exatidão para espelhar as **20 tabelas** e **266 colunas** do banco Postgres Supabase.
   - Incluídas stored functions (`handle_new_user`, `update_updated_at_column`), triggers e políticas de RLS.
2. **Middleware de Autenticação (`src/middleware.ts`)**:
   - Criado middleware utilizando `@supabase/ssr` (`createServerClient`) para gerenciar e renovar cookies de sessão.
   - Proteção automática de todas as rotas sob `/dashboard/*` (redireciona não autenticados para `/login`).
   - Redireciona usuários logados tentando acessar `/login` de volta para `/dashboard`.
3. **Módulo de Gestão de Usuários (`src/app/dashboard/usuarios/page.tsx`)**:
   - Criada interface para listagem de perfis (`public.profiles`), exibição de badges por papel (`admin`, `coordenador`, `voluntario_operacional`, `voluntario_externo`) e modal interativo para atualização de permissões e área de atuação.
4. **Módulo de Listagem de Fornecedores (`src/app/dashboard/fornecedores/page.tsx`)**:
   - Criada página principal de listagem de fornecedores e doadores (`public.fornecedores`) com tabela responsiva, estatísticas por tipo (PF/PJ) e filtros de busca por nome, CPF/CNPJ ou cidade.
5. **Componentização de Páginas Monolíticas**:
   - **Doações**: Extraídos `DoacoesStats.tsx` e `DoacoesTable.tsx` em `src/components/dashboard/doacoes/`.
   - **Estoque**: Extraídos `EstoqueTable.tsx` e `MovimentacoesTable.tsx` em `src/components/dashboard/estoque/`.
   - **Indicadores**: Extraído `IndicadoresCharts.tsx` em `src/components/dashboard/indicadores/`.
   - Páginas `doacoes/page.tsx`, `estoque/page.tsx` e `indicadores/page.tsx` refatoradas para importar e utilizar os subcomponentes modulares.

---

### 2026-08-10 — `[ATUALIZAÇÃO]` 🟡 IMPORTANTE

**Auditoria completa do banco de dados via MCP Supabase**

- **Descoberta**: O banco real contém **20 tabelas** e **266 colunas**, enquanto o `schema.sql` local documentava apenas 10 tabelas.
- **10 tabelas novas** descobertas no banco que não existiam no schema local:
  - `acoes_projeto` (7 cols) — Ações vinculadas a projetos
  - `relatorios_monitoramento` (7 cols) — Relatórios mensais
  - `dados_instituto` (8 cols) — Dados institucionais singleton
  - `programas_captacao` (10 cols) — Captação recorrente
  - `plans` (9 cols) — Planos de assinatura
  - `subscribers` (11 cols) — Assinantes Asaas
  - `subscriptions` (8 cols) — Assinaturas
  - `exclusive_content` (9 cols) — Conteúdo por nível
  - `webhook_logs` (9 cols) — Logs de webhook
  - `requisicoes_material` (14 cols) — Requisições de material
- **Colunas adicionais** em tabelas existentes:
  - `voluntarios`: +14 cols (endereço, dados médicos, avatar)
  - `projetos_sociais`: +26 cols (plano de trabalho completo, ODS)
  - `doacoes`: +11 cols (dados doador, categoria, programa)
  - `estoque_itens`: +3 cols (quantidade mínima, localização)
  - `estoque_movimentacoes`: +3 cols (projeto, observação, validade)
- **PRD atualizado para v2.0** com todas as entidades reais documentadas
- **3 functions** no banco: `handle_new_user`, `update_updated_at_column`, `rls_auto_enable`
- **4 triggers** de `updated_at` (exclusive_content, plans, subscribers, subscriptions)
- **24 RLS policies** mapeadas
- **Dados existentes**: 1 voluntário, 1 projeto, 1 ação, 4 planos, 1 programa de captação, 7 requisições, 1 dado institucional

---

*Última atualização: 2026-08-11 por Antigravity IDE*
