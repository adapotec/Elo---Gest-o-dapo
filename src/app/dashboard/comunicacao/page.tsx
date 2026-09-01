'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import {
  Calendar as CalendarIcon,
  Megaphone,
  TrendingUp,
  FolderOpen,
  Plus,
} from 'lucide-react';

import {
  ComunicacaoCalendario,
  ConteudoItem,
} from '@/components/dashboard/comunicacao/ComunicacaoCalendario';
import {
  ComunicacaoCampanhas,
  CampanhaItem,
} from '@/components/dashboard/comunicacao/ComunicacaoCampanhas';
import {
  ComunicacaoIndicadores,
  MetricasRedeRecord,
  MetaConfigRecord,
} from '@/components/dashboard/comunicacao/ComunicacaoIndicadores';
import {
  ComunicacaoGaleria,
  GaleriaItem,
} from '@/components/dashboard/comunicacao/ComunicacaoGaleria';
import { Voluntario } from '@/components/dashboard/voluntarios/VoluntariosEquipe';

type TabKey = 'calendario' | 'campanhas' | 'indicadores' | 'galeria';

interface TabItem {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}

const TABS: TabItem[] = [
  { key: 'calendario', label: 'Calendário Editorial', icon: CalendarIcon, color: '#F2632D' },
  { key: 'campanhas', label: 'Campanhas Estratégicas', icon: Megaphone, color: '#93368F' },
  { key: 'indicadores', label: 'Indicadores & Redes', icon: TrendingUp, color: '#3B82F6' },
  { key: 'galeria', label: 'Galeria & Drive', icon: FolderOpen, color: '#1C9C82' },
];

function ComunicacaoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab') as TabKey | null;
  const [activeTab, setActiveTab] = useState<TabKey>(
    tabParam && ['calendario', 'campanhas', 'indicadores', 'galeria'].includes(tabParam)
      ? tabParam
      : 'calendario'
  );

  const [conteudos, setConteudos] = useState<ConteudoItem[]>([]);
  const [campanhas, setCampanhas] = useState<CampanhaItem[]>([]);
  const [galeria, setGaleria] = useState<GaleriaItem[]>([]);
  const [metricas, setMetricas] = useState<MetricasRedeRecord[]>([]);
  const [metaConfig, setMetaConfig] = useState<MetaConfigRecord | null>(null);

  const [projetos, setProjetos] = useState<{ id: string; nome: string; cor_identificacao?: string }[]>([]);
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Carregar em paralelo dados auxiliares e do módulo
      const [
        respProjetos,
        respVoluntarios,
        respConteudos,
        respCampanhas,
        respGaleria,
        respMetricas,
        respMetaConfig,
      ] = await Promise.all([
        supabase.from('projetos_sociais').select('id, nome, cor_identificacao').order('nome'),
        supabase.from('voluntarios').select('*').eq('status', 'ativo').order('nome_completo'),
        supabase.from('conteudos_comunicacao').select('*, projetos_sociais(nome, cor_identificacao), campanhas_comunicacao(titulo), voluntarios(nome_completo, avatar_url)').order('data_publicacao', { ascending: true }),
        supabase.from('campanhas_comunicacao').select('*, projetos_sociais(nome, cor_identificacao), voluntarios(nome_completo)').order('created_at', { ascending: false }),
        supabase.from('galeria_midia_acoes').select('*, projetos_sociais(nome, cor_identificacao), voluntarios(nome_completo)').order('data_evento', { ascending: false }),
        supabase.from('metricas_redes_sociais').select('*').order('ano', { ascending: false }).order('mes', { ascending: false }),
        supabase.from('meta_integracao_config').select('*').maybeSingle(),
      ]);

      if (respProjetos.data) setProjetos(respProjetos.data);
      if (respVoluntarios.data) setVoluntarios(respVoluntarios.data as Voluntario[]);

      if (!respConteudos.error && respConteudos.data) {
        setConteudos(respConteudos.data as ConteudoItem[]);
      } else {
        // Fallback local se a tabela for recém-criada
        const stored = localStorage.getItem('elo_comunicacao_conteudos');
        if (stored) setConteudos(JSON.parse(stored));
      }

      if (!respCampanhas.error && respCampanhas.data) {
        setCampanhas(respCampanhas.data as CampanhaItem[]);
      } else {
        const stored = localStorage.getItem('elo_comunicacao_campanhas');
        if (stored) setCampanhas(JSON.parse(stored));
      }

      if (!respGaleria.error && respGaleria.data) {
        setGaleria(respGaleria.data as GaleriaItem[]);
      } else {
        const stored = localStorage.getItem('elo_comunicacao_galeria');
        if (stored) setGaleria(JSON.parse(stored));
      }

      if (!respMetricas.error && respMetricas.data) {
        setMetricas(respMetricas.data as MetricasRedeRecord[]);
      }

      if (respMetaConfig.data) {
        setMetaConfig(respMetaConfig.data as MetaConfigRecord);
      }
    } catch (err) {
      console.error('Erro ao carregar dados de comunicação:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    router.replace(`/dashboard/comunicacao?tab=${key}`, { scroll: false });
  };

  // Salvar Conteúdo (Calendário)
  const handleSaveConteudo = async (conteudo: Partial<ConteudoItem>) => {
    try {
      if (conteudo.id) {
        const { error } = await supabase
          .from('conteudos_comunicacao')
          .update({ ...conteudo, updated_at: new Date().toISOString() })
          .eq('id', conteudo.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('conteudos_comunicacao')
          .insert([conteudo]);
        if (error) throw error;
      }
      loadAllData();
    } catch (err: any) {
      // Fallback local
      const newId = conteudo.id || `local-${Date.now()}`;
      const updatedList = [
        ...conteudos.filter((c) => c.id !== conteudo.id),
        { ...conteudo, id: newId } as ConteudoItem,
      ];
      setConteudos(updatedList);
      localStorage.setItem('elo_comunicacao_conteudos', JSON.stringify(updatedList));
    }
  };

  const handleDeleteConteudo = async (id: string) => {
    if (!confirm('Deseja realmente excluir este conteúdo do calendário editorial?')) return;
    try {
      await supabase.from('conteudos_comunicacao').delete().eq('id', id);
    } catch (e) {}
    setConteudos((prev) => prev.filter((c) => c.id !== id));
  };

  // Salvar Campanha
  const handleSaveCampanha = async (campanha: Partial<CampanhaItem>) => {
    try {
      if (campanha.id) {
        const { error } = await supabase
          .from('campanhas_comunicacao')
          .update({ ...campanha, updated_at: new Date().toISOString() })
          .eq('id', campanha.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('campanhas_comunicacao')
          .insert([campanha]);
        if (error) throw error;
      }
      loadAllData();
    } catch (err: any) {
      const newId = campanha.id || `local-camp-${Date.now()}`;
      const updatedList = [
        ...campanhas.filter((c) => c.id !== campanha.id),
        { ...campanha, id: newId } as CampanhaItem,
      ];
      setCampanhas(updatedList);
      localStorage.setItem('elo_comunicacao_campanhas', JSON.stringify(updatedList));
    }
  };

  const handleDeleteCampanha = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta campanha estratégica?')) return;
    try {
      await supabase.from('campanhas_comunicacao').delete().eq('id', id);
    } catch (e) {}
    setCampanhas((prev) => prev.filter((c) => c.id !== id));
  };

  // Salvar Galeria
  const handleSaveGaleria = async (item: Partial<GaleriaItem>) => {
    try {
      if (item.id) {
        const { error } = await supabase
          .from('galeria_midia_acoes')
          .update(item)
          .eq('id', item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('galeria_midia_acoes')
          .insert([item]);
        if (error) throw error;
      }
      loadAllData();
    } catch (err: any) {
      const newId = item.id || `local-gal-${Date.now()}`;
      const updatedList = [
        ...galeria.filter((g) => g.id !== item.id),
        { ...item, id: newId } as GaleriaItem,
      ];
      setGaleria(updatedList);
      localStorage.setItem('elo_comunicacao_galeria', JSON.stringify(updatedList));
    }
  };

  const handleDeleteGaleria = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta pasta da galeria?')) return;
    try {
      await supabase.from('galeria_midia_acoes').delete().eq('id', id);
    } catch (e) {}
    setGaleria((prev) => prev.filter((g) => g.id !== id));
  };

  // Salvar Métricas / Meta
  const handleSaveMetricas = async (metricasRecord: MetricasRedeRecord) => {
    try {
      await supabase
        .from('metricas_redes_sociais')
        .upsert(metricasRecord, { onConflict: 'mes,ano' });
      loadAllData();
    } catch (e) {
      setMetricas((prev) => [
        ...prev.filter((m) => !(m.mes === metricasRecord.mes && m.ano === metricasRecord.ano)),
        metricasRecord,
      ]);
    }
  };

  const handleSaveMetaConfig = async (config: MetaConfigRecord) => {
    try {
      await supabase.from('meta_integracao_config').upsert(config);
      setMetaConfig(config);
    } catch (e) {
      setMetaConfig(config);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Comunicação & Mídia"
        subtitle="Calendário Editorial, Campanhas Estratégicas, Redes Sociais e Acervo"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6 flex-1 overflow-y-auto">
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
          {activeTab === 'calendario' && (
            <ComunicacaoCalendario
              conteudos={conteudos}
              projetos={projetos}
              campanhas={campanhas}
              voluntarios={voluntarios}
              loading={loading}
              onRefresh={loadAllData}
              onSaveConteudo={handleSaveConteudo}
              onDeleteConteudo={handleDeleteConteudo}
            />
          )}

          {activeTab === 'campanhas' && (
            <ComunicacaoCampanhas
              campanhas={campanhas}
              conteudos={conteudos}
              projetos={projetos}
              voluntarios={voluntarios}
              loading={loading}
              onRefresh={loadAllData}
              onSaveCampanha={handleSaveCampanha}
              onDeleteCampanha={handleDeleteCampanha}
            />
          )}

          {activeTab === 'indicadores' && (
            <ComunicacaoIndicadores
              metricas={metricas}
              metaConfig={metaConfig}
              conteudos={conteudos}
              projetos={projetos}
              loading={loading}
              onRefresh={loadAllData}
              onSaveMetricas={handleSaveMetricas}
              onSaveMetaConfig={handleSaveMetaConfig}
            />
          )}

          {activeTab === 'galeria' && (
            <ComunicacaoGaleria
              itens={galeria}
              projetos={projetos}
              voluntarios={voluntarios}
              loading={loading}
              onRefresh={loadAllData}
              onSaveGaleria={handleSaveGaleria}
              onDeleteGaleria={handleDeleteGaleria}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ComunicacaoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--text-muted)]">Carregando Comunicação...</div>}>
      <ComunicacaoContent />
    </Suspense>
  );
}
