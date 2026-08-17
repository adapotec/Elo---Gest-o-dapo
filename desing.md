# Design System — Sistema Elo
### Identidade Visual, Componentes e Princípios de UX/UI

**Versão:** 0.2 (Atualizado com diretrizes da skill `frontend-design`)  
**Referências:** Paleta institucional do Instituto Ádapo (`CORES.png`) + Estrutura de layout inspirada em L'Inventaire e Softcount + Princípios de UX Psychology.

---

## 1. Direção de Identidade e Filosofia de Design

O Elo é um sistema **institucional, acolhedor e confiável** — não um SaaS corporativo genérico. A paleta nasce das cores do Instituto Ádapo (foco em crianças, adolescentes e transformação social): quente, humana, com o **laranja como cor de ação e destaque principal**, apoiado por roxo, amarelo, marrom terroso e verde-azulado como cores de suporte e categorização.

### Princípios Fundamentais (`frontend-design`):
1. **Restrição é Luxo**: Evitar poluição visual, elementos decorativos desnecessários ou emojis informais em controles do sistema.
2. **Carga Cognitiva Mínima (Lei de Hick)**: Interfaces densas em dados devem agrupar campos de forma lógica, usando progressive disclosure (ex: formulários em seções claras/cards reutilizáveis).
3. **Ergonomia e Área de Toque (Lei de Fitts)**: Alvos de ação principais devem possuir dimensões confortáveis, contraste nítido e resposta tátil imediata.
4. **Alinhamento e Estrutura Semântica**: Ícones e textos em botões/Badges devem obrigatoriamente manter alinhamento inline rígido (`inline-flex flex-row items-center whitespace-nowrap`), sem quebra de linha entre ícone e rótulo.

---

## 2. Paleta de Cores e Regra 60-30-10

Extraída da referência institucional (`CORES.png`):

| Nome | Hex | Uso Semântico |
|---|---|---|
| `laranja` (primária) | `#F2632D` | Ações primárias (CTAs), destaques de navegação, alvos de interação principais |
| `laranja-claro` | `#F7955F` | Hover e estados ativos de foco |
| `amarelo` | `#F9C859` | Alertas suaves, avisos de vencimento (`OVERDUE`), destaques secundários |
| `roxo` | `#93368F` | Categorização de beneficiários, programas recorrentes, badges institucionais |
| `roxo-escuro` | `#4A1B57` | Contraste alto, cabeçalhos institucionais em dark mode |
| `marrom` | `#8B4A2E` | Módulo de Estoque, divisores decorativos, tom terroso institucional |
| `verde-azulado` | `#1C9C82` | Status de sucesso (`ACTIVE`), confirmações financeiras, valores positivos |

### Proporção Visual (60-30-10):
- **60% (Fundo & Base)**: Canvas claro acolhedor (`--bg-primary`: `#FDFBF8`) e superfície de cards (`--bg-elevated`: `#FFFFFF`).
- **30% (Estrutura & Leitura)**: Painéis secundários (`--bg-secondary`: `#F5F1EA`), textos (`--text-primary`: `#2B2118`) e bordas (`--border-default`: `#E8E1D6`).
- **10% (Contraste & Ação)**: Laranja primário (`#F2632D`) para alvos de conversão e botões primários.

---

## 3. Tokens Semânticos (CSS Custom Properties)

```css
/* index.css */

:root {
  /* --- Paleta bruta --- */
  --raw-laranja: #F2632D;
  --raw-laranja-claro: #F7955F;
  --raw-amarelo: #F9C859;
  --raw-roxo: #93368F;
  --raw-roxo-escuro: #4A1B57;
  --raw-marrom: #8B4A2E;
  --raw-verde: #1C9C82;

  /* --- Tokens semânticos: Light Mode (padrão) --- */
  --bg-primary: #FDFBF8;
  --bg-secondary: #F5F1EA;
  --bg-elevated: #FFFFFF;
  --bg-sidebar: #FFFFFF;

  --text-primary: #2B2118;
  --text-secondary: #6B6055;
  --text-muted: #9C9187;
  --text-on-primary: #FFFFFF;

  --border-default: #E8E1D6;
  --border-strong: #D4CABA;

  --color-primary: var(--raw-laranja);
  --color-primary-hover: #DE5623;
  --color-primary-soft: #FCE6DB;

  --color-accent-purple: var(--raw-roxo);
  --color-accent-yellow: var(--raw-amarelo);
  --color-accent-brown: var(--raw-marrom);

  --color-success: var(--raw-verde);
  --color-success-soft: #DCF3EC;
  --color-warning: var(--raw-amarelo);
  --color-warning-soft: #FDF3DA;
  --color-danger: #D64545;
  --color-danger-soft: #FBE2E2;

  --shadow-card: 0 1px 2px rgba(43, 33, 24, 0.06), 0 1px 8px rgba(43, 33, 24, 0.04);
}

[data-theme="dark"] {
  --bg-primary: #1C1712;
  --bg-secondary: #24201A;
  --bg-elevated: #2A251E;
  --bg-sidebar: #211C16;

  --text-primary: #F3EDE4;
  --text-secondary: #B8AC9C;
  --text-muted: #7D7466;
  --text-on-primary: #FFFFFF;

  --border-default: #383126;
  --border-strong: #4A4235;

  --color-primary: var(--raw-laranja);
  --color-primary-hover: #f7955fff;
  --color-primary-soft: #3D2A1E;

  --color-accent-purple: #B85BB3;
  --color-accent-yellow: var(--raw-amarelo);
  --color-accent-brown: #B87A54;

  --color-success: #3FC1A2;
  --color-success-soft: #1B3B33;
  --color-warning: var(--raw-amarelo);
  --color-warning-soft: #3D3620;
  --color-danger: #E57575;
  --color-danger-soft: #3D2323;

  --shadow-card: 0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 8px rgba(0, 0, 0, 0.2);
}
```

