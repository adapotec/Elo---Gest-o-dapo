# Design System — Sistema Elo
### Identidade Visual, Componentes, Geometria e Princípios de UI/UX

**Versão:** 1.0 (Auditoria Completa de UI/UX, Divulgação Progressiva & Consistência Visual)  
**Organização:** Instituto Ádapo  
**Referências:** Paleta institucional (`CORES.png`) + Princípios da `frontend-design` & `ui-ux-pro-max` + Psicologia de UX (Leis de Miller, Hick e Fitts).

---

## 1. Direção de Identidade e Filosofia de Design

O Elo é um sistema de gestão **institucional, acolhedor, transparente e eficiente** voltado ao atendimento de crianças, adolescentes e comunidades. Ele se distancia do visual frio e impessoal dos SaaS corporativos, entregando uma interface com personalidade humana, clareza cirúrgica e rigor técnico.

### Princípios Fundamentais de UX/UI:
1. **Restrição é Luxo & Clareza**: Eliminar elementos visuais supérfluos, ruídos decorativos e emojis em controles de interface.
2. **Divulgação Progressiva (Progressive Disclosure)**: Não sobrecarregar o usuário com todos os dados de uma só vez. Detalhes secundários são exibidos através de abas, modais retráteis e tooltips contextuais.
3. **A Lei de Miller (Miller's Law)**: Toda tela ou sub-seção deve agrupar as informações principais em no máximo **5 a 9 blocos lógicos visíveis**.
4. **Espaço para Respirar (Whitespace)**: Manter espaçamento consistente e generoso (`p-6` a `p-8`, `gap-6`, `space-y-6`) para reduzir a fadiga visual e proporcionar leitura fluida.
5. **Ergonomia e Área de Toque (Lei de Fitts)**: Elementos de clique com dimensões confortáveis (mínimo 36px de altura), feedback visual instantâneo e `cursor-pointer` em 100% dos itens interativos.

---

## 2. Paleta de Cores Institucional e Regra 60-30-10

Extraída das diretrizes oficiais do Instituto Ádapo:

| Nome do Token | Hex | Papel Semântico no Sistema |
|---|---|---|
| `laranja` (Primária) | `#F2632D` | **Cor de Ação**: Botões primários (CTAs), destaques de conversão e foco ativo |
| `laranja-claro` | `#F7955F` | Estados de hover e backgrounds suaves de destaque |
| `amarelo` | `#F9C859` | Alertas de atenção, avisos de prazo, destaques informativos |
| `roxo` | `#93368F` | Módulo Pedagógico, planos de aula e categorização institucional |
| `roxo-escuro` | `#4A1B57` | Cabeçalhos de alto contraste e textos institucionais em dark mode |
| `marrom` | `#8B4A2E` | Módulo de Estoque, identificadores físicos e divisores decorativos |
| `verde-azulado` | `#1C9C82` | Status concluído/ativo, confirmações de sucesso e valores positivos |
| `vermelho` | `#D64545` | Ações destrutivas (exclusões), cancelamentos e erros |

### Distribuição Visual da Proporção 60-30-10:
* **60% — Superfície & Fundo (Base)**: Canvas limpo (`--bg-primary`: `#FDFBF8` / Dark: `#1C1712`) e cartões elevados (`--bg-elevated`: `#FFFFFF` / Dark: `#2A251E`).
* **30% — Estrutura & Leitura (Contraste Médio)**: Painéis secundários (`--bg-secondary`: `#F5F1EA` / Dark: `#24201A`), textos (`--text-primary`: `#2B2118` / Dark: `#F3EDE4`) e bordas (`--border-default`: `#E8E1D6` / Dark: `#383126`).
* **10% — Ponto Focal & Ação (Laranja Ádapo)**: Reservado exclusivamente para botões de ação primária (`#F2632D`), badges ativos e indicadores de estado.

> 🔴 **Regra de Ouro da Cor**: O roxo (`#93368F`) e o azul nunca devem substituir o laranja (`#F2632D`) como cor de ação principal de formulários ou botões primários.

---

## 3. Geometria Unificada do Design System (Soft Bento Institucional)

Para eliminar o amadorismo de arredondamentos aleatórios (mistura descontrolada de 4px, 6px e 8px), o ERP Elo adota a estética **Soft Bento Institucional**, com regras geométricas rígidas:

| Elemento de UI | Classe Tailwind | Raio (Radius) | Uso Obrigatório |
|---|---|---|---|
| **Containers Principais & Telas** | `rounded-2xl` | `16px` a `24px` | Painéis principais, seções de dashboard, envelopes de formulário |
| **Cards, Modais & Tabelas** | `rounded-xl` | `12px` a `16px` | Cards de listagem, painéis de dados, modais de diálogo |
| **Controles, Inputs & Botões** | `rounded-xl` | `10px` a `12px` | Campos de texto, `<select>`, botões `<Button>`, textareas |
| **Tooltips & Menus Suspensos** | `rounded-xl` | `12px` | Componente `FieldInfo`, menus dropdown de ações |
| **Badges, Tags & Pílulas** | `rounded-full` ou `rounded-lg` | `9999px` ou `8px` | Indicadores de status, tags temáticas, contadores |

> ⛔ **Proibição**: Nunca utilizar `rounded-sm` (2px) ou `rounded-md` (6px) em cartões ou botões principais do sistema.

---

## 4. Contraste Tipográfico & Legibilidade

A tipografia é hierarquizada em 3 famílias fontes complementares:

| Família Tipográfica | Fonte | Classe / Uso | Padrão de Contraste |
|---|---|---|---|
| **Display (Títulos & Destaques)** | **Fraunces** (Serifada) | `font-display font-bold` | `#2B2118` (Dark: `#F3EDE4`) |
| **Corpo (Formulários & Tabelas)** | **Inter** (Sans-serif) | `font-sans text-sm / text-xs` | `#2B2118` (Dark: `#F3EDE4`) |
| **Secundário & Legendas** | **Inter** (Sans-serif) | `text-[var(--text-secondary)]` | Mínimo Slate-600 (`#475569` / `#6B6055`) |
| **Utilitária (Valores, CPFs & Datas)** | **IBM Plex Mono** | `font-mono-data` | Contraste alto para números e dados fiscais |

---

## 5. Profundidade em Camadas & Eixo Z (Layered Depth)

Para que o usuário compreenda intuitivamente a sobreposição de elementos sem confusão visual:

1. **Camada 0 (Fundo)**: `--bg-primary` plano.
2. **Camada 1 (Superfície de Cards)**: `--bg-elevated` com borda de 1px `border-[var(--border-default)]` e sombra suave `shadow-[var(--shadow-card)]`.
3. **Camada 2 (Dropdowns & Tooltips `FieldInfo`)**: Fundo escuro sólido `#2B2118` (ou `#FFFFFF` em light), borda de alto contraste `border-[#4A4235]` e sombra profunda `shadow-2xl` com `z-[100]`.
4. **Camada 3 (Modais & Drawers)**: Backdrop escuro `bg-black/60 backdrop-blur-sm`, contêiner central `shadow-2xl` e `z-[200]`.

---

## 6. Especificação dos Componentes Padronizados

### 6.1 Balão Informativo e Dica de Tela (`FieldInfo.tsx`)
- **Ícone**: SVG oficial `HelpCircle` da biblioteca **Lucide React** (tamanho 12x12 ou 14x14). **Emojis como ❓ ou ℹ️ são estritamente proibidos**.
- **Comportamento**:
  - **Hover Suave**: Transição de opacidade/cor estável entre 150ms e 200ms (`animate-in fade-in-0 zoom-in-95`).
  - **Zero Layout Shift**: O hover nunca altera o tamanho ou margem do botão, evitando deslocamentos no formulário.
  - **Clique Suporte**: Permite manter o balão aberto para leitura no celular ou via teclado (tecla `Escape` fecha).
  - **`cursor-pointer`**: Sempre habilitado.

### 6.2 Botões (`Button.tsx`)
- Alinhamento inline estrito: `inline-flex flex-row items-center justify-center whitespace-nowrap shrink-0`.
- Ícone SVG acoplado sem quebra de linha: `gap-2`.
- Geometria: `rounded-xl` com micro-interação suave no hover (`transition-all duration-200`).

### 6.3 Badges (`Badge.tsx`)
- Variantes institucionais: `primary` (laranja), `purple` (pedagogia), `success` (verde), `warning` (amarelo), `danger` (vermelho), `neutral` (cinza).
- Tipografia: `text-[10px]` ou `text-xs font-semibold tracking-wide uppercase`.

---

## 7. Check-up Rápido de Tela (Auditoria Pré-Entrega)

Antes de considerar qualquer tela ou componente como finalizado, execute as seguintes validações:

- [ ] **Teste do Espaço**: Os textos longos de ajuda foram convertidos para o componente `FieldInfo`? A tela ganhou pelo menos 20% a mais de espaço em branco para respirar?
- [ ] **Teste da Lei de Miller**: As informações da tela estão agrupadas em no máximo 5 a 9 blocos lógicos visíveis?
- [ ] **Teste do Cursor**: Todos os elementos interativos (linhas de tabela, cards clicáveis, botões de ajuda) possuem `cursor-pointer` e feedback suave?
- [ ] **Teste de Consistência Geométrica**: Os arredondamentos seguem a regra (`rounded-2xl` para painéis, `rounded-xl` para cards/inputs/botões)?
- [ ] **Teste de Zero Emojis**: Não há nenhum emoji sendo utilizado como ícone de controle? Todos os ícones pertencem à biblioteca Lucide React?
- [ ] **Teste de Contraste & Dark Mode**: A tela foi testada no modo claro e no modo escuro sem textos apagados ou ilegíveis?