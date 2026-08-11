# PRD — Sistema Elo
### Sistema de Gestão Interna (ERP) do Instituto Ádapo

**Versão:** 3.0  
**Autor:** Kayro Costa da Silva / Antigravity AI  
**Última atualização:** 2026-08-11  
**Auditoria & DDL Sync:** Concluído com 100% de exatidão em 2026-08-11  

---

## 1. Visão Geral

O Sistema Elo é a aplicação web de gestão interna do Instituto Ádapo, criada para centralizar informações e processos da organização, garantindo:

- **Organização** dos dados de beneficiários, voluntários, projetos e recursos;
- **Rastreabilidade** das ações sociais realizadas;
- **Otimização de recursos** (doações, estoque, alocação de voluntários);
- **Captação de recursos** via programas recorrentes com gateway de pagamento (Asaas);
- **Geração de indicadores** que sustentem relatórios para financiadores e prestação de contas.

O sistema substitui ferramentas fragmentadas (planilhas, formulários avulsos, grupos de WhatsApp, trello, etc.) por uma plataforma única, acessível apenas pela equipe interna.

## 2. Objetivos

- Ter um cadastro único e confiável de beneficiários e voluntários;
- Vincular beneficiários a projetos sociais com histórico de participação;
- Registrar e rastrear doações (financeiras e em itens);
- Controlar entradas e saídas de estoque, com fornecedores e lote;
- Gerenciar requisições de material entre projetos e estoque;
- Operar programas de captação recorrente com assinantes;
- Gerar indicadores sociais consolidados para relatórios e dashboards.

## 3. Referência de Domínio

O escopo de Beneficiários, Doações, Projetos Sociais e Estoque foi inspirado no repositório de referência **"Providenciando a Favor da Vida"** (Django, autoria de Bruno Oliveira), usado apenas como base conceitual de domínio — a implementação é 100% nativa em Next.js/Supabase.

Conceitos incorporados dessa referência:
- Tabela de **Inscrições** como vínculo N:N entre Beneficiário e Projeto Social;
- **Fornecedores** e **geração automática de número de lote** no módulo de Estoque;
- Separação clara entre módulos operacionais e controle de acesso.

Módulos modelados do zero para o Elo:
- **Voluntários** (com dados médicos e endereço completo)
- **Indicadores Sociais**
- **Captação Recorrente** (Asaas gateway)
- **Requisições de Material**
- **Relatórios de Monitoramento**
- **Ações de Projeto**

## 4. Stack Técnica

| Camada | Tecnologia | Versão |
|---|---|---|
| Frontend | Next.js (App Router) + React + Tailwind CSS | 16.3.0 / React 19.2.8 / TW v4 |
| Backend | Next.js Server Actions / API Routes | — |
| Banco de Dados | Supabase (Postgres 17.6) | sa-east-1 / `jkpmioffpsdcoitgghyo` |
| Autenticação | Supabase Auth (equipe interna apenas) | @supabase/ssr ^0.12.4 |
| Gateway Pagamento | Asaas (via webhooks) | — |
| Ícones | Lucide React | ^1.30.0 |
| Gráficos | Recharts | ^3.10.1 |
| Deploy inicial | Vercel | — |
| Migração futura | Hostinger | — |
| IDE / geração de código | Antigravity (VS Code + agente de IA) | — |

## 5. Módulos e Entidades Principais

### 5.1 Beneficiários — `beneficiarios` (28 colunas)
- Cadastro completo com dados pessoais, endereço, escolaridade, profissão, cor/raça, estado civil;
- Renda familiar, dependentes, membros da família;
- Contatos de emergência (JSONB);
- Status: `ativo`, `pendente`, `suspenso`;
- Vínculo com projetos via Inscrições e com doações.

