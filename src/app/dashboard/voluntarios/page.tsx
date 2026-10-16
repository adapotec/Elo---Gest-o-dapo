'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import {
  VoluntariosEquipe,
  Voluntario,
} from '@/components/dashboard/voluntarios/VoluntariosEquipe';
import { RefreshCw } from 'lucide-react';
import { getVoluntarios, getCachedVoluntariosSync } from '@/lib/services/voluntariosService';

function ListaVoluntariosContent() {
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVoluntarios = async (force = false) => {
    try {
      if (force) {
        setLoading(true);
      }
      // Carrega 'todos' para que os filtros de ativos e inativos funcionem instantaneamente no cliente
      const data = await getVoluntarios({ status: 'todos', forceRefresh: force });
      setVoluntarios(data);
    } catch (err) {
      console.error('Erro ao carregar equipe de voluntários:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cached = getCachedVoluntariosSync('todos');
    if (cached.length > 0) {
      setVoluntarios(cached);
      setLoading(false);
    }
    fetchVoluntarios();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* ── 1. CABEÇALHO DA PÁGINA (CONSULTIVO) ── */}
      <Topbar
        title="Lista de Voluntários"
        subtitle="Catálogo da equipe, competências, WhatsApp direto e indicadores de horas trabalhadas."
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchVoluntarios(true)}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            className="min-h-[44px]"
          >
            Atualizar
          </Button>
        }
      />

      {/* ── 2. CONTAINER CENTRALIZADO COM BREADCRUMB (MAX-W-7XL) ── */}
      <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 flex-1 overflow-y-auto transition-all duration-300">
        {/* Breadcrumb Estrutural */}
        <nav aria-label="Navegação estrutural" className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-medium">
          <Link href="/dashboard" className="hover:text-[var(--color-primary)] transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-[var(--text-primary)] font-semibold">Equipe de Voluntários</span>
        </nav>

        <VoluntariosEquipe
          voluntarios={voluntarios}
          loading={loading && voluntarios.length === 0}
          onRefresh={() => fetchVoluntarios(true)}
        />
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
      <ListaVoluntariosContent />
    </Suspense>
  );
}
