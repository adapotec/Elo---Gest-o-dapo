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
- **Estilo de Fundo Padrão**: **Estilo Trello (`data-bg-style="imersivo"`)** é o tema inicial padrão do sistema para novos usuários/sessões, com fundo vibrante e cards em relevo.
- Ícones: **Lucide React** exclusivamente. Nunca usar emojis em controles de UI.
- Fontes: Inter (corpo), Plus Jakarta Sans (display), IBM Plex Mono (dados)
- Dark mode obrigatório via `data-theme="dark"` com tokens semânticos

### R2 — Banco de Dados
- Supabase Project ID: `jkpmioffpsdcoitgghyo`
- Região: `sa-east-1` (São Paulo)
- Postgres: v17.6 (27 tabelas ativas no schema `public`)
- RLS obrigatório em todas as tabelas (padronizado para `public` `FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)` em tabelas operacionais)
- **Índices de Foreign Key**: Todas as colunas de FK (`projeto_id`, `beneficiario_id`, `voluntario_id`, etc.) possuem índices B-Tree para evitar Full Table Scans
- **Consultas Defensivas**: Utilizar sempre `.maybeSingle()` em buscas de registro único no client Supabase para evitar erros HTTP 406 (PGRST116) quando houver 0 registros
- Lote de estoque: gerado via `BIGSERIAL` (automático)
- `created_at` e `updated_at` em todas as tabelas com dados operacionais
- **Beneficiários (Crianças)**: Campos `cpf`, `cep`, `rua`, `numero`, `bairro`, `cidade`, `uf`, `telefone`, `escolaridade` são **opcionais** (adaptação para público infantil). Colunas dedicadas: `genero`, `nome_responsavel`, `telefone_responsavel`, `parentesco_responsavel`
- **160 crianças importadas** do CSV histórico com normalização automática (nomes capitalizados, telefones com DDD 98, regiões: Novo Angelim, Vila Sapo, Angelim Velho, Alto do Angelim)

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

### 2026-08-19 — `[UI/UX] & [DESIGN SYSTEM] & [REFACTOR]` 🔴 CRÍTICO

**Padronização Integral de UI/UX entre `/pedagogia` e `/projetos`, Redução de Carga Cognitiva e Design System v2.0**

1. **Atualização Oficial do `desing.md` (v2.0)**:
   - Especificação do padrão de arquitetura em 3 blocos para páginas complexas: Cabeçalho com Seletor Global Ativo, Barra de Navegação por Áreas (Tabs Bento) e Sub-navegação em Pílulas.
   - Padrão de **Cards Salvos com Accordion Inteligente** para visualização compacta sem poluição visual.
   - Padrão de **Papel Timbrado Oficial (`PapelTimbradoModal.tsx`)** para devoluções à família, planos de aula e relatórios técnicos.
   - Padrão de **Banners de Salvamento com Alto Contraste** (`bg-emerald-600 text-white font-bold`).

2. **Otimização e Harmonização da Página de Pedagogia (`/dashboard/pedagogia`)**:
   - **Seletor Global de Projeto no Cabeçalho**: Permite ao gestor pedagógico alternar o projeto ativo a qualquer momento, atualizando reativamente todas as 4 sub-telas (*Frequência, Dossiê, Socioemocional, Planos de Aula*).
   - **Acompanhamento Socioemocional (`PedagogiaSocioemocional.tsx`)**:
     - Sub-navegação em pílulas dividindo **Fichas Cadastradas** (consulta de fichas do projeto, atalho para Devolutiva em PDF timbrado, edição rápida e exclusão) e **Preencher / Editar Ficha** (formulário focado nos 4 eixos).
     - Integração do seletor de "Responsável pelo Preenchimento" com a lista de voluntários cadastrados da pedagogia + suporte a nome customizado/externo.
     - Campo do Eixo 4 identificado explicitamente com badge `[Exibido na Devolutiva Timbrada]`.
   - **Planos de Aula & Metodologia (`PedagogiaPlanosAula.tsx`)**:
     - Cards salvos redesenhados no formato compacto com **Accordion Inteligente** para expandir dinâmicas, mediadores e metas sob demanda sem poluição visual.
     - Modal de edição harmonizado com tipografia, espaçamentos e paleta Ádapo.
   - **Frequência & Presença (`PedagogiaFrequencia.tsx`)**:
     - Banners de feedback atualizados com contraste sólido e alta legibilidade.

