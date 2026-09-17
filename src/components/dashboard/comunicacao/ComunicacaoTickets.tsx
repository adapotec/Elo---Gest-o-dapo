'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  FileText,
  Plus,
  Search,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  User,
  ExternalLink,
  Trash2,
  X,
  FolderKanban,
  Flame,
} from 'lucide-react';
import { Voluntario } from '@/components/dashboard/voluntarios/VoluntariosEquipe';

export interface SolicitacaoComunicacaoItem {
  id: string;
  titulo: string;
  projeto_id?: string | null;
  solicitante_id?: string | null;
  solicitante_nome?: string | null;
  tipo_material: string;
  publico_alvo?: string | null;
  objetivo?: string | null;
  descricao_detalhes?: string | null;
  prazo_desejado?: string | null;
  urgencia?: 'baixa' | 'normal' | 'alta' | 'urgente';
  links_referencia?: string | null;
  status: 'pendente' | 'em_analise' | 'aprovado' | 'em_producao' | 'concluido' | 'recusado';
  resposta_comunicacao?: string | null;
  responsavel_comunicacao_id?: string | null;
  conteudo_criado_id?: string | null;
  created_at?: string;
  updated_at?: string;
  projetos_sociais?: { nome: string; cor_identificacao?: string } | null;
  solicitante?: { nome_completo: string; avatar_url?: string } | null;
  responsavel?: { nome_completo: string } | null;
}

interface ProjetoSimples {
  id: string;
  nome: string;
  cor_identificacao?: string;
}

interface ComunicacaoTicketsProps {
  tickets: SolicitacaoComunicacaoItem[];
  projetos: ProjetoSimples[];
  voluntarios: Voluntario[];
  loading: boolean;
  onRefresh: () => void;
  onSaveTicket: (ticket: Partial<SolicitacaoComunicacaoItem>) => Promise<void>;
  onDeleteTicket: (id: string) => Promise<void>;
  onConvertToConteudo: (ticket: SolicitacaoComunicacaoItem) => void;
  initialOpenNew?: boolean;
}

export interface TipoMaterialOption {
  value: string;
  label: string;
  categoria: 'redes' | 'fisico' | 'institucional';
}

export const TIPOS_MATERIAL: TipoMaterialOption[] = [
  // Redes Sociais (Formatos integrados ao Calendário Editorial)
  { value: 'carrossel', label: 'Carrossel de Fotos/Artes', categoria: 'redes' },
  { value: 'reels', label: 'Reels / Vídeo Curto', categoria: 'redes' },
  { value: 'stories', label: 'Sequência de Stories', categoria: 'redes' },
  { value: 'estatico', label: 'Post Estático (Foto única)', categoria: 'redes' },
  { value: 'video_longo', label: 'Vídeo Longo / Documentário', categoria: 'redes' },
  { value: 'artigo', label: 'Artigo / Comunicado Digital', categoria: 'redes' },

  // Materiais Gráficos & Físicos (Para eventos e identificação)
  { value: 'cracha', label: 'Crachá de Identificação', categoria: 'fisico' },
  { value: 'camiseta', label: 'Arte para Camiseta / Uniforme', categoria: 'fisico' },
  { value: 'banner_impresso', label: 'Banner ou Faixa Impressa', categoria: 'fisico' },
  { value: 'adesivo_brinde', label: 'Adesivo ou Brinde', categoria: 'fisico' },

  // Institucional & Eventos
  { value: 'apresentacao_pdf', label: 'Apresentação em Slides / PDF', categoria: 'institucional' },
  { value: 'cobertura_foto_video', label: 'Cobertura de Foto / Vídeo', categoria: 'institucional' },
  { value: 'outro', label: 'Outro Material / Demanda Específica', categoria: 'institucional' },
];

export const getTipoMaterialLabel = (tipo?: string | null): string => {
  if (!tipo) return 'Material';
  const found = TIPOS_MATERIAL.find((t) => t.value === tipo);
  if (found) return found.label;
  if (tipo === 'feed_carrossel') return 'Carrossel de Fotos/Artes';
  if (tipo === 'reels_video') return 'Reels / Vídeo Curto';
  if (tipo === 'story') return 'Sequência de Stories';
  return tipo.replace('_', ' ');
};

export function ComunicacaoTickets({
  tickets,
  projetos,
  voluntarios,
  loading,
  onRefresh,
  onSaveTicket,
  onDeleteTicket,
  onConvertToConteudo,
  initialOpenNew = false,
}: ComunicacaoTicketsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [projetoFilter, setProjetoFilter] = useState<string>('todos');
  const [urgenciaFilter, setUrgenciaFilter] = useState<string>('todos');

  const [showNewModal, setShowNewModal] = useState(initialOpenNew);
  const [selectedTicketDetail, setSelectedTicketDetail] = useState<SolicitacaoComunicacaoItem | null>(null);

  // Form states para Nova Solicitação
  const [formTitulo, setFormTitulo] = useState('');
  const [formProjetoId, setFormProjetoId] = useState('');
  const [formSolicitanteNome, setFormSolicitanteNome] = useState('');
  const [formSolicitanteId, setFormSolicitanteId] = useState('');
  const [formTipoMaterial, setFormTipoMaterial] = useState('carrossel');
  const [formPublicoAlvo, setFormPublicoAlvo] = useState('');
  const [formObjetivo, setFormObjetivo] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formPrazoDesejado, setFormPrazoDesejado] = useState('');
  const [formUrgencia, setFormUrgencia] = useState<'baixa' | 'normal' | 'alta' | 'urgente'>('normal');
  const [formLinksReferencia, setFormLinksReferencia] = useState('');
  const [saving, setSaving] = useState(false);

  // Form states para Gerenciar Demanda (Equipe de Comunicação)
  const [gestaoStatus, setGestaoStatus] = useState<SolicitacaoComunicacaoItem['status']>('pendente');
  const [gestaoResposta, setGestaoResposta] = useState('');
  const [gestaoResponsavelId, setGestaoResponsavelId] = useState('');

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      pendentes: tickets.filter((t) => t.status === 'pendente' || t.status === 'em_analise').length,
      emProducao: tickets.filter((t) => t.status === 'em_producao' || t.status === 'aprovado').length,
      concluidos: tickets.filter((t) => t.status === 'concluido').length,
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((item) => {
      const matchSearch =
        (item.titulo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.solicitante_nome && item.solicitante_nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.descricao_detalhes && item.descricao_detalhes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus =
        statusFilter === 'todos'
          ? true
          : statusFilter === 'pendentes_geral'
          ? item.status === 'pendente' || item.status === 'em_analise'
          : statusFilter === 'producao_geral'
          ? item.status === 'em_producao' || item.status === 'aprovado'
          : item.status === statusFilter;

      const matchProj = projetoFilter === 'todos' || item.projeto_id === projetoFilter;
      const matchUrgencia = urgenciaFilter === 'todos' || item.urgencia === urgenciaFilter;

      return matchSearch && matchStatus && matchProj && matchUrgencia;
    });
  }, [tickets, searchTerm, statusFilter, projetoFilter, urgenciaFilter]);

  const handleOpenNewModal = () => {
    setFormTitulo('');
    setFormProjetoId('');
    setFormSolicitanteNome('');
    setFormSolicitanteId('');
    setFormTipoMaterial('carrossel');
    setFormPublicoAlvo('');
    setFormObjetivo('');
    setFormDescricao('');
    setFormPrazoDesejado('');
    setFormUrgencia('normal');
    setFormLinksReferencia('');
    setShowNewModal(true);
  };

  const handleOpenDetailModal = (ticket: SolicitacaoComunicacaoItem) => {
    setSelectedTicketDetail(ticket);
    setGestaoStatus(ticket.status);
    setGestaoResposta(ticket.resposta_comunicacao || '');
    setGestaoResponsavelId(ticket.responsavel_comunicacao_id || '');
  };

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitulo.trim()) {
      alert('Por favor, informe o título ou nome da demanda.');
      return;
    }

    setSaving(true);
    try {
      await onSaveTicket({
        titulo: formTitulo.trim(),
        projeto_id: formProjetoId || null,
        solicitante_nome: formSolicitanteNome.trim() || null,
        solicitante_id: formSolicitanteId || null,
        tipo_material: formTipoMaterial,
        publico_alvo: formPublicoAlvo.trim() || null,
        objetivo: formObjetivo.trim() || null,
        descricao_detalhes: formDescricao.trim() || null,
        prazo_desejado: formPrazoDesejado || null,
        urgencia: formUrgencia,
        links_referencia: formLinksReferencia.trim() || null,
        status: 'pendente',
      });
      setShowNewModal(false);
    } catch (err: any) {
      alert('Erro ao enviar solicitação: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGestao = async () => {
    if (!selectedTicketDetail) return;
    setSaving(true);
    try {
      await onSaveTicket({
        id: selectedTicketDetail.id,
        status: gestaoStatus,
        resposta_comunicacao: gestaoResposta.trim() || null,
        responsavel_comunicacao_id: gestaoResponsavelId || null,
      });
      setSelectedTicketDetail(null);
    } catch (err: any) {
      alert('Erro ao atualizar ticket: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const renderUrgenciaBadge = (urgencia?: string) => {
    switch (urgencia) {
      case 'urgente':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 shadow-2xs animate-pulse">
            <Flame className="w-3 h-3 text-rose-600" />
            <span>Urgente</span>
          </span>
        );
      case 'alta':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Alta</span>
          </span>
        );
      case 'baixa':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">
            Baixa
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
            Normal
          </span>
        );
    }
  };

  const renderStatusBadge = (status: SolicitacaoComunicacaoItem['status']) => {
    switch (status) {
      case 'pendente':
        return (
          <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30">
            Pendente
          </span>
        );
      case 'em_analise':
        return (
          <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-sky-500/15 text-sky-800 dark:text-sky-200 border border-sky-500/30">
            Em Análise
          </span>
        );
      case 'aprovado':
        return (
          <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-teal-500/15 text-teal-800 dark:text-teal-200 border border-teal-500/30">
            Aprovado
          </span>
        );
      case 'em_producao':
        return (
          <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-[var(--color-primary-soft)] text-[var(--color-primary)] border border-[var(--color-primary)]/30">
            Em Produção
          </span>
        );
      case 'concluido':
        return (
          <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30">
            Concluído
          </span>
        );
      case 'recusado':
        return (
          <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-rose-500/15 text-rose-800 dark:text-rose-200 border border-rose-500/30">
            Recusado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5">
      {/* ── 1. MICRO-KPIS COM PADRÃO DE ALTO CONTRASTE UNIFICADO ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('todos')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 bg-[var(--bg-elevated)] ${
            statusFilter === 'todos'
              ? 'border-2 border-[var(--color-primary)] shadow-md ring-2 ring-offset-1 ring-[var(--color-primary)]/25'
              : 'border-[var(--border-default)] shadow-[var(--shadow-card)] hover:border-[var(--color-primary)]/50'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              statusFilter === 'todos'
                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                : 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
            }`}
          >
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
                Total de Demandas
              </p>
              {statusFilter === 'todos' && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                  Ativo
                </span>
              )}
            </div>
            <p className="text-lg sm:text-xl font-display font-extrabold text-[var(--text-primary)]">
              {stats.total}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'pendentes_geral' ? 'todos' : 'pendentes_geral')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 bg-[var(--bg-elevated)] ${
            statusFilter === 'pendentes_geral'
              ? 'border-2 border-amber-500 shadow-md ring-2 ring-offset-1 ring-amber-500/25'
              : 'border-[var(--border-default)] shadow-[var(--shadow-card)] hover:border-amber-500/50'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              statusFilter === 'pendentes_geral'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}
          >
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
                Pendentes / Triagem
              </p>
              {statusFilter === 'pendentes_geral' && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-amber-500/15 text-amber-800 dark:text-amber-200">
                  Ativo
                </span>
              )}
            </div>
            <p className="text-lg sm:text-xl font-display font-extrabold text-amber-600 dark:text-amber-400">
              {stats.pendentes}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'producao_geral' ? 'todos' : 'producao_geral')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 bg-[var(--bg-elevated)] ${
            statusFilter === 'producao_geral'
              ? 'border-2 border-blue-500 shadow-md ring-2 ring-offset-1 ring-blue-500/25'
              : 'border-[var(--border-default)] shadow-[var(--shadow-card)] hover:border-blue-500/50'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              statusFilter === 'producao_geral'
                ? 'bg-blue-500 text-white shadow-xs'
                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
                Em Produção
              </p>
              {statusFilter === 'producao_geral' && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-blue-500/15 text-blue-800 dark:text-blue-200">
                  Ativo
                </span>
              )}
            </div>
            <p className="text-lg sm:text-xl font-display font-extrabold text-blue-600 dark:text-blue-400">
              {stats.emProducao}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'concluido' ? 'todos' : 'concluido')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 bg-[var(--bg-elevated)] ${
            statusFilter === 'concluido'
              ? 'border-2 border-emerald-500 shadow-md ring-2 ring-offset-1 ring-emerald-500/25'
              : 'border-[var(--border-default)] shadow-[var(--shadow-card)] hover:border-emerald-500/50'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              statusFilter === 'concluido'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
                Concluídos
              </p>
              {statusFilter === 'concluido' && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  Ativo
                </span>
              )}
            </div>
            <p className="text-lg sm:text-xl font-display font-extrabold text-emerald-600 dark:text-emerald-400">
              {stats.concluidos}
            </p>
          </div>
        </button>
      </div>

      {/* ── 2. BARRA DE CONTROLE, FILTROS & AÇÃO DE ABERTURA ── */}
      <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Buscar solicitação por título, solicitante ou objetivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap">
            <select
              value={projetoFilter}
              onChange={(e) => setProjetoFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-bold cursor-pointer shrink-0"
            >
              <option value="todos">Todos os Projetos</option>
              {projetos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>

            <select
              value={urgenciaFilter}
              onChange={(e) => setUrgenciaFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-bold cursor-pointer shrink-0"
            >
              <option value="todos">Todas Urgências</option>
              <option value="urgente">Urgente</option>
              <option value="alta">Alta</option>
              <option value="normal">Normal</option>
              <option value="baixa">Baixa</option>
            </select>

            <Button
              onClick={handleOpenNewModal}
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              className="w-full sm:w-auto justify-center shrink-0 font-bold"
            >
              + Solicitar Material
            </Button>
          </div>
        </div>
      </div>

      {/* ── 3. LISTA / GRADE DE SOLICITAÇÕES ── */}
      {filteredTickets.length === 0 ? (
        <Card className="p-12 text-center text-[var(--text-muted)] space-y-3">
          <FileText className="w-12 h-12 mx-auto text-[var(--text-muted)] opacity-40" />
          <h4 className="font-bold text-base text-[var(--text-primary)]">
            Nenhuma solicitação encontrada
          </h4>
          <p className="max-w-md mx-auto text-xs">
            {tickets.length === 0
              ? 'Nenhum voluntário abriu solicitações de materiais ainda. Qualquer voluntário pode solicitar posts, faixas, crachás ou coberturas de comunicação!'
              : 'Nenhuma solicitação corresponde aos filtros de busca atuais.'}
          </p>
          <Button size="sm" onClick={handleOpenNewModal}>
            Abrir Primeira Solicitação
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTickets.map((ticket) => {
            const cor = ticket.projetos_sociais?.cor_identificacao || '#F2632D';
            const nomeProjeto = ticket.projetos_sociais?.nome || 'Institucional Ádapo';
            const tipoObj = TIPOS_MATERIAL.find((t) => t.value === ticket.tipo_material);
            const isRedeSocial = !tipoObj || tipoObj.categoria === 'redes';

            return (
              <Card
                key={ticket.id}
                className="p-5 flex flex-col justify-between border-[var(--border-default)] hover:border-[var(--color-primary)]/50 transition-all space-y-4"
                style={{ borderTop: `4px solid ${cor}` }}
              >
                <div className="space-y-3">
                  {/* Topo do Card: Projeto + Urgência + Status */}
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <div
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border"
                      style={{
                        backgroundColor: `${cor}15`,
                        borderColor: `${cor}35`,
                        color: cor,
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: cor }}
                      />
                      <span className="truncate max-w-[140px]">{nomeProjeto}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {renderUrgenciaBadge(ticket.urgencia)}
                      {renderStatusBadge(ticket.status)}
                    </div>
                  </div>

                  {/* Título e Tipo */}
                  <div>
                    <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-default)] inline-block mb-1">
                      {getTipoMaterialLabel(ticket.tipo_material)}
                    </span>
                    <h4 className="font-display font-bold text-sm text-[var(--text-primary)] leading-snug line-clamp-2">
                      {ticket.titulo}
                    </h4>
                    {ticket.descricao_detalhes && (
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-1 leading-relaxed">
                        {ticket.descricao_detalhes}
                      </p>
                    )}
                  </div>

                  {/* Metadados: Solicitante e Prazo */}
                  <div className="space-y-1.5 text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-default)]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1 truncate text-[var(--text-secondary)]">
                        <User className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
                        <span className="truncate">
                          Por: <strong>{ticket.solicitante_nome || 'Voluntário'}</strong>
                        </span>
                      </span>

                      {ticket.prazo_desejado && (
                        <span className="flex items-center gap-1 shrink-0 font-semibold text-[var(--text-primary)]">
                          <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Até {new Date(ticket.prazo_desejado).toLocaleDateString('pt-BR')}</span>
                        </span>
                      )}
                    </div>

                    {ticket.resposta_comunicacao && (
                      <div className="p-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[11px] text-[var(--text-secondary)]">
                        <p className="font-bold text-[10px] uppercase text-[var(--color-primary)]">
                          Resposta da Comunicação:
                        </p>
                        <p className="line-clamp-2">{ticket.resposta_comunicacao}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações do Card */}
                <div className="pt-3 border-t border-[var(--border-default)] flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1 justify-center text-xs font-bold"
                    onClick={() => handleOpenDetailModal(ticket)}
                  >
                    Ver & Responder
                  </Button>

                  {/* Se for rede social e ainda não convertido, agenda no calendário */}
                  {isRedeSocial && !ticket.conteudo_criado_id && ticket.status !== 'recusado' && (
                    <button
                      type="button"
                      onClick={() => onConvertToConteudo(ticket)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[var(--color-primary-soft)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white border border-[var(--color-primary)]/30 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                      title="Converter esta solicitação aprovada em uma publicação no Calendário Editorial"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">+ Calendário</span>
                    </button>
                  )}

                  {/* Se for material físico/institucional e pendente/em análise, aprova direto para o Quadro de Tarefas */}
                  {!isRedeSocial && (ticket.status === 'pendente' || ticket.status === 'em_analise') && (
                    <button
                      type="button"
                      onClick={() => onSaveTicket({ id: ticket.id, status: 'em_producao' })}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                      title="Aprovar e enviar demanda diretamente para o Quadro de Tarefas em Produção"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Aprovar Produção</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Deseja excluir a solicitação "${ticket.titulo}"?`)) {
                        onDeleteTicket(ticket.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 transition-colors"
                    title="Excluir ticket"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── 4. MODAL: NOVA SOLICITAÇÃO DE MATERIAL (PARA VOLUNTÁRIOS) ── */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[var(--color-primary)]" />
                <div>
                  <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                    Solicitar Material de Comunicação
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Abra uma demanda para a equipe de marketing e comunicação
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitNew} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                  Título da Demanda / Ação *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Divulgação da Oficina de Pintura / Crachás da Nova Turma"
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                    Projeto Social Vinculado
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
                    Tipo de Peça / Material *
                  </label>
                  <select
                    value={formTipoMaterial}
                    onChange={(e) => setFormTipoMaterial(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium cursor-pointer"
                  >
                    <optgroup label="Redes Sociais">
                      {TIPOS_MATERIAL.filter((t) => t.categoria === 'redes').map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Materiais Físicos & Gráficos">
                      {TIPOS_MATERIAL.filter((t) => t.categoria === 'fisico').map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Institucional & Cobertura">
                      {TIPOS_MATERIAL.filter((t) => t.categoria === 'institucional').map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                    Nome do Solicitante (Voluntário) *
                  </label>
                  <select
                    value={formSolicitanteId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormSolicitanteId(val);
                      if (val === 'outro_externo') {
                        setFormSolicitanteNome('');
                      } else {
                        const vol = voluntarios.find((v) => v.id === val);
                        if (vol) {
                          setFormSolicitanteNome(vol.nome_completo);
                        } else {
                          setFormSolicitanteNome('');
                        }
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium cursor-pointer"
                    required
                  >
                    <option value="">Selecione o voluntário solicitante...</option>
                    {voluntarios.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nome_completo} {v.area_atuacao ? `(${v.area_atuacao})` : ''}
                      </option>
                    ))}
                    <option value="outro_externo">Outro (Parceiro / Demanda Externa)</option>
                  </select>

                  {formSolicitanteId === 'outro_externo' && (
                    <input
                      type="text"
                      placeholder="Digite o nome do solicitante externo"
                      value={formSolicitanteNome}
                      onChange={(e) => setFormSolicitanteNome(e.target.value)}
                      className="w-full mt-2 px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium"
                      required
                    />
                  )}
                </div>

                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                    Data Limite / Prazo Desejado
                  </label>
                  <input
                    type="date"
                    value={formPrazoDesejado}
                    onChange={(e) => setFormPrazoDesejado(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                  Grau de Urgência
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['baixa', 'normal', 'alta', 'urgente'] as const).map((urg) => (
                    <button
                      key={urg}
                      type="button"
                      onClick={() => setFormUrgencia(urg)}
                      className={`py-1.5 px-2 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                        formUrgencia === urg
                          ? urg === 'urgente'
                            ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                            : urg === 'alta'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : urg === 'baixa'
                            ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                            : 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-default)]'
                      }`}
                    >
                      {urg}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                  Público-Alvo e Objetivo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Voluntários ativos, doadores, comunidade do bairro..."
                  value={formPublicoAlvo}
                  onChange={(e) => setFormPublicoAlvo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                  Detalhes, Informações Obrigatórias ou Roteiro
                </label>
                <textarea
                  rows={3}
                  placeholder="Descreva o que não pode faltar no material, textos obrigatórios, horários ou locais..."
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium resize-none"
                />
              </div>

              <div>
                <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                  Links de Referência / Fotos no Google Drive
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={formLinksReferencia}
                  onChange={(e) => setFormLinksReferencia(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-default)]">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowNewModal(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? 'Enviando...' : 'Enviar Solicitação'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 5. MODAL: DETALHES & RESPOSTA DA COMUNICAÇÃO (TRIAGEM) ── */}
      {selectedTicketDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-[var(--color-primary)]" />
                <div>
                  <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                    Gerenciar Solicitação #{selectedTicketDetail.id.slice(0, 8)}
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Atualize o status e envie o retorno ao solicitante
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicketDetail(null)}
                className="p-1 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-secondary)]/60 border border-[var(--border-default)] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[var(--text-primary)] text-sm">
                  {selectedTicketDetail.titulo}
                </span>
                {renderUrgenciaBadge(selectedTicketDetail.urgencia)}
              </div>
              <p className="text-[var(--text-secondary)]">
                {selectedTicketDetail.descricao_detalhes || 'Sem detalhes fornecidos.'}
              </p>
              <div className="pt-2 border-t border-[var(--border-default)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <span>Solicitante: <strong>{selectedTicketDetail.solicitante_nome}</strong></span>
                {selectedTicketDetail.prazo_desejado && (
                  <span>Prazo: {new Date(selectedTicketDetail.prazo_desejado).toLocaleDateString('pt-BR')}</span>
                )}
              </div>
              {selectedTicketDetail.links_referencia && (
                <div className="pt-1">
                  <a
                    href={selectedTicketDetail.links_referencia}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[var(--color-primary)] font-bold hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ver Link de Referência</span>
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                  Status da Solicitação
                </label>
                <select
                  value={gestaoStatus}
                  onChange={(e) => setGestaoStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-bold cursor-pointer"
                >
                  <option value="pendente">Pendente</option>
                  <option value="em_analise">Em Análise</option>
                  <option value="aprovado">Aprovado</option>
                  <option value="em_producao">Em Produção</option>
                  <option value="concluido">Concluído</option>
                  <option value="recusado">Recusado</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                  Responsável na Equipe de Comunicação
                </label>
                <select
                  value={gestaoResponsavelId}
                  onChange={(e) => setGestaoResponsavelId(e.target.value)}
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

              <div>
                <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                  Parecer / Resposta da Comunicação
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Aprovado! Arte agendada para produção. Link do arquivo entregue em..."
                  value={gestaoResposta}
                  onChange={(e) => setGestaoResposta(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[var(--border-default)]">
                {/* Botão de Ação Direta conforme o tipo de material */}
                {!selectedTicketDetail.conteudo_criado_id && selectedTicketDetail.status !== 'recusado' && (
                  (() => {
                    const tipoObj = TIPOS_MATERIAL.find((t) => t.value === selectedTicketDetail.tipo_material);
                    const isRede = !tipoObj || tipoObj.categoria === 'redes';

                    if (isRede) {
                      return (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          icon={<Sparkles className="w-4 h-4 text-[var(--color-primary)]" />}
                          onClick={() => {
                            const t = selectedTicketDetail;
                            setSelectedTicketDetail(null);
                            onConvertToConteudo(t);
                          }}
                        >
                          Agendar no Calendário
                        </Button>
                      );
                    } else {
                      return (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          icon={<CheckCircle2 className="w-4 h-4 text-blue-600" />}
                          onClick={async () => {
                            const t = selectedTicketDetail;
                            setSelectedTicketDetail(null);
                            await onSaveTicket({ id: t.id, status: 'em_producao' });
                          }}
                        >
                          Aprovar para Produção
                        </Button>
                      );
                    }
                  })()
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTicketDetail(null)}
                  >
                    Fechar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={saving}
                    onClick={handleSaveGestao}
                  >
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
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