### 5.2 Voluntários — `voluntarios` (29 colunas)
- Cadastro com dados pessoais e endereço completo;
- Tipos: `operacional` (equipe interna) ou `externo` (monitores por projeto);
- **Dados médicos**: tipo sanguíneo, alergias, medicamentos de uso contínuo, plano de saúde;
- Contato de emergência (nome, parentesco, telefone);
- Avatar, área de atuação, função, período de atividade;
- Status: `ativo`, `inativo`.

### 5.3 Projetos Sociais — `projetos_sociais` (37 colunas)
- Cadastro completo de projetos com tipo (`curso`, `encontro`, `palestra`, `outro`);
- Status: `planejado`, `ativo`, `concluido`, `cancelado`;
- **Plano de Trabalho completo**: apresentação, justificativa, público-alvo, ingresso/permanência, localidade;
- **Objetivos**: objetivo geral, objetivos específicos, estrutura de objetivos (JSONB);
- **Monitoramento**: metas, procedimento, periodicidade, responsável;
- **Metodologia, acessibilidade, resultados esperados**;
- **Diagnóstico**: texto livre + diagnóstico detalhado (JSONB);
- **ODS selecionadas** (JSONB — Objetivos de Desenvolvimento Sustentável);
- **Despesas financeiras** (JSONB);
- **Avaliação de encerramento**;
- Nº beneficiários diretos/indiretos, aceita vínculo de beneficiários;
- Responsável pela escrita (FK → voluntários);
- Ícone personalizável, cor de identificação.

### 5.4 Ações de Projeto — `acoes_projeto` (7 colunas)
- Registro de ações/atividades vinculadas a projetos;
- Data/hora, nome da ação, descrição;
- Documento estruturador (default: "Plano de Aula");
- Voluntários alocados por ação específica.

### 5.5 Inscrições — `inscricoes` (5 colunas)
- Tabela de vínculo N:N entre Beneficiário e Projeto Social;
- Controle de status: `ativo`, `concluido`, `desligado`;
- Constraint UNIQUE(beneficiario_id, projeto_id).

### 5.6 Alocações de Voluntários — `alocacoes_voluntarios` (7 colunas)
- Vínculo N:N entre Voluntário e Projeto Social;
- Função no projeto, período (data_inicio, data_fim);
- Vínculo opcional com ação específica (FK → acoes_projeto);
- Constraint UNIQUE(voluntario_id, projeto_id).

### 5.7 Doações — `doacoes` (22 colunas)
- Tipo: `financeira` ou `item`;
- Dados do doador inline (nome, CPF/CNPJ, telefone, email);
- Categoria padronizada, forma de pagamento, comprovante URL;
- Mês/ano de referência, data da doação;
- Para itens: quantidade, unidade;
- Vínculo opcional com programa de captação;
- Vínculo opcional com movimentação de estoque e beneficiário.

### 5.8 Controle de Estoque

#### Itens — `estoque_itens` (10 colunas)
- Nome, descrição, categoria, quantidade atual, unidade de medida;
- **Quantidade mínima** (alerta de estoque baixo, default: 10);
- **Localização** (default: "Depósito Principal").

#### Movimentações — `estoque_movimentacoes` (12 colunas)
- Tipo: `entrada` ou `saida`;
- Lote automático (BIGSERIAL);
- Fornecedor (FK), projeto vinculado (FK);
- Observação, validade do item;
- `is_available` para controle de disponibilidade.

### 5.9 Fornecedores — `fornecedores` (16 colunas)
- Tipo pessoa: `PF` ou `PJ`;
- Dados cadastrais, endereço completo;
- Tax ID (CPF/CNPJ) único;
- Flag `is_anonymous` para doadores anônimos.

### 5.10 Requisições de Material — `requisicoes_material` (14 colunas)
- Requisição de material vinculada a projeto;
- Item, categoria, quantidade solicitada vs liberada;
- Valor unitário para orçamento;
- Status de aprovação (`pendente`, etc.);
- Vínculo com item de estoque para baixa automática;
- Respondido por (FK → profiles), data de resposta.

### 5.11 Relatórios de Monitoramento — `relatorios_monitoramento` (7 colunas)
- Vinculados a projetos;
- Mês de referência, resumo do avanço;
- Metas atingidas, dificuldades encontradas.

### 5.12 Dados do Instituto — `dados_instituto` (8 colunas)
- Tabela singleton com dados institucionais;
- Razão social, CNPJ, endereço, telefone, email, presidente.

### 5.13 Indicadores Sociais
- Dashboard consolidado a partir dos demais módulos;
- Implementado com Recharts no frontend;
- Base para relatórios a financiadores.

---

## 6. Módulo de Captação Recorrente

Sistema completo de assinaturas com gateway Asaas:

### 6.1 Programas de Captação — `programas_captacao` (10 colunas)
- Nome, descrição, tipo (`recorrente`), gateway (`asaas`);
- Status: `ativo`;
- Meta mensal de arrecadação;
- Vínculo opcional com projeto social.

### 6.2 Planos — `plans` (9 colunas)
- Nome, valor (`amount`), ciclo (`MONTHLY`);
- Descrição, flag `active`;
- Vínculo com programa de captação.

### 6.3 Assinantes — `subscribers` (11 colunas)
- Nome, email (unique), CPF (unique), telefone;
- ID do cliente no Asaas (`asaas_customer_id`);
- Vínculo com plano e com auth.users;
- Status de assinatura.

### 6.4 Assinaturas — `subscriptions` (8 colunas)
- ID da assinatura no Asaas;
- Método de pagamento, status (`ACTIVE`);
- Próxima data de vencimento.

### 6.5 Conteúdo Exclusivo — `exclusive_content` (9 colunas)
- Conteúdo para assinantes por nível de plano;
- Tipo, URL/path no storage, data de publicação;
- Valor mínimo do plano para acesso.

### 6.6 Webhook Logs — `webhook_logs` (9 colunas)
- Log de eventos recebidos do Asaas;
- Evento, IDs de pagamento/assinatura/cliente;
- Payload completo (JSONB), status de processamento.

---

## 7. Papéis de Acesso (Roles)

Acesso restrito **exclusivamente à equipe interna** — beneficiários não possuem login/portal próprio.

| Papel | Descrição |
|---|---|
| **Admin** | Acesso total a todos os módulos, gestão de usuários e permissões |
| **Coordenador** | Gestão de projetos, beneficiários, voluntários e indicadores da sua área |
| **Voluntário operacional** | Acesso a registro de atendimentos/atividades e consulta por área (Pedagogia, Comunicação, Tecnologia, Gestão de Projetos, Financeiro, Administração, Captação de recursos) |
| **Voluntário Externo** | Acesso restrito aos projetos autorizados pelos coordenadores |

---

## 8. Segurança e RLS — Estado Atual

### Functions (3)
| Função | Finalidade |
|---|---|
| `handle_new_user()` | Cria perfil automaticamente no signup |
| `update_updated_at_column()` | Atualiza `updated_at` em triggers de UPDATE |
| `rls_auto_enable()` | Habilita RLS automaticamente em novas tabelas |

### Triggers (4)
- `update_exclusive_content_updated_at` → exclusive_content
- `update_plans_updated_at` → plans
- `update_subscribers_updated_at` → subscribers
- `update_subscriptions_updated_at` → subscriptions

### Políticas RLS — Estado Atual
| Tabela | Política | Tipo |
|---|---|---|
| profiles | Leitura total para autenticados | SELECT |
| profiles | Atualização própria de profile | UPDATE |
| beneficiarios, voluntarios, projetos_sociais, inscricoes, alocacoes_voluntarios, fornecedores, estoque_itens, estoque_movimentacoes, doacoes, programas_captacao, relatorios_monitoramento, dados_instituto, requisicoes_material | Acesso total autenticados | ALL |
| exclusive_content | Assinante ativo acessa conteúdo do seu nível | SELECT (com JOIN) |
| plans | Planos são visíveis para todos | SELECT |
| subscribers | Assinante vê apenas seus dados | SELECT |
| subscriptions | Assinante vê apenas suas assinaturas | SELECT |