3. **Integração dos Dados Reais da Pedagogia na Aba `/dashboard/projetos/[id]`**:
   - Removido o banner legado de "## Em Construção ##" e os componentes placeholder.
   - Integrados os 4 componentes oficiais com dados vivos do projeto (`PedagogiaPlanosAula`, `PedagogiaSocioemocional`, `PedagogiaFrequencia` e `PedagogiaDossie`).
   - Adicionada barra de navegação Bento interna com 4 sub-abas, cabeçalho temático com avatar do projeto e resumo em pílulas numéricas (`Inscritos`, `Encontros`, `Metas`, `Planos de Aula Vinculados`).

4. **Saneamento e Conexão de Dados Reais no Painel Inicial (`/dashboard`)**:
   - **Próximas Atividades do Instituto**: Substituídos os cards estáticos/hardcoded por consulta real à tabela `acoes_projeto` com join em `projetos_sociais` (data, horário, nome da oficina e cor de identificação).
   - **Alertas Operacionais**: Conectados aos dados reais do banco (estoque crítico `<= 10`, requisições pendentes em `requisicoes_material`, volume de fichas socioemocionais do mês vigente e projetos em fase de planejamento).
   - **Histórico & Avisos Recentes**: Montagem dinâmica baseada nos últimos registros de `beneficiarios`, `doacoes` e `acoes_projeto`.

---

### 2026-08-19 — `[UI/UX] & [DESIGN SYSTEM] & [REFACTOR]` 🔴 CRÍTICO

**Auditoria Completa de UI/UX, Divulgação Progressiva e Padronização Geométrica Soft Bento**

1. **Atualização Oficial do `desing.md` (v1.0)**:
   - Consolidação das regras de **Divulgação Progressiva** e **Lei de Miller** (máximo de 5 a 9 blocos visíveis).
   - Definição do sistema geométrico **Soft Bento Institucional**: painéis com `rounded-2xl`, cards/tabelas/modais com `rounded-xl`, inputs/botões com `rounded-xl` e badges com `rounded-full`/`rounded-lg`.
   - Regras de contraste tipográfico (mínimo Slate-600 para textos secundários) e profundidade tridimensional em 4 camadas (Z-axis).
   - Criação do **Check-up Rápido de Tela** para auditorias de interface.

2. **Reformulação do Componente de Dicas de Tela (`FieldInfo.tsx`)**:
   - Ícone SVG oficial `HelpCircle` da biblioteca Lucide React (eliminando emojis).
   - Abertura suave no **hover** (transição de opacidade/cor de 150-200ms com zero layout shift) e suporte a clique em dispositivos touch.
   - Camada flutuante com `z-[100]`, fundo `#2B2118`, tipografia nítida e sombra profunda `shadow-2xl`.

3. **Padronização Geométrica dos Componentes Base**:
   - `Button.tsx`, `Input.tsx` e `Select.tsx` atualizados para a geometria padronizada `rounded-xl`.

4. **Auditoria e Reestruturação das Rotas de Projetos**:
   - **Listagem (`/dashboard/projetos/page.tsx`)**: Inclusão de 4 cards de métricas KPI com tooltips `FieldInfo`, barra de busca com raios harmonizados e espaçamento respirável.
   - **Criação (`/dashboard/projetos/novo/page.tsx`)**: Textos longos convertidos em `FieldInfo`, formulário organizado em 4 blocos semânticos e geometria `rounded-xl` consistente.
   - **Detalhe do Projeto (`/dashboard/projetos/[id]/page.tsx`)**: Sub-aba Diagnóstico reestruturada em **3 cartões temáticos equilibrados**, substituindo a lista vertical densa por campos agrupados com tooltips contextuais.

---

### 2026-08-18 — `[RECURSO] & [UX/UI] & [REFACTOR]` 🔴 CRÍTICO

**Centralização da Gestão de Ações em Projetos e Visualização Integral de Metas em Planos de Aula**

1. **Centralização da Gestão de Ações na Equipe de Gestão de Projetos**:
   - Removida a segmentação/categorização "Pedagogia" vs "Projetos" e o filtro segmented control da barra de ações em `/dashboard/projetos/[id]`.
   - Todas as ações cadastradas no cronograma agora são tratadas como pertencentes ao fluxo unificado de gestão do projeto.
   - Removido o botão de redirecionamento para o módulo de Pedagogia nos cards de ação.
   - Todos os cards agora contam com o botão universal **"Programação"** (com indicador de quantidade de dinâmicas programadas) e opção de exportação em PDF timbrado.
   - Ações que possuem plano de aula vinculado na pedagogia recebem badge informativa sutil `Plano de Aula`.

2. **Visualização Completa e Sem Truncamento de Metas nos Planos de Aula (`PedagogiaPlanosAula.tsx`)**:
   - Substituído o elemento `<select>` nativo do HTML (que cortava as descrições das metas com reticências) por um seletor visual customizado com dropdown expansível.
   - Tanto no estado fechado quanto nas opções disponíveis para escolha, o texto completo de cada meta é exibido em múltiplas linhas (`whitespace-normal`), permitindo leitura 100% integral dos objetivos pactuados.

