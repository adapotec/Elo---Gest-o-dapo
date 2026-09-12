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
} from 'lucide-react';

export default function InstitucionalPage() {
  const [loading, setLoading] = useState(true);
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [projetos, setProjetos] = useState<ProjetoResumo[]>([]);
  const [voluntarios, setVoluntarios] = useState<VoluntarioItem[]>([]);
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
        let initialSelected = formatadas[0] || null;
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const paramId = urlParams.get('reuniaoId');
          if (paramId) {
            const achada = formatadas.find((f) => f.id === paramId);
            if (achada) initialSelected = achada;
          }
        }

        if (formatadas.length > 0) {
          setSelectedReuniao((prev) => {
            if (!prev) return initialSelected;
            const updated = formatadas.find((r) => r.id === prev.id);
            return updated || initialSelected;
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
          if (!prev) return formatadas[0] || null;
          const updated = formatadas.find((r: Reuniao) => r.id === prev.id);
          return updated || prev;
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
        {/* Micro-KPIs Compactos */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-3.5 flex items-center gap-3 border-l-4 border-l-[#F2632D] shadow-xs">
            <div className="p-2.5 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Total de Reuniões</p>
              <p className="text-xl font-bold text-[var(--text-primary)] leading-tight">{kpiTotal}</p>
            </div>
          </Card>

          <Card className="p-3.5 flex items-center gap-3 border-l-4 border-l-purple-500 shadow-xs">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Agendadas / Próximas</p>
              <p className="text-xl font-bold text-[var(--text-primary)] leading-tight">{kpiAgendadas}</p>
            </div>
          </Card>

          <Card className="p-3.5 flex items-center gap-3 border-l-4 border-l-emerald-500 shadow-xs">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Atas Lavradas</p>
              <p className="text-xl font-bold text-[var(--text-primary)] leading-tight">{kpiConcluidas}</p>
            </div>
          </Card>

          <Card className="p-3.5 flex items-center gap-3 border-l-4 border-l-blue-500 shadow-xs">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">De Projetos Sociais</p>
              <p className="text-xl font-bold text-[var(--text-primary)] leading-tight">{kpiProjetos}</p>
            </div>
          </Card>
        </div>

        {/* Barra de Ferramentas / Filtros em Linha Única */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Buscar reunião por título, pauta, projeto ou conteúdo da ata..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {/* Filtro Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-2 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] shrink-0 focus:outline-none focus:border-[var(--color-primary)]"
            >
              <option value="todos">Status: Todos</option>
              <option value="agendada">Agendadas</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluida">Concluídas</option>
              <option value="cancelada">Canceladas</option>
            </select>

            {/* Filtro Projeto */}
            <select
              value={filterProjeto}
              onChange={(e) => setFilterProjeto(e.target.value)}
              className="px-2.5 py-2 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] shrink-0 focus:outline-none focus:border-[var(--color-primary)]"
            >
              <option value="todos">Vínculo: Todos</option>
              <option value="geral">Geral / Diretoria</option>
              {projetos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>

            {/* Filtro Tipo */}
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="px-2.5 py-2 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] shrink-0 focus:outline-none focus:border-[var(--color-primary)]"
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

        {/* LAYOUT MASTER-DETAIL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* COLUNA ESQUERDA: LISTA DE REUNIÕES (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                Lista de Reuniões ({filteredReunioes.length})
              </h3>
              {loading && <span className="text-xs text-[var(--text-muted)] animate-pulse">Atualizando...</span>}
            </div>

            {filteredReunioes.length === 0 ? (
              <Card className="p-8 text-center space-y-3">
                <Calendar className="w-10 h-10 mx-auto text-[var(--text-muted)] opacity-40" />
                <p className="text-xs text-[var(--text-muted)]">Nenhuma reunião encontrada com os filtros selecionados.</p>
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
              </Card>
            ) : (
              <div className="space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                {filteredReunioes.map((r) => {
                  const isSelected = selectedReuniao?.id === r.id;
                  const dataDate = new Date(r.data_hora);

                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSelectedReuniao(r);
                      }}
                      className={`w-full text-left p-4 rounded-2xl border transition-all text-xs card-contrast relative overflow-hidden group cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--bg-elevated)] border-[#F2632D] shadow-md ring-2 ring-[#F2632D]/30 border-l-[6px] border-l-[#F2632D]'
                          : 'bg-[var(--bg-elevated)]/90 border-[var(--border-default)] hover:border-[#F2632D]/40 hover:bg-[var(--bg-elevated)] shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="min-w-0 flex-1">
                          {/* Tag de Projeto ou Geral */}
                          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
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

                          <p
                            className={`text-sm truncate leading-snug ${
                              isSelected
                                ? 'font-extrabold text-[var(--text-primary)]'
                                : 'font-bold text-[var(--text-primary)] group-hover:text-[#F2632D] transition-colors'
                            }`}
                          >
                            {r.titulo}
                          </p>

                          {/* Data e Horário */}
                          <div className="flex items-center gap-2 mt-2 text-[11px] text-[var(--text-secondary)] flex-wrap">
                            <span className="flex items-center gap-1 font-semibold text-[var(--text-primary)]">
                              <Calendar className="w-3.5 h-3.5 text-[#F2632D]" />
                              {dataDate.toLocaleDateString('pt-BR')}
                            </span>
                            <span className="opacity-40">•</span>
                            <span className="flex items-center gap-1 font-medium">
                              <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                              {dataDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {r.participantes && r.participantes.length > 0 && (
                              <>
                                <span className="opacity-40">•</span>
                                <span className="flex items-center gap-1 font-medium text-[var(--text-muted)]">
                                  <Users className="w-3.5 h-3.5" />
                                  {r.participantes.length}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2.5 shrink-0 pt-0.5">
                          {getStatusBadge(r.status)}
                          <ChevronRight
                            className={`w-4 h-4 transition-all ${
                              isSelected
                                ? 'text-[#F2632D] translate-x-1 font-bold'
                                : 'text-[var(--text-muted)] opacity-50 group-hover:translate-x-0.5 group-hover:opacity-80'
                            }`}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* COLUNA DIREITA: DETALHE DA REUNIÃO EM 3 ABAS (lg:col-span-7) */}
          <div className="lg:col-span-7">
            {!selectedReuniao ? (
              <Card className="p-12 text-center space-y-4">
                <Landmark className="w-12 h-12 mx-auto text-[var(--text-muted)] opacity-40" />
                <div>
                  <h3 className="font-bold text-base text-[var(--text-primary)]">Selecione uma Reunião</h3>
                  <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mt-1">
                    Clique em qualquer reunião da lista à esquerda para consultar a pauta, registrar a presença ou lavrar a ata oficial.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    setEditingReuniao(null);
                    setShowModalReuniao(true);
                  }}
                >
                  Criar Nova Reunião
                </Button>
              </Card>
            ) : (
              <Card className="p-5 sm:p-6 space-y-6 border-l-4 border-l-[#F2632D] shadow-sm">
                {/* Header do Detalhe */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedReuniao.projeto ? (
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center gap-1">
                          <FolderKanban className="w-3.5 h-3.5" />
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

                    <h2 className="font-bold text-lg text-[var(--text-primary)] leading-tight">
                      {selectedReuniao.titulo}
                    </h2>
                  </div>

                  {/* Ações da Reunião */}
                  <div className="flex items-center gap-2 shrink-0">
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

                {/* Abas de Ciclo de Vida da Reunião */}
                <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-1 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('pauta')}
                    className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                      activeTab === 'pauta'
                        ? 'bg-[var(--color-primary)] text-white shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    1. Pauta & Convocação
                  </button>

                  <button
                    onClick={() => setActiveTab('presenca')}
                    className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                      activeTab === 'presenca'
                        ? 'bg-[var(--color-primary)] text-white shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    2. Condução & Presença
                    {selectedReuniao.presentes && selectedReuniao.presentes.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 ml-1">
                        {selectedReuniao.presentes.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('ata')}
                    className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                      activeTab === 'ata'
                        ? 'bg-[var(--color-primary)] text-white shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    3. Ata & Encaminhamentos
                    {selectedReuniao.ata && (
                      <CheckCircle className="w-3 h-3 text-emerald-400 ml-1" />
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
                      onUpdateReuniao={handleUpdateSelected}
                      onOpenAtaPrint={() => {
                        setPrintModo('ata');
                        setPrintModalOpen(true);
                      }}
                    />
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
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
      >
        {selectedReuniao && <ReuniaoPrintTemplate reuniao={selectedReuniao} modo={printModo} />}
      </PapelTimbradoModal>
    </div>
  );
}
