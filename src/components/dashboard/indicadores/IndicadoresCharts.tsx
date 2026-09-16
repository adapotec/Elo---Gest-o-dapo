'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export const PALETA_CORES = {
  laranja: '#F2632D',
  teal: '#0D9488',
  esmeralda: '#10B981',
  azul: '#2563EB',
  ambar: '#D97706',
  ciano: '#0891B2',
  cinza: '#64748B',
  rose: '#E11D48',
  verdeClaro: '#34D399',
  azulClaro: '#38BDF8',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-xl text-xs space-y-1 z-50">
        {label && <p className="font-bold text-[var(--text-primary)] mb-1">{label}</p>}
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2 text-[var(--text-secondary)]">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            <span className="font-medium text-[var(--text-primary)]">
              {entry.name}:
            </span>
            <span>{typeof entry.value === 'number' ? entry.value.toLocaleString('pt-BR') : entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ==========================================
// 1. PROJETOS CHARTS
// ==========================================
interface ProjetosChartsProps {
  presencasPorAcao: Array<{ nome: string; presencas: number; faltas: number }>;
  faixasEtarias: Array<{ faixa: string; total: number; cor: string }>;
  comunidades: Array<{ comunidade: string; total: number }>;
}

export function ProjetosCharts({
  presencasPorAcao,
  faixasEtarias,
  comunidades,
}: ProjetosChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico 1: Presença e Faltas nas Ações Recentes */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
            Presença vs. Faltas nas Ações Realizadas
          </h3>
          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded-md">
            Chamadas Reais
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Volume de adesão das crianças por ação comunitária de sábado.
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={presencasPorAcao}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis
                dataKey="nome"
                stroke="var(--text-muted)"
                fontSize={10}
                angle={-20}
                textAnchor="end"
                interval={0}
              />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }} />
              <Bar dataKey="presencas" name="Presentes" fill={PALETA_CORES.teal} radius={[4, 4, 0, 0]} />
              <Bar dataKey="faltas" name="Faltas" fill={PALETA_CORES.cinza} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Gráfico 2: Pirâmide Etária dos Beneficiários */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
            Distribuição por Faixa Etária
          </h3>
          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded-md">
            163 Beneficiários
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Proporção entre Primeira Infância, Crianças e Adolescentes atendidos.
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={faixasEtarias}
              layout="vertical"
              margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis type="number" stroke="var(--text-muted)" fontSize={11} />
              <YAxis dataKey="faixa" type="category" stroke="var(--text-muted)" fontSize={11} width={130} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" name="Beneficiários" radius={[0, 6, 6, 0]}>
                {faixasEtarias.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.cor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Gráfico 3: Cobertura por Território / Comunidade */}
      <Card className="p-5 space-y-3 lg:col-span-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
            Concentração Territorial dos Beneficiários
          </h3>
          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded-md">
            Bairros & Vilas
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Distribuição dos beneficiários pelas comunidades periféricas do território de atuação.
        </p>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={comunidades}
              margin={{ top: 10, right: 15, left: -20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="comunidade" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" name="Crianças e Jovens" fill={PALETA_CORES.laranja} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

// ==========================================
// 2. PEDAGOGIA CHARTS
// ==========================================
interface PedagogiaChartsProps {
  eixosData: Array<{ eixo: string; consolidado: number; emDesenvolvimento: number }>;
  instrumentosData: Array<{ nome: string; quantidade: number; cor: string }>;
}

export function PedagogiaCharts({
  eixosData,
  instrumentosData,
}: PedagogiaChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico 1: Eixos Socioemocionais */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
            Desenvolvimento por Eixo Socioemocional
          </h3>
          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded-md">
            Avaliações Pedagógicas
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Acompanhamento qualitativo de autonomia, resolução de conflitos e escuta ativa.
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={eixosData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="eixo" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }} />
              <Bar dataKey="consolidado" name="Consolidado / Autônomo" fill={PALETA_CORES.esmeralda} radius={[4, 4, 0, 0]} />
              <Bar dataKey="emDesenvolvimento" name="Em Desenvolvimento" fill={PALETA_CORES.ambar} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Gráfico 2: Instrumentos Metodológicos Cadastrados */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
            Instrumentos Pedagógicos em Uso
          </h3>
          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded-md">
            Governança da Pedagogia
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Documentos pedagógicos ativos no sistema para planejamento e acompanhamento.
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={instrumentosData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="nome" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="quantidade" name="Registros" radius={[6, 6, 0, 0]}>
                {instrumentosData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.cor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

// ==========================================
// 3. ADMINISTRAÇÃO CHARTS
// ==========================================
interface AdministracaoChartsProps {
  voluntariosPorArea: Array<{ name: string; value: number; color: string }>;
  reunioesPorTipo: Array<{ tipo: string; concluidas: number; agendadas: number }>;
}

export function AdministracaoCharts({
  voluntariosPorArea,
  reunioesPorTipo,
}: AdministracaoChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico 1: Voluntários por Área */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
            Distribuição Funcional da Equipe Voluntária
          </h3>
          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded-md">
            11 Voluntários Ativos
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Alocação de talentos por área de atuação dentro da estrutura organizacional.
        </p>
        <div className="h-64 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={voluntariosPorArea}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                label={({ name, percent }: any) =>
                  `${name || ''} (${((percent || 0) * 100).toFixed(0)}%)`
                }
              >
                {voluntariosPorArea.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Gráfico 2: Reuniões de Governança e Articulação */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
            Reuniões Institucionais & Advocacy
          </h3>
          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded-md">
            6 Encontros
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Reuniões com órgãos públicos (SEDIHPOP, CAEMA) e alinhamentos internos.
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reunioesPorTipo} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="tipo" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }} />
              <Bar dataKey="concluidas" name="Realizadas" fill={PALETA_CORES.azul} radius={[4, 4, 0, 0]} />
              <Bar dataKey="agendadas" name="Agendadas" fill={PALETA_CORES.ambar} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

// ==========================================
// 4. COMUNICAÇÃO CHARTS
// ==========================================
interface ComunicacaoChartsProps {
  statusConteudos: Array<{ status: string; total: number; cor: string }>;
  midiasPorProjeto: Array<{ projeto: string; pastas: number }>;
}

export function ComunicacaoCharts({
  statusConteudos,
  midiasPorProjeto,
}: ComunicacaoChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico 1: Status do Calendário Editorial */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
            Status das Peças do Calendário Editorial
          </h3>
          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded-md">
            13 Peças
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Fluxo de produção das postagens institucionais e de projetos.
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusConteudos} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="status" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" name="Peças de Comunicação" radius={[6, 6, 0, 0]}>
                {statusConteudos.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.cor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Gráfico 2: Acervo Fotográfico no Google Drive */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
            Acervo Audiovisual & Coberturas por Ação
          </h3>
          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded-md">
            19 Pastas Catalogadas
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Registros de fotos e vídeos catalogados para memória histórica institucional.
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={midiasPorProjeto} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis
                dataKey="projeto"
                stroke="var(--text-muted)"
                fontSize={10}
                angle={-15}
                textAnchor="end"
                interval={0}
              />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pastas" name="Pastas de Fotos/Vídeos" fill={PALETA_CORES.ambar} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

// ==========================================
// 5. FINANCEIRO CHARTS
// ==========================================
interface FinanceiroChartsProps {
  planosDisponiveis: Array<{ nome: string; valor: number; ciclo: string }>;
  projecaoRecorrencia: Array<{ cenario: string; receitaMensal: number }>;
}

export function FinanceiroCharts({
  planosDisponiveis,
  projecaoRecorrencia,
}: FinanceiroChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico 1: Planos de Apadrinhamento */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
            Planos de Apadrinhamento Estruturados
          </h3>
          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded-md">
            Ticket Mensal
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Modalidades de contribuição recorrente configuradas no banco de dados.
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={planosDisponiveis} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="nome" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} unit="R$" />
              <Tooltip
                formatter={(val: any) => [`R$ ${Number(val).toFixed(2)}`, 'Valor']}
                content={<CustomTooltip />}
              />
              <Bar dataKey="valor" name="Valor Mensal" fill={PALETA_CORES.esmeralda} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Gráfico 2: Projeção de Sustentabilidade Recorrente */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
            Potencial de Sustentabilidade por Faixa de Padrinhos
          </h3>
          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded-md">
            Receita Recorrente
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Simulação de receita mensal necessária para custeio dos lanches e materiais das oficinas.
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projecaoRecorrencia} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="cenario" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} unit="R$" />
              <Tooltip
                formatter={(val: any) => [`R$ ${Number(val).toLocaleString('pt-BR')}`, 'Receita Mensal']}
                content={<CustomTooltip />}
              />
              <Bar dataKey="receitaMensal" name="Receita Mensal Estimada" fill={PALETA_CORES.teal} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

// ==========================================
// 6. TECNOLOGIA CHARTS
// ==========================================
interface TecnologiaChartsProps {
  segurancaDados: Array<{ tipo: string; quantidade: number; cor: string }>;
  perfisUsuarios: Array<{ papel: string; usuarios: number }>;
}

export function TecnologiaCharts({
  segurancaDados,
  perfisUsuarios,
}: TecnologiaChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico 1: Digitalização e Segurança de Dados */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
            Transição Digital e Segurança da Informação
          </h3>
          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded-md">
            LGPD & ECA
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          163 prontuários infantis digitalizados com controle de acesso e criptografia.
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={segurancaDados} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="tipo" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="quantidade" name="Registros" radius={[6, 6, 0, 0]}>
                {segurancaDados.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.cor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Gráfico 2: Perfis com Acesso ao ELO */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
            Contas Administrativas Ativas
          </h3>
          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded-md">
            10 Usuários
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Distribuição dos papéis de acesso cadastrados na tabela profiles.
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={perfisUsuarios} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="papel" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="usuarios" name="Usuários Ativos" fill={PALETA_CORES.ciano} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
