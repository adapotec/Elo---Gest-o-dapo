'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { VoluntariosSaude } from '@/components/dashboard/voluntarios/VoluntariosSaude';
import { Voluntario } from '@/components/dashboard/voluntarios/VoluntariosEquipe';
import { RefreshCw, ChevronRight } from 'lucide-react';
import { getVoluntarios, getCachedVoluntariosSync } from '@/lib/services/voluntariosService';

function SaudeEmergenciaContent() {
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVoluntarios = async (force = false) => {
    try {
      if (force) {
        setLoading(true);
      }
      const data = await getVoluntarios({ status: 'ativo', forceRefresh: force });
      setVoluntarios(data);
    } catch (err) {
      console.error('Erro inesperado:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cached = getCachedVoluntariosSync('ativo');
    if (cached.length > 0) {
      setVoluntarios(cached);
      setLoading(false);
    }
    fetchVoluntarios();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* ── 1. CABEÇALHO DA PÁGINA ── */}
      <Topbar
        title="Saúde & Emergência"
        subtitle="Prontuário operacional da equipe para segurança em campo e emissão de crachá de socorro."
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchVoluntarios(true)}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            className="min-h-[44px] px-3.5"
          >
            Atualizar
          </Button>
        }
      />

      {/* ── 2. CONTAINER CENTRALIZADO (MAX-W-7XL) ── */}
      <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 flex-1 overflow-y-auto transition-all duration-300">
        {/* Breadcrumb de Navegação */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-medium">
          <Link href="/dashboard" className="hover:text-[var(--text-primary)] transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/dashboard/voluntarios" className="hover:text-[var(--text-primary)] transition-colors">
            Voluntários
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[var(--text-primary)] font-semibold" aria-current="page">
            Saúde &amp; Emergência
          </span>
        </nav>

        <VoluntariosSaude
          voluntarios={voluntarios}
          loading={loading && voluntarios.length === 0}
        />
      </div>
    </div>
  );
}

export default function SaudePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
        </div>
      }
    >
      <SaudeEmergenciaContent />
    </Suspense>
  );
}
