'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { createClient } from '@/lib/supabase/client';
import {
  ComunicacaoIndicadores,
  MetricasRedeRecord,
  MetaConfigRecord,
} from '@/components/dashboard/comunicacao/ComunicacaoIndicadores';
import { ConteudoItem } from '@/components/dashboard/comunicacao/ComunicacaoCalendario';

const safeSetItem = (key: string, value: any) => {
  try {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  } catch (e) {
    console.warn(`[localStorage] Falha ao salvar chave ${key}:`, e);
  }
};

async function safeFetch<T>(
  promise: PromiseLike<{ data: T | null; error: any }>,
  timeoutMs = 8000
): Promise<{ data: T | null; error: any }> {
  try {
    const timeout = new Promise<{ data: null; error: any }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error('Timeout') }), timeoutMs)
    );
    return await Promise.race([Promise.resolve(promise), timeout]);
  } catch (err: any) {
    return { data: null, error: err };
  }
}

function IndicadoresContent() {
  const [metricas, setMetricas] = useState<MetricasRedeRecord[]>([]);
  const [metaConfig, setMetaConfig] = useState<MetaConfigRecord | null>(null);
  const [conteudos, setConteudos] = useState<ConteudoItem[]>([]);
  const [projetos, setProjetos] = useState<{ id: string; nome: string; cor_identificacao?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    try {
      const cachedMetricas = localStorage.getItem('elo_comunicacao_metricas');
      const cachedMetaConfig = localStorage.getItem('elo_comunicacao_meta_config');
      const cachedCont = localStorage.getItem('elo_comunicacao_conteudos');
      const cachedProj = localStorage.getItem('elo_comunicacao_projetos');

      if (cachedMetricas) setMetricas(JSON.parse(cachedMetricas));
      if (cachedMetaConfig) setMetaConfig(JSON.parse(cachedMetaConfig));
      if (cachedCont) setConteudos(JSON.parse(cachedCont));
      if (cachedProj) setProjetos(JSON.parse(cachedProj));

      if (cachedMetricas || cachedCont) {
        setLoading(false);
      }
    } catch (e) {
      console.warn('Erro ao restaurar cache inicial de indicadores:', e);
    }

    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [respMetricas, respMetaConfig, respCont, respProj] = await Promise.all([
        safeFetch(
          supabase
            .from('metricas_redes_sociais')
            .select('*')
            .order('ano', { ascending: false })
            .order('mes', { ascending: false })
        ),
        safeFetch(supabase.from('meta_integracao_config').select('*').maybeSingle()),
        safeFetch(
          supabase
            .from('conteudos_comunicacao')
            .select('*, projetos_sociais(nome, cor_identificacao), responsavel:voluntarios(nome_completo)')
            .order('data_prevista', { ascending: false })
        ),
        safeFetch(
          supabase
            .from('projetos_sociais')
            .select('id, nome, cor_identificacao')
            .order('nome')
        ),
      ]);

      if (respMetricas?.data) {
        setMetricas(respMetricas.data as MetricasRedeRecord[]);
        safeSetItem('elo_comunicacao_metricas', respMetricas.data);
      }
      if (respMetaConfig?.data) {
        setMetaConfig(respMetaConfig.data as MetaConfigRecord);
        safeSetItem('elo_comunicacao_meta_config', respMetaConfig.data);
      }
      if (respCont?.data) {
        setConteudos(respCont.data as ConteudoItem[]);
        safeSetItem('elo_comunicacao_conteudos', respCont.data);
      }
      if (respProj?.data) {
        setProjetos(respProj.data as any);
        safeSetItem('elo_comunicacao_projetos', respProj.data);
      }
    } catch (err) {
      console.error('Erro ao carregar dados de indicadores:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Indicadores de Comunicação"
        subtitle="Métricas oficiais, inteligência analítica do Instagram e orientações de integração"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6 flex-1 overflow-y-auto">
        <ComunicacaoIndicadores
          metricas={metricas}
          metaConfig={metaConfig}
          conteudos={conteudos}
          projetos={projetos}
          loading={loading}
          onRefresh={loadData}
        />
      </div>
    </div>
  );
}

export default function IndicadoresPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-[var(--text-muted)]">
          Carregando Indicadores...
        </div>
      }
    >
      <IndicadoresContent />
    </Suspense>
  );
}
