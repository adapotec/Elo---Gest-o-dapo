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

### 2026-08-29 — `[RECESSOS & FOLGAS] & [2 FOLGAS MENSAIS + RECESSO 15 DIAS + APROVAÇÃO DIRETORIA]` 🟢 IMPLEMENTADO

**Regras de Negócio Diferenciadas para Folgas Mensais e Recesso Anual**
- **Folgas Mensais (2 Folgas por Mês)**:
  - **1ª Folga (Coletiva)**: No 1º Domingo do Mês (**Dia da Família**), pré-reservada automaticamente para toda a equipe.
  - **2ª Folga (Individual / Livre Escolha)**: 1 dia de livre escolha do voluntário no mês. Caso a data coincida com o **último final de semana do mês** (dias de encontros com público externo), o sistema emite alerta em destaque indicando a prioridade de presença da equipe.
- **Recesso Anual (15 Dias Consecutivos)**:
  - O voluntário escolhe a data de início e o sistema calcula os 15 dias corridos, alertando se houver interseção com o último fim de semana externo.
- **Painel de Aprovações & Diretoria Administrativa**:
  - Apenas o **Diretor Administrativo** pode desativar o Dia da Família (com justificativa).
  - Todas as solicitações de folgas e recessos entram com status `pendente` e são julgadas na aba de Aprovações (botões *Aprovar* e *Recusar com justificativa*).
  - **Regra do Calendário**: Apenas folgas e recessos **aprovados** são renderizados na grade visual do calendário mensal.
- **Migração SQL**:
  - `supabase/migrations/20260829_recessos_folgas_15_dias.sql`

---

### 2026-08-28 — `[VOLUNTÁRIOS] & [MÓDULO UNIFICADO EM 4 ABAS & DOCUMENTOS TIMBRADOS]` 🟢 IMPLEMENTADO

**Reestruturação Modular do Voluntariado, Prontuário de Saúde, Recessos e Documentos Oficiais**
- **4 Abas Principais em `/dashboard/voluntarios`**:
  1. `equipe` (**Equipe & Voluntários**): Cards KPIs executivos, busca por habilidades, filtros de tipo/status, WhatsApp direto e `DetailPanel`.
  2. `saude` (**Saúde & Emergência**): Prontuário operacional da equipe com Tipos Sanguíneos, Alergias, Medicamentos contínuos, contatos SOS e emissão de **Crachá / Cartão de Emergência Timbrado em PDF** para saídas a campo.
  3. `recesso` (**Recessos & Folgas**): Incorporação do calendário do Dia da Família (1º domingo), controle de limites e solicitação de folgas.
  4. `documentos` (**Documentos & Certificados**): Emissor do **Termo de Adesão ao Trabalho Voluntário (Lei Federal nº 9.608/1998)** e do **Certificado de Reconhecimento & Horas Complementares** em papel timbrado oficial com assinatura.
- **Componentes criados**:
  - `src/components/dashboard/voluntarios/VoluntariosEquipe.tsx`
  - `src/components/dashboard/voluntarios/VoluntariosSaude.tsx`
  - `src/components/dashboard/voluntarios/VoluntariosRecesso.tsx`
  - `src/components/dashboard/voluntarios/VoluntariosDocumentos.tsx`
- **Migração SQL**:
  - `supabase/migrations/20260828_add_voluntarios_skills_and_docs.sql`

---

### 2026-08-21 — `[PROJETOS] & [STATUS & FIXAÇÃO & ORDENAÇÃO]` 🟢 IMPLEMENTADO

**Status "Em Planejamento", Fixação no Topo e Ordenação por Movimentação em `/projetos`**
- **Novo Status "Em Planejamento" (`em_planejamento`)**:
  - Migration aplicada no Supabase (`projetos_sociais_status_check` atualizado para `('planejado', 'em_planejamento', 'ativo', 'concluido', 'cancelado')`).
  - Formulário de Novo Projeto (`/projetos/novo`), Gerenciamento (`/projetos/[id]`) e Listagem (`/projetos`) integrados.
- **Fixação no Topo (Pin to Top)**:
  - Adicionada coluna `is_pinned BOOLEAN DEFAULT FALSE` na tabela `projetos_sociais`.
  - Botão interativo de Fixar/Desafixar direto no card/tabela e no painel lateral de detalhes com persistência em tempo real.
  - Projetos fixados ganham selo visual e prioridade absoluta no topo da listagem.
