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
import { VoluntariosDocumentos } from '@/components/dashboard/voluntarios/VoluntariosDocumentos';
import {
  Users,
  Heart,
  Calendar,
  FileText,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

type TabKey = 'equipe' | 'saude' | 'recesso' | 'documentos';

interface TabItem {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}

const TABS: TabItem[] = [
  { key: 'equipe', label: 'Equipe & Voluntários', icon: Users, color: '#F2632D' },
  { key: 'saude', label: 'Saúde & Emergência', icon: Heart, color: '#EF4444' },
  { key: 'recesso', label: 'Recessos & Folgas', icon: Calendar, color: '#93368F' },
  { key: 'documentos', label: 'Documentos & Certificados', icon: FileText, color: '#1C9C82' },
];

function VoluntariosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab') as TabKey | null;
  const [activeTab, setActiveTab] = useState<TabKey>(
    tabParam && ['equipe', 'saude', 'recesso', 'documentos'].includes(tabParam)
      ? tabParam
      : 'equipe'
  );

  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para navegação contextual entre abas
  const [voluntarioParaDoc, setVoluntarioParaDoc] = useState<Voluntario | null>(null);
  const [tipoDocContexto, setTipoDocContexto] = useState<'termo' | 'certificado' | null>(null);

  const supabase = createClient();

  const fetchVoluntarios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('voluntarios')
        .select('*')
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

  const handleSelectParaDocumento = (vol: Voluntario, tipo: 'termo' | 'certificado') => {
    setVoluntarioParaDoc(vol);
    setTipoDocContexto(tipo);
    handleTabChange('documentos');
  };

  return (
    <div className="space-y-6">
      {/* ── 1. CABEÇALHO DA PÁGINA (TOPBAR) ── */}
      <Topbar
        title="Gestão de Voluntários & Equipe"
        subtitle="Ciclo de vida, prontuário operacional de saúde, recessos e emissão de documentos oficiais timbrados."
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

            <Link href="/dashboard/voluntarios/novo">
              <Button size="sm" icon={<Plus className="w-4 h-4" />}>
                Novo Voluntário
              </Button>
            </Link>
          </div>
        }
      />

      {/* ── 2. SELETOR DE ABAS PRINCIPAIS ── */}
      <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl shadow-[var(--shadow-card)] overflow-x-auto custom-scrollbar">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-xs border border-[var(--border-default)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/50'
              }`}
            >
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: isActive ? `${tab.color}20` : 'transparent',
                  color: isActive ? tab.color : 'currentColor',
                }}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── 3. RENDERIZAÇÃO DA ABA ATIVA ── */}
      <div className="animate-in fade-in duration-200">
        {activeTab === 'equipe' && (
          <VoluntariosEquipe
            voluntarios={voluntarios}
            loading={loading}
            onRefresh={fetchVoluntarios}
            onSelectParaDocumento={handleSelectParaDocumento}
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

        {activeTab === 'documentos' && (
          <VoluntariosDocumentos
            voluntarios={voluntarios}
            voluntarioPreSelecionado={voluntarioParaDoc}
            tipoDocInicial={tipoDocContexto}
          />
        )}
      </div>
    </div>
  );
}

export default function VoluntariosPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm text-[var(--text-muted)]">
          Carregando módulo de voluntários...
        </div>
      }
    >
      <VoluntariosContent />
    </Suspense>
  );
}
