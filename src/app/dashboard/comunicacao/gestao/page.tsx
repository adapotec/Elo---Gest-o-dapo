'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { createClient } from '@/lib/supabase/client';
import {
  Calendar as CalendarIcon,
  Megaphone,
  FolderOpen,
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
  ComunicacaoGaleria,
  GaleriaItem,
} from '@/components/dashboard/comunicacao/ComunicacaoGaleria';
import { Voluntario } from '@/components/dashboard/voluntarios/VoluntariosEquipe';

type GestaoTabKey = 'calendario' | 'campanhas' | 'galeria';

interface GestaoTabItem {
  key: GestaoTabKey;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

const TABS: GestaoTabItem[] = [
  { key: 'calendario', label: 'Calendário Editorial', icon: CalendarIcon },
  { key: 'campanhas', label: 'Campanhas Estratégicas', icon: Megaphone },
  { key: 'galeria', label: 'Galeria & Drive', icon: FolderOpen },
];

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

function GestaoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab') as string | null;

  // Por padrão a tela inicial de Gestão de Comunicação abre no Calendário Editorial
  const [activeTab, setActiveTab] = useState<GestaoTabKey>(
    tabParam && ['calendario', 'campanhas', 'galeria'].includes(tabParam)
      ? (tabParam as GestaoTabKey)
      : 'calendario'
  );

  const [conteudos, setConteudos] = useState<ConteudoItem[]>([]);
  const [campanhas, setCampanhas] = useState<CampanhaItem[]>([]);
  const [galeria, setGaleria] = useState<GaleriaItem[]>([]);
  const [projetos, setProjetos] = useState<{ id: string; nome: string; cor_identificacao?: string }[]>([]);
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado para converter demanda em conteúdo no calendário editorial
  const [prefillConteudo, setPrefillConteudo] = useState<Partial<ConteudoItem> | null>(null);

  const supabase = createClient();

  useEffect(() => {
    // Se a rota acessada for a antiga aba de tickets, redireciona para a nova rota dedicada
    if (tabParam === 'tickets') {
      router.replace('/dashboard/comunicacao/tickets');
      return;
    }

    try {
      const cachedProj = localStorage.getItem('elo_comunicacao_projetos');
      const cachedVol = localStorage.getItem('elo_comunicacao_voluntarios');
      const cachedCont = localStorage.getItem('elo_comunicacao_conteudos');
      const cachedCamp = localStorage.getItem('elo_comunicacao_campanhas');
      const cachedGal = localStorage.getItem('elo_comunicacao_galeria');

      if (cachedProj) setProjetos(JSON.parse(cachedProj));
      if (cachedVol) setVoluntarios(JSON.parse(cachedVol));
      if (cachedCont) setConteudos(JSON.parse(cachedCont));
      if (cachedCamp) setCampanhas(JSON.parse(cachedCamp));
      if (cachedGal) setGaleria(JSON.parse(cachedGal));

      if (cachedProj || cachedCont) {
        setLoading(false);
      }

      // Checa se há prefill pendente de ticket convertido
      const storedPrefill = sessionStorage.getItem('elo_prefill_conteudo');
      if (storedPrefill) {
        setPrefillConteudo(JSON.parse(storedPrefill));
        sessionStorage.removeItem('elo_prefill_conteudo');
      }
    } catch (e) {
      console.warn('Erro ao restaurar cache de gestão de comunicação:', e);
    }

    loadInitialNetworkData();
  }, [tabParam, router]);

