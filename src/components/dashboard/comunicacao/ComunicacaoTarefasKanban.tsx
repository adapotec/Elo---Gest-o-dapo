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
  Bookmark,
  ArrowUpDown,
  Ban,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  AlertOctagon,
} from 'lucide-react';
import { ConteudoItem } from './ComunicacaoCalendario';
import { SolicitacaoComunicacaoItem } from './ComunicacaoTickets';
import { Voluntario } from '@/components/dashboard/voluntarios/VoluntariosEquipe';
import {
  isConteudoEmAtraso,
  formatDisplayDate,
  getComparableTimestamp,
  isPrazoVencido,
} from '@/lib/utils/dateTimeUtils';

export interface ChecklistItem {
  id: string;
  texto: string;
  concluido: boolean;
}

export interface TarefaAvulsaItem {
  id: string;
  titulo: string;
  descricao?: string | null;
  status: 'a_fazer' | 'em_andamento' | 'revisao' | 'concluido' | 'cancelado';
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  projeto_id?: string | null;
  responsavel_id?: string | null;
  data_limite?: string | null;
  etiquetas?: string[];
  checklist?: ChecklistItem[] | null;
  motivo_cancelamento?: string | null;
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
  coluna: 'a_fazer' | 'em_producao' | 'em_revisao' | 'concluido' | 'cancelado';
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  projetoNome?: string;
  projetoCor?: string;
  responsavelNome?: string;
  solicitanteNome?: string;
  dataLimite?: string | null;
  tipoRotulo: string;
  checklist?: ChecklistItem[] | null;
  motivoCancelamento?: string | null;
  rawItem: any;
  createdAt?: string;
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
  onUpdateConteudoStatus: (id: string, status: ConteudoItem['status'], motivoCancelamento?: string | null) => Promise<void>;
  onUpdateTicketStatus: (id: string, status: SolicitacaoComunicacaoItem['status'], motivoCancelamento?: string | null) => Promise<void>;
  onUpdateChecklist?: (id: string, origem: 'conteudo' | 'ticket' | 'tarefa', checklist: ChecklistItem[]) => Promise<void>;
  onNavigateToTab?: (tab: 'calendario' | 'tickets' | 'campanhas' | 'galeria') => void;
}