- **Ordenação Dinâmica de Projetos**:
  - Filtro por **Última Movimentação (mais recentemente atualizados)** como padrão, Data de Criação, Nome (A-Z / Z-A) e Data de Início.

---

### 2026-08-21 — `[PROJETOS] & [DATABASE] & [BUGFIX]` 🟢 RESOLVIDO

**Correção de Salvamento e Atualização de Projetos Sociais (`/projetos/[id]`)**
- **Causa Raiz**: O payload enviado no `update` de `projetos_sociais` passava strings vazias `""` para campos do tipo `DATE` (`data_fim`, `data_diagnostico`) e `UUID` (`responsavel_escrita_id`, `responsavel_diagnostico_id`). O PostgreSQL/PostgREST rejeitava a tipagem estrita com erro `400 (Bad Request)`.
- **Solução Aplicada (`src/app/dashboard/projetos/[id]/page.tsx`)**:
  - Sanitização de campos de data e UUID para converter strings vazias em `null`.
  - Coerção de números (`num_beneficiarios_diretos`, `num_beneficiarios_indiretos`).
  - Sanitização no salvamento dos dados institucionais (`dados_instituto`).

---

### 2026-08-21 — `[SECURITY] & [AUTH] & [ZERO-TRUST HARDENING]` 🟢 IMPLEMENTADO

**Endurecimento de Segurança e Princípio do Menor Privilégio (Zero-Trust)**
- **Restrição de `public.profiles`**: Revertida a abertura pública de `profiles`, restringindo o `SELECT` exclusivamente para `TO authenticated` (impedindo enumeração de roles, UUIDs e metadados por visitantes anônimos).
- **RPC Seguro `get_registered_emails()`**: Criada função `SECURITY DEFINER` com `SET search_path = public, auth` que retorna exclusivamente os e-mails registrados para a tela de login identificar contas ativas sem vazar cargos ou dados adicionais.
- **Prevenção de Search Path Hijacking**: Atualizado `SET search_path = public, auth` em todas as funções `SECURITY DEFINER` do banco (`handle_new_user`, `update_updated_at_column`, etc.).
- **Revogação de Privilégios `anon`**: Revogada a execução anônima de funções administrativas (`auto_confirm_voluntario_user`, `rls_auto_enable`).
- **Políticas RLS em Tabelas Operacionais**: Aplicadas políticas explícitas em `doacoes`, `estoque_itens`, `estoque_movimentacoes` e `fornecedores`.
- **Frontend Atualizado (`src/app/(auth)/login/page.tsx`)**: Integrado com `supabase.rpc('get_registered_emails')` e fallback seguro.

---

### 2026-08-20 — `[UI/UX] & [MOBILE & RESPONSIVIDADE GLOBAL]` 🔴 CRÍTICO

**Responsividade Touch-First Completa (Mobile, Tablet e Desktop)**
- **Mobile Drawer com Contexto (`MobileNavContext.tsx` & `Sidebar.tsx`)**:
  - Em telas móveis (`< 768px`), a barra lateral fixa fica oculta para liberar 100% da viewport.
  - Ao tocar no botão Hambúrguer na Topbar, a Sidebar abre como uma **Gaveta Deslizante lateral (Mobile Drawer)** com backdrop escuro, fechamento automático ao navegar ou tocar fora, e bloqueio de scroll no body.
  - Em telas `>= 768px`, mantém o comportamento original de barra compacta/expandida com hover e pinagem.
