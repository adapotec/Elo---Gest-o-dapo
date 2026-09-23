'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  User,
  Share2,
  Ticket,
  CheckSquare,
  ArrowRight,
  ArrowLeft,
  Calendar,
  X,
  ExternalLink,
  Edit2,
  Trash2,
  Layers,
  GripVertical,
} from 'lucide-react';
import { ConteudoItem } from './ComunicacaoCalendario';
import { SolicitacaoComunicacaoItem } from './ComunicacaoTickets';
import { Voluntario } from '@/components/dashboard/voluntarios/VoluntariosEquipe';

export interface ChecklistItem {
  id: string;
  texto: string;
  concluido: boolean;
}

export interface TarefaAvulsaItem {
  id: string;
  titulo: string;
  descricao?: string | null;
  status: 'a_fazer' | 'em_andamento' | 'revisao' | 'concluido';
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  projeto_id?: string | null;
  responsavel_id?: string | null;
  data_limite?: string | null;
  etiquetas?: string[];
  checklist?: ChecklistItem[] | null;
  created_at?: string;
  updated_at?: string;
  projetos_sociais?: { nome: string; cor_identificacao?: string } | null;
  voluntarios?: { nome_completo: string; avatar_url?: string } | null;
}

export interface KanbanCard {
  id: string;
  origem: 'conteudo' | 'ticket' | 'tarefa';
  titulo: string;
  descricao?: string | null;
  coluna: 'a_fazer' | 'em_producao' | 'em_revisao' | 'concluido';
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  projetoNome?: string;
  projetoCor?: string;
  responsavelNome?: string;
  solicitanteNome?: string;
  dataLimite?: string | null;
  tipoRotulo: string;
  checklist?: ChecklistItem[] | null;
  rawItem: any;
}

interface ProjetoSimples {
  id: string;
  nome: string;
  cor_identificacao?: string;
}

interface ComunicacaoTarefasKanbanProps {
  tarefas: TarefaAvulsaItem[];
  conteudos: ConteudoItem[];
  tickets: SolicitacaoComunicacaoItem[];
  projetos: ProjetoSimples[];
  voluntarios: Voluntario[];
  loading: boolean;
  canEdit?: boolean;
  onRefresh: () => void;
  onSaveTarefa: (tarefa: Partial<TarefaAvulsaItem>) => Promise<void>;
  onDeleteTarefa: (id: string) => Promise<void>;
  onUpdateConteudoStatus: (id: string, status: ConteudoItem['status']) => Promise<void>;
  onUpdateTicketStatus: (id: string, status: SolicitacaoComunicacaoItem['status']) => Promise<void>;
  onUpdateChecklist?: (id: string, origem: 'conteudo' | 'ticket' | 'tarefa', checklist: ChecklistItem[]) => Promise<void>;
  onNavigateToTab?: (tab: 'calendario' | 'tickets' | 'campanhas' | 'galeria') => void;
}

