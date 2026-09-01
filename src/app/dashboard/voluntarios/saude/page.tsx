'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { VoluntariosSaude } from '@/components/dashboard/voluntarios/VoluntariosSaude';
import { Voluntario } from '@/components/dashboard/voluntarios/VoluntariosEquipe';
import { RefreshCw, Heart } from 'lucide-react';

function SaudeEmergenciaContent() {
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
        console.error('Erro ao carregar dados de saúde:', error);
      } else if (data) {
        setVoluntarios(data as Voluntario[]);
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
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
        title="Saúde & Emergência"
        subtitle="Prontuário operacional da equipe para segurança em campo e emissão de crachá de socorro."
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchVoluntarios}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Atualizar
          </Button>
        }
      />

      {/* ── 2. CONTAINER CENTRALIZADO (MAX-W-7XL) ── */}
      <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 flex-1 overflow-y-auto transition-all duration-300">
        <VoluntariosSaude
          voluntarios={voluntarios}
          loading={loading}
        />
      </div>
    </div>
  );
}

export default function SaudeEmergenciaPage() {
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
