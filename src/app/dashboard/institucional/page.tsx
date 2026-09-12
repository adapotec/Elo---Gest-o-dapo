'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PapelTimbradoModal } from '@/components/ui/PapelTimbradoModal';
import { ModalNovaReuniao } from '@/components/dashboard/institucional/ModalNovaReuniao';
import { ReuniaoPautaTab } from '@/components/dashboard/institucional/ReuniaoPautaTab';
import { ReuniaoPresencaTab } from '@/components/dashboard/institucional/ReuniaoPresencaTab';
import { ReuniaoAtaTab } from '@/components/dashboard/institucional/ReuniaoAtaTab';
import { ReuniaoPrintTemplate } from '@/components/dashboard/institucional/ReuniaoPrintTemplate';
import { Reuniao, ProjetoResumo } from '@/types/reuniao';
import { parseReuniaoFromDB, prepareReuniaoForDB } from '@/lib/services/reuniaoMetadata';
import { dispararNotificacoesConvocacaoReuniao } from '@/lib/services/notificacoesService';
import { VoluntarioItem } from '@/components/dashboard/institucional/ModalNovaReuniao';
import {
  Landmark,
  Plus,
  Calendar,
  Clock,
  Users,
  FileText,
  Trash2,
  CheckCircle,
  Search,
  FolderKanban,
  Edit,
  Sparkles,
  Printer,
  ChevronRight,
  ListFilter,
  Play,
  ClipboardList,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

export default function InstitucionalPage() {
  const [loading, setLoading] = useState(true);
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [projetos, setProjetos] = useState<ProjetoResumo[]>([]);
  const [voluntarios, setVoluntarios] = useState<VoluntarioItem[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id?: string; name: string; email?: string } | null>(null);
  const [selectedReuniao, setSelectedReuniao] = useState<Reuniao | null>(null);
  const [activeTab, setActiveTab] = useState<'pauta' | 'presenca' | 'ata'>('pauta');

  // Filtros
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterProjeto, setFilterProjeto] = useState<string>('todos');
  const [filterTipo, setFilterTipo] = useState<string>('todos');

  // Modais
  const [showModalReuniao, setShowModalReuniao] = useState(false);
  const [editingReuniao, setEditingReuniao] = useState<Reuniao | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printModo, setPrintModo] = useState<'convocacao' | 'ata'>('convocacao');

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setLoading(true);
      const supabase = createClient();

      // Carregar perfil do usuário logado
      try {
        const cached = sessionStorage.getItem('elo_user_profile_cache') || localStorage.getItem('elo_user_profile_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          setCurrentUser({ name: parsed.name, email: parsed.email });
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser((prev) => ({
            id: user.id,
            name: prev?.name || user.user_metadata?.nome_completo || user.email?.split('@')[0] || 'Administrador',
            email: user.email || prev?.email,
          }));
        }
      } catch (e) {}

      // 1. Carregar Projetos, Voluntários e Reuniões em paralelo
      const [respProj, respVol, respReunioes] = await Promise.all([
        supabase
          .from('projetos_sociais')
          .select('id, nome, cor_identificacao, icone')
          .order('nome'),
        supabase
          .from('voluntarios')
          .select('id, nome_completo, email, telefone, avatar_url, area_atuacao')
          .order('nome_completo'),
        supabase
          .from('reunioes_institucional')
          .select('*')
          .order('data_hora', { ascending: false }),
      ]);

      const projetosLista: ProjetoResumo[] = respProj.data || [];
      const voluntariosLista: VoluntarioItem[] = respVol.data || [];
      setProjetos(projetosLista);
      setVoluntarios(voluntariosLista);

      const projetosMap = new Map<string, any>();
      projetosLista.forEach((p) => projetosMap.set(p.id, p));

      if (respReunioes.error) {
        console.error('Erro ao buscar reunioes_institucional:', respReunioes.error.message || respReunioes.error);
        setReunioes([]);
      } else {
        const formatadas: Reuniao[] = (respReunioes.data || []).map((r: any) =>
          parseReuniaoFromDB(r, projetosMap)
        );

        setReunioes(formatadas);

        // Se houver parâmetro na URL (?reuniaoId=...), priorizar essa reunião
        let initialSelected: Reuniao | null = null;
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const paramId = urlParams.get('reuniaoId');
          if (paramId) {
            const achada = formatadas.find((f) => f.id === paramId);
            if (achada) initialSelected = achada;
          }
        }

        if (initialSelected) {
          setSelectedReuniao(initialSelected);
        } else {
          setSelectedReuniao((prev) => {
            if (!prev) return null;
            const updated = formatadas.find((r) => r.id === prev.id);
            return updated || null;
          });
        }
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err?.message || err);
      setReunioes([]);
    } finally {
      setLoading(false);
    }
  }

  // Sincronização leve em segundo plano apenas das reuniões (sem recarregar projetos e voluntários)
  async function loadReunioesOnly() {
    try {
      const supabase = createClient();
      const { data: reunioesData, error } = await supabase
        .from('reunioes_institucional')
        .select('*')
        .order('data_hora', { ascending: false });

      if (!error && reunioesData) {
        const projetosMap = new Map<string, any>();
        projetos.forEach((p) => projetosMap.set(p.id, p));

        const formatadas: Reuniao[] = reunioesData.map((r: any) => parseReuniaoFromDB(r, projetosMap));
        setReunioes(formatadas);

        setSelectedReuniao((prev) => {
          if (!prev) return null;
          const updated = formatadas.find((r: Reuniao) => r.id === prev.id);
          return updated || null;
        });
      }
    } catch (err) {
      console.warn('Sincronização leve de reuniões:', err);
    }
  }

  // Salvar Reunião com Atualização Otimista Imediata (Resposta instantânea ao usuário)
  async function handleSaveReuniao(data: Partial<Reuniao>) {
    const supabase = createClient();
    const dbPayload = prepareReuniaoForDB(data);
    const projetosMap = new Map<string, any>();
    projetos.forEach((p) => projetosMap.set(p.id, p));

    if (editingReuniao?.id) {
      // 1. Atualização Otimista Imediata (0ms)
      const merged: Reuniao = { ...editingReuniao, ...data };
      setSelectedReuniao(merged);
      setReunioes((prev) => prev.map((r) => (r.id === editingReuniao.id ? merged : r)));

      // 2. Atualizar no Supabase
      const { error } = await supabase
        .from('reunioes_institucional')
        .update(dbPayload)
        .eq('id', editingReuniao.id);

      if (error) {
        console.error('Erro ao atualizar reunião:', error);
        throw error;
      }

      // 3. Disparar notificações para participantes convocados
      dispararNotificacoesConvocacaoReuniao({
        reuniaoId: editingReuniao.id,
        titulo: data.titulo || 'Reunião Institucional',
        dataHora: data.data_hora || new Date().toISOString(),
        localOuLink: data.local_reuniao || data.link_virtual,
        participantes: data.participantes || [],
        isEdicao: true,
        voluntarios: voluntarios.map((v) => ({ nome_completo: v.nome_completo, email: v.email })),
      });
    } else {
      const tempId = `reuniao-${Date.now()}`;
      const novaReuniao = parseReuniaoFromDB({ ...dbPayload, id: tempId }, projetosMap);

      // 1. Atualizar estado local imediatamente (0ms)
      setSelectedReuniao(novaReuniao);
      setReunioes((prev) => [novaReuniao, ...prev]);

      // 2. Disparar notificações para participantes convocados
      dispararNotificacoesConvocacaoReuniao({
        reuniaoId: tempId,
        titulo: data.titulo || 'Reunião Institucional',
        dataHora: data.data_hora || new Date().toISOString(),
        localOuLink: data.local_reuniao || data.link_virtual,
        participantes: data.participantes || [],
        isEdicao: false,
        voluntarios: voluntarios.map((v) => ({ nome_completo: v.nome_completo, email: v.email })),
      });

      // 3. Inserir no Supabase e sincronizar ID canônico
      const { data: inserted, error } = await supabase
        .from('reunioes_institucional')
        .insert([dbPayload])
        .select('id')
        .single();

      if (error) {
        console.error('Erro ao inserir reunião:', error);
        throw error;
      }

      if (inserted?.id) {
        const canonicalReuniao = parseReuniaoFromDB({ ...dbPayload, id: inserted.id }, projetosMap);
        setSelectedReuniao((prev) => (prev?.id === tempId ? canonicalReuniao : prev));
        setReunioes((prev) =>
          prev.map((r) => (r.id === tempId ? canonicalReuniao : r))
        );
      }
    }

    // Sincronização em segundo plano sem travar a interface
    loadReunioesOnly();
  }

  // Atualizações pontuais vindas das abas (presença, notas, ata, encaminhamentos)
  async function handleUpdateSelected(updates: Partial<Reuniao>) {
    if (!selectedReuniao?.id) return;
    const supabase = createClient();

    const merged: Reuniao = { ...selectedReuniao, ...updates };

    // 1. Atualizar estado local imediatamente (0ms de espera)
    setSelectedReuniao(merged);
    setReunioes((prev) =>
      prev.map((r) => (r.id === selectedReuniao.id ? merged : r))
    );

    const dbPayload = prepareReuniaoForDB(merged);

    const { error } = await supabase
      .from('reunioes_institucional')
      .update(dbPayload)
      .eq('id', selectedReuniao.id);

    if (error) {
      console.error('Erro ao atualizar reunião:', error);
      throw error;
    }
  }

  async function handleDeleteReuniao(id: string) {
    if (!confirm('Deseja realmente excluir esta reunião e todos os seus registros de ata?')) return;
    try {
      const supabase = createClient();
      await supabase.from('reunioes_institucional').delete().eq('id', id);
      if (selectedReuniao?.id === id) {
        setSelectedReuniao(null);
      }
      await loadInitialData();
    } catch (err) {
      console.error('Erro ao excluir reunião:', err);
      alert('Erro ao excluir reunião.');
    }
  }

  // Reuniões Filtradas
  const filteredReunioes = useMemo(() => {
    return reunioes.filter((r) => {
      // Busca
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchTitulo = r.titulo.toLowerCase().includes(query);
        const matchPauta = r.pauta?.toLowerCase().includes(query);
        const matchAta = r.ata?.toLowerCase().includes(query);
        const matchProj = r.projeto?.nome.toLowerCase().includes(query);
        if (!matchTitulo && !matchPauta && !matchAta && !matchProj) return false;
      }

      // Status
      if (filterStatus !== 'todos' && r.status !== filterStatus) return false;

      // Projeto
      if (filterProjeto !== 'todos') {
        if (filterProjeto === 'geral') {
          if (r.projeto_id) return false;
        } else {
          if (r.projeto_id !== filterProjeto) return false;
        }
      }

      // Tipo
      if (filterTipo !== 'todos' && r.tipo !== filterTipo) return false;

      return true;
    });
  }, [reunioes, search, filterStatus, filterProjeto, filterTipo]);

  // Micro-KPIs
  const kpiTotal = reunioes.length;
  const kpiAgendadas = reunioes.filter((r) => r.status === 'agendada').length;
  const kpiConcluidas = reunioes.filter((r) => r.status === 'concluida').length;
  const kpiProjetos = reunioes.filter((r) => Boolean(r.projeto_id)).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'concluida':
        return <Badge variant="success">CONCLUÍDA</Badge>;
      case 'em_andamento':
        return <Badge variant="warning">EM ANDAMENTO</Badge>;
      case 'agendada':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
            AGENDADA
          </span>
        );
      case 'cancelada':
      default:
        return <Badge variant="danger">CANCELADA</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'extraordinaria':
        return <Badge variant="warning">EXTRAORDINÁRIA</Badge>;
      case 'alinhamento_projeto':
        return <Badge variant="primary">ALINHAMENTO</Badge>;
      case 'assembleia':
        return <Badge variant="purple">ASSEMBLEIA</Badge>;
      case 'conselho':
        return <Badge variant="neutral">CONSELHO</Badge>;
      case 'diretoria':
        return <Badge variant="purple">DIRETORIA</Badge>;
      case 'planejamento':
        return <Badge variant="primary">PLANEJAMENTO</Badge>;
      case 'ordinaria':
      default:
        return <Badge variant="neutral">ORDINÁRIA</Badge>;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Reuniões & Governança"
        subtitle="Agendamentos, pautas, condução, atas timbradas em PDF e alinhamento de projetos"
        action={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingReuniao(null);
              setShowModalReuniao(true);
            }}
          >
            Nova Reunião
          </Button>
        }
      />

      {/* Container Centralizado Arejado (Design System padrão Elo) */}
      <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 flex-1 overflow-y-auto">
        {!selectedReuniao ? (
          /* =========================================================================
             ESTADO 1: HUB DE REUNIÕES (VISÃO GERAL MINIMALISTA & INSTITUCIONAL)
             ========================================================================= */
          <div className="space-y-6">
            {/* Micro-KPIs Minimalistas em Estilo Executivo */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center gap-3.5 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#F2632D] flex items-center justify-center shrink-0">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Total de Reuniões</p>
                  <p className="text-xl font-bold text-[var(--text-primary)] leading-tight">{kpiTotal}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center gap-3.5 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Agendadas / Próximas</p>
                  <p className="text-xl font-bold text-[var(--text-primary)] leading-tight">{kpiAgendadas}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center gap-3.5 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Atas Lavradas</p>
                  <p className="text-xl font-bold text-[var(--text-primary)] leading-tight">{kpiConcluidas}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center gap-3.5 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">De Projetos Sociais</p>
                  <p className="text-xl font-bold text-[var(--text-primary)] leading-tight">{kpiProjetos}</p>
                </div>
              </div>
            </div>

            {/* Barra de Filtros em Chips + Busca Rápida */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[var(--bg-elevated)] p-3.5 rounded-2xl border border-[var(--border-default)] shadow-xs">
              {/* Chips Rápidos de Status */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                <button
                  type="button"
                  onClick={() => setFilterStatus('todos')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all shrink-0 cursor-pointer ${
                    filterStatus === 'todos'
                      ? 'bg-[#F2632D] text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Todas ({kpiTotal})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('agendada')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all shrink-0 cursor-pointer ${
                    filterStatus === 'agendada'
                      ? 'bg-[#F2632D] text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Agendadas ({kpiAgendadas})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('em_andamento')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all shrink-0 cursor-pointer ${
                    filterStatus === 'em_andamento'
                      ? 'bg-[#F2632D] text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Em Andamento
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('concluida')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all shrink-0 cursor-pointer ${
                    filterStatus === 'concluida'
                      ? 'bg-[#F2632D] text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Atas Concluídas ({kpiConcluidas})
                </button>
              </div>

              {/* Busca e Dropdowns de Filtro */}
              <div className="flex items-center gap-2 flex-1 md:justify-end flex-wrap sm:flex-nowrap">
                <div className="relative flex-1 md:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Buscar reunião ou pauta..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[#F2632D] transition-all"
                  />
                </div>

                <select
                  value={filterProjeto}
                  onChange={(e) => setFilterProjeto(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] shrink-0 focus:outline-none focus:border-[#F2632D]"
                >
                  <option value="todos">Vínculo: Todos</option>
                  <option value="geral">Geral / Diretoria</option>
                  {projetos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>

                <select
                  value={filterTipo}
                  onChange={(e) => setFilterTipo(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] shrink-0 focus:outline-none focus:border-[#F2632D]"
                >
                  <option value="todos">Tipo: Todos</option>
                  <option value="ordinaria">Ordinária</option>
                  <option value="extraordinaria">Extraordinária</option>
                  <option value="alinhamento_projeto">Alinhamento</option>
                  <option value="diretoria">Diretoria</option>
                  <option value="assembleia">Assembleia</option>
                  <option value="conselho">Conselho</option>
                  <option value="planejamento">Planejamento</option>
                </select>
              </div>
            </div>

            {/* Cabeçalho da Lista / Grid */}
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                Reuniões Cadastradas ({filteredReunioes.length})
              </h3>
              {loading && <span className="text-xs text-[var(--text-muted)] animate-pulse">Atualizando dados...</span>}
            </div>

            {/* GRID DE CARDS DAS REUNIÕES */}
            {filteredReunioes.length === 0 ? (
              <Card className="p-12 text-center space-y-4 max-w-lg mx-auto">
                <Calendar className="w-12 h-12 mx-auto text-[var(--text-muted)] opacity-40" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-[var(--text-primary)]">Nenhuma reunião encontrada</h4>
                  <p className="text-xs text-[var(--text-muted)]">
                    Não há agendamentos com os filtros selecionados no momento.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSearch('');
                      setFilterStatus('todos');
                      setFilterProjeto('todos');
                      setFilterTipo('todos');
                    }}
                  >
                    Limpar Filtros
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={() => {
                      setEditingReuniao(null);
                      setShowModalReuniao(true);
                    }}
                  >
                    Nova Reunião
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReunioes.map((r) => {
                  const dataDate = new Date(r.data_hora);
                  const duracao = r.duracao_estimada_min || 60;
                  const numPautas = r.pautas_topicos?.length || 0;
                  const numParticipantes = r.participantes?.length || 0;

                  return (
                    <div
                      key={r.id}
                      className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:border-[#F2632D]/40 transition-all flex flex-col justify-between space-y-4 shadow-xs group hover:shadow-md cursor-pointer"
                      onClick={() => {
                        setSelectedReuniao(r);
                        setActiveTab('pauta');
                      }}
                    >
                      {/* Topo do Card: Vínculo + Tipo + Status */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {r.projeto ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[10px] bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                                <FolderKanban className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                {r.projeto.nome}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[10px] bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                                Geral
                              </span>
                            )}
                            {getTipoBadge(r.tipo)}
                          </div>

                          {getStatusBadge(r.status)}
                        </div>

                        {/* Data e Horário em Destaque */}
                        <div className="flex items-center gap-2 pt-1 text-xs text-[var(--text-secondary)]">
                          <span className="flex items-center gap-1.5 font-bold text-[#F2632D]">
                            <Calendar className="w-3.5 h-3.5" />
                            {dataDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="opacity-40">•</span>
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            {dataDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Título da Reunião */}
                        <h4 className="font-bold text-base text-[var(--text-primary)] leading-snug group-hover:text-[#F2632D] transition-colors line-clamp-2 pt-0.5">
                          {r.titulo}
                        </h4>

                        {/* Resumo de Pautas e Participantes */}
                        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] pt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <ClipboardList className="w-3.5 h-3.5 text-[#F2632D]" />
                            {numPautas > 0 ? `${numPautas} pauta(s)` : 'Pauta livre'}
                          </span>
                          <span className="opacity-40">•</span>
                          <span>{duracao} min</span>
                          {numParticipantes > 0 && (
                            <>
                              <span className="opacity-40">•</span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                {numParticipantes} convocados
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Rodapé do Card: Ações Diretas */}
                      <div
                        className="flex items-center justify-between gap-2 pt-3 border-t border-[var(--border-default)]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setSelectedReuniao(r);
                            setActiveTab('pauta');
                          }}
                          icon={<ArrowRight className="w-3.5 h-3.5" />}
                          className="flex-1 justify-center text-xs font-semibold"
                        >
                          Abrir Reunião
                        </Button>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingReuniao(r);
                              setShowModalReuniao(true);
                            }}
                            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                            title="Editar agendamento"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReuniao(r.id!)}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Excluir reunião"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* =========================================================================
             ESTADO 2: WORKSPACE FOCADO DA REUNIÃO (LARGURA TOTAL, SEM SOBRECARGA)
             ========================================================================= */
          <div className="max-w-5xl mx-auto space-y-5">
            {/* Barra de Navegação: Botão Voltar + Ações */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedReuniao(null)}
                className="inline-flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[#F2632D] transition-colors cursor-pointer self-start"
              >
                <ArrowLeft className="w-4 h-4 text-[#F2632D]" />
                Voltar para todas as reuniões
              </button>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setPrintModo('convocacao');
                    setPrintModalOpen(true);
                  }}
                  icon={<Printer className="w-3.5 h-3.5 text-[#F2632D]" />}
                  title="Gerar PDF oficial de Convocação"
                >
                  Convocação PDF
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setPrintModo('ata');
                    setPrintModalOpen(true);
                  }}
                  icon={<FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                  title="Gerar PDF oficial da Ata Timbrada"
                >
                  Ata Timbrada
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditingReuniao(selectedReuniao);
                    setShowModalReuniao(true);
                  }}
                  icon={<Edit className="w-3.5 h-3.5 text-[var(--text-secondary)]" />}
                >
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDeleteReuniao(selectedReuniao.id!)}
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Excluir
                </Button>
              </div>
            </div>

            {/* Card Focado da Reunião */}
            <Card className="p-6 sm:p-8 space-y-6 border-l-4 border-l-[#F2632D] shadow-sm">
              {/* Header do Detalhe */}
              <div className="space-y-2 pb-4 border-b border-[var(--border-default)]">
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedReuniao.projeto ? (
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 flex items-center gap-1">
                      <FolderKanban className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      {selectedReuniao.projeto.nome}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                      Institucional Geral
                    </span>
                  )}
                  {getTipoBadge(selectedReuniao.tipo)}
                  {getStatusBadge(selectedReuniao.status)}
                </div>

                <h2 className="font-extrabold text-xl sm:text-2xl text-[var(--text-primary)] leading-tight">
                  {selectedReuniao.titulo}
                </h2>
              </div>

              {/* Abas de Ciclo de Vida da Reunião */}
              <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-1 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('pauta')}
                  className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    activeTab === 'pauta'
                      ? 'bg-[#F2632D] text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  1. Pauta & Convocação
                </button>

                <button
                  onClick={() => setActiveTab('presenca')}
                  className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    activeTab === 'presenca'
                      ? 'bg-[#F2632D] text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  2. Condução & Presença
                  {selectedReuniao.presentes && selectedReuniao.presentes.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 ml-1">
                      {selectedReuniao.presentes.length} presentes
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('ata')}
                  className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    activeTab === 'ata'
                      ? 'bg-[#F2632D] text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  3. Ata & Encaminhamentos
                  {selectedReuniao.ata && (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 ml-1" />
                  )}
                </button>
              </div>

              {/* Conteúdo da Aba Ativa */}
              <div className="pt-2">
                {activeTab === 'pauta' && (
                  <ReuniaoPautaTab
                    reuniao={selectedReuniao}
                    onOpenConvocacaoPrint={() => {
                      setPrintModo('convocacao');
                      setPrintModalOpen(true);
                    }}
                  />
                )}

                {activeTab === 'presenca' && (
                  <ReuniaoPresencaTab
                    reuniao={selectedReuniao}
                    onUpdateReuniao={handleUpdateSelected}
                    onNavigateToAta={() => setActiveTab('ata')}
                  />
                )}

                {activeTab === 'ata' && (
                  <ReuniaoAtaTab
                    reuniao={selectedReuniao}
                    currentUser={currentUser}
                    onUpdateReuniao={handleUpdateSelected}
                    onOpenAtaPrint={() => {
                      setPrintModo('ata');
                      setPrintModalOpen(true);
                    }}
                  />
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* MODAL NOVO/EDITAR AGENDAMENTO DE REUNIÃO */}
      <ModalNovaReuniao
        isOpen={showModalReuniao}
        onClose={() => {
          setShowModalReuniao(false);
          setEditingReuniao(null);
        }}
        onSave={handleSaveReuniao}
        initialData={editingReuniao}
        projetos={projetos}
        voluntarios={voluntarios}
        currentUser={currentUser}
      />

      {/* MODAL DE IMPRESSÃO / PDF TIMBRADO (PAPEL TIMBRADO INSTITUTO ÁDAPO) */}
      <PapelTimbradoModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        tituloDocumento={
          printModo === 'convocacao'
            ? 'CONVOCAÇÃO OFICIAL DE REUNIÃO'
            : `ATA DE REUNIÃO ${selectedReuniao?.tipo?.toUpperCase() || ''}`
        }
        subtituloDocumento={
          selectedReuniao
            ? `${selectedReuniao.titulo} | ${new Date(selectedReuniao.data_hora).toLocaleDateString('pt-BR')}`
            : ''
        }
        nomeArquivo={
          selectedReuniao
            ? `${printModo === 'convocacao' ? 'Convocação' : 'Ata'} - ${selectedReuniao.titulo} - ${new Date(selectedReuniao.data_hora).toLocaleDateString('pt-BR').replace(/\//g, '-')}`
            : undefined
        }
      >
        {selectedReuniao && <ReuniaoPrintTemplate reuniao={selectedReuniao} modo={printModo} />}
      </PapelTimbradoModal>
    </div>
  );
}
