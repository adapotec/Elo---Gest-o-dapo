'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { VoluntariosEscalaDisponibilidade } from '@/components/dashboard/voluntarios/VoluntariosEscalaDisponibilidade';
import { VoluntariosRecesso } from '@/components/dashboard/voluntarios/VoluntariosRecesso';
import { Calendar, Coffee, Sparkles } from 'lucide-react';

type TabKey = 'escala' | 'folgas';

interface TabItem {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}

const TABS: TabItem[] = [
  { key: 'escala', label: 'Escala Mensal & Disponibilidade', icon: Calendar, color: '#F2632D' },
  { key: 'folgas', label: 'Folgas & Recessos', icon: Coffee, color: '#93368F' },
];

function EscalasContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab') as TabKey | null;
  const [activeTab, setActiveTab] = useState<TabKey>(
    tabParam && ['escala', 'folgas'].includes(tabParam)
      ? tabParam
      : 'escala'
  );

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    router.replace(`/dashboard/voluntarios/escalas?tab=${key}`);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* ── 1. CABEÇALHO DA PÁGINA ── */}
      <Topbar
        title="Escalas & Recessos"
        subtitle="Disponibilidade mensal para ações e projetos, solicitações de 2ª folga e recesso anual."
      />

      {/* ── 2. CONTAINER CENTRALIZADO (MAX-W-7XL) ── */}
      <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 flex-1 overflow-y-auto transition-all duration-300">
        {/* Seletor de Abas Superiores */}
        <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl shadow-[var(--shadow-card)] overflow-x-auto custom-scrollbar">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-xs border border-[var(--border-default)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/50'
                }`}
              >
                <div
                  className="w-5 h-5 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: isActive ? `${tab.color}20` : 'transparent',
                    color: isActive ? tab.color : 'currentColor',
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Conteúdo Renderizado da Aba Ativa */}
        <div className="animate-in fade-in duration-200">
          {activeTab === 'escala' && (
            <VoluntariosEscalaDisponibilidade />
          )}

          {activeTab === 'folgas' && (
            <VoluntariosRecesso />
          )}
        </div>
      </div>
    </div>
  );
}

export default function EscalasPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
        </div>
      }
    >
      <EscalasContent />
    </Suspense>
  );
}
