'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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

export interface MensalData {
  mes: string;
  doacoes: number;
  inscricoes: number;
  entradasEstoque: number;
  saidasEstoque: number;
}

export interface ProjetoMetric {
  nome: string;
  cor: string;
  inscritos: number;
  meta: number;
  taxa: number;
}

export interface AreaVoluntario {
  name: string;
  value: number;
  color: string;
}

interface IndicadoresChartsProps {
  dadosMensais: MensalData[];
  projetosMetrics: ProjetoMetric[];
  voluntariosPorArea: AreaVoluntario[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-xl text-xs">
        <p className="font-bold text-[var(--text-primary)] mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2 text-[var(--text-secondary)]">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span>
              {entry.name}: {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function IndicadoresCharts({
  dadosMensais,
  projetosMetrics,
  voluntariosPorArea,
}: IndicadoresChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico 1: Evolução Mensal de Doações */}
      <Card className="p-6 space-y-4">
        <h3 className="font-bold text-base text-[var(--text-primary)]">
          Evolução Mensal de Arrecadação (R$)
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dadosMensais} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDoacoes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F2632D" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#F2632D" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="mes" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="doacoes"
                name="Doações (R$)"
                stroke="#F2632D"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorDoacoes)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Gráfico 2: Beneficiários por Projeto Social */}
      <Card className="p-6 space-y-4">
        <h3 className="font-bold text-base text-[var(--text-primary)]">
          Beneficiários Inscritos por Projeto
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projetosMetrics} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="nome" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="inscritos" name="Inscritos" radius={[6, 6, 0, 0]}>
                {projetosMetrics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.cor || '#F2632D'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Gráfico 3: Voluntários por Área de Atuação */}
      <Card className="p-6 space-y-4 lg:col-span-2">
        <h3 className="font-bold text-base text-[var(--text-primary)]">
          Distribuição de Voluntários por Área de Atuação
        </h3>
        <div className="h-72 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={voluntariosPorArea}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }: { name?: string; percent?: number }) =>
                  `${name || ''} (${((percent || 0) * 100).toFixed(0)}%)`
                }
              >
                {voluntariosPorArea.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