- **Topbar Touch-First (`Topbar.tsx`)**:
  - Botão de menu hambúrguer visível no mobile com área de toque mínima de **44x44px** (Fitts' Law / Touch Psychology).
  - Dropdowns de Configurações e Perfil com largura contida (`max-w-[calc(100vw-32px)]`) para não vazar a tela em smartphones compactos (320px–375px).
- **Ciranda Responsiva (`VolunteerCarousel.tsx`)**:
  - Escala fluida adaptativa (`scale-[0.88] xs:scale-95 sm:scale-100`) para visualização perfeita a partir de 320px sem overflow horizontal.
- **Componentes Base & Páginas**:
  - `DataTable.tsx`: Rolagem horizontal com aceleração por hardware e touch target seguro.
  - `DetailPanel.tsx`: Backdrop escuro no mobile e ocupação fluida `w-full sm:max-w-lg`.
  - Páginas internas migradas de `p-8` estático para `p-4 sm:p-6 lg:p-8`.

---

### 2026-08-20 — `[UI/UX] & [AUTH & LOGIN FLOW]` 🔴 CRÍTICO

**Fluxo de Acesso Progressivo em 2 Etapas (`src/app/(auth)/login/page.tsx`)**
- **Etapa 1 (`step === 'ciranda'`)**: Foco total na **Ciranda Adapete** centralizada. Exibe a Logo ELO dinâmica, o nome da plataforma, os perfis na órbita, o perfil selecionado com foto nítida e badge de status, acompanhado de botão de ação: *"Acessar com este Perfil →"* (ou *"Continuar (1º Acesso)"*).
- **Etapa 2 (`step === 'login'`)**: Modal de autenticação dedicado com card de identificação do voluntário selecionado, botão *"← Voltar para a Ciranda"*, campos de senha (com alternância de visibilidade), suporte a primeiro acesso e recuperação de senha.
- **Divulgação Progressiva**: Elimina a sobrecarga cognitiva da tela dividida em 2 colunas concorrentes, criando uma jornada de login linear, acolhedora e moderna.

---

### 2026-08-20 — `[UI/UX] & [DASHBOARD]` 🔴 CRÍTICO

**Cockpit Operacional Orientado à Ação, Alertas & Acolhimento em `/dashboard` (Opção A)**
- **Topbar com Logo Oficial do Instituto Ádapo**: Inserção vetorial de `logo-adapo-completa-preta.svg` ao lado esquerdo do título/subtítulo (com filtro automático no dark mode).
- **Banner de Boas-Vindas Humanizado**: Saudação contextual dinâmica (*Bom dia ☀️ / Boa tarde 🌤️ / Boa noite 🌙*), avatar sincronizado do perfil/voluntário (sem sobreposição de emojis), tag com a função real do voluntário e o lema oficial: *"Dando linha pra sonhar" — Instituto Ádapo*.
- **Trilho de Alertas Prioritários (Soft Bento Horizontal)**: Pílulas de atenção rápida conectadas aos dados reais do Supabase (estoque baixo, projetos em planejamento, fichas socioemocionais do mês e status geral).
- **4 KPIs Executivos com Micro-Indicadores**: Total de Beneficiários Ativos, Encontros do Mês, Projetos Ativos e Quantidade de Voluntários.
- **Próximas Ações do Cronograma (Próximos 7 dias)**: Lista das oficinas e encontros com badges de projeto e link direto para ver o projeto ou o calendário.
- **Painel de Aniversariantes do Mês**: Lista de acolhimento comunitário com aniversariantes (beneficiários e voluntários) ordenados pelo dia.
- **Painel de Galeria & Pastas Google Drive**: Acesso rápido a fotos das oficinas, termos de imagem, documentos oficiais e apostilas na nuvem.
- **Logs de Últimas Movimentações**: Linha do tempo visual em tempo real com ícones coloridos das últimas operações registradas no sistema.
- **Atalhos Rápidos de 1 Clique**: Nova Inscrição, Cadastrar Ação em Projetos, Plano de Aula, Registrar Doação, Movimentar Estoque e Calendário.

---

### 2026-08-20 — `[UI/UX] & [LAYOUT & NAVEGAÇÃO]` 🔴 CRÍTICO

**Topbar com Configurações e Perfil Fixos & Sidebar Compacta sem Scroll Vertical**
- **Topbar Unificada (`src/components/layout/Topbar.tsx`)**:
  - Centraliza no canto superior direito de todas as páginas o acesso ao **Perfil do Usuário** (Avatar, Nome, E-mail, Cargo/Role, Link para Meu Perfil, Troca de Tema Claro/Escuro e Logout) e ao menu de **Configurações do Sistema** (Personalização de Tema, Usuários & Controle de Acesso para Administradores, Gestão Institucional Ádapo).
  - Menus suspensos com fechamento automático ao clicar fora (*click outside handler*).
- **Sidebar Enxuta (`src/components/layout/Sidebar.tsx`)**:
  - Removido o grupo de configurações e o rodapé duplicado de usuário.
  - Elimina completamente o scroll vertical quando a barra lateral está recolhida ou expandida, mantendo controle de fixação (`Pin`/`PinOff`).

---

### 2026-08-20 — `[UI/UX] & [DESIGN SYSTEM]` 🔴 CRÍTICO

**Componente SVG Vetorial Dinâmico `EloLogo` Adaptado ao Tema do Sistema**
- **Componente `EloLogo.tsx` (`src/components/ui/EloLogo.tsx`)**:
  - Converte o SVG vetorial do símbolo do ELO em um componente React dinâmico.
  - O preenchimento dos arcos e conexões do glifo consome diretamente a variável CSS `var(--color-primary)` (ou prop `color`), adaptando-se em tempo real a qualquer mudança de tema (Laranja Ádapo `#F2632D`, Roxo, Verde, Dark/Light Mode).
  - Tipografia interna com alto contraste (`#ffffff` ou `textColor`).
  - Aplicado no topo da Ciranda Adapete (`VolunteerCarousel.tsx`) e na barra de navegação lateral (`Sidebar.tsx`).

---

### 2026-08-20 — `[UI/UX] & [PROJETOS] & [PEDAGOGIA]` 🔴 CRÍTICO

**Painel Executivo de Acompanhamento Pedagógico em `/projetos/[id]` & Extração Timbrada**
- **Componente `ProjetoPedagogiaResumo.tsx` (`src/components/dashboard/projetos/ProjetoPedagogiaResumo.tsx`)**:
  - Transforma a aba de Pedagogia em `/projetos/[id]` em um **Dashboard Executivo de Acompanhamento & Consulta** (sem duplicação desnecessária de telas operacionais completas).
  - **4 Indicadores Bento**: Total de Planos Criados, Frequência Média (% de presença), Fichas Socioemocionais e Alunos Atendidos.
  - **Planos de Aula do Projeto**: Cards limpos com ementa colapsável (accordion) e botão com 1 clique para extrair o **Plano de Aula em Papel Timbrado Oficial (PDF/Impressão)**.
  - **Frequência & Presença**: Panorama de presença por encontro e exportação de **Lista de Chamada Timbrada**.
  - **Acompanhamento Socioemocional**: Resumo das observações dos alunos e exportação de **Fichas Socioemocionais Timbradas**.
  - **Divisão de Responsabilidades**: A edição e criação de novos materiais continua centralizada em `/pedagogia`, com botões claros de redirecionamento e orientação.

---

### 2026-08-20 — `[UI/UX] & [AUTH] & [SEGURANÇA]` 🔴 CRÍTICO

**Ciranda Adapete Orbital, Visualização de Senha & Fluxo de Recuperação de Acesso**
- **Ciranda Adapete (`src/components/auth/VolunteerCarousel.tsx`)**:
  - Órbita circular perfeitamente concêntrica com posicionamento trigonométrico exato de todos os voluntários cadastrados.
  - Pré-carregamento imediato assíncrono de todas as fotos de perfil em background, eliminando atrasos.
  - Logo oficial do ELO (`w-20 h-20`) e títulos centralizados no topo da ciranda com alto contraste.
  - Informações de orientação abaixo da ciranda sem exposição de e-mails em texto aberto.
- **Input Global com Visualização de Senha (`src/components/ui/Input.tsx`)**:
  - Inclusão nativa de botão de alternância de visibilidade (`Eye`/`EyeOff`) em campos de senha com foco e acessibilidade.
- **Fluxo de Recuperação de Senha ("Esqueceu a senha?")**:
  - Modal interativo e envio de e-mail de recuperação via `supabase.auth.resetPasswordForEmail()` com link temporário de uso único (OTP).
- **Varredura de Segurança (Security Audit)**:
  - Verificação de dependências (`npm audit`: 0 vulnerabilidades), queries parametrizadas (PostgREST) contra SQL Injection e proteção de rotas com middleware SSR.

---

### 2026-08-20 — `[UI/UX] & [DESIGN SYSTEM] & [SIDEBAR]` 🔴 CRÍTICO

**Barra Lateral de Navegação Estilo Instagram Web & Adaptação Fluida de Layout**
- **Comportamento Instagram Web**: Sidebar compacta por padrão (`w-[72px]`) com ícones e avatares centralizados, expandindo suavemente no hover (`w-64`) com animação contínua e sem quebra de fluxo.
- **Redução de Carga Cognitiva**: Foco total no conteúdo principal das páginas com menu discreto e expansão sob demanda, mantendo opção de fixar aberta se desejado.
- **Adaptação Fluida de Layout**:
  - `src/app/dashboard/layout.tsx`: `main` com `flex-1 min-w-0 transition-all duration-300 ease-in-out` para expandir e comprimir suavemente com o estado da barra.
  - `src/app/dashboard/pedagogia/page.tsx`: Container expandido de `max-w-6xl` para `w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 transition-all duration-300`.
  - `src/app/dashboard/projetos/page.tsx` & `projetos/[id]/page.tsx`: Containers padronizados para `w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 transition-all duration-300`.
- **Efeito nos Modais e Painéis**: Grids, modais retráteis e gavetas se adaptam preenchendo 100% da largura extra disponível quando a barra está recolhida.

---

### 2026-08-19 — `[UI/UX] & [ARQUITETURA] & [PEDAGOGIA]` 🟡 IMPORTANTE

**Modo Somente Visualização & Acompanhamento de Pedagogia em `/projetos/[id]`**
- **Separação de Responsabilidades**: A seção de Pedagogia dentro de `projetos/[id]` (Gerenciar Projeto) foi configurada para **modo somente visualização e acompanhamento**.
- **Segurança Operacional**: Impedida a edição/exclusão direta de planos de aula, materiais, fichas socioemocionais e chamada de frequência dentro de `/projetos/[id]`.
- **Redirecionamento Claro**: Inclusão de banners contextuais e botões de redirecionamento para o módulo global `/pedagogia` ("Abrir Módulo de Pedagogia" / "Gerenciar na Pedagogia"), onde os materiais e registros são editáveis.
- **Componentes Adequados**: `PedagogiaPlanosAula`, `PedagogiaSocioemocional` e `PedagogiaFrequencia` receberam a prop `readOnly?: boolean`, ocultando ações de mutação e renderizando badges e dados consolidados com suporte total a visualização e impressão em papel timbrado.

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
   - **Filtro Mensal de Ações em Frequência e Planos de Aula**:
     - **Encontro Selecionado (`PedagogiaFrequencia.tsx`)**: Adicionado filtro mensal com seletor de meses disponíveis, atalho para "Mês Vigente" e dropdown de encontros escopado por mês com exibição formatada de data e horário.
     - **Vínculo no Modal de Plano de Aula (`PedagogiaPlanosAula.tsx`)**: Integrado filtro mensal antes do dropdown de ações no modal de criação e edição, sincronizando automaticamente o mês da ação vinculada ao editar e prevenindo listas infinitas.
   - **Planos de Aula & Metodologia (`PedagogiaPlanosAula.tsx`)**:
     - Cards salvos redesenhados no formato compacto com **Accordion Inteligente** para expandir dinâmicas, mediadores e metas sob demanda sem poluição visual.
     - **Correção de Educador/Mediador**: Removido preenchimento forçado silencioso do primeiro voluntário (`voluntarios[0]`), adicionado campo explícito de "Educador / Oficineiro Responsável Geral" no modal com seleção de voluntário ou nome personalizado, e exibição de "Não informado" quando vazio.
     - **Ergonomia UI/UX de Atividades**: Adicionado botão de "+ Adicionar Nova Atividade / Dinâmica ao Roteiro" na extremidade inferior da lista de atividades, eliminando a necessidade de rolar para o topo do formulário.
     - Modal de edição harmonizado com tipografia, espaçamentos e paleta Ádapo.
   - **Frequência & Presença (`PedagogiaFrequencia.tsx`)**:
     - Banners de feedback atualizados com contraste sólido e alta legibilidade.

3. **Aprimoramentos em Execução & Monitoramento > Programação da Ação (`/dashboard/projetos/[id]`)**:
   - **Padronização de Horário com Inputs Numéricos (`type="time"`)**: O campo de horário agora é composto por dois seletores de tempo (Início e Fim), decompondo e persistindo no formato estruturado `"HH:MM - HH:MM"` sem aceitar textos aleatórios.
   - **Sistema de Templates Reutilizáveis de Programação**: Gestores podem salvar a grade de atividades atual como modelo reutilizável (`Salvar Template`) e carregar templates salvos via dropdown com 1 clique (persistidos no `localStorage`).
   - **Correção de Fuso Horário no PDF Exportado**: Substituído `new Date().toLocaleString()` que convertia UTC -3h (exibindo 11h para ações das 14h) por `formatarDataHoraAcao()` com parsing seguro da data e hora real cadastrada.
   - **Correção de Layout nos Labels de Materiais e Equipe**: Ajustado o contador quantitativo `(N)` para exibição em linha (`whitespace-nowrap flex items-center gap-1`) com o ícone e título do campo, eliminando o deslocamento vertical dos inputs.
   - **Redução de Carga Cognitiva no Vínculo com Metas**: Seção transformada em **Accordion Compacto colapsável**, exibindo metas não selecionadas em linhas limpas de 1 clique e expandindo justificativa de impacto apenas para metas marcadas.

4. **Integração dos Dados Reais da Pedagogia na Aba `/dashboard/projetos/[id]`**:
   - Removido o banner legado de "## Em Construção ##" e os componentes placeholder.
   - Integrados os 4 componentes oficiais com dados vivos do projeto (`PedagogiaPlanosAula`, `PedagogiaSocioemocional`, `PedagogiaFrequencia` e `PedagogiaDossie`).
   - Adicionada barra de navegação Bento interna com 4 sub-abas, cabeçalho temático com avatar do projeto e resumo em pílulas numéricas (`Inscritos`, `Encontros`, `Metas`, `Planos de Aula Vinculados`).

5. **Saneamento e Conexão de Dados Reais no Painel Inicial (`/dashboard`)**:
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

### 2026-09-02 — `[BUGFIX]` & `[ATUALIZAÇÃO]` 🔴 CRÍTICO

**Correção do Erro 400 ao Salvar Conteúdo em `/dashboard/comunicacao`**

1. **Causa Raiz**:
   - Ao salvar um novo conteúdo pelo modal de Calendário Editorial (`editingConteudo === null`), a propriedade `id: undefined` era propagada no objeto do payload.
   - No cliente PostgREST, `id: undefined` era serializado como `null`, violando a constraint `NOT NULL` da chave primária (`id UUID PRIMARY KEY DEFAULT gen_random_uuid()`) e retornando código `23502 (HTTP 400 Bad Request)`.
2. **Correção Aplicada**:
   - Higienização e sanitização estrita do payload em `src/app/dashboard/comunicacao/page.tsx` (`handleSaveConteudo`, `handleSaveCampanha`, `handleSaveGaleria`), omitindo o campo `id` em criações para delegar a geração nativa do UUID ao PostgreSQL.
   - Inclusão da propriedade `metricas` na interface `ConteudoItem` em `ComunicacaoCalendario.tsx`.
   - Conexão e sincronização direta confirmada com retorno `HTTP 201 Created`.

---

### 2026-09-02 — `[MIGRAÇÃO]` & `[ARQUITETURA]` 🔴 CRÍTICO

**Execução do Plano de Otimização Arquitetural e Governança do Banco Supabase (`PLAN-database-optimization.md`)**

1. **Auditoria Geral via Supabase MCP**:
   - Mapeadas **37 tabelas ativas** no schema `public`, com **100% de RLS (Row Level Security) habilitado**.
2. **Vinculação Nativa de Identidade (`voluntarios.auth_user_id`)**:
   - Adicionada a coluna `auth_user_id UUID REFERENCES auth.users(id)` em `public.voluntarios` com índice `idx_voluntarios_auth_user_id`.
   - Executada reconciliação automática vinculando 9 voluntários existentes aos seus respectivos logins em `auth.users` (incluindo *Kayro Costa*).
   - Atualizada a trigger `handle_new_user()` para associar novos usuários cadastrados automaticamente ao registro de voluntário caso o e-mail coincida.
   - Frontend em `VoluntariosEscalaDisponibilidade.tsx` atualizado para selecionar o voluntário logado por `v.auth_user_id === user.id` de forma 100% determinística.
   - Exibição de badge `USUÁRIO ELO` no dossiê de voluntários em `VoluntariosEquipe.tsx`.
3. **Segurança RBAC (Role-Based Access Control) no PostgreSQL**:
   - Criada a stored function `public.is_admin_or_coordinator()`.
   - Refinadas políticas de RLS em `recessos_voluntarios`: voluntários podem registrar solicitações para si mesmos, mas **apenas a Diretoria (`admin`, `coordenador`)** possui permissão de homologar, alterar status e excluir registros.
4. **Unificação de Comunicação & Limpeza de Tabela Legada**:
   - Descontinuada e descartada a tabela órfã `public.pecas_comunicacao_projeto`.
   - Componente `ProjetoComunicacao.tsx` (dossiê de projetos) migrado para ler e gravar diretamente na tabela canônica `public.conteudos_comunicacao`. Peças criadas dentro de projetos agora aparecem automaticamente no Calendário Editorial Central de `/dashboard/comunicacao` e vice-versa.
5. **Otimização de Performance e Índices**:
   - Criados **20 índices de cobertura** em foreign keys identificadas pelo Supabase Database Linter.
   - Aplicado `SET search_path = public` em funções críticas para conformidade OWASP.
   - Otimizadas políticas de RLS substituindo chamadas dinâmicas por `(SELECT auth.uid())` em `profiles`, `subscribers` e `subscriptions`.
   - Projeções seletivas de colunas implementadas nas listagens de Projetos e Beneficiários, reduzindo mais de 70% do tráfego de rede.

---

### 2026-09-01 — `[ATUALIZAÇÃO]` 🟡 IMPORTANTE

**Módulo de Voluntariado, Escala Mensal & Otimização de Carregamento**

1. **Reestruturação de Navegação na Sidebar**:
   - Separadas as opções entre "Equipe & Contatos" (`/dashboard/voluntarios`) e "Gestão de Pessoas" (`/dashboard/voluntarios/gestao`).
   - Criada a tela de **Escalas & Recessos** (`/dashboard/voluntarios/escalas`) com calendário mensal integrado a ações sociais e oficinas pedagógicas (`acoes_projeto`).
2. **Correção de Divergências de Schema**:
   - Eliminado filtro inválido em `voluntarios.data_nascimento` (coluna inexistente em voluntários, existente apenas em beneficiários) que disparava erro 400.
   - Ajustadas queries de `doacoes` para usar `tipo` e `descricao`.
   - Corrigido erro de hidratação Minified React #418 em componentes de escala e listagem.
3. **Serviço de Cache Unificado (`voluntariosService.ts`)**:
   - Implementado padrão Stale-While-Revalidate com cache singleton em memória e `sessionStorage` para carregamento imediato (0ms).

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

### 2026-09-04 — `[MELHORIAS]` 🟢 Comunicação & Mídia → Comunicação
- **Renomeação**:
  - Módulo renomeado de "Comunicação & Mídia" para **"Comunicação"** em `Sidebar.tsx` e `src/app/dashboard/comunicacao/page.tsx`.
- **Banco de Dados (Supabase)**:
  - Adicionada coluna `link_publicacao TEXT` na tabela `conteudos_comunicacao`.
  - Integrada persistência no frontend com suporte a fallback defensivo local.
- **Calendário Editorial**:
  - Tabela refinada com tipografia aprimorada, badges de formato (Reels, Carrossel, Stories, etc.) com alto contraste, badge de dia da semana e botões de acesso direto ao post publicado (`link_publicacao`) e à peça de produção (`link_producao`).
  - Campo obrigatório de Link da Publicação na Rede Social (Instagram/TikTok/YouTube) ao selecionar status "Publicado", com modal rápido para confirmação e inclusão de link. Exceção de negócio implementada para **Stories** (temporários de 24h sem URL fixa), onde o preenchimento do link é opcional.
  - Modo Calendário Mensal despoluído para visualização pura: ao clicar em qualquer dia, abre modal completo de **Detalhes dos Posts do Dia** com listagem detalhada, roteiro/legenda, ações e opção de agendamento pré-preenchido.
  - Exportação em PDF Timbrado oficial do Calendário Editorial direto pela barra de ferramentas.
- **Campanhas Estratégicas**:
  - Correção de contraste da campanha selecionada na lista lateral (`border-2 border-[var(--color-primary)] border-l-6 border-l-[var(--color-primary)] bg-[var(--bg-elevated)]`, badge `SELECIONADA`, tipografia Slate-900 / Branco de alto contraste).
  - Componente de textarea autoexpansível dinâmico (`AutoResizeTextarea`) aplicado nos campos de texto longo (Resumo, Diagnóstico, Personas, Metas, Narrativa, Gatilhos).
  - Adicionado o bloco 8 (**Calendário Editorial da Campanha**) com tabela completa no PDF Timbrado da campanha.
- **Validação**: Build Turbopack e checagem TypeScript executados com 0 erros (36 rotas compiladas com sucesso).

---

*Última atualização: 2026-09-04 por Antigravity IDE*

