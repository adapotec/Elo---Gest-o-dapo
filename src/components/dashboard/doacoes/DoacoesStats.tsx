'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Gift, TrendingUp, Users, HeartHandshake } from 'lucide-react';

interface DoacoesStatsProps {
  totalDoacoesValor: number;
  totalDoacoesCount: number;
  totalProgramasCount: number;
  mrrTotal: number;
  totalDoadoresCount: number;
}

export function DoacoesStats({
  totalDoacoesValor,
  totalDoacoesCount,
  totalProgramasCount,
  mrrTotal,
  totalDoadoresCount,
}: DoacoesStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4 flex items-center gap-4 border-l-4 border-l-[#1C9C82]">
        <div className="p-3 rounded-xl bg-[#1C9C82]/10 text-[#1C9C82]">
          <Gift className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Total Arrecadado (Avulso)</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">
            {totalDoacoesValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className="text-[11px] text-[var(--text-muted)]">{totalDoacoesCount} registros computados</p>
        </div>
      </Card>

      <Card className="p-4 flex items-center gap-4 border-l-4 border-l-emerald-500">
        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">MRR (Recorrente Estimado)</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">
            {mrrTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className="text-[11px] text-[var(--text-muted)]">Em programas ativos</p>
        </div>
      </Card>

      <Card className="p-4 flex items-center gap-4 border-l-4 border-l-blue-500">
        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
          <HeartHandshake className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Programas de Captação</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{totalProgramasCount}</p>
          <p className="text-[11px] text-[var(--text-muted)]">Programas cadastrados</p>
        </div>
      </Card>

      <Card className="p-4 flex items-center gap-4 border-l-4 border-l-purple-500">
        <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Doadores Únicos</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{totalDoadoresCount}</p>
          <p className="text-[11px] text-[var(--text-muted)]">Base consolidada de doadores</p>
        </div>
      </Card>
    </div>
  );
}
