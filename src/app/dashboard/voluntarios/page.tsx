'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import {
  VoluntariosEquipe,
  Voluntario,
} from '@/components/dashboard/voluntarios/VoluntariosEquipe';
import { VoluntariosSaude } from '@/components/dashboard/voluntarios/VoluntariosSaude';
import { VoluntariosRecesso } from '@/components/dashboard/voluntarios/VoluntariosRecesso';
import {
  Users,
  Heart,
  Calendar,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

type TabKey = 'equipe' | 'saude' | 'recesso';

interface TabItem {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}

const TABS: TabItem[] = [
  { key: 'equipe', label: 'Equipe & Habilidades', icon: Users, color: '#F2632D' },
  { key: 'saude', label: 'Saúde & Emergência', icon: Heart, color: '#EF4444' },
  { key: 'recesso', label: 'Recessos & Folgas', icon: Calendar, color: '#93368F' },
];

function VoluntariosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab') as TabKey | null;
  const [activeTab, setActiveTab] = useState<TabKey>(
    tabParam && ['equipe', 'saude', 'recesso'].includes(tabParam)
      ? tabParam
      : 'equipe'
  );

  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchVoluntarios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('voluntarios')
        .select('*')
        .eq('status', 'ativo')
        .order('nome_completo', { ascending: true });

      if (error) {
        console.error('Erro ao carregar voluntários:', error);
      } else if (data) {
        setVoluntarios(data as Voluntario[]);
      }
    } catch (err) {
      console.error('Erro inesperado ao buscar voluntários:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoluntarios();
  }, []);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    router.replace(`/dashboard/voluntarios?tab=${key}`);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* ── 1. CABEÇALHO DA PÁGINA (TOPBAR FIXO NO TOPO) ── */}
      <Topbar
        title="Equipe & Contatos"
        subtitle="Catálogo da equipe, habilidades, prontuário operacional de emergência e calendário de folgas."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchVoluntarios}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Atualizar
            </Button>

            <Link href="/dashboard/voluntarios/gestao">
              <Button variant="secondary" size="sm" icon={<ShieldCheck className="w-4 h-4 text-[#1C9C82]" />}>
                Gestão de Pessoas
              </Button>
            </Link>
          </div>
        }
      />

      {/* ── 2. CONTAINER COM ESPAÇAMENTO AREJADO E CENTRALIZADO (MAX-W-7XL) ── */}
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
          {activeTab === 'equipe' && (
            <VoluntariosEquipe
              voluntarios={voluntarios}
              loading={loading}
              onRefresh={fetchVoluntarios}
            />
          )}

          {activeTab === 'saude' && (
            <VoluntariosSaude
              voluntarios={voluntarios}
              loading={loading}
            />
          )}

          {activeTab === 'recesso' && (
            <VoluntariosRecesso />
          )}
        </div>
      </div>
    </div>
  );
}

export default function VoluntariosPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
        </div>
      }
    >
      <VoluntariosContent />
    </Suspense>
  );
}
