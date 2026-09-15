'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { createClient } from '@/lib/supabase/client';
import {
  Calendar as CalendarIcon,
  Megaphone,
  TrendingUp,
  FolderOpen,
  FileText,
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
import {
  ComunicacaoTickets,
  SolicitacaoComunicacaoItem,
} from '@/components/dashboard/comunicacao/ComunicacaoTickets';
import { Voluntario } from '@/components/dashboard/voluntarios/VoluntariosEquipe';

type TabKey = 'calendario' | 'campanhas' | 'indicadores' | 'galeria' | 'tickets';

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
  { key: 'tickets', label: 'Solicitações & Tickets', icon: FileText },
];

// Helper para timeout de segurança em chamadas de rede (evita congelamento da tela)
async function safeFetch<T>(promise: PromiseLike<{ data: T | null; error: any }>, timeoutMs = 8000): Promise<{ data: T | null; error: any }> {
  try {
    const timeout = new Promise<{ data: null; error: any }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error('Timeout') }), timeoutMs)
    );
    return await Promise.race([Promise.resolve(promise), timeout]);
  } catch (err: any) {
    return { data: null, error: err };
  }
}

function ComunicacaoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab') as TabKey | null;
  const novoParam = searchParams.get('novo') === 'true';

  const [activeTab, setActiveTab] = useState<TabKey>(
    tabParam && ['calendario', 'campanhas', 'indicadores', 'galeria', 'tickets'].includes(tabParam)
      ? tabParam
      : 'calendario'
  );

  const [conteudos, setConteudos] = useState<ConteudoItem[]>([]);
  const [campanhas, setCampanhas] = useState<CampanhaItem[]>([]);
  const [galeria, setGaleria] = useState<GaleriaItem[]>([]);
  const [tickets, setTickets] = useState<SolicitacaoComunicacaoItem[]>([]);
  const [metricas, setMetricas] = useState<MetricasRedeRecord[]>([]);
  const [metaConfig, setMetaConfig] = useState<MetaConfigRecord | null>(null);

  const [projetos, setProjetos] = useState<{ id: string; nome: string; cor_identificacao?: string }[]>([]);
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado para passar dados pré-populados do Ticket para o Calendário Editorial
  const [prefillConteudo, setPrefillConteudo] = useState<Partial<ConteudoItem> | null>(null);

  const supabase = createClient();

  // 1. CARREGAMENTO INSTANTÂNEO COM STALE-WHILE-REVALIDATE (0ms inicial)
  useEffect(() => {
    try {
      const cachedProj = localStorage.getItem('elo_comunicacao_projetos');
      const cachedVol = localStorage.getItem('elo_comunicacao_voluntarios');
      const cachedCont = localStorage.getItem('elo_comunicacao_conteudos');
      const cachedCamp = localStorage.getItem('elo_comunicacao_campanhas');
      const cachedGal = localStorage.getItem('elo_comunicacao_galeria');
      const cachedTick = localStorage.getItem('elo_comunicacao_tickets');

      if (cachedProj) setProjetos(JSON.parse(cachedProj));
      if (cachedVol) setVoluntarios(JSON.parse(cachedVol));
      if (cachedCont) setConteudos(JSON.parse(cachedCont));
      if (cachedCamp) setCampanhas(JSON.parse(cachedCamp));
      if (cachedGal) setGaleria(JSON.parse(cachedGal));
      if (cachedTick) setTickets(JSON.parse(cachedTick));

      // Se houver qualquer cache, libera a UI imediatamente em 0ms
      if (cachedProj || cachedCont) {
        setLoading(false);
      }
    } catch (e) {
      console.warn('Erro ao restaurar cache inicial de comunicação:', e);
    }

    // Carregamento de rede desacoplado e progressivo
    loadInitialNetworkData();
  }, []);

  // 2. CARREGAMENTO DESACOPLADO (PRIORIZA ABA ATIVA E NÃO BLOQUEIA)
  const loadInitialNetworkData = async () => {
    try {
      // Passo A: Dados base essenciais (Projetos e Voluntários)
      const [respProj, respVol] = await Promise.all([
        safeFetch(supabase.from('projetos_sociais').select('id, nome, cor_identificacao').order('nome')),
        safeFetch(supabase.from('voluntarios').select('*').eq('status', 'ativo').order('nome_completo')),
      ]);

      if (respProj?.data) {
        setProjetos(respProj.data as any);
        localStorage.setItem('elo_comunicacao_projetos', JSON.stringify(respProj.data));
      }
      if (respVol?.data) {
        setVoluntarios(respVol.data as Voluntario[]);
        localStorage.setItem('elo_comunicacao_voluntarios', JSON.stringify(respVol.data));
      }

      // Passo B: Carregar imediatamente a aba ativa
      if (activeTab === 'calendario') await loadConteudosOnly();
      else if (activeTab === 'campanhas') await loadCampanhasOnly();
      else if (activeTab === 'galeria') await loadGaleriaOnly();
      else if (activeTab === 'tickets') await loadTicketsOnly();
      else if (activeTab === 'indicadores') await loadIndicadoresOnly();

      // UI liberada com dados atualizados
      setLoading(false);

      // Passo C: Em segundo plano não-bloqueante, atualizar as outras abas
      setTimeout(() => {
        if (activeTab !== 'calendario') loadConteudosOnly();
        if (activeTab !== 'campanhas') loadCampanhasOnly();
        if (activeTab !== 'galeria') loadGaleriaOnly();
        if (activeTab !== 'tickets') loadTicketsOnly();
        if (activeTab !== 'indicadores') loadIndicadoresOnly();
      }, 300);
    } catch (err) {
      console.error('Erro na carga de rede:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    router.replace(`/dashboard/comunicacao?tab=${key}`, { scroll: false });

    // Carga sob demanda da aba se estiver vazia
    if (key === 'calendario' && conteudos.length === 0) loadConteudosOnly();
    if (key === 'campanhas' && campanhas.length === 0) loadCampanhasOnly();
    if (key === 'galeria' && galeria.length === 0) loadGaleriaOnly();
    if (key === 'tickets' && tickets.length === 0) loadTicketsOnly();
    if (key === 'indicadores' && metricas.length === 0) loadIndicadoresOnly();
  };

  // Sincronização de conteúdos (Calendário)
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
        localStorage.setItem('elo_comunicacao_conteudos', JSON.stringify(resp.data));
      }
    } catch (e) {
      console.warn('Sincronização de conteúdos:', e);
    }
  };

  // Sincronização de campanhas
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
        localStorage.setItem('elo_comunicacao_campanhas', JSON.stringify(resp.data));
      }
    } catch (e) {
      console.warn('Sincronização de campanhas:', e);
    }
  };

  // Sincronização da galeria
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
        localStorage.setItem('elo_comunicacao_galeria', JSON.stringify(resp.data));
      }
    } catch (e) {
      console.warn('Sincronização de galeria:', e);
    }
  };

  // Sincronização de tickets de comunicação
  const loadTicketsOnly = async () => {
    try {
      const resp = await safeFetch(
        supabase
          .from('solicitacoes_comunicacao')
          .select('*, projetos_sociais(nome, cor_identificacao), voluntarios(nome_completo)')
          .order('created_at', { ascending: false })
      );
      if (resp?.data && !resp.error) {
        setTickets(resp.data as SolicitacaoComunicacaoItem[]);
        localStorage.setItem('elo_comunicacao_tickets', JSON.stringify(resp.data));
      }
    } catch (e) {
      console.warn('Sincronização de tickets:', e);
    }
  };

  // Sincronização de métricas e Meta
  const loadIndicadoresOnly = async () => {
    try {
      const [respMetricas, respMetaConfig] = await Promise.all([
        safeFetch(supabase.from('metricas_redes_sociais').select('*').order('ano', { ascending: false }).order('mes', { ascending: false })),
        safeFetch(supabase.from('meta_integracao_config').select('*').maybeSingle()),
      ]);

      if (respMetricas?.data) setMetricas(respMetricas.data as MetricasRedeRecord[]);
      if (respMetaConfig?.data) setMetaConfig(respMetaConfig.data as MetaConfigRecord);
    } catch (e) {
      console.warn('Sincronização de indicadores:', e);
    }
  };

  // Recarga geral de dados
  const loadAllData = async () => {
    await Promise.all([
      loadConteudosOnly(),
      loadCampanhasOnly(),
      loadGaleriaOnly(),
      loadTicketsOnly(),
      loadIndicadoresOnly(),
    ]);
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
        setConteudos((prev) =>
          prev.map((c) =>
            c.id === conteudo.id
              ? ({
                  ...c,
                  ...payload,
                  projetos_sociais: proj ? { nome: proj.nome, cor_identificacao: proj.cor_identificacao } : null,
                  campanhas_comunicacao: camp ? { titulo: camp.titulo } : null,
                  voluntarios: vol ? { nome_completo: vol.nome_completo, avatar_url: vol.avatar_url || undefined } : null,
                } as ConteudoItem)
              : c
          )
        );

        await supabase.from('conteudos_comunicacao').update(payload).eq('id', conteudo.id);
      } else {
        const tempId = `local-${Date.now()}`;
        const tempItem: ConteudoItem = {
          id: tempId,
          created_at: new Date().toISOString(),
          ...payload,
          projetos_sociais: proj ? { nome: proj.nome, cor_identificacao: proj.cor_identificacao } : null,
          campanhas_comunicacao: camp ? { titulo: camp.titulo } : null,
          voluntarios: vol ? { nome_completo: vol.nome_completo, avatar_url: vol.avatar_url || undefined } : null,
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
      alert('Erro ao salvar conteúdo: ' + err.message);
    }
  };

  const handleDeleteConteudo = async (id: string) => {
    setConteudos((prev) => prev.filter((c) => c.id !== id));
    await supabase.from('conteudos_comunicacao').delete().eq('id', id);
    loadConteudosOnly();
  };

  // Salvar Campanha Estratégica
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
        await supabase.from('campanhas_comunicacao').update(payload).eq('id', campanha.id);
      } else {
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

  // Salvar Galeria / Drive
  const handleSaveGaleria = async (item: Partial<GaleriaItem>) => {
    try {
      const payload: Record<string, any> = {
        titulo: item.titulo,
        projeto_id: item.projeto_id || null,
        data_evento: item.data_evento || new Date().toISOString().slice(0, 10),
        link_drive: item.link_drive,
        fotografo_voluntario_id: item.fotografo_voluntario_id || null,
        descricao: item.descricao || null,
        tags: item.tags || [],
        updated_at: new Date().toISOString(),
      };

      const proj = projetos.find((p) => p.id === item.projeto_id);
      const vol = voluntarios.find((v) => v.id === item.fotografo_voluntario_id);

      if (item.id && !item.id.startsWith('local-')) {
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
        await supabase.from('galeria_midia_acoes').update(payload).eq('id', item.id);
      } else {
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

  // Salvar Solicitação / Ticket
  const handleSaveTicket = async (ticket: Partial<SolicitacaoComunicacaoItem>) => {
    try {
      const payload: Record<string, any> = {
        titulo: ticket.titulo,
        projeto_id: ticket.projeto_id || null,
        solicitante_id: ticket.solicitante_id || null,
        solicitante_nome: ticket.solicitante_nome || null,
        tipo_material: ticket.tipo_material || 'feed_carrossel',
        publico_alvo: ticket.publico_alvo || null,
        objetivo: ticket.objetivo || null,
        descricao_detalhes: ticket.descricao_detalhes || null,
        prazo_desejado: ticket.prazo_desejado || null,
        urgencia: ticket.urgencia || 'normal',
        links_referencia: ticket.links_referencia || null,
        status: ticket.status || 'pendente',
        resposta_comunicacao: ticket.resposta_comunicacao || null,
        responsavel_comunicacao_id: ticket.responsavel_comunicacao_id || null,
        conteudo_criado_id: ticket.conteudo_criado_id || null,
        updated_at: new Date().toISOString(),
      };

      const proj = projetos.find((p) => p.id === ticket.projeto_id);
      const volResp = voluntarios.find((v) => v.id === ticket.responsavel_comunicacao_id);

      if (ticket.id && !ticket.id.startsWith('local-')) {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticket.id
              ? ({
                  ...t,
                  ...payload,
                  projetos_sociais: proj ? { nome: proj.nome, cor_identificacao: proj.cor_identificacao } : null,
                  responsavel: volResp ? { nome_completo: volResp.nome_completo } : null,
                } as SolicitacaoComunicacaoItem)
              : t
          )
        );
        await supabase.from('solicitacoes_comunicacao').update(payload).eq('id', ticket.id);
      } else {
        const tempId = `local-${Date.now()}`;
        const tempItem: SolicitacaoComunicacaoItem = {
          id: tempId,
          created_at: new Date().toISOString(),
          ...payload,
          projetos_sociais: proj ? { nome: proj.nome, cor_identificacao: proj.cor_identificacao } : null,
          responsavel: volResp ? { nome_completo: volResp.nome_completo } : null,
        } as unknown as SolicitacaoComunicacaoItem;

        setTickets((prev) => [tempItem, ...prev]);

        const { data, error } = await supabase
          .from('solicitacoes_comunicacao')
          .insert([payload])
          .select('*, projetos_sociais(nome, cor_identificacao), voluntarios(nome_completo)')
          .single();

        if (!error && data) {
          setTickets((prev) => prev.map((t) => (t.id === tempId ? (data as SolicitacaoComunicacaoItem) : t)));
        }
      }

      loadTicketsOnly();
    } catch (err: any) {
      console.error('Erro ao salvar ticket:', err);
      alert('Erro ao salvar solicitação: ' + err.message);
    }
  };

  const handleDeleteTicket = async (id: string) => {
    setTickets((prev) => prev.filter((t) => t.id !== id));
    await supabase.from('solicitacoes_comunicacao').delete().eq('id', id);
    loadTicketsOnly();
  };

  // Converter Solicitação Aprovada em Publicação do Calendário Editorial (1 clique)
  const handleConvertToConteudo = (ticket: SolicitacaoComunicacaoItem) => {
    const tipoMap: Record<string, ConteudoItem['tipo_conteudo']> = {
      feed_carrossel: 'carrossel',
      reels_video: 'reels',
      story: 'stories',
      banner_impresso: 'reels',
      cracha: 'reels',
      camiseta: 'reels',
      apresentacao_pdf: 'carrossel',
      cobertura_foto_video: 'reels',
      outro: 'reels',
    };

    const prefill: Partial<ConteudoItem> = {
      titulo: ticket.titulo,
      projeto_id: ticket.projeto_id || undefined,
      tipo_conteudo: tipoMap[ticket.tipo_material] || 'reels',
      observacoes: ticket.descricao_detalhes || undefined,
      roteiro_legenda: ticket.objetivo ? `Objetivo: ${ticket.objetivo}\nPúblico: ${ticket.publico_alvo || 'Geral'}` : undefined,
      data_publicacao: ticket.prazo_desejado ? new Date(ticket.prazo_desejado).toISOString() : new Date().toISOString(),
      categoria: 'avulso',
      link_producao: ticket.links_referencia || undefined,
      status: 'producao',
    };

    setPrefillConteudo(prefill);
    setActiveTab('calendario');
    router.replace('/dashboard/comunicacao?tab=calendario', { scroll: false });

    // Atualiza status do ticket para 'em_producao'
    handleSaveTicket({ id: ticket.id, status: 'em_producao' });
  };

  // Salvar Métricas e Configurações da Meta
  const handleSaveMetricas = async (record: Partial<MetricasRedeRecord>) => {
    try {
      if (record.id) {
        await supabase.from('metricas_redes_sociais').update(record).eq('id', record.id);
      } else {
        await supabase.from('metricas_redes_sociais').insert([record]);
      }
      loadIndicadoresOnly();
    } catch (err: any) {
      alert('Erro ao salvar métricas: ' + err.message);
    }
  };

  const handleSaveMetaConfig = async (config: Partial<MetaConfigRecord>) => {
    try {
      if (config.id) {
        await supabase.from('meta_integracao_config').update(config).eq('id', config.id);
      } else {
        await supabase.from('meta_integracao_config').insert([config]);
      }
      loadIndicadoresOnly();
    } catch (err: any) {
      alert('Erro ao salvar configuração da Meta: ' + err.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Comunicação"
        subtitle="Calendário Editorial, Campanhas Estratégicas, Redes Sociais, Acervo e Tickets"
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

          {activeTab === 'tickets' && (
            <ComunicacaoTickets
              tickets={tickets}
              projetos={projetos}
              voluntarios={voluntarios}
              loading={loading}
              onRefresh={loadAllData}
              onSaveTicket={handleSaveTicket}
              onDeleteTicket={handleDeleteTicket}
              onConvertToConteudo={handleConvertToConteudo}
              initialOpenNew={novoParam}
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