  const loadInitialNetworkData = async () => {
    try {
      const [respProj, respVol] = await Promise.all([
        safeFetch(supabase.from('projetos_sociais').select('id, nome, cor_identificacao').order('nome')),
        safeFetch(supabase.from('voluntarios').select('*').eq('status', 'ativo').order('nome_completo')),
      ]);

      if (respProj?.data) {
        setProjetos(respProj.data as any);
        safeSetItem('elo_comunicacao_projetos', respProj.data);
      }
      if (respVol?.data) {
        setVoluntarios(respVol.data as Voluntario[]);
        safeSetItem('elo_comunicacao_voluntarios', respVol.data);
      }

      if (activeTab === 'calendario') await loadConteudosOnly();
      else if (activeTab === 'campanhas') await loadCampanhasOnly();
      else if (activeTab === 'galeria') await loadGaleriaOnly();

      setLoading(false);

      setTimeout(() => {
        if (activeTab !== 'calendario') loadConteudosOnly();
        if (activeTab !== 'campanhas') loadCampanhasOnly();
        if (activeTab !== 'galeria') loadGaleriaOnly();
      }, 300);
    } catch (err) {
      console.error('Erro ao carregar dados de gestão:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (key: GestaoTabKey) => {
    setActiveTab(key);
    router.replace(`/dashboard/comunicacao/gestao?tab=${key}`, { scroll: false });

    if (key === 'calendario' && conteudos.length === 0) loadConteudosOnly();
    if (key === 'campanhas' && campanhas.length === 0) loadCampanhasOnly();
    if (key === 'galeria' && galeria.length === 0) loadGaleriaOnly();
  };

  const loadConteudosOnly = async () => {
    try {
      const resp = await safeFetch(
        supabase
          .from('conteudos_comunicacao')
          .select('*, projetos_sociais(nome, cor_identificacao), campanhas_comunicacao(titulo), voluntarios(nome_completo, avatar_url)')
          .order('data_publicacao', { ascending: true })
      );
      if (resp?.data && !resp.error) {
        setConteudos(resp.data as ConteudoItem[]);
        safeSetItem('elo_comunicacao_conteudos', resp.data);
      }
    } catch (e) {
      console.warn('Erro ao carregar conteúdos:', e);
    }
  };

  const loadCampanhasOnly = async () => {
    try {
      const resp = await safeFetch(
        supabase
          .from('campanhas_comunicacao')
          .select('*, projetos_sociais(nome, cor_identificacao), voluntarios(nome_completo)')
          .order('created_at', { ascending: false })
      );
      if (resp?.data && !resp.error) {
        setCampanhas(resp.data as CampanhaItem[]);
        safeSetItem('elo_comunicacao_campanhas', resp.data);
      }
    } catch (e) {
      console.warn('Erro ao carregar campanhas:', e);
    }
  };

  const loadGaleriaOnly = async () => {
    try {
      const resp = await safeFetch(
        supabase
          .from('galeria_midia_acoes')
          .select('*, projetos_sociais(nome, cor_identificacao), voluntarios(nome_completo)')
          .order('data_evento', { ascending: false })
      );
      if (resp?.data && !resp.error) {
        setGaleria(resp.data as GaleriaItem[]);
        safeSetItem('elo_comunicacao_galeria', resp.data);
      }
    } catch (e) {
      console.warn('Erro ao carregar galeria:', e);
    }
  };

  const loadAllData = async () => {
    await Promise.all([
      loadConteudosOnly(),
      loadCampanhasOnly(),
      loadGaleriaOnly(),
    ]);
  };

  // Handlers de Salvamento e Deleção
  const handleSaveConteudo = async (conteudo: Partial<ConteudoItem>) => {
    try {
      const proj = conteudo.projeto_id !== undefined ? projetos.find((p) => p.id === conteudo.projeto_id) : undefined;
      const camp = conteudo.campanha_id !== undefined ? campanhas.find((c) => c.id === conteudo.campanha_id) : undefined;
      const vol = conteudo.responsavel_id !== undefined ? voluntarios.find((v) => v.id === conteudo.responsavel_id) : undefined;

      if (conteudo.id && !conteudo.id.startsWith('local-')) {
        const updatePayload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (conteudo.titulo !== undefined) updatePayload.titulo = conteudo.titulo;
        if (conteudo.descricao !== undefined) updatePayload.descricao = conteudo.descricao;
        if (conteudo.tipo_conteudo !== undefined) updatePayload.tipo_conteudo = conteudo.tipo_conteudo;
        if (conteudo.categoria !== undefined) updatePayload.categoria = conteudo.categoria;
        if (conteudo.status !== undefined) updatePayload.status = conteudo.status;
        if (conteudo.data_publicacao !== undefined) updatePayload.data_publicacao = conteudo.data_publicacao;
        if (conteudo.projeto_id !== undefined) updatePayload.projeto_id = conteudo.projeto_id;
        if (conteudo.campanha_id !== undefined) updatePayload.campanha_id = conteudo.campanha_id;
        if (conteudo.responsavel_id !== undefined) updatePayload.responsavel_id = conteudo.responsavel_id;
        if (conteudo.link_producao !== undefined) updatePayload.link_producao = conteudo.link_producao;
        if (conteudo.link_publicacao !== undefined) updatePayload.link_publicacao = conteudo.link_publicacao;
        if (conteudo.roteiro_legenda !== undefined) updatePayload.roteiro_legenda = conteudo.roteiro_legenda;
        if (conteudo.observacoes !== undefined) updatePayload.observacoes = conteudo.observacoes;

        setConteudos((prev) =>
          prev.map((c) =>
            c.id === conteudo.id
              ? ({
                  ...c,
                  ...updatePayload,
                  ...(conteudo.projeto_id !== undefined ? { projetos_sociais: proj ? { nome: proj.nome, cor_identificacao: proj.cor_identificacao } : null } : {}),
                  ...(conteudo.campanha_id !== undefined ? { campanhas_comunicacao: camp ? { titulo: camp.titulo } : null } : {}),
                  ...(conteudo.responsavel_id !== undefined ? { voluntarios: vol ? { nome_completo: vol.nome_completo, avatar_url: vol.avatar_url } : null } : {}),
                } as ConteudoItem)
              : c
          )
        );

        await supabase.from('conteudos_comunicacao').update(updatePayload).eq('id', conteudo.id);
      } else {
        const payload: Record<string, any> = {
          titulo: conteudo.titulo || 'Nova Publicação',
          descricao: conteudo.descricao || null,
          tipo_conteudo: conteudo.tipo_conteudo || 'carrossel',
          categoria: conteudo.categoria || 'avulso',
          status: conteudo.status || 'planejado',
          data_publicacao: conteudo.data_publicacao || new Date().toISOString(),
          projeto_id: conteudo.projeto_id || null,
          campanha_id: conteudo.campanha_id || null,
          responsavel_id: conteudo.responsavel_id || null,
          link_producao: conteudo.link_producao || null,
          link_publicacao: conteudo.link_publicacao || null,
          roteiro_legenda: conteudo.roteiro_legenda || null,
          observacoes: conteudo.observacoes || null,
          updated_at: new Date().toISOString(),
        };

        const tempId = `local-${Date.now()}`;
        const tempItem: ConteudoItem = {
          id: tempId,
          created_at: new Date().toISOString(),
          ...payload,
          projetos_sociais: proj ? { nome: proj.nome, cor_identificacao: proj.cor_identificacao } : null,
          campanhas_comunicacao: camp ? { titulo: camp.titulo } : null,
          voluntarios: vol ? { nome_completo: vol.nome_completo, avatar_url: vol.avatar_url } : null,
        } as unknown as ConteudoItem;

        setConteudos((prev) => [tempItem, ...prev]);

        const { data, error } = await supabase
          .from('conteudos_comunicacao')
          .insert([payload])
          .select('*, projetos_sociais(nome, cor_identificacao), campanhas_comunicacao(titulo), voluntarios(nome_completo, avatar_url)')
          .single();

        if (!error && data) {
          setConteudos((prev) => prev.map((c) => (c.id === tempId ? (data as ConteudoItem) : c)));
        }
      }

      loadConteudosOnly();
    } catch (err: any) {
      console.error('Erro ao salvar conteúdo:', err);
      alert('Erro ao salvar publicação: ' + err.message);
    }
  };

  const handleDeleteConteudo = async (id: string) => {
    setConteudos((prev) => prev.filter((c) => c.id !== id));
    await supabase.from('conteudos_comunicacao').delete().eq('id', id);
    loadConteudosOnly();
  };

  const handleSaveCampanha = async (campanha: Partial<CampanhaItem>) => {
    try {
      const proj = campanha.projeto_id !== undefined ? projetos.find((p) => p.id === campanha.projeto_id) : undefined;
      const vol = campanha.responsavel_id !== undefined ? voluntarios.find((v) => v.id === campanha.responsavel_id) : undefined;

      if (campanha.id && !campanha.id.startsWith('local-')) {
        const updatePayload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (campanha.titulo !== undefined) updatePayload.titulo = campanha.titulo;
        if (campanha.resumo !== undefined) updatePayload.resumo = campanha.resumo;
        if (campanha.diagnostico_contexto !== undefined) updatePayload.diagnostico_contexto = campanha.diagnostico_contexto;
        if (campanha.status !== undefined) updatePayload.status = campanha.status;
        if (campanha.data_inicio !== undefined) updatePayload.data_inicio = campanha.data_inicio;
        if (campanha.data_fim !== undefined) updatePayload.data_fim = campanha.data_fim;
        if (campanha.personas_publico !== undefined) updatePayload.personas_publico = campanha.personas_publico;
        if (campanha.objetivos !== undefined) updatePayload.objetivos = campanha.objetivos;
        if (campanha.estrategia_narrativa !== undefined) updatePayload.estrategia_narrativa = campanha.estrategia_narrativa;
        if (campanha.gatilhos_persuasao !== undefined) updatePayload.gatilhos_persuasao = campanha.gatilhos_persuasao;
        if (campanha.canais_ferramentas !== undefined) updatePayload.canais_ferramentas = campanha.canais_ferramentas;
        if (campanha.recursos_equipe !== undefined) updatePayload.recursos_equipe = campanha.recursos_equipe;
        if (campanha.indicadores_esperados !== undefined) updatePayload.indicadores_esperados = campanha.indicadores_esperados;
        if (campanha.projeto_id !== undefined) updatePayload.projeto_id = campanha.projeto_id;
        if (campanha.responsavel_id !== undefined) updatePayload.responsavel_id = campanha.responsavel_id;

        setCampanhas((prev) =>
          prev.map((c) =>
            c.id === campanha.id
              ? ({
                  ...c,
                  ...updatePayload,
                  ...(campanha.projeto_id !== undefined ? { projetos_sociais: proj ? { nome: proj.nome, cor_identificacao: proj.cor_identificacao } : null } : {}),
                  ...(campanha.responsavel_id !== undefined ? { voluntarios: vol ? { nome_completo: vol.nome_completo } : null } : {}),
                } as CampanhaItem)
              : c
          )
        );

        await supabase.from('campanhas_comunicacao').update(updatePayload).eq('id', campanha.id);
      } else {
        const payload: Record<string, any> = {
          titulo: campanha.titulo || 'Nova Campanha',
          resumo: campanha.resumo || null,
          diagnostico_contexto: campanha.diagnostico_contexto || null,
          status: campanha.status || 'planejamento',
          data_inicio: campanha.data_inicio || null,
          data_fim: campanha.data_fim || null,
          personas_publico: campanha.personas_publico || null,
          objetivos: campanha.objetivos || null,
          estrategia_narrativa: campanha.estrategia_narrativa || null,
          gatilhos_persuasao: campanha.gatilhos_persuasao || null,
          canais_ferramentas: campanha.canais_ferramentas || [],
          recursos_equipe: campanha.recursos_equipe || [],
          indicadores_esperados: campanha.indicadores_esperados || null,
          projeto_id: campanha.projeto_id || null,
          responsavel_id: campanha.responsavel_id || null,
          updated_at: new Date().toISOString(),
        };

        const tempId = `local-${Date.now()}`;
        const tempItem: CampanhaItem = {
          id: tempId,
          created_at: new Date().toISOString(),
          ...payload,
          projetos_sociais: proj ? { nome: proj.nome, cor_identificacao: proj.cor_identificacao } : null,
          voluntarios: vol ? { nome_completo: vol.nome_completo } : null,
        } as unknown as CampanhaItem;

        setCampanhas((prev) => [tempItem, ...prev]);

        const { data, error } = await supabase
          .from('campanhas_comunicacao')
          .insert([payload])
          .select('*, projetos_sociais(nome, cor_identificacao), voluntarios(nome_completo)')
          .single();

        if (!error && data) {
          setCampanhas((prev) => prev.map((c) => (c.id === tempId ? (data as CampanhaItem) : c)));
        }
      }

      loadCampanhasOnly();
    } catch (err: any) {
      console.error('Erro ao salvar campanha:', err);
      alert('Erro ao salvar campanha: ' + err.message);
    }
  };

  const handleDeleteCampanha = async (id: string) => {
    setCampanhas((prev) => prev.filter((c) => c.id !== id));
    await supabase.from('campanhas_comunicacao').delete().eq('id', id);
    loadCampanhasOnly();
  };

  const handleSaveGaleria = async (item: Partial<GaleriaItem>) => {
    try {
      const proj = item.projeto_id !== undefined ? projetos.find((p) => p.id === item.projeto_id) : undefined;
      const vol = item.fotografo_voluntario_id !== undefined ? voluntarios.find((v) => v.id === item.fotografo_voluntario_id) : undefined;

      if (item.id && !item.id.startsWith('local-')) {
        const updatePayload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (item.titulo !== undefined) updatePayload.titulo = item.titulo;
        if (item.descricao !== undefined) updatePayload.descricao = item.descricao;
        if (item.link_drive !== undefined) updatePayload.link_drive = item.link_drive;
        if (item.data_evento !== undefined) updatePayload.data_evento = item.data_evento;
        if (item.tags !== undefined) updatePayload.tags = item.tags;
        if (item.projeto_id !== undefined) updatePayload.projeto_id = item.projeto_id;
        if (item.fotografo_voluntario_id !== undefined) updatePayload.fotografo_voluntario_id = item.fotografo_voluntario_id;

        setGaleria((prev) =>
          prev.map((g) =>
            g.id === item.id
              ? ({
                  ...g,
                  ...updatePayload,
                  ...(item.projeto_id !== undefined ? { projetos_sociais: proj ? { nome: proj.nome, cor_identificacao: proj.cor_identificacao } : null } : {}),
                  ...(item.fotografo_voluntario_id !== undefined ? { voluntarios: vol ? { nome_completo: vol.nome_completo } : null } : {}),
                } as GaleriaItem)
              : g
          )
        );

        await supabase.from('galeria_midia_acoes').update(updatePayload).eq('id', item.id);
      } else {
        const payload: Record<string, any> = {
          titulo: item.titulo || 'Nova Pasta de Mídia',
          descricao: item.descricao || null,
          link_drive: item.link_drive || 'https://drive.google.com',
          data_evento: item.data_evento || new Date().toISOString().slice(0, 10),
          tags: item.tags || [],
          projeto_id: item.projeto_id || null,
          fotografo_voluntario_id: item.fotografo_voluntario_id || null,
        };

        const tempId = `local-${Date.now()}`;
        const tempItem: GaleriaItem = {
          id: tempId,
          ...payload,
          projetos_sociais: proj ? { nome: proj.nome, cor_identificacao: proj.cor_identificacao } : null,
          voluntarios: vol ? { nome_completo: vol.nome_completo } : null,
        } as unknown as GaleriaItem;

        setGaleria((prev) => [tempItem, ...prev]);

        const { data, error } = await supabase
          .from('galeria_midia_acoes')
          .insert([payload])
          .select('*, projetos_sociais(nome, cor_identificacao), voluntarios(nome_completo)')
          .single();

        if (!error && data) {
          setGaleria((prev) => prev.map((g) => (g.id === tempId ? (data as GaleriaItem) : g)));
        }
      }

      loadGaleriaOnly();
    } catch (err: any) {
      console.error('Erro ao salvar galeria:', err);
      alert('Erro ao salvar pasta da galeria: ' + err.message);
    }
  };

  const handleDeleteGaleria = async (id: string) => {
    setGaleria((prev) => prev.filter((g) => g.id !== id));
    await supabase.from('galeria_midia_acoes').delete().eq('id', id);
    loadGaleriaOnly();
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Gestão de Comunicação"
        subtitle="Planejamento Editorial, Campanhas Estratégicas e Acervo no Google Drive"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6 flex-1 overflow-y-auto">
        {/* Seletor de Abas Superiores (Sem emojis, ícones elegantes e alto contraste) */}
        <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-md overflow-x-auto custom-scrollbar">
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
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-slate-400 dark:text-slate-500'
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
              prefillConteudo={prefillConteudo}
              onClearPrefill={() => setPrefillConteudo(null)}
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

export default function GestaoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--text-muted)]">Carregando Gestão de Comunicação...</div>}>
      <GestaoContent />
    </Suspense>
  );
}