const COLUNAS = [
  { id: 'a_fazer', titulo: 'A Fazer', badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700' },
  { id: 'em_producao', titulo: 'Em Produção', badgeBg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800' },
  { id: 'em_revisao', titulo: 'Em Revisão', badgeBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800' },
  { id: 'concluido', titulo: 'Concluído', badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' },
] as const;

export function ComunicacaoTarefasKanban({
  tarefas,
  conteudos,
  tickets,
  projetos,
  voluntarios,
  loading,
  canEdit = true,
  onRefresh,
  onSaveTarefa,
  onDeleteTarefa,
  onUpdateConteudoStatus,
  onUpdateTicketStatus,
  onUpdateChecklist,
  onNavigateToTab,
}: ComunicacaoTarefasKanbanProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [origemFilter, setOrigemFilter] = useState<'todos' | 'tarefa' | 'conteudo' | 'ticket'>('todos');
  const [projetoFilter, setProjetoFilter] = useState<string>('todos');
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>('todos');

  // Estados para Drag and Drop
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Estados de Modal para Criar / Editar Tarefa Operacional Avulsa
  const [showModalTarefa, setShowModalTarefa] = useState(false);
  const [editingTarefa, setEditingTarefa] = useState<TarefaAvulsaItem | null>(null);
  const [formTitulo, setFormTitulo] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formColuna, setFormColuna] = useState<TarefaAvulsaItem['status']>('a_fazer');
  const [formPrioridade, setFormPrioridade] = useState<TarefaAvulsaItem['prioridade']>('normal');
  const [formProjetoId, setFormProjetoId] = useState('');
  const [formResponsavelId, setFormResponsavelId] = useState('');
  const [formDataLimite, setFormDataLimite] = useState('');
  const [saving, setSaving] = useState(false);

  // Modal de Detalhes do Card Selecionado (com visualização e Checklist)
  const [selectedCardDetail, setSelectedCardDetail] = useState<KanbanCard | null>(null);
  const [newChecklistText, setNewChecklistText] = useState('');

  // 1. Unificação dos 3 tipos de dados em cards para o Kanban
  const kanbanCards: KanbanCard[] = useMemo(() => {
    const cards: KanbanCard[] = [];

    // A. Produções do Calendário Editorial
    conteudos.forEach((c) => {
      let coluna: KanbanCard['coluna'] = 'a_fazer';
      if (c.status === 'producao') coluna = 'em_producao';
      else if (c.status === 'analise' || c.status === 'em_atraso') coluna = 'em_revisao';
      else if (c.status === 'publicado') coluna = 'concluido';

      cards.push({
        id: c.id,
        origem: 'conteudo',
        titulo: c.titulo || 'Sem título',
        descricao: c.descricao || c.observacoes || null,
        coluna,
        prioridade: c.status === 'em_atraso' ? 'urgente' : 'normal',
        projetoNome: c.projetos_sociais?.nome,
        projetoCor: c.projetos_sociais?.cor_identificacao || '#F2632D',
        responsavelNome: c.voluntarios?.nome_completo,
        dataLimite: c.data_publicacao,
        tipoRotulo: `Rede Social (${c.tipo_conteudo?.toUpperCase() || 'POST'})`,
        checklist: Array.isArray((c as any).checklist) ? (c as any).checklist : [],
        rawItem: c,
      });
    });

    // B. Demandas e Solicitações de Materiais
    tickets.forEach((t) => {
      let coluna: KanbanCard['coluna'] = 'a_fazer';
      if (t.status === 'em_producao' || t.status === 'aprovado') coluna = 'em_producao';
      else if (t.status === 'em_analise') coluna = 'em_revisao';
      else if (t.status === 'concluido') coluna = 'concluido';

      cards.push({
        id: t.id,
        origem: 'ticket',
        titulo: t.titulo || 'Sem título',
        descricao: t.descricao_detalhes || null,
        coluna,
        prioridade: t.urgencia || 'normal',
        projetoNome: t.projetos_sociais?.nome,
        projetoCor: t.projetos_sociais?.cor_identificacao || '#2563EB',
        solicitanteNome: t.solicitante_nome || t.solicitante?.nome_completo,
        dataLimite: t.prazo_desejado,
        tipoRotulo: `Demanda (${(t.tipo_material || 'material').replace('_', ' ').toUpperCase()})`,
        checklist: Array.isArray((t as any).checklist) ? (t as any).checklist : [],
        rawItem: t,
      });
    });

    // C. Tarefas Avulsas & Rotina Operacional
    tarefas.forEach((ta) => {
      let coluna: KanbanCard['coluna'] = 'a_fazer';
      if (ta.status === 'em_andamento') coluna = 'em_producao';
      else if (ta.status === 'revisao') coluna = 'em_revisao';
      else if (ta.status === 'concluido') coluna = 'concluido';

      cards.push({
        id: ta.id,
        origem: 'tarefa',
        titulo: ta.titulo || 'Sem título',
        descricao: ta.descricao || null,
        coluna,
        prioridade: ta.prioridade || 'normal',
        projetoNome: ta.projetos_sociais?.nome,
        projetoCor: ta.projetos_sociais?.cor_identificacao || '#0D9488',
        responsavelNome: ta.voluntarios?.nome_completo,
        dataLimite: ta.data_limite,
        tipoRotulo: 'Tarefa Operacional',
        checklist: Array.isArray(ta.checklist) ? ta.checklist : [],
        rawItem: ta,
      });
    });

    return cards;
  }, [conteudos, tickets, tarefas]);

  // 2. Filtros
  const filteredCards = useMemo(() => {
    return kanbanCards.filter((card) => {
      const matchSearch =
        (card.titulo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (card.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (card.responsavelNome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (card.solicitanteNome || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchOrigem = origemFilter === 'todos' || card.origem === origemFilter;
      const matchProj =
        projetoFilter === 'todos' ||
        card.rawItem?.projeto_id === projetoFilter ||
        card.projetoNome === projetoFilter;
      const matchPrio = prioridadeFilter === 'todos' || card.prioridade === prioridadeFilter;

      return matchSearch && matchOrigem && matchProj && matchPrio;
    });
  }, [kanbanCards, searchTerm, origemFilter, projetoFilter, prioridadeFilter]);

  // 3. Mover Card entre Colunas (Drag and Drop ou Botões)
  const handleMoverCardToCol = async (
    cardId: string,
    origem: KanbanCard['origem'],
    novaColuna: KanbanCard['coluna']
  ) => {
    if (!canEdit) return;

    if (origem === 'conteudo') {
      const statusMap: Record<KanbanCard['coluna'], ConteudoItem['status']> = {
        a_fazer: 'nao_iniciado',
        em_producao: 'producao',
        em_revisao: 'analise',
        concluido: 'publicado',
      };
      await onUpdateConteudoStatus(cardId, statusMap[novaColuna]);
    } else if (origem === 'ticket') {
      const statusMap: Record<KanbanCard['coluna'], SolicitacaoComunicacaoItem['status']> = {
        a_fazer: 'pendente',
        em_producao: 'em_producao',
        em_revisao: 'em_analise',
        concluido: 'concluido',
      };
      await onUpdateTicketStatus(cardId, statusMap[novaColuna]);
    } else {
      const statusMap: Record<KanbanCard['coluna'], TarefaAvulsaItem['status']> = {
        a_fazer: 'a_fazer',
        em_producao: 'em_andamento',
        em_revisao: 'revisao',
        concluido: 'concluido',
      };
      await onSaveTarefa({ id: cardId, status: statusMap[novaColuna] });
    }
  };

  const handleMoverCard = async (card: KanbanCard, direcao: 'avancar' | 'recuar') => {
    const ordemColunas: KanbanCard['coluna'][] = ['a_fazer', 'em_producao', 'em_revisao', 'concluido'];
    const currentIndex = ordemColunas.indexOf(card.coluna);
    const targetIndex = direcao === 'avancar' ? currentIndex + 1 : currentIndex - 1;

    if (targetIndex < 0 || targetIndex >= ordemColunas.length) return;
    const novaColuna = ordemColunas[targetIndex];
    await handleMoverCardToCol(card.id, card.origem, novaColuna);
  };

  // 4. Checklist Handlers
  const handleToggleChecklistItem = async (itemId: string) => {
    if (!selectedCardDetail || !onUpdateChecklist || !canEdit) return;
    const currentList = selectedCardDetail.checklist || [];
    const updated = currentList.map((i) => (i.id === itemId ? { ...i, concluido: !i.concluido } : i));

    setSelectedCardDetail((prev) => (prev ? { ...prev, checklist: updated } : null));
    await onUpdateChecklist(selectedCardDetail.id, selectedCardDetail.origem, updated);
  };

  const handleAddChecklistItem = async () => {
    if (!selectedCardDetail || !newChecklistText.trim() || !onUpdateChecklist || !canEdit) return;
    const currentList = selectedCardDetail.checklist || [];
    const newItem: ChecklistItem = {
      id: `chk-${Date.now()}`,
      texto: newChecklistText.trim(),
      concluido: false,
    };
    const updated = [...currentList, newItem];
    setNewChecklistText('');

    setSelectedCardDetail((prev) => (prev ? { ...prev, checklist: updated } : null));
    await onUpdateChecklist(selectedCardDetail.id, selectedCardDetail.origem, updated);
  };

  const handleRemoveChecklistItem = async (itemId: string) => {
    if (!selectedCardDetail || !onUpdateChecklist || !canEdit) return;
    const currentList = selectedCardDetail.checklist || [];
    const updated = currentList.filter((i) => i.id !== itemId);

    setSelectedCardDetail((prev) => (prev ? { ...prev, checklist: updated } : null));
    await onUpdateChecklist(selectedCardDetail.id, selectedCardDetail.origem, updated);
  };

  // 5. Modal Criar / Editar Tarefa
  const handleOpenNovaTarefa = (colunaStatus: TarefaAvulsaItem['status'] = 'a_fazer') => {
    setEditingTarefa(null);
    setFormTitulo('');
    setFormDescricao('');
    setFormColuna(colunaStatus);
    setFormPrioridade('normal');
    setFormProjetoId('');
    setFormResponsavelId('');
    setFormDataLimite('');
    setShowModalTarefa(true);
  };

  const handleEditTarefa = (tarefa: TarefaAvulsaItem) => {
    setEditingTarefa(tarefa);
    setFormTitulo(tarefa.titulo || '');
    setFormDescricao(tarefa.descricao || '');
    setFormColuna(tarefa.status || 'a_fazer');
    setFormPrioridade(tarefa.prioridade || 'normal');
    setFormProjetoId(tarefa.projeto_id || '');
    setFormResponsavelId(tarefa.responsavel_id || '');
    setFormDataLimite(tarefa.data_limite || '');
    setShowModalTarefa(true);
  };

  const handleSubmitTarefa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitulo.trim()) {
      alert('Informe o título da tarefa.');
      return;
    }

    setSaving(true);
    try {
      await onSaveTarefa({
        ...(editingTarefa ? { id: editingTarefa.id } : {}),
        titulo: formTitulo.trim(),
        descricao: formDescricao.trim() || null,
        status: formColuna,
        prioridade: formPrioridade,
        projeto_id: formProjetoId || null,
        responsavel_id: formResponsavelId || null,
        data_limite: formDataLimite || null,
      });
      setShowModalTarefa(false);
    } catch (err: any) {
      alert('Erro ao salvar tarefa: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const renderPrioridadeBadge = (prio: string) => {
    switch (prio) {
      case 'urgente':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/25">
            <Flame className="w-3 h-3 text-rose-600 shrink-0" />
            <span>Urgente</span>
          </span>
        );
      case 'alta':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/25">
            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
            <span>Alta</span>
          </span>
        );
      case 'baixa':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            Baixa
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
            Normal
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra Superior de Filtros e Adição Rápida */}
      <div className="p-3 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar no quadro de tarefas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[var(--color-primary)] font-medium"
            />
          </div>

          <select
            value={origemFilter}
            onChange={(e: any) => setOrigemFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-medium cursor-pointer"
          >
            <option value="todos">Todas as Origens</option>
            <option value="tarefa">Apenas Tarefas Avulsas</option>
            <option value="conteudo">Apenas Redes Sociais</option>
            <option value="ticket">Apenas Demandas & Tickets</option>
          </select>

          <select
            value={projetoFilter}
            onChange={(e) => setProjetoFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-medium cursor-pointer"
          >
            <option value="todos">Todos os Projetos</option>
            {projetos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>

          <select
            value={prioridadeFilter}
            onChange={(e) => setPrioridadeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-medium cursor-pointer"
          >
            <option value="todos">Todas as Prioridades</option>
            <option value="urgente">Urgente</option>
            <option value="alta">Alta</option>
            <option value="normal">Normal</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2 self-end md:self-auto">
            <Button
              size="sm"
              variant="primary"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => handleOpenNovaTarefa('a_fazer')}
            >
              Nova Tarefa
            </Button>
          </div>
        )}
      </div>

      {/* QUADRO KANBAN (4 COLUNAS) COM ARRASTAR E SOLTAR (DRAG & DROP) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUNAS.map((coluna) => {
          const cardsDaColuna = filteredCards.filter((c) => c.coluna === coluna.id);
          const isOver = dragOverColumn === coluna.id;

          return (
            <div
              key={coluna.id}
              onDragOver={(e) => {
                if (!canEdit) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverColumn !== coluna.id) {
                  setDragOverColumn(coluna.id);
                }
              }}
              onDragLeave={(e) => {
                if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                if (dragOverColumn === coluna.id) {
                  setDragOverColumn(null);
                }
              }}
              onDrop={async (e) => {
                if (!canEdit) return;
                e.preventDefault();
                setDragOverColumn(null);
                setDraggedCardId(null);
                try {
                  const rawData = e.dataTransfer.getData('text/plain');
                  if (!rawData) return;
                  const { id, origem, coluna: fromCol } = JSON.parse(rawData);
                  if (fromCol === coluna.id) return;
                  await handleMoverCardToCol(id, origem, coluna.id);
                } catch (err) {
                  console.error('Erro no drag and drop:', err);
                }
              }}
              className={`flex flex-col rounded-2xl border transition-all duration-200 min-h-[620px] p-3.5 space-y-3 ${
                isOver
                  ? 'border-2 border-dashed border-[var(--color-primary)] bg-[var(--color-primary-soft)]/30 ring-4 ring-[var(--color-primary)]/15 scale-[1.01]'
                  : 'border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-md'
              }`}
            >
              {/* Cabeçalho da Coluna */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    {coluna.titulo}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold border ${coluna.badgeBg}`}
                  >
                    {cardsDaColuna.length}
                  </span>
                </div>

                {canEdit && (
                  <button
                    type="button"
                    title="Adicionar tarefa nesta coluna"
                    onClick={() => {
                      const statusMap: Record<string, TarefaAvulsaItem['status']> = {
                        a_fazer: 'a_fazer',
                        em_producao: 'em_andamento',
                        em_revisao: 'revisao',
                        concluido: 'concluido',
                      };
                      handleOpenNovaTarefa(statusMap[coluna.id]);
                    }}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Lista de Cartões da Coluna */}
              <div className="space-y-2.5 flex-1 overflow-y-auto custom-scrollbar pr-0.5 min-h-[200px]">
                {cardsDaColuna.length === 0 ? (
                  <div className="h-36 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
                    <Layers className="w-5 h-5 text-slate-400 dark:text-slate-500 mb-1" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Nenhum item nesta etapa</span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Arraste um cartão para cá</span>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenNovaTarefa(
                            coluna.id === 'em_producao'
                              ? 'em_andamento'
                              : coluna.id === 'em_revisao'
                              ? 'revisao'
                              : coluna.id === 'concluido'
                              ? 'concluido'
                              : 'a_fazer'
                          )
                        }
                        className="mt-2 text-xs font-bold text-[var(--color-primary)] hover:underline cursor-pointer"
                      >
                        + Criar cartão
                      </button>
                    )}
                  </div>
                ) : (
                  cardsDaColuna.map((card) => {
                    const isTask = card.origem === 'tarefa';
                    const isContent = card.origem === 'conteudo';
                    const isTicket = card.origem === 'ticket';
                    const isDragging = draggedCardId === card.id;

                    const chkTotal = card.checklist?.length || 0;
                    const chkDone = card.checklist?.filter((i) => i.concluido).length || 0;
                    const chkAllDone = chkTotal > 0 && chkDone === chkTotal;

                    return (
                      <div
                        key={`${card.origem}-${card.id}`}
                        draggable={canEdit}
                        onDragStart={(e) => {
                          if (!canEdit) return;
                          setDraggedCardId(card.id);
                          e.dataTransfer.setData(
                            'text/plain',
                            JSON.stringify({ id: card.id, origem: card.origem, coluna: card.coluna })
                          );
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragEnd={() => {
                          setDraggedCardId(null);
                          setDragOverColumn(null);
                        }}
                        className={`p-3.5 space-y-2.5 rounded-xl border transition-all shadow-xs group bg-white dark:bg-slate-800/90 border-slate-200/90 dark:border-slate-700/80 hover:border-[var(--color-primary)]/80 hover:shadow-md ${
                          canEdit ? 'cursor-grab active:cursor-grabbing' : ''
                        } ${isDragging ? 'opacity-40 scale-95 border-blue-500 ring-2 ring-blue-500/20' : ''}`}
                      >
                        {/* Linha Superior: Origem & Prioridade */}
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isContent
                                ? 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/20'
                                : isTicket
                                ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                                : 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20'
                            }`}
                          >
                            {isContent && <Share2 className="w-2.5 h-2.5 shrink-0" />}
                            {isTicket && <Ticket className="w-2.5 h-2.5 shrink-0" />}
                            {isTask && <CheckSquare className="w-2.5 h-2.5 shrink-0" />}
                            <span className="truncate max-w-[120px]">{card.tipoRotulo}</span>
                          </span>

                          <div className="flex items-center gap-1">
                            {renderPrioridadeBadge(card.prioridade)}
                            {canEdit && (
                              <GripVertical className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* Título do Cartão */}
                        <h4
                          onClick={() => setSelectedCardDetail(card)}
                          className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 hover:text-[var(--color-primary)] cursor-pointer line-clamp-2 leading-snug transition-colors"
                        >
                          {card.titulo}
                        </h4>

                        {/* Indicador de Progresso de Checklist */}
                        {chkTotal > 0 && (
                          <div className="pt-1">
                            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                              <span className="flex items-center gap-1">
                                <CheckSquare
                                  className={`w-3 h-3 ${chkAllDone ? 'text-emerald-500' : 'text-slate-400'}`}
                                />
                                <span>{chkDone}/{chkTotal} checklist</span>
                              </span>
                              <span className={chkAllDone ? 'text-emerald-600 font-bold' : ''}>
                                {Math.round((chkDone / chkTotal) * 100)}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  chkAllDone ? 'bg-emerald-500' : 'bg-[var(--color-primary)]'
                                }`}
                                style={{ width: `${Math.round((chkDone / chkTotal) * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Projeto e Responsável */}
                        <div className="flex items-center justify-between text-[11px] gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                          {card.projetoNome ? (
                            <div className="flex items-center gap-1.5 truncate">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: card.projetoCor || '#F2632D' }}
                              />
                              <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[110px]">
                                {card.projetoNome}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 text-[10px]">Institucional</span>
                          )}

                          {card.responsavelNome ? (
                            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 truncate">
                              <User className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[90px]">{card.responsavelNome}</span>
                            </div>
                          ) : card.solicitanteNome ? (
                            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 truncate">
                              <span className="text-slate-400 text-[10px]">Por:</span>
                              <span className="truncate max-w-[90px]">{card.solicitanteNome}</span>
                            </div>
                          ) : null}
                        </div>

                        {/* Prazo e Ações Manuais de Movimentação */}
                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          {card.dataLimite ? (
                            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-mono-data text-[10px]">
                              <Clock className="w-3 h-3 shrink-0" />
                              <span>{new Date(card.dataLimite).toLocaleDateString('pt-BR')}</span>
                            </div>
                          ) : (
                            <span />
                          )}

                          {canEdit && (
                            <div className="flex items-center gap-1">
                              {coluna.id !== 'a_fazer' && (
                                <button
                                  type="button"
                                  title="Mover para etapa anterior"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoverCard(card, 'recuar');
                                  }}
                                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
                                >
                                  <ArrowLeft className="w-3 h-3" />
                                </button>
                              )}

                              {coluna.id !== 'concluido' && (
                                <button
                                  type="button"
                                  title="Avançar para próxima etapa"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoverCard(card, 'avancar');
                                  }}
                                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
                                >
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CRIAR / EDITAR TAREFA OPERACIONAL AVULSA */}
      {/* ========================================================================= */}
      {showModalTarefa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-default)]">
              <h3 className="font-bold text-base text-[var(--text-primary)]">
                {editingTarefa ? 'Editar Tarefa Operacional' : 'Nova Tarefa Operacional'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModalTarefa(false)}
                className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitTarefa} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                  Título da Tarefa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Enviar briefing para gráfica / Revisar roteiro do evento"
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                    Coluna / Etapa
                  </label>
                  <select
                    value={formColuna}
                    onChange={(e: any) => setFormColuna(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium cursor-pointer"
                  >
                    <option value="a_fazer">A Fazer</option>
                    <option value="em_andamento">Em Produção</option>
                    <option value="revisao">Em Revisão</option>
                    <option value="concluido">Concluído</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                    Prioridade
                  </label>
                  <select
                    value={formPrioridade}
                    onChange={(e: any) => setFormPrioridade(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium cursor-pointer"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                    Projeto Social (Opcional)
                  </label>
                  <select
                    value={formProjetoId}
                    onChange={(e) => setFormProjetoId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium cursor-pointer"
                  >
                    <option value="">Institucional Geral</option>
                    {projetos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                    Responsável na Equipe
                  </label>
                  <select
                    value={formResponsavelId}
                    onChange={(e) => setFormResponsavelId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium cursor-pointer"
                  >
                    <option value="">Não atribuído</option>
                    {voluntarios.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nome_completo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                  Data Limite
                </label>
                <input
                  type="date"
                  value={formDataLimite}
                  onChange={(e) => setFormDataLimite(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                  Descrição e Anotações
                </label>
                <textarea
                  rows={3}
                  placeholder="Informações adicionais, contatos de fornecedores, especificações..."
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-default)]">
                {editingTarefa ? (
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm('Deseja realmente excluir esta tarefa?')) {
                        await onDeleteTarefa(editingTarefa.id);
                        setShowModalTarefa(false);
                      }
                    }}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowModalTarefa(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    variant="primary"
                    disabled={saving}
                  >
                    {saving ? 'Salvando...' : editingTarefa ? 'Atualizar' : 'Criar Tarefa'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DETALHES DO CARD (COM CHECKLIST INTERATIVO) */}
      {/* ========================================================================= */}
      {selectedCardDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-default)]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {selectedCardDetail.tipoRotulo}
                </span>
                <h3 className="font-bold text-base text-[var(--text-primary)] mt-0.5">
                  {selectedCardDetail.titulo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCardDetail(null)}
                className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)]/60 border border-[var(--border-default)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Etapa Atual:</span>
                  <span className="font-bold text-[var(--text-primary)] capitalize">
                    {selectedCardDetail.coluna.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Prioridade:</span>
                  <div>{renderPrioridadeBadge(selectedCardDetail.prioridade)}</div>
                </div>
                {selectedCardDetail.projetoNome && (
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Projeto:</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {selectedCardDetail.projetoNome}
                    </span>
                  </div>
                )}
                {selectedCardDetail.responsavelNome && (
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Responsável:</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {selectedCardDetail.responsavelNome}
                    </span>
                  </div>
                )}
                {selectedCardDetail.solicitanteNome && (
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Solicitante:</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {selectedCardDetail.solicitanteNome}
                    </span>
                  </div>
                )}
                {selectedCardDetail.dataLimite && (
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Data Limite:</span>
                    <span className="font-bold font-mono-data text-[var(--text-primary)]">
                      {new Date(selectedCardDetail.dataLimite).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>

              {selectedCardDetail.descricao && (
                <div>
                  <span className="font-semibold text-[var(--text-secondary)] block mb-1">
                    Descrição / Detalhes:
                  </span>
                  <p className="p-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                    {selectedCardDetail.descricao}
                  </p>
                </div>
              )}

              {/* ========================================================= */}
              {/* CHECKLIST DE ATIVIDADES DO ITEM */}
              {/* ========================================================= */}
              <div className="space-y-2 pt-2 border-t border-[var(--border-default)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                    <CheckSquare className="w-4 h-4 text-[var(--color-primary)]" />
                    <span>Checklist de Atividades</span>
                  </div>
                  {(selectedCardDetail.checklist?.length || 0) > 0 && (
                    <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                      {selectedCardDetail.checklist?.filter((i) => i.concluido).length} de{' '}
                      {selectedCardDetail.checklist?.length} concluídos
                    </span>
                  )}
                </div>

                {/* Barra de Progresso */}
                {(selectedCardDetail.checklist?.length || 0) > 0 && (
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.round(
                          ((selectedCardDetail.checklist?.filter((i) => i.concluido).length || 0) /
                            (selectedCardDetail.checklist?.length || 1)) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                )}

                {/* Lista de Itens do Checklist */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {(selectedCardDetail.checklist || []).length === 0 ? (
                    <p className="text-[11px] text-[var(--text-muted)] italic py-1">
                      Nenhum item no checklist ainda. Adicione as etapas necessárias abaixo.
                    </p>
                  ) : (
                    (selectedCardDetail.checklist || []).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-secondary)]/70 hover:bg-[var(--bg-secondary)] border border-[var(--border-default)]/60 text-xs transition-colors"
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={item.concluido}
                            disabled={!canEdit}
                            onChange={() => handleToggleChecklistItem(item.id)}
                            className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                          />
                          <span
                            className={`truncate ${
                              item.concluido
                                ? 'line-through text-[var(--text-muted)]'
                                : 'text-[var(--text-primary)] font-medium'
                            }`}
                          >
                            {item.texto}
                          </span>
                        </label>

                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleRemoveChecklistItem(item.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors ml-2"
                            title="Remover item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Adicionar Novo Item ao Checklist */}
                {canEdit && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Adicionar tarefa ao checklist (ex: Revisar arte, agendar post)..."
                      value={newChecklistText}
                      onChange={(e) => setNewChecklistText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddChecklistItem();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleAddChecklistItem}
                      disabled={!newChecklistText.trim()}
                      className="shrink-0 text-xs"
                    >
                      + Adicionar
                    </Button>
                  </div>
                )}
              </div>

              {/* Botões de Ação do Modal */}
              <div className="pt-3 border-t border-[var(--border-default)] flex items-center justify-between gap-2">
                {selectedCardDetail.origem === 'tarefa' && canEdit && (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Edit2 className="w-3.5 h-3.5" />}
                    onClick={() => {
                      const t = selectedCardDetail.rawItem as TarefaAvulsaItem;
                      setSelectedCardDetail(null);
                      handleEditTarefa(t);
                    }}
                  >
                    Editar Dados
                  </Button>
                )}

                {selectedCardDetail.origem === 'conteudo' && onNavigateToTab && (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<ExternalLink className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setSelectedCardDetail(null);
                      onNavigateToTab('calendario');
                    }}
                  >
                    Ver no Calendário
                  </Button>
                )}

                {selectedCardDetail.origem === 'ticket' && onNavigateToTab && (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<ExternalLink className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setSelectedCardDetail(null);
                      onNavigateToTab('tickets');
                    }}
                  >
                    Ver Solicitação
                  </Button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedCardDetail(null)}
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