const COLUNAS_ATIVAS = [
  {
    id: 'a_fazer',
    titulo: 'A Fazer',
    corBarra: 'border-t-slate-600 dark:border-t-slate-400',
    badgeBg: 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700',
  },
  {
    id: 'em_producao',
    titulo: 'Em Produção',
    corBarra: 'border-t-blue-600 dark:border-t-blue-500',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-800',
  },
  {
    id: 'em_revisao',
    titulo: 'Em Revisão',
    corBarra: 'border-t-amber-500 dark:border-t-amber-400',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800',
  },
  {
    id: 'concluido',
    titulo: 'Concluído',
    corBarra: 'border-t-emerald-600 dark:border-t-emerald-500',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800',
  },
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
  const [ordenacao, setOrdenacao] = useState<'prazo_asc' | 'prazo_desc' | 'prioridade' | 'recentes' | 'alfabetica'>('prazo_asc');

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

  // Alternador de Visões: 'quadro' (4 colunas na tela cheia) vs 'cancelados' (visão dedicada com motivos)
  const [visaoAtiva, setVisaoAtiva] = useState<'quadro' | 'cancelados'>('quadro');

  // Modal para confirmação e registro do motivo ao cancelar item
  const [cardPendenteCancelamento, setCardPendenteCancelamento] = useState<{
    id: string;
    origem: KanbanCard['origem'];
    titulo: string;
  } | null>(null);
  const [motivoCancelamentoInput, setMotivoCancelamentoInput] = useState('');

  // 1. Unificação dos 3 tipos de dados em cards para o Kanban
  const kanbanCards: KanbanCard[] = useMemo(() => {
    const cards: KanbanCard[] = [];

    // A. Produções do Calendário Editorial
    conteudos.forEach((c) => {
      let coluna: KanbanCard['coluna'] = 'a_fazer';
      if (c.status === 'cancelado') coluna = 'cancelado';
      else if (c.status === 'producao') coluna = 'em_producao';
      else if (c.status === 'analise' || c.status === 'em_atraso') coluna = 'em_revisao';
      else if (c.status === 'publicado') coluna = 'concluido';

      cards.push({
        id: c.id,
        origem: 'conteudo',
        titulo: c.titulo || 'Sem título',
        descricao: c.descricao || c.observacoes || null,
        coluna,
        prioridade: (c.status === 'em_atraso' || isConteudoEmAtraso(c)) ? 'urgente' : 'normal',
        projetoNome: c.projetos_sociais?.nome,
        projetoCor: c.projetos_sociais?.cor_identificacao || '#F2632D',
        responsavelNome: c.voluntarios?.nome_completo,
        dataLimite: c.data_publicacao,
        tipoRotulo: `Rede Social (${c.tipo_conteudo?.toUpperCase() || 'POST'})`,
        checklist: Array.isArray(c.checklist) ? (c.checklist as any) : [],
        motivoCancelamento: (c as any).motivo_cancelamento || null,
        rawItem: c,
        createdAt: c.created_at,
      });
    });

    // B. Demandas e Solicitações de Materiais
    tickets.forEach((t) => {
      // Regra de Fluxo: Somente tickets com status operacional entram no Quadro de Tarefas
      if (t.status === 'pendente' || t.status === 'em_analise') {
        return;
      }

      let coluna: KanbanCard['coluna'] = 'a_fazer';
      if (t.status === 'recusado' || t.status === 'cancelado') coluna = 'cancelado';
      else if (t.status === 'aprovado') coluna = 'a_fazer';
      else if (t.status === 'em_producao') coluna = 'em_producao';
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
        checklist: Array.isArray(t.checklist) ? (t.checklist as any) : [],
        motivoCancelamento: (t as any).motivo_cancelamento || t.resposta_comunicacao || null,
        rawItem: t,
        createdAt: t.created_at,
      });
    });

    // C. Tarefas Avulsas & Rotina Operacional
    tarefas.forEach((ta) => {
      let coluna: KanbanCard['coluna'] = 'a_fazer';
      if (ta.status === 'cancelado') coluna = 'cancelado';
      else if (ta.status === 'em_andamento') coluna = 'em_producao';
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
        motivoCancelamento: ta.motivo_cancelamento || null,
        rawItem: ta,
        createdAt: ta.created_at,
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

  // 3. Ordenação Inteligente dos Cards (Padrão: Prazo Mais Próximo Primeiro)
  const sortedFilteredCards = useMemo(() => {
    const list = [...filteredCards];

    list.sort((a, b) => {
      if (ordenacao === 'prazo_asc') {
        const timeA = getComparableTimestamp(a.dataLimite);
        const timeB = getComparableTimestamp(b.dataLimite);
        if (timeA !== timeB) return timeA - timeB;
        // Desempate por prioridade
        const prioWeight: Record<string, number> = { urgente: 4, alta: 3, normal: 2, baixa: 1 };
        const diffPrio = (prioWeight[b.prioridade] || 0) - (prioWeight[a.prioridade] || 0);
        if (diffPrio !== 0) return diffPrio;
        return (a.titulo || '').localeCompare(b.titulo || '');
      }

      if (ordenacao === 'prazo_desc') {
        const timeA = getComparableTimestamp(a.dataLimite);
        const timeB = getComparableTimestamp(b.dataLimite);
        if (timeA === Infinity && timeB !== Infinity) return 1;
        if (timeB === Infinity && timeA !== Infinity) return -1;
        if (timeA !== timeB) return timeB - timeA;
        return (a.titulo || '').localeCompare(b.titulo || '');
      }

      if (ordenacao === 'prioridade') {
        const prioWeight: Record<string, number> = { urgente: 4, alta: 3, normal: 2, baixa: 1 };
        const diffPrio = (prioWeight[b.prioridade] || 0) - (prioWeight[a.prioridade] || 0);
        if (diffPrio !== 0) return diffPrio;
        const timeA = getComparableTimestamp(a.dataLimite);
        const timeB = getComparableTimestamp(b.dataLimite);
        return timeA - timeB;
      }

      if (ordenacao === 'recentes') {
        const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return createdB - createdA;
      }

      if (ordenacao === 'alfabetica') {
        return (a.titulo || '').localeCompare(b.titulo || '');
      }

      return 0;
    });

    return list;
  }, [filteredCards, ordenacao]);

  const totalCancelados = useMemo(() => {
    return kanbanCards.filter((c) => c.coluna === 'cancelado').length;
  }, [kanbanCards]);

  const totalAtivos = useMemo(() => {
    return kanbanCards.filter((c) => c.coluna !== 'cancelado').length;
  }, [kanbanCards]);

  // 3. Mover Card entre Colunas (Drag and Drop ou Botões)
  const handleMoverCardToCol = async (
    cardId: string,
    origem: KanbanCard['origem'],
    novaColuna: KanbanCard['coluna'],
    motivoCancelamento?: string | null
  ) => {
    if (!canEdit) return;

    // Se estiver movendo para cancelado e ainda não tiver informado o motivo, abre o modal
    if (novaColuna === 'cancelado' && motivoCancelamento === undefined) {
      const card = kanbanCards.find((c) => c.id === cardId && c.origem === origem);
      setCardPendenteCancelamento({
        id: cardId,
        origem,
        titulo: card?.titulo || 'Cartão',
      });
      setMotivoCancelamentoInput('');
      return;
    }

    if (origem === 'conteudo') {
      const statusMap: Record<KanbanCard['coluna'], ConteudoItem['status']> = {
        a_fazer: 'nao_iniciado',
        em_producao: 'producao',
        em_revisao: 'analise',
        concluido: 'publicado',
        cancelado: 'cancelado',
      };
      await onUpdateConteudoStatus(cardId, statusMap[novaColuna], motivoCancelamento);
    } else if (origem === 'ticket') {
      const statusMap: Record<KanbanCard['coluna'], SolicitacaoComunicacaoItem['status']> = {
        a_fazer: 'aprovado',
        em_producao: 'em_producao',
        em_revisao: 'em_producao',
        concluido: 'concluido',
        cancelado: 'cancelado',
      };
      await onUpdateTicketStatus(cardId, statusMap[novaColuna], motivoCancelamento);
    } else {
      const statusMap: Record<KanbanCard['coluna'], TarefaAvulsaItem['status']> = {
        a_fazer: 'a_fazer',
        em_producao: 'em_andamento',
        em_revisao: 'revisao',
        concluido: 'concluido',
        cancelado: 'cancelado',
      };
      await onSaveTarefa({
        id: cardId,
        status: statusMap[novaColuna],
        motivo_cancelamento: motivoCancelamento ?? (novaColuna === 'cancelado' ? undefined : null),
      });
    }
  };

  const handleMoverCard = async (card: KanbanCard, direcao: 'avancar' | 'recuar') => {
    // Se estiver em cancelado, recuar o reativa para "a_fazer"
    if (card.coluna === 'cancelado') {
      if (direcao === 'recuar') {
        await handleMoverCardToCol(card.id, card.origem, 'a_fazer', null);
      }
      return;
    }

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
      {/* Barra Superior Unificada: Alternador de Visões + Filtros + Ações */}
      <div className="p-3.5 sm:p-4 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs space-y-3">
        {/* Linha 1: Alternador de Visão (Tabs) e Botão Nova Tarefa */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setVisaoAtiva('quadro')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                visaoAtiva === 'quadro'
                  ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
              <span>Quadro de Produção</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600">
                {totalAtivos}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setVisaoAtiva('cancelados')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                visaoAtiva === 'cancelados'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400'
              }`}
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Cancelados & Não Realizados</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  visaoAtiva === 'cancelados'
                    ? 'bg-rose-800 text-white'
                    : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                }`}
              >
                {totalCancelados}
              </span>
            </button>
          </div>

          {canEdit && (
            <div className="flex items-center gap-2">
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

        {/* Linha 2: Busca e Filtros com Alto Contraste */}
        <div className="flex items-center gap-2.5 flex-wrap pt-1 border-t border-slate-200 dark:border-slate-800">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por título, descrição, voluntário ou projeto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-slate-500 font-medium"
            />
          </div>

          <select
            value={origemFilter}
            onChange={(e: any) => setOrigemFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 font-semibold cursor-pointer"
          >
            <option value="todos">Todas as Origens</option>
            <option value="tarefa">Apenas Tarefas Avulsas</option>
            <option value="conteudo">Apenas Redes Sociais</option>
            <option value="ticket">Apenas Demandas & Tickets</option>
          </select>

          <select
            value={projetoFilter}
            onChange={(e) => setProjetoFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 font-semibold cursor-pointer"
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
            className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 font-semibold cursor-pointer"
          >
            <option value="todos">Todas as Prioridades</option>
            <option value="urgente">Urgente</option>
            <option value="alta">Alta</option>
            <option value="normal">Normal</option>
            <option value="baixa">Baixa</option>
          </select>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
            <select
              value={ordenacao}
              onChange={(e: any) => setOrdenacao(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-slate-100 font-semibold cursor-pointer focus:outline-none"
              title="Critério de ordenação dos cartões"
            >
              <option value="prazo_asc">Prazo: Mais próximo primeiro</option>
              <option value="prazo_desc">Prazo: Mais distante primeiro</option>
              <option value="prioridade">Prioridade: Urgentes primeiro</option>
              <option value="recentes">Mais recentes primeiro</option>
              <option value="alfabetica">Título (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Zona de Drop Rápido para Cancelar ao Arrastar */}
      {draggedCardId && (
        <div
          onDragOver={(e) => {
            if (!canEdit) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (dragOverColumn !== 'cancelado') setDragOverColumn('cancelado');
          }}
          onDragLeave={(e) => {
            if (e.currentTarget.contains(e.relatedTarget as Node)) return;
            if (dragOverColumn === 'cancelado') setDragOverColumn(null);
          }}
          onDrop={async (e) => {
            if (!canEdit) return;
            e.preventDefault();
            setDragOverColumn(null);
            setDraggedCardId(null);
            try {
              const rawData = e.dataTransfer.getData('text/plain');
              if (!rawData) return;
              const { id, origem } = JSON.parse(rawData);
              await handleMoverCardToCol(id, origem, 'cancelado');
            } catch (err) {
              console.error('Erro no drag and drop:', err);
            }
          }}
          className={`p-3.5 rounded-2xl border-2 border-dashed transition-all flex items-center justify-center gap-2 text-xs font-bold animate-in fade-in duration-150 ${
            dragOverColumn === 'cancelado'
              ? 'border-rose-600 bg-rose-500/20 text-rose-900 dark:text-rose-100 ring-4 ring-rose-500/20 scale-[1.01]'
              : 'border-rose-400 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300'
          }`}
        >
          <Ban className="w-4 h-4 shrink-0 text-rose-600" />
          <span>Solte o cartão aqui para Cancelar ou registrar como Não Realizado</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISÃO 1: QUADRO ATIVO (4 COLUNAS NA TELA INTEIRA SEM ROLAGEM HORIZONTAL)  */}
      {/* ========================================================================= */}
      {visaoAtiva === 'quadro' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full h-[calc(100vh-310px)] min-h-[550px] max-h-[820px]">
          {COLUNAS_ATIVAS.map((coluna) => {
            const cardsDaColuna = sortedFilteredCards.filter((c) => c.coluna === coluna.id);
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
                className={`flex flex-col h-full rounded-2xl border-2 transition-all duration-200 overflow-hidden shadow-xs border-t-4 ${
                  coluna.corBarra
                } ${
                  isOver
                    ? 'border-dashed border-[var(--color-primary)] bg-[var(--color-primary-soft)]/20 ring-4 ring-[var(--color-primary)]/15 scale-[1.01]'
                    : 'border-slate-300 dark:border-slate-700/80 bg-slate-100/90 dark:bg-slate-900/95'
                }`}
              >
                {/* Cabeçalho Fixo da Coluna com Alto Contraste */}
                <div className="shrink-0 flex items-center justify-between p-3.5 pb-2.5 border-b-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider truncate">
                      {coluna.titulo}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold border shrink-0 ${coluna.badgeBg}`}
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
                      className="p-1 rounded-lg text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Lista de Cartões com Rolagem Interna Independente */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 pt-2.5 space-y-2.5 pr-2">
                  {cardsDaColuna.length === 0 ? (
                    <div className="h-36 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-white/60 dark:bg-slate-800/40">
                      <Layers className="w-5 h-5 text-slate-400 dark:text-slate-500 mb-1" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Nenhum item nesta etapa
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Arraste um cartão para cá
                      </span>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => {
                            const statusMap: Record<string, TarefaAvulsaItem['status']> = {
                              a_fazer: 'a_fazer',
                              em_producao: 'em_andamento',
                              em_revisao: 'revisao',
                              concluido: 'concluido',
                            };
                            handleOpenNovaTarefa(statusMap[coluna.id]);
                          }}
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
                          className={`p-3.5 space-y-2.5 rounded-xl border-2 transition-all shadow-xs group bg-white dark:bg-slate-800/95 border-slate-300/90 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-md ${
                            canEdit ? 'cursor-grab active:cursor-grabbing' : ''
                          } ${
                            isDragging ? 'opacity-40 scale-95 border-blue-500 ring-2 ring-blue-500/20' : ''
                          }`}
                        >
                          {/* Topo do Card: Origem, Prioridade e Handle de Arraste */}
                          <div className="flex items-center justify-between gap-1.5 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                isContent
                                  ? 'bg-orange-100 text-orange-900 dark:bg-orange-950/80 dark:text-orange-200 border border-orange-300 dark:border-orange-700'
                                  : isTicket
                                  ? 'bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:text-blue-200 border border-blue-300 dark:border-blue-700'
                                  : 'bg-teal-100 text-teal-900 dark:bg-teal-950/80 dark:text-teal-200 border border-teal-300 dark:border-teal-700'
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
                                <GripVertical className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-slate-600" />
                              )}
                            </div>
                          </div>

                          {/* Título do Cartão com Alto Contraste */}
                          <h4
                            onClick={() => setSelectedCardDetail(card)}
                            className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 hover:text-[var(--color-primary)] cursor-pointer line-clamp-2 leading-snug transition-colors"
                          >
                            {card.titulo}
                          </h4>

                          {/* Progresso de Checklist */}
                          {chkTotal > 0 && (
                            <div className="pt-1">
                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                <span className="flex items-center gap-1">
                                  <CheckSquare
                                    className={`w-3 h-3 ${chkAllDone ? 'text-emerald-600' : 'text-slate-500'}`}
                                  />
                                  <span>{chkDone}/{chkTotal} checklist</span>
                                </span>
                                <span className={chkAllDone ? 'text-emerald-700 dark:text-emerald-300 font-extrabold' : ''}>
                                  {Math.round((chkDone / chkTotal) * 100)}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    chkAllDone ? 'bg-emerald-600' : 'bg-[var(--color-primary)]'
                                  }`}
                                  style={{ width: `${Math.round((chkDone / chkTotal) * 100)}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Projeto e Responsável */}
                          <div className="flex items-center justify-between text-[11px] gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                            {card.projetoNome ? (
                              <div className="flex items-center gap-1.5 truncate">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
                                  style={{ backgroundColor: card.projetoCor || '#F2632D' }}
                                />
                                <span className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[110px]">
                                  {card.projetoNome}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500 dark:text-slate-400 text-[10px] font-medium">Institucional</span>
                            )}

                            {card.responsavelNome ? (
                              <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 truncate font-medium">
                                <User className="w-3 h-3 text-slate-500 shrink-0" />
                                <span className="truncate max-w-[90px]">{card.responsavelNome}</span>
                              </div>
                            ) : card.solicitanteNome ? (
                              <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 truncate font-medium">
                                <span className="text-slate-500 text-[10px]">Por:</span>
                                <span className="truncate max-w-[90px]">{card.solicitanteNome}</span>
                              </div>
                            ) : null}
                          </div>

                          {/* Rodapé: Prazo e Ações Rápidas (Mover & Cancelar) */}
                          <div className="flex items-center justify-between pt-1 text-[11px] border-t border-slate-100 dark:border-slate-700/60">
                            {card.dataLimite ? (
                              <div
                                className={`flex items-center gap-1 font-mono-data text-[10px] ${
                                  isPrazoVencido(card.dataLimite, card.coluna)
                                    ? 'text-rose-700 dark:text-rose-300 font-bold bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-300 dark:border-rose-800'
                                    : 'text-slate-600 dark:text-slate-300 font-medium'
                                }`}
                                title={
                                  isPrazoVencido(card.dataLimite, card.coluna)
                                    ? 'Atenção: Prazo de produção/publicação vencido!'
                                    : 'Prazo estipulado'
                                }
                              >
                                {isPrazoVencido(card.dataLimite, card.coluna) ? (
                                  <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                ) : (
                                  <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                                )}
                                <span>{formatDisplayDate(card.dataLimite)}</span>
                                {isPrazoVencido(card.dataLimite, card.coluna) && (
                                  <span className="uppercase text-[8px] font-extrabold">
                                    Vencido
                                  </span>
                                )}
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
                                    className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
                                  >
                                    <ArrowLeft className="w-3 h-3" />
                                  </button>
                                )}

                                {/* Ação Rápida de Cancelar / Registrar Motivo */}
                                <button
                                  type="button"
                                  title="Cancelar ou registrar como não realizado"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCardPendenteCancelamento({
                                      id: card.id,
                                      origem: card.origem,
                                      titulo: card.titulo,
                                    });
                                    setMotivoCancelamentoInput('');
                                  }}
                                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>

                                {coluna.id !== 'concluido' && (
                                  <button
                                    type="button"
                                    title="Avançar para próxima etapa"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoverCard(card, 'avancar');
                                    }}
                                    className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
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
      )}

      {/* ========================================================================= */}
      {/* VISÃO 2: CANCELADOS & NÃO REALIZADOS (VISÃO DEDICADA COM MOTIVO E REATIVAÇÃO) */}
      {/* ========================================================================= */}
      {visaoAtiva === 'cancelados' && (
        <div className="space-y-4">
          {/* Banner de Contexto de Cancelados */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 shrink-0">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-rose-950 dark:text-rose-100">
                    Cancelados & Não Realizados
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 border border-rose-300 dark:border-rose-700">
                    {totalCancelados} itens
                  </span>
                </div>
                <p className="text-xs text-rose-900/80 dark:text-rose-300/80 mt-0.5 font-medium">
                  Demandas, publicações e tarefas que foram suspensas ou não puderam ser realizadas, com justificativa arquivada.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setVisaoAtiva('quadro')}
                icon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Voltar ao Quadro de Produção
              </Button>
            </div>
          </div>

          {/* Grid de Cards Cancelados com Alto Contraste */}
          {(() => {
            const cardsCancelados = sortedFilteredCards.filter((c) => c.coluna === 'cancelado');

            if (cardsCancelados.length === 0) {
              return (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900">
                  <Ban className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-2" />
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Nenhum item cancelado ou não realizado
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                    {searchTerm || origemFilter !== 'todos' || projetoFilter !== 'todos' || prioridadeFilter !== 'todos'
                      ? 'Nenhum item cancelado corresponde aos filtros selecionados.'
                      : 'Todas as tarefas, produções e demandas estão ativas no fluxo de produção.'}
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto max-h-[calc(100vh-310px)] min-h-[540px] p-1 custom-scrollbar">
                {cardsCancelados.map((card) => (
                  <div
                    key={`${card.origem}-${card.id}`}
                    className="border-2 border-rose-300 dark:border-rose-900/60 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm space-y-3 border-t-4 border-t-rose-600 hover:border-rose-400 dark:hover:border-rose-700 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      {/* Cabeçalho do Card */}
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-800 dark:text-rose-200 border border-rose-500/20">
                          <Ban className="w-2.5 h-2.5 shrink-0" />
                          <span>{card.tipoRotulo}</span>
                        </span>
                        {renderPrioridadeBadge(card.prioridade)}
                      </div>

                      {/* Título */}
                      <h4
                        onClick={() => setSelectedCardDetail(card)}
                        className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer line-clamp-2 leading-snug"
                      >
                        {card.titulo}
                      </h4>

                      {/* Motivo do Cancelamento em Destaque Alto Contraste */}
                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-xs text-rose-950 dark:text-rose-100 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-rose-700 dark:text-rose-300">
                          <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                          <span>Motivo Registrado</span>
                        </div>
                        <p className="italic font-semibold leading-relaxed">
                          {card.motivoCancelamento ? `"${card.motivoCancelamento}"` : 'Nenhum motivo detalhado informado no cancelamento.'}
                        </p>
                      </div>

                      {/* Projeto & Responsável */}
                      <div className="flex items-center justify-between text-[11px] gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                        {card.projetoNome ? (
                          <div className="flex items-center gap-1.5 truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
                              style={{ backgroundColor: card.projetoCor || '#F2632D' }}
                            />
                            <span className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[120px]">
                              {card.projetoNome}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400 text-[10px] font-medium">Institucional</span>
                        )}

                        {card.responsavelNome ? (
                          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 truncate font-medium">
                            <User className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate max-w-[100px]">{card.responsavelNome}</span>
                          </div>
                        ) : card.solicitanteNome ? (
                          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 truncate font-medium">
                            <span className="text-slate-500 text-[10px]">Por:</span>
                            <span className="truncate max-w-[100px]">{card.solicitanteNome}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Ações: Reativar Tarefa & Detalhes */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                      {canEdit && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-full text-emerald-900 dark:text-emerald-100 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 border border-emerald-400 dark:border-emerald-700 font-bold cursor-pointer"
                          icon={<RotateCcw className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />}
                          onClick={() => handleMoverCardToCol(card.id, card.origem, 'a_fazer', null)}
                        >
                          Reativar Tarefa (Mover para A Fazer)
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                        onClick={() => setSelectedCardDetail(card)}
                      >
                        Ver Detalhes do Card
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

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
                    <option value="cancelado">Cancelado / Não Realizado</option>
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
                      {formatDisplayDate(selectedCardDetail.dataLimite)}
                    </span>
                  </div>
                )}
              </div>

              {/* Destaque para Tarefas Canceladas / Não Realizadas */}
              {selectedCardDetail.coluna === 'cancelado' && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 space-y-1.5 text-xs text-rose-800 dark:text-rose-200 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-300">
                    <Ban className="w-4 h-4 shrink-0" />
                    <span>Item Cancelado / Não Realizado</span>
                  </div>
                  {selectedCardDetail.motivoCancelamento ? (
                    <p className="italic font-medium leading-relaxed pl-5">
                      "{selectedCardDetail.motivoCancelamento}"
                    </p>
                  ) : (
                    <p className="text-[11px] opacity-80 pl-5">
                      Nenhum motivo específico registrado no momento do cancelamento.
                    </p>
                  )}
                </div>
              )}

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

              {/* Referência Visual & Destaques (se for ticket/demanda de comunicação) */}
              {selectedCardDetail.origem === 'ticket' &&
                (selectedCardDetail.rawItem?.links_referencia || selectedCardDetail.rawItem?.observacoes_referencia) && (
                  <div className="p-3 rounded-xl bg-[var(--bg-secondary)]/80 border border-[var(--border-default)] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[var(--color-primary)] flex items-center gap-1.5">
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>Referência & Inspiração Visual</span>
                      </span>
                      {selectedCardDetail.rawItem?.links_referencia && (
                        <a
                          href={selectedCardDetail.rawItem.links_referencia}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--color-primary)] hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Abrir Link</span>
                        </a>
                      )}
                    </div>
                    {selectedCardDetail.rawItem?.observacoes_referencia && (
                      <div className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border-l-3 border-[var(--color-primary)] text-xs text-[var(--text-secondary)]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)] block mb-0.5">
                          O que o solicitante destacou:
                        </span>
                        <p className="italic leading-relaxed whitespace-pre-wrap text-[var(--text-primary)] font-medium">
                          "{selectedCardDetail.rawItem.observacoes_referencia}"
                        </p>
                      </div>
                    )}
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

                {selectedCardDetail.coluna === 'cancelado' && canEdit && (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<RotateCcw className="w-3.5 h-3.5 text-emerald-600" />}
                    onClick={async () => {
                      const id = selectedCardDetail.id;
                      const origem = selectedCardDetail.origem;
                      setSelectedCardDetail(null);
                      await handleMoverCardToCol(id, origem, 'a_fazer', null);
                    }}
                  >
                    Reativar Tarefa
                  </Button>
                )}

                {selectedCardDetail.coluna !== 'cancelado' && canEdit && (
                  <Button
                    size="sm"
                    variant="danger"
                    icon={<Ban className="w-3.5 h-3.5" />}
                    onClick={() => {
                      const id = selectedCardDetail.id;
                      const origem = selectedCardDetail.origem;
                      const titulo = selectedCardDetail.titulo;
                      setSelectedCardDetail(null);
                      setCardPendenteCancelamento({ id, origem, titulo });
                      setMotivoCancelamentoInput('');
                    }}
                  >
                    Cancelar / Não Realizado
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

      {/* ========================================================================= */}
      {/* MODAL: CONFIRMAR CANCELAMENTO / REGISTRAR MOTIVO */}
      {/* ========================================================================= */}
      {cardPendenteCancelamento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <Ban className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-base text-[var(--text-primary)]">
                  Cancelar Tarefa / Demanda
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCardPendenteCancelamento(null)}
                className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-[var(--text-secondary)]">
                Você está movendo este item para <strong>Cancelado / Não Realizado</strong>:
              </p>
              <p className="p-2.5 rounded-xl bg-[var(--bg-secondary)] text-xs font-semibold text-[var(--text-primary)] border border-[var(--border-default)] truncate">
                {cardPendenteCancelamento.titulo}
              </p>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-[var(--text-primary)] block">
                Motivo ou Justificativa (Opcional):
              </label>
              <textarea
                rows={3}
                value={motivoCancelamentoInput}
                onChange={(e) => setMotivoCancelamentoInput(e.target.value)}
                placeholder="Ex: Cancelado por motivos de chuva, corte no orçamento, mudança de cronograma..."
                className="w-full p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-rose-500 font-medium resize-none"
              />
              <span className="text-[11px] text-[var(--text-muted)] block">
                O motivo ficará arquivado e você poderá reativar a tarefa futuramente se necessário.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setCardPendenteCancelamento(null)}
              >
                Voltar
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={async () => {
                  const card = cardPendenteCancelamento;
                  const motivo = motivoCancelamentoInput.trim() || null;
                  setCardPendenteCancelamento(null);
                  await handleMoverCardToCol(card.id, card.origem, 'cancelado', motivo);
                }}
              >
                Confirmar Cancelamento
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
