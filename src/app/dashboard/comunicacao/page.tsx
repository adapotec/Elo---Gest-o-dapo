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
}

const TABS: TabItem[] = [
  { key: 'calendario', label: 'Calendário Editorial', icon: CalendarIcon },
  { key: 'campanhas', label: 'Campanhas Estratégicas', icon: Megaphone },
  { key: 'indicadores', label: 'Indicadores & Redes', icon: TrendingUp },
  { key: 'galeria', label: 'Galeria & Drive', icon: FolderOpen },
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

  // Sincronização leve em segundo plano apenas de conteúdos
  const loadConteudosOnly = async () => {
    try {
      const { data, error } = await supabase
        .from('conteudos_comunicacao')
        .select('*, projetos_sociais(nome, cor_identificacao), campanhas_comunicacao(titulo), voluntarios(nome_completo, avatar_url)')
        .order('data_publicacao', { ascending: true });
      if (!error && data) {
        setConteudos(data as ConteudoItem[]);
        localStorage.setItem('elo_comunicacao_conteudos', JSON.stringify(data));
      }
    } catch (e) {
      console.warn('Sincronização de conteúdos:', e);
    }
  };

  // Sincronização leve em segundo plano apenas de campanhas
  const loadCampanhasOnly = async () => {
    try {
      const { data, error } = await supabase
        .from('campanhas_comunicacao')
        .select('*, projetos_sociais(nome, cor_identificacao), voluntarios(nome_completo)')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setCampanhas(data as CampanhaItem[]);
        localStorage.setItem('elo_comunicacao_campanhas', JSON.stringify(data));
      }
    } catch (e) {
      console.warn('Sincronização de campanhas:', e);
    }
  };

  // Sincronização leve em segundo plano apenas da galeria
  const loadGaleriaOnly = async () => {
    try {
      const { data, error } = await supabase
        .from('galeria_midia_acoes')
        .select('*, projetos_sociais(nome, cor_identificacao), voluntarios(nome_completo)')
        .order('data_evento', { ascending: false });
      if (!error && data) {
        setGaleria(data as GaleriaItem[]);
        localStorage.setItem('elo_comunicacao_galeria', JSON.stringify(data));
      }
    } catch (e) {
      console.warn('Sincronização de galeria:', e);
    }
  };

  // Salvar Conteúdo / Material com Atualização Otimista Instantânea (0ms)
  const handleSaveConteudo = async (conteudo: Partial<ConteudoItem>) => {
    try {
      const textoDescricao = (conteudo.observacoes || conteudo.descricao || '').trim() || null;
      const textoLegenda = (conteudo.roteiro_legenda || '').trim() || null;

      const payload: Record<string, any> = {
        titulo: conteudo.titulo,
        data_publicacao: conteudo.data_publicacao ? new Date(conteudo.data_publicacao).toISOString() : new Date().toISOString(),
        tipo_conteudo: conteudo.tipo_conteudo || 'reels',
        descricao: textoDescricao,
        observacoes: textoDescricao,
        roteiro_legenda: textoLegenda,
        projeto_id: conteudo.projeto_id || null,
        campanha_id: conteudo.campanha_id || null,
        status: conteudo.status || 'nao_iniciado',
        responsavel_id: conteudo.responsavel_id || null,
        categoria: conteudo.categoria || 'engajamento',
        link_producao: conteudo.link_producao || null,
        link_publicacao: conteudo.link_publicacao || null,
        metricas: conteudo.metricas || { alcance: 0, curtidas: 0, salvamentos: 0, compartilhamentos: 0 },
        updated_at: new Date().toISOString(),
      };

      const proj = projetos.find((p) => p.id === conteudo.projeto_id);
      const camp = campanhas.find((c) => c.id === conteudo.campanha_id);
      const vol = voluntarios.find((v) => v.id === conteudo.responsavel_id);

      if (conteudo.id && !conteudo.id.startsWith('local-')) {
        // 1. Atualização Otimista Imediata na tabela (0ms de espera)
        setConteudos((prev) =>
          prev.map((c) =>
            c.id === conteudo.id
              ? ({
                  ...c,
                  ...payload,
                  projetos_sociais: proj ? { nome: proj.nome, cor_identificacao: proj.cor_identificacao } : null,
                  campanhas_comunicacao: camp ? { titulo: camp.titulo } : null,
                  voluntarios: vol ? { nome_completo: vol.nome_completo, avatar_url: vol.avatar_url } : null,
                } as ConteudoItem)
              : c
          )
        );

        // 2. Gravar no Supabase em segundo plano
        const { error } = await supabase
          .from('conteudos_comunicacao')
          .update(payload)
          .eq('id', conteudo.id);
        if (error) throw error;
      } else {
        const tempId = `temp-${Date.now()}`;
        const novoItem: ConteudoItem = {
          id: tempId,
          ...payload,
          projetos_sociais: proj ? { nome: proj.nome, cor_identificacao: proj.cor_identificacao } : null,
          campanhas_comunicacao: camp ? { titulo: camp.titulo } : null,
          voluntarios: vol ? { nome_completo: vol.nome_completo, avatar_url: vol.avatar_url } : null,
        } as ConteudoItem;

        // 1. Atualização Otimista Imediata (0ms)
        setConteudos((prev) => [novoItem, ...prev]);

        // 2. Inserir no Supabase e atualizar ID
        const { data: inserted, error } = await supabase
          .from('conteudos_comunicacao')
          .insert([payload])
          .select('id')
          .single();
        if (error) throw error;

        if (inserted?.id) {
          setConteudos((prev) =>
            prev.map((c) => (c.id === tempId ? { ...c, id: inserted.id } : c))
          );
        }
      }

      // Sincronização leve em segundo plano sem bloquear a UI
      loadConteudosOnly();
    } catch (err: any) {
      console.warn('Fallback local ao salvar conteúdo:', err);
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
    setConteudos((prev) => prev.filter((c) => c.id !== id));
    try {
      await supabase.from('conteudos_comunicacao').delete().eq('id', id);
    } catch (e) {}
  };

  // Salvar Campanha com Atualização Otimista Imediata
  const handleSaveCampanha = async (campanha: Partial<CampanhaItem>) => {
    try {
      const payload: Record<string, any> = {
        titulo: campanha.titulo,
        projeto_id: campanha.projeto_id || null,
        responsavel_id: campanha.responsavel_id || null,
        status: campanha.status || 'planejamento',
        data_inicio: campanha.data_inicio || null,
        data_fim: campanha.data_fim || null,
        resumo: campanha.resumo || null,
        diagnostico_contexto: campanha.diagnostico_contexto || null,
        personas_publico: campanha.personas_publico || {},
        objetivos: campanha.objetivos || {},
        estrategia_narrativa: campanha.estrategia_narrativa || {},
        gatilhos_persuasao: campanha.gatilhos_persuasao || null,
        canais_ferramentas: campanha.canais_ferramentas || [],
        recursos_equipe: campanha.recursos_equipe || [],
        indicadores_esperados: campanha.indicadores_esperados || {},
        updated_at: new Date().toISOString(),
      };

      const proj = projetos.find((p) => p.id === campanha.projeto_id);
      const vol = voluntarios.find((v) => v.id === campanha.responsavel_id);

      if (campanha.id && !campanha.id.startsWith('local-') && !campanha.id.startsWith('temp-')) {
        // Atualização Otimista
        setCampanhas((prev) =>
          prev.map((c) =>
            c.id === campanha.id
              ? ({
                  ...c,
                  ...payload,
                  projetos_sociais: proj ? { nome: proj.nome, cor_identificacao: proj.cor_identificacao } : null,
                  voluntarios: vol ? { nome_completo: vol.nome_completo } : null,
                } as CampanhaItem)
              : c
          )
        );

        const { error } = await supabase
          .from('campanhas_comunicacao')
          .update(payload)
          .eq('id', campanha.id);
        if (error) throw error;
      } else {
        const tempId = `temp-camp-${Date.now()}`;
        const novaCampanha: CampanhaItem = {
          id: tempId,
          ...payload,
          projetos_sociais: proj ? { nome: proj.nome, cor_identificacao: proj.cor_identificacao } : null,
          voluntarios: vol ? { nome_completo: vol.nome_completo } : null,
        } as CampanhaItem;

        // Atualização Otimista
        setCampanhas((prev) => [novaCampanha, ...prev]);

        const { data: inserted, error } = await supabase
          .from('campanhas_comunicacao')
          .insert([payload])
          .select('id')
          .single();
        if (error) throw error;

        if (inserted?.id) {
          setCampanhas((prev) =>
            prev.map((c) => (c.id === tempId ? { ...c, id: inserted.id } : c))
          );
        }
      }

      loadCampanhasOnly();
    } catch (err: any) {
      console.warn('Fallback local ao salvar campanha:', err);
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
    setCampanhas((prev) => prev.filter((c) => c.id !== id));
    try {
      await supabase.from('campanhas_comunicacao').delete().eq('id', id);
    } catch (e) {}
  };

  // Salvar Galeria com Atualização Otimista Imediata
  const handleSaveGaleria = async (item: Partial<GaleriaItem>) => {
    try {
      const payload: Record<string, any> = {
        titulo: item.titulo,
        projeto_id: item.projeto_id || null,
        acao_id: item.acao_id || null,
        data_evento: item.data_evento || new Date().toISOString().split('T')[0],
        link_drive: item.link_drive,
        fotografo_voluntario_id: item.fotografo_voluntario_id || null,
        descricao: item.descricao || null,
        tags: item.tags || [],
      };

      const proj = projetos.find((p) => p.id === item.projeto_id);
      const vol = voluntarios.find((v) => v.id === item.fotografo_voluntario_id);

      if (item.id && !item.id.startsWith('local-') && !item.id.startsWith('temp-')) {
        setGaleria((prev) =>
          prev.map((g) =>
            g.id === item.id
              ? ({
                  ...g,
                  ...payload,
                  projetos_sociais: proj ? { nome: proj.nome, cor_identificacao: proj.cor_identificacao } : null,
                  voluntarios: vol ? { nome_completo: vol.nome_completo } : null,
                } as GaleriaItem)
              : g
          )
        );

        const { error } = await supabase
          .from('galeria_midia_acoes')
          .update(payload)
          .eq('id', item.id);
        if (error) throw error;
      } else {
        const tempId = `temp-gal-${Date.now()}`;
        const novoItem: GaleriaItem = {
          id: tempId,
          ...payload,
          projetos_sociais: proj ? { nome: proj.nome, cor_identificacao: proj.cor_identificacao } : null,
          voluntarios: vol ? { nome_completo: vol.nome_completo } : null,
        } as GaleriaItem;

        setGaleria((prev) => [novoItem, ...prev]);

        const { data: inserted, error } = await supabase
          .from('galeria_midia_acoes')
          .insert([payload])
          .select('id')
          .single();
        if (error) throw error;

        if (inserted?.id) {
          setGaleria((prev) =>
            prev.map((g) => (g.id === tempId ? { ...g, id: inserted.id } : g))
          );
        }
      }

      loadGaleriaOnly();
    } catch (err: any) {
      console.warn('Fallback local ao salvar galeria:', err);
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
        title="Comunicação"
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
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[var(--color-primary)] text-white shadow-sm shadow-[var(--color-primary)]/25'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-[var(--text-muted)]'
                  }`}
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