---

## 4. Tipografia Institucional

| Papel | Fonte | Uso |
|---|---|---|
| **Display (Títulos)** | **Fraunces** (serifada) | Cabeçalhos de módulo, títulos de banners (`font-display font-bold`) |
| **Corpo (UI & Formulários)** | **Inter** (sans-serif) | Textos de tabelas, labels de campos, parágrafos informativos |
| **Utilitária (Dados & Moeda)** | **IBM Plex Mono** (monospace) | Valores em R$, contagem de assinantes, CPFs, datas e IDs (`font-mono-data`) |

---

## 5. Regras Rígidas de UI & Diretrizes de Componentes

### 5.1 Proibição Absoluta de Emojis em Controles da Interface
- **Regra**: NUNCA utilizar emojis em opções de `<Select>`, rótulos de `<Badge>`, botões `<Button>`, abas de navegação ou headers de tabela.
- **Substituição**: Utilizar exclusivamente a biblioteca de ícones **Lucide React** (`<Gift />`, `<DollarSign />`, `<Package />`, `<Target />`, etc.) ou a sobriedade tipográfica pura.

### 5.2 Botões (`Button.tsx`)
- **Alinhamento Inline Rígido**: Os botões devem ser compostos por `inline-flex flex-row items-center justify-center whitespace-nowrap shrink-0`.
- **Prevenção de Quebra de Ícone**: O container interno de `children` possui `inline-flex flex-row items-center gap-1.5 whitespace-nowrap`, impedindo que o ícone SVG e o texto fiquem empilhados em duas linhas em qualquer tamanho de tela.
- **Variantes**:
  - `primary`: Fundo `--color-primary`, texto branco.
  - `secondary`: Transparente com borda `--border-strong`.
  - `ghost`: Transparente com texto `--color-primary`.
  - `danger`: Fundo `--color-danger`.

### 5.3 Barra Superior (`Topbar.tsx`)
- **Flexibilidade sem Truncamento**: Removido `truncate` forçado do título da página. Em resoluções menores, a Topbar se reorganiza de forma fluida (`flex-col lg:flex-row`), preservando o nome da tela visível e sem colidir com os botões de ação ou campo de busca.

### 5.4 Balões Explicativos & Tooltips (`FieldInfo.tsx`)
- **Contenção de Bordas**: Todo modal ou balão explicativo (`?`) possui largura máxima contida (`max-w-[calc(100vw-2rem)]`) e posicionamento inteligente (`right-0 sm:left-0`), evitando estouro lateral da janela.

---

## 6. Padronização Institucional de Categorias

Para garantir consistência nos relatórios financeiros e orçamentários do ERP Elo, todas as doações financeiras e em itens físicos devem utilizar a taxonomia padronizada abaixo:

### A. Doações Financeiras (Categorias Padrão):
1. `Geral Institucional`
2. `Alimentação e Nutrição`
3. `Material de Consumo e Didático`
4. `Equipamentos e Tecnologia`
5. `Recursos Humanos e Serviços`
6. `Logística e Transporte`
7. `Infraestrutura e Reformas`
8. `Eventos e Capacitações`
9. `Emergencial e Apadrinhamento`
10. `Outros`

### B. Doações em Itens Físicos (Categorias Padrão):
1. `Cesta Básica / Alimentos`
2. `Vestuário / Calçados`
3. `Equipamentos / Eletrônicos`
4. `Material Escolar / Didático`
5. `Móveis / Utensílios`
6. `Insumos / Consumo`
7. `Outros Mantimentos`

---

## 7. Acessibilidade e Auditoria UX

- **Foco Visível**: Alvos de entrada e botões possuem `focus:ring-2 focus:ring-[var(--color-primary)]`.
- **Navegação via Teclado**: Suporte completo a navegação por tabulação.
- **Contraste Mínimo AA**: Garantido contraste de 4.5:1 para todos os textos sobre `--bg-primary` e `--bg-elevated`.
- **Tema sem Flash (FOUC)**: Script inline de pré-hidratação que define `data-theme` antes da renderização do React.