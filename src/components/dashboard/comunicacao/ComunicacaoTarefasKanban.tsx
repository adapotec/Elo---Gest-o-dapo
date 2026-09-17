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
  MoreVertical,
  Layers,
} from 'lucide-react';
import { ConteudoItem } from './ComunicacaoCalendario';
import { SolicitacaoComunicacaoItem } from './ComunicacaoTickets';
import { Voluntario } from '@/components/dashboard/voluntarios/VoluntariosEquipe';

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
  onRefresh: () => void;
  onSaveTarefa: (tarefa: Partial<TarefaAvulsaItem>) => Promise<void>;
  onDeleteTarefa: (id: string) => Promise<void>;
  onUpdateConteudoStatus: (id: string, status: ConteudoItem['status']) => Promise<void>;
  onUpdateTicketStatus: (id: string, status: SolicitacaoComunicacaoItem['status']) => Promise<void>;
  onNavigateToTab: (tab: 'calendario' | 'tickets') => void;
}

const COLUNAS = [
  { id: 'a_fazer', titulo: 'A Fazer', badgeBg: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20' },
  { id: 'em_producao', titulo: 'Em Produção', badgeBg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20' },
  { id: 'em_revisao', titulo: 'Em Revisão', badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20' },
  { id: 'concluido', titulo: 'Concluído', badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20' },
] as const;

export function ComunicacaoTarefasKanban({
  tarefas,
  conteudos,
  tickets,
  projetos,
  voluntarios,
  loading,
  onRefresh,
  onSaveTarefa,
  onDeleteTarefa,
  onUpdateConteudoStatus,
  onUpdateTicketStatus,
  onNavigateToTab,
}: ComunicacaoTarefasKanbanProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [origemFilter, setOrigemFilter] = useState<'todos' | 'conteudo' | 'ticket' | 'tarefa'>('todos');
  const [projetoFilter, setProjetoFilter] = useState('todos');
  const [prioridadeFilter, setPrioridadeFilter] = useState('todos');

  // Modal para Nova Tarefa Avulsa
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

  // Modal para Detalhes do Card
  const [selectedCardDetail, setSelectedCardDetail] = useState<KanbanCard | null>(null);

  // 1. Mapeamento Unificado de Itens para o Quadro Kanban
  const kanbanCards = useMemo<KanbanCard[]>(() => {
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
        rawItem: t,
      });
    });

    // C. Tarefas Avulsas & Notas da Rotina de Comunicação
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

  // 3. Ações de Movimentação de Colunas (Kanban Flow)
  const handleMoverCard = async (card: KanbanCard, direcao: 'avancar' | 'recuar') => {
    const ordemColunas: KanbanCard['coluna'][] = ['a_fazer', 'em_producao', 'em_revisao', 'concluido'];
    const idxAtual = ordemColunas.indexOf(card.coluna);
    const novoIdx = direcao === 'avancar' ? idxAtual + 1 : idxAtual - 1;

    if (novoIdx < 0 || novoIdx >= ordemColunas.length) return;
    const novaColuna = ordemColunas[novoIdx];

    if (card.origem === 'tarefa') {
      const statusMap: Record<KanbanCard['coluna'], TarefaAvulsaItem['status']> = {
        a_fazer: 'a_fazer',
        em_producao: 'em_andamento',
        em_revisao: 'revisao',
        concluido: 'concluido',
      };
      await onSaveTarefa({ id: card.id, status: statusMap[novaColuna] });
    } else if (card.origem === 'conteudo') {
      const statusMap: Record<KanbanCard['coluna'], ConteudoItem['status']> = {
        a_fazer: 'nao_iniciado',
        em_producao: 'producao',
        em_revisao: 'analise',
        concluido: 'publicado',
      };
      await onUpdateConteudoStatus(card.id, statusMap[novaColuna]);
    } else if (card.origem === 'ticket') {
      const statusMap: Record<KanbanCard['coluna'], SolicitacaoComunicacaoItem['status']> = {
        a_fazer: 'pendente',
        em_producao: 'em_producao',
        em_revisao: 'em_analise',
        concluido: 'concluido',
      };
      await onUpdateTicketStatus(card.id, statusMap[novaColuna]);
    }
  };

  const handleOpenNovaTarefa = (colunaPadrao: TarefaAvulsaItem['status'] = 'a_fazer') => {
    setEditingTarefa(null);
    setFormTitulo('');
    setFormDescricao('');
    setFormColuna(colunaPadrao);
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
      <div className="p-3 sm:p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Buscar no quadro de tarefas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] font-medium"
            />
          </div>

          <select
            value={origemFilter}
            onChange={(e: any) => setOrigemFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] font-medium cursor-pointer"
          >
            <option value="todos">Todas as Origens</option>
            <option value="tarefa">Apenas Tarefas Avulsas</option>
            <option value="conteudo">Apenas Redes Sociais</option>
            <option value="ticket">Apenas Demandas & Tickets</option>
          </select>

          <select
            value={projetoFilter}
            onChange={(e) => setProjetoFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] font-medium cursor-pointer"
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
            className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] font-medium cursor-pointer"
          >
            <option value="todos">Todas as Prioridades</option>
            <option value="urgente">Urgente</option>
            <option value="alta">Alta</option>
            <option value="normal">Normal</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>

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
      </div>

      {/* QUADRO KANBAN (4 COLUNAS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUNAS.map((coluna) => {
          const cardsDaColuna = filteredCards.filter((c) => c.coluna === coluna.id);

          return (
            <div
              key={coluna.id}
              className="flex flex-col rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/50 p-3 min-h-[580px] space-y-3"
            >
              {/* Cabeçalho da Coluna */}
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-default)]">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    {coluna.titulo}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold border ${coluna.badgeBg}`}
                  >
                    {cardsDaColuna.length}
                  </span>
                </div>

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
                  className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Lista de Cartões da Coluna */}
              <div className="space-y-2.5 flex-1 overflow-y-auto custom-scrollbar pr-0.5">
                {cardsDaColuna.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-center p-4 border border-dashed border-[var(--border-default)] rounded-xl">
                    <span className="text-xs text-[var(--text-muted)]">Nenhum item nesta etapa</span>
                    <button
                      type="button"
                      onClick={() => handleOpenNovaTarefa(coluna.id === 'em_producao' ? 'em_andamento' : coluna.id === 'em_revisao' ? 'revisao' : coluna.id === 'concluido' ? 'concluido' : 'a_fazer')}
                      className="mt-2 text-xs font-semibold text-[var(--color-primary)] hover:underline"
                    >
                      + Criar cartão
                    </button>
                  </div>
                ) : (
                  cardsDaColuna.map((card) => {
                    const isTask = card.origem === 'tarefa';
                    const isContent = card.origem === 'conteudo';
                    const isTicket = card.origem === 'ticket';

                    return (
                      <Card
                        key={`${card.origem}-${card.id}`}
                        className="p-3.5 space-y-2.5 bg-[var(--bg-elevated)] border-[var(--border-default)] hover:border-[var(--color-primary)] transition-all shadow-xs group"
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

                          {renderPrioridadeBadge(card.prioridade)}
                        </div>

                        {/* Título do Cartão */}
                        <h4
                          onClick={() => setSelectedCardDetail(card)}
                          className="font-bold text-xs sm:text-sm text-[var(--text-primary)] hover:text-[var(--color-primary)] cursor-pointer line-clamp-2 leading-snug transition-colors"
                        >
                          {card.titulo}
                        </h4>

                        {/* Projeto e Responsável */}
                        <div className="flex items-center justify-between text-[11px] gap-2 pt-1 border-t border-[var(--border-default)]/60">
                          {card.projetoNome ? (
                            <div className="flex items-center gap-1.5 truncate">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: card.projetoCor || '#F2632D' }}
                              />
                              <span className="text-[var(--text-secondary)] font-medium truncate max-w-[110px]">
                                {card.projetoNome}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[var(--text-muted)] text-[10px]">Institucional</span>
                          )}

                          {card.responsavelNome ? (
                            <div className="flex items-center gap-1 text-[var(--text-secondary)] truncate">
                              <User className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                              <span className="truncate max-w-[90px]">{card.responsavelNome}</span>
                            </div>
                          ) : card.solicitanteNome ? (
                            <div className="flex items-center gap-1 text-[var(--text-secondary)] truncate">
                              <span className="text-[var(--text-muted)] text-[10px]">Por:</span>
                              <span className="truncate max-w-[90px]">{card.solicitanteNome}</span>
                            </div>
                          ) : null}
                        </div>

                        {/* Prazo e Ações de Movimentação */}
                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          {card.dataLimite ? (
                            <div className="flex items-center gap-1 text-[var(--text-muted)] font-mono-data text-[10px]">
                              <Clock className="w-3 h-3 shrink-0" />
                              <span>{new Date(card.dataLimite).toLocaleDateString('pt-BR')}</span>
                            </div>
                          ) : (
                            <span />
                          )}

                          {/* Botões Rápidos para Mover de Coluna */}
                          <div className="flex items-center gap-1">
                            {coluna.id !== 'a_fazer' && (
                              <button
                                type="button"
                                title="Mover para etapa anterior"
                                onClick={() => handleMoverCard(card, 'recuar')}
                                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all cursor-pointer"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}

                            {coluna.id !== 'concluido' && (
                              <button
                                type="button"
                                title="Avançar para próxima etapa"
                                onClick={() => handleMoverCard(card, 'avancar')}
                                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all cursor-pointer"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>

              {/* Botão de Adição Rápida no Rodapé da Coluna */}
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
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-dashed border-[var(--border-default)] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Cartão</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: NOVA TAREFA / EDITAR TAREFA AVULSA */}
      {/* ========================================================================= */}
      {showModalTarefa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-default)]">
              <div>
                <h3 className="font-bold text-base text-[var(--text-primary)]">
                  {editingTarefa ? 'Editar Tarefa' : 'Nova Tarefa no Quadro'}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Atividade de apoio, preparativo ou organização da comunicação
                </p>
              </div>
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
                  placeholder="Ex: Cotação de camisetas para o evento / Separar cartões de memória"
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                    Coluna Inicial
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
                    Projeto Vinculado
                  </label>
                  <select
                    value={formProjetoId}
                    onChange={(e) => setFormProjetoId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium cursor-pointer"
                  >
                    <option value="">Institucional Geral (Ádapo)</option>
                    {projetos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                    Responsável da Equipe
                  </label>
                  <select
                    value={formResponsavelId}
                    onChange={(e) => setFormResponsavelId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium cursor-pointer"
                  >
                    <option value="">Não atribuído</option>
                    {voluntarios.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nome_completo} {v.area_atuacao ? `(${v.area_atuacao})` : ''}
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
      {/* MODAL: DETALHES DO CARD (REDE SOCIAL, TICKET OU TAREFA) */}
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

              {/* Ações Específicas conforme a Origem */}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-default)]">
                {selectedCardDetail.origem === 'tarefa' ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Edit2 className="w-3.5 h-3.5" />}
                    onClick={() => {
                      const t = tarefas.find((item) => item.id === selectedCardDetail.id);
                      if (t) {
                        setSelectedCardDetail(null);
                        handleEditTarefa(t);
                      }
                    }}
                  >
                    Editar Tarefa
                  </Button>
                ) : selectedCardDetail.origem === 'conteudo' ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<ExternalLink className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setSelectedCardDetail(null);
                      onNavigateToTab('calendario');
                    }}
                  >
                    Abrir no Calendário Editorial
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<ExternalLink className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setSelectedCardDetail(null);
                      onNavigateToTab('tickets');
                    }}
                  >
                    Abrir em Solicitações & Tickets
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setSelectedCardDetail(null)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