---

## 9. Backlog Atualizado (Épicos e Status)

### ✅ Épico 1 — Fundação do Projeto (COMPLETO)
- [x] Setup do projeto Next.js 16 (App Router) + Tailwind CSS v4
- [x] Setup do projeto Supabase
- [x] Configuração de autenticação Supabase Auth

### ✅ Épico 2 — Modelagem de Dados (COMPLETO — 20 tabelas)
- [x] Sincronização do schema DDL local `supabase/schema.sql` (20 tabelas, 266 colunas)
- [x] Funções armazenadas, triggers e RLS ativado em 100% das tabelas

### ✅ Épico 3 — Módulo Beneficiários (COMPLETO)
- [x] CRUD de beneficiários
- [x] Histórico de participação em projetos (via Inscrições)

### ✅ Épico 4 — Módulo Voluntários (COMPLETO)
- [x] CRUD de voluntários com dados médicos
- [x] Alocação em projetos sociais

### ✅ Épico 5 — Módulo Projetos Sociais (COMPLETO)
- [x] CRUD de projetos (37 campos)
- [x] Gestão de inscrições e alocações

### ✅ Épico 6 — Módulo Doações (COMPLETO)
- [x] CRUD de doações com subcomponentes modulares (`DoacoesStats.tsx`, `DoacoesTable.tsx`)

### ✅ Épico 7 — Módulo Controle de Estoque (COMPLETO)
- [x] CRUD de itens e movimentações com lote
- [x] Listagem dedicada de fornecedores (`/dashboard/fornecedores`)
- [x] Subcomponentes modulares (`EstoqueTable.tsx`, `MovimentacoesTable.tsx`)

### ✅ Épico 8 — Módulo Indicadores Sociais (COMPLETO)
- [x] Dashboard consolidado BI com Recharts (`IndicadoresCharts.tsx`)

### 🟡 Épico 9 — Controle de Acesso e Permissões (EM PROGRESSO)
- [x] Módulo de gestão de usuários e papéis (`/dashboard/usuarios`)
- [x] Telas protegidas por middleware SSR (`src/middleware.ts`)
- [ ] Políticas de RLS refinadas por role nas tabelas operacionais
- [ ] Log de auditoria de alterações (`created_by`/`updated_by`)

### 🟡 Épico 10 — Preparação para Produção (EM PROGRESSO)
- [x] Middleware de autenticação de rotas
- [x] Compilação e build de produção Next.js validados (24/24 rotas estáticas)
- [ ] Testes de responsividade mobile-first em campo
- [ ] Exportação de relatórios (PDF/CSV)

---

## 10. Próximos Passos Prioritários (Roadmap v3.0)

1. 🔒 **Refinamento de Políticas RLS por Role**: Substituir políticas `USING (true)` por regras baseadas nos papéis `admin`, `coordenador` e `voluntario` da tabela `profiles`.
2. 📄 **Exportação de Relatórios de Impacto (PDF/CSV)**: Adicionar gerador de PDFs para relatórios de monitoramento e exportação CSV para auditoria financeira/doações.
3. 💳 **Gestão Visual de Captação Recorrente (Asaas)**: Criar interface dedicada para acompanhamento de assinaturas ativas, MRR por plano e tratamento de webhooks.
4. 📝 **Rastreabilidade e Auditoria de Dados**: Garantir preenchimento dos campos `created_by` e `updated_at` em todas as operações de escrita no banco.
5. 📱 **Auditoria de UX & Responsividade Mobile**: Testar e otimizar formulários e tabelas em dispositivos móveis.