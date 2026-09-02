'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import {
  VoluntariosEquipe,
  Voluntario,
} from '@/components/dashboard/voluntarios/VoluntariosEquipe';
import { RefreshCw } from 'lucide-react';
import { getVoluntarios, getCachedVoluntariosSync } from '@/lib/services/voluntariosService';

function ListaVoluntariosContent() {
  // Inicializa instantaneamente com dados do cache (0ms - sem tela de loading)
  const initialData = getCachedVoluntariosSync('ativo');
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>(initialData);
  const [loading, setLoading] = useState(initialData.length === 0);

  const fetchVoluntarios = async (force = false) => {
    try {
      if (voluntarios.length === 0 || force) {
        setLoading(true);
      }
      const data = await getVoluntarios({ status: 'ativo', forceRefresh: force });
      setVoluntarios(data);
    } catch (err) {
      console.error('Erro ao carregar voluntários:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoluntarios();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* ── 1. CABEÇALHO DA PÁGINA ── */}
      <Topbar
        title="Lista de Voluntários"
        subtitle="Catálogo da equipe, competências, WhatsApp direto e indicadores de horas trabalhadas."
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchVoluntarios(true)}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Atualizar
          </Button>
        }
      />

      {/* ── 2. CONTAINER CENTRALIZADO (MAX-W-7XL) ── */}
      <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 flex-1 overflow-y-auto transition-all duration-300">
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