---

### 2026-08-18 — `[RECURSO] & [BUGFIX] & [INTEGRAÇÃO]` 🔴 CRÍTICO

**Simplificação de Cadastro de Ações, Integração de Planos de Aula Pedagógicos e Sincronização com Programação de Projetos**

1. **Simplificação do Modal de Cadastro de Ação no Cronograma (Fix Erro HTTP 400)**:
   - Form em `/dashboard/projetos/[id]` reduzido estritamente para 3 campos: **Nome da Ação**, **Data e Horário** e **Descrição**.
   - Removido o envio indevido de `meta_id` e `justificativa_meta_acao` no payload raiz do insert REST da tabela `acoes_projeto` (que causava o erro 400 Bad Request devido à ausência dessas colunas na tabela).
   - Validação executada via MCP/Node.js confirmando retorno `201 Created` no Supabase.

2. **Reestruturação Completa de Planos de Aula no Módulo de Pedagogia (`PedagogiaPlanosAula.tsx`)**:
   - Vínculo direto e dinâmico com as ações cadastradas em `acoes_projeto`.
   - Estrutura completa de atividades socioeducativas: **Título**, **Mediador / Oficineiro** (seletor de voluntários cadastrados + opção personalizada), **Descrição em texto corrido**, **Materiais Necessários** e **Meta do Projeto Vinculada**.
   - Campo de Observações Gerais e Avaliação do Encontro.
   - Exportação e visualização em **Papel Timbrado Oficial do Instituto Ádapo** sem nenhum emoji (apenas ícones Lucide).

3. **Sincronização de Pedagogia com a Grade de Programação de Projetos**:
   - Botão **"Visualizar Plano de Aula"** posicionado na barra da grade de programação, abrindo o modal com o **Papel Timbrado do Plano de Aula** da pedagogia vinculado àquela ação.
   - Em cada linha da grade: inclusão de campo de descrição detalhada e menu **"Importar da Pedagogia"** que preenche automaticamente título, descrição, materiais e mediadores.
   - **Vínculo Múltiplo de Metas**: O gestor agora pode vincular múltiplas metas a uma ação, com campos individuais de justificativa e botão **"Importar Metas da Pedagogia"** para pré-carregar as metas trabalhadas nas atividades pedagógicas.

4. **Correção de Leitura de Metas**:
   - `Pedagogia` e `Projetos` padronizados para resolver metas priorizando `descricao_meta || descricao || texto`.

---

### 2026-08-18 — `[RECURSO] & [MIGRAÇÃO] & [BUGFIX]` 🔴 CRÍTICO

**Módulo Pedagógico Unificado, Importação de Beneficiários (Crianças), RLS Fix & Filtros Avançados**

1. **Unificação Visual do Módulo Pedagógico**:
   - Refatorados 5 componentes pedagógicos (`PedagogiaFrequencia.tsx`, `PedagogiaDossie.tsx`, `PedagogiaPlanosAula.tsx`, `PedagogiaSocioemocional.tsx` e `page.tsx`) para visual unificado com container padrão `rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)]`.

2. **Adaptação de Beneficiários para Crianças & Adolescentes**:
   - Formulários de criação (`/novo`) e edição (`/[id]`) adaptados com seções: Dados da Criança/Adolescente, Responsável Legal, e Endereço/Território.
   - Campos adultos (`CPF`, `profissão`) tornados opcionais; escolaridade reformulada para faixas infantis (Educação Infantil, Fundamental I/II, Médio).
   - Novos campos: `genero`, `nome_responsavel`, `parentesco_responsavel`, `telefone_responsavel`.

3. **Importação em Lote de 160 Crianças do CSV Histórico**:
   - Script `scripts/importar-criancas.js` criado para normalizar e importar dados do arquivo `BANCO DE DADOS DAS CRIANÇAS - Dados Totais.csv`.
   - Normalização: nomes capitalizados, telefones com DDD `98`, datas de nascimento estimadas por idade, ruas e números separados, regiões mapeadas (Novo Angelim, Vila Sapo, Angelim Velho, Alto do Angelim).
   - 100% dos 160 registros inseridos com sucesso via API REST do Supabase.

4. **Correção de RLS via MCP Supabase (Resolução do 403 Forbidden)**:
   - Identificado que políticas `TO authenticated` bloqueavam requisições feitas com `anon key` sem sessão JWT.
   - Migração `fix_rls_and_adapt_beneficiarios_tables` aplicada via MCP liberando 8 tabelas operacionais (`inscricoes`, `projetos_sociais`, `acoes_projeto`, `beneficiarios`, `frequencias_acao`, `acompanhamento_socioemocional`, `planos_aula`, `planos_oficina`, `alocacoes_voluntarios`) para `TO anon, authenticated`.
   - Adaptação DDL: campos NOT NULL de documentos adultos convertidos para nullable na tabela `beneficiarios`.

5. **Filtros Avançados & Paginação na Listagem de Beneficiários**:
   - Pílulas de filtro por território/comunidade com contadores em tempo real.
   - Filtros por faixa etária (0-5 / 6-10 / 11-15), gênero (M/F) e status.
   - Paginação completa: seletor de itens por página (15/30/50/100), navegação com indicador (`Exibindo 1 a 15 de 160 crianças`).
   - Coluna de idade com `whitespace-nowrap` e largura fixa `110px` eliminando quebra de linha.
   - `DataTable.tsx` aprimorado com suporte a `width`, `className` e `headerClassName` por coluna.

6. **Correção de Assets de Logo (Eliminação de 404 no Console)**:
   - Arquivos de logo renomeados para nomes URL-safe sem acentos ou espaços:
     - `ELO Social - Gestão Ádapo.svg` → `elo-social-gestao-adapo.svg`
     - `logo branca sem fundo ádapo.png` → `logo-branca-sem-fundo.png`
     - `log preta sem fundo.png` → `logo-preta-sem-fundo.png`
   - Criado `logo-favicon.png` (cópia de `logo-branca-com-fundo-laranja.png`).
   - Referências atualizadas em `Sidebar.tsx`, `dashboard/page.tsx`, `login/page.tsx` e `layout.tsx`.

---

### 2026-08-17 — `[RECURSO] & [REFACTOR]` 🔴 CRÍTICO

**Execução, Monitoramento e Relatórios Técnicos de Projetos Sociais (`/dashboard/projetos/[id]`)**

1. **Registros de Ações do Projeto (Layout Minimalista & Filtros)**:
   - Layout redesenhado em formato minimalista e de alta legibilidade, eliminando poluição visual.
   - **Filtro Padrão por Mês Vigente**: Exibição automática das ações do mês atual (`YYYY-MM`), com seletor de histórico de meses disponíveis, atalho para retorno ao mês vigente e opção "Todos os Meses".
   - **Segmented Control de Responsabilidade**: Filtro rápido por equipe (*Todos*, *Equipe de Projetos*, *Equipe de Pedagogia*).
   - **Busca Instantânea**: Campo de filtro em tempo real por título da ação ou meta vinculada.
   - Associação de metas pactuadas diretamente por ação (com justificativa de impacto) e badges institucionais (`FolderKanban` para Projetos e `GraduationCap` para Pedagogia).

2. **Relatórios Técnicos de Monitoramento & Avaliação (Padrão MROSC / Ádapo)**:
   - Wizard estruturado em 5 etapas com integração de IA para redação automática da Introdução Sumária e Conclusão Técnica.
   - **Simplificação da Etapa 2 (Introdução)**: Removido o checklist desnecessário de "Documentos & Evidências Avaliadas", concentrando o fluxo na contextualização e no gerador assistido por IA.
   - Avaliação qualitativa de atividades e dinâmicas com suporte a múltiplos planos de ação com prazo.
   - Frequência de beneficiários categorizada em 4 faixas (100%, 90-75%, 75-50%, 50-0%) e módulos de análise socioemocional e pesquisa de satisfação.
   - Avaliação de transparência ativa e prestação de contas institucional.

3. **Etapa 4: Avaliação do Cumprimento de Metas do Projeto**:
   - Hierarquia visual reformulada: destaque superior para o **Objetivo Estratégico** com badge e ícone `Compass`, e descrição em destaque da **Meta Pactuada**.
   - Chips informativos para Procedimento & Forma de Coleta (`FileText`) e Responsável Técnico (`Users`).
   - Seletor moderno de status (*Não Iniciada*, *Iniciada*, *Concluída*) através de botões segmentados com ícones Lucide (`XCircle`, `Clock`, `CheckCircle2`).
   - Card integrado de justificativa e plano de ação corretivo com prazo para metas não concluídas.

4. **Padronização Visual & Remoção Completa de Emojis**:
   - Varredura e eliminação de 100% dos emojis em toda a página de projetos, modais de programação, seleção e no **PapelTimbradoModal**, substituídos por ícones semânticos da biblioteca **Lucide React**.
   - Correção e alinhamento do timbrado institucional para evitar quebras inadequadas e manter cabeçalho/rodapé fixos.

---

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

*Última atualização: 2026-08-18 por Antigravity IDE*
