'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import { PapelTimbradoModal } from '@/components/ui/PapelTimbradoModal';
import {
  Calendar as CalendarIcon,
  Table as TableIcon,
  Plus,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Film,
  Layers,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Edit,
  Trash2,
  FolderKanban,
  Megaphone,
  User,
  Link2,
  X,
  Save,
  Printer,
  Globe,
  Share2,
  Eye,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import { Voluntario } from '@/components/dashboard/voluntarios/VoluntariosEquipe';

export interface ConteudoItem {
  id: string;
  titulo: string;
  data_publicacao: string;
  tipo_conteudo: 'reels' | 'carrossel' | 'stories' | 'estatico' | 'video_longo' | 'artigo';
  descricao?: string | null;
  observacoes?: string | null;
  roteiro_legenda?: string | null;
  campanha_id?: string | null;
  projeto_id?: string | null;
  status: 'nao_iniciado' | 'producao' | 'analise' | 'em_atraso' | 'publicado' | 'cancelado';
  responsavel_id?: string | null;
  categoria: 'engajamento' | 'informacao' | 'cta' | 'institucional' | 'avulso' | 'depoimento';
  link_producao?: string | null;
  link_publicacao?: string | null;
  metricas?: Record<string, any> | null;
  projetos_sociais?: { nome: string; cor_identificacao?: string } | null;
  campanhas_comunicacao?: { titulo: string } | null;
  voluntarios?: { nome_completo: string; avatar_url?: string } | null;
}

interface ProjetoSimples {
  id: string;
  nome: string;
  cor_identificacao?: string;
}

interface CampanhaSimples {
  id: string;
  titulo: string;
}

interface ComunicacaoCalendarioProps {
  conteudos: ConteudoItem[];
  projetos: ProjetoSimples[];
  campanhas: CampanhaSimples[];
  voluntarios: Voluntario[];
  loading: boolean;
  onRefresh: () => void;
  onSaveConteudo: (conteudo: Partial<ConteudoItem>) => Promise<void>;
  onDeleteConteudo: (id: string) => Promise<void>;
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function ComunicacaoCalendario({
  conteudos,
  projetos,
  campanhas,
  voluntarios,
  loading,
  onRefresh,
  onSaveConteudo,
  onDeleteConteudo,
}: ComunicacaoCalendarioProps) {
  const [viewMode, setViewMode] = useState<'tabela' | 'calendario'>('tabela');
  const [searchTerm, setSearchTerm] = useState('');
  const [mesFilter, setMesFilter] = useState('todos');
  const [projetoFilter, setProjetoFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [categoriaFilter, setCategoriaFilter] = useState('todos');
  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  // Navegação de Mês para o modo Calendário
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Modal de Detalhes do Dia (Apenas visualização dos posts do dia)
  const [selectedDiaDetalhes, setSelectedDiaDetalhes] = useState<{
    day: number;
    date: Date;
    dateFormatted: string;
    datePrefill: string;
    posts: ConteudoItem[];
  } | null>(null);

  // Modal Flutuante: Detalhes Completos da Publicação (ao clicar no título)
  const [selectedConteudoDetalhes, setSelectedConteudoDetalhes] = useState<ConteudoItem | null>(null);
  const [copiedLegenda, setCopiedLegenda] = useState(false);

  // Modal de Criar / Editar Conteúdo
  const [showModal, setShowModal] = useState(false);
  const [editingConteudo, setEditingConteudo] = useState<ConteudoItem | null>(null);
  const [formTitulo, setFormTitulo] = useState('');
  const [formDataPub, setFormDataPub] = useState('');
  const [formTipo, setFormTipo] = useState<ConteudoItem['tipo_conteudo']>('reels');
  const [formObservacoes, setFormObservacoes] = useState('');
  const [formRoteiroLegenda, setFormRoteiroLegenda] = useState('');
  const [formProjetoId, setFormProjetoId] = useState('');
  const [formCampanhaId, setFormCampanhaId] = useState('');
  const [formStatus, setFormStatus] = useState<ConteudoItem['status']>('nao_iniciado');
  const [formResponsavelId, setFormResponsavelId] = useState('');
  const [formCategoria, setFormCategoria] = useState<ConteudoItem['categoria']>('engajamento');
  const [formLinkProducao, setFormLinkProducao] = useState('');
  const [formLinkPublicacao, setFormLinkPublicacao] = useState('');
  const [saving, setSaving] = useState(false);

  // Modal Rápido de Publicação (Inserir Link)
  const [quickPublishItem, setQuickPublishItem] = useState<ConteudoItem | null>(null);
  const [quickPublishUrl, setQuickPublishUrl] = useState('');
  const [quickPublishing, setQuickPublishing] = useState(false);

  // Modal de Exportar PDF Timbrado Geral
  const [showPdfModal, setShowPdfModal] = useState(false);

  const handlePrevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));

  // Copiar Legenda
  const handleCopyLegenda = (texto: string) => {
    if (!texto) return;
    navigator.clipboard.writeText(texto);
    setCopiedLegenda(true);
    setTimeout(() => setCopiedLegenda(false), 2000);
  };

  // Abrir Modal para Novo Conteúdo
  const handleOpenNewModal = (datePrefill?: string) => {
    setEditingConteudo(null);
    setFormTitulo('');
    setFormDataPub(datePrefill || new Date().toISOString().slice(0, 16));
    setFormTipo('reels');
    setFormObservacoes('');
    setFormRoteiroLegenda('');
    setFormProjetoId('');
    setFormCampanhaId('');
    setFormStatus('nao_iniciado');
    setFormResponsavelId('');
    setFormCategoria('engajamento');
    setFormLinkProducao('');
    setFormLinkPublicacao('');
    setShowModal(true);
  };

  // Abrir Modal para Edição
  const handleOpenEditModal = (item: ConteudoItem) => {
    setEditingConteudo(item);
    setFormTitulo(item.titulo);
    setFormDataPub(item.data_publicacao ? item.data_publicacao.slice(0, 16) : '');
    setFormTipo(item.tipo_conteudo);
    const legInicial = (item.roteiro_legenda || '').trim();
    let obsInicial = (item.observacoes || '').trim();
    // Se observações estiver vazia mas houver descrição no banco diferente da legenda, aproveita a descrição
    if (!obsInicial && item.descricao) {
      const descLimpa = item.descricao.trim();
      if (descLimpa !== legInicial) {
        obsInicial = descLimpa;
      }
    }
    setFormObservacoes(obsInicial);
    setFormRoteiroLegenda(item.roteiro_legenda || '');
    setFormProjetoId(item.projeto_id || '');
    setFormCampanhaId(item.campanha_id || '');
    setFormStatus(item.status);
    setFormResponsavelId(item.responsavel_id || '');
    setFormCategoria(item.categoria);
    setFormLinkProducao(item.link_producao || '');
    setFormLinkPublicacao(item.link_publicacao || '');
    setShowModal(true);
  };

  // Ação Rápida: Abrir modal para marcar como Publicado e inserir link
  const handleOpenQuickPublish = (item: ConteudoItem) => {
    setQuickPublishItem(item);
    setQuickPublishUrl(item.link_publicacao || '');
  };

  // Confirmar Publicação Rápida
  const handleConfirmQuickPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPublishItem) return;

    // Stories são temporários e não exigem link obrigatório
    if (quickPublishItem.tipo_conteudo !== 'stories' && !quickPublishUrl.trim()) {
      alert('Por favor, informe o link do conteúdo publicado na rede social.');
      return;
    }

    setQuickPublishing(true);
    const itemToUpdate = quickPublishItem;
    const urlToUpdate = quickPublishUrl.trim() || null;
    setQuickPublishItem(null);
    setQuickPublishUrl('');

    try {
      await onSaveConteudo({
        id: itemToUpdate.id,
        status: 'publicado',
        link_publicacao: urlToUpdate,
      });
    } catch (err: any) {
      alert('Erro ao marcar publicação: ' + err.message);
    } finally {
      setQuickPublishing(false);
    }
  };

  // Salvar Formulário de Conteúdo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitulo.trim() || !formDataPub) {
      alert('Informe o título e a data de publicação.');
      return;
    }

    // Validação obrigatória do Link de Publicação ao marcar como publicado (exceto para Stories que são temporários)
    if (formStatus === 'publicado' && formTipo !== 'stories' && !formLinkPublicacao.trim()) {
      alert('Ao marcar um conteúdo como "Publicado", é obrigatório inserir o link dele na rede social publicada (exceto Stories).');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<ConteudoItem> = {
        titulo: formTitulo.trim(),
        data_publicacao: formDataPub,
        tipo_conteudo: formTipo,
        observacoes: formObservacoes.trim() || null,
        descricao: formObservacoes.trim() || null,
        roteiro_legenda: formRoteiroLegenda.trim() || null,
        projeto_id: formProjetoId || null,
        campanha_id: formCampanhaId || null,
        status: formStatus,
        responsavel_id: formResponsavelId || null,
        categoria: formCategoria,
        link_producao: formLinkProducao.trim() || null,
        link_publicacao: formLinkPublicacao.trim() || null,
      };

      if (editingConteudo?.id) {
        payload.id = editingConteudo.id;
      }

      // Fechamento instantâneo do modal para o usuário não ficar preso esperando
      setShowModal(false);
      if (selectedDiaDetalhes) {
        setSelectedDiaDetalhes(null);
      }
      if (selectedConteudoDetalhes) {
        setSelectedConteudoDetalhes(null);
      }

      await onSaveConteudo(payload);
    } catch (err: any) {
      alert('Erro ao salvar conteúdo: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Sincronizar mês no calendário quando selecionado no filtro
  useEffect(() => {
    if (mesFilter !== 'todos') {
      const targetMonth = Number(mesFilter);
      setCurrentDate((prev) => new Date(prev.getFullYear(), targetMonth, 1));
    }
  }, [mesFilter]);

  // Helper robusto para extrair o mês (0 a 11) independente de timezone UTC/local
  const getMesFromDateStr = (dateStr?: string | null): number | null => {
    if (!dateStr) return null;
    const match = dateStr.match(/^\d{4}-(\d{2})/);
    if (match) {
      const m = parseInt(match[1], 10);
      return !isNaN(m) && m >= 1 && m <= 12 ? m - 1 : null;
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d.getMonth();
  };

  // Filtragem Geral
  const filteredConteudos = useMemo(() => {
    return conteudos.filter((c) => {
      const matchSearch =
        searchTerm === '' ||
        c.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.descricao && c.descricao.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.observacoes && c.observacoes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.roteiro_legenda && c.roteiro_legenda.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.projetos_sociais?.nome && c.projetos_sociais.nome.toLowerCase().includes(searchTerm.toLowerCase()));

      const postMes = getMesFromDateStr(c.data_publicacao);
      const matchMes = mesFilter === 'todos' || postMes === Number(mesFilter);

      const matchProj = projetoFilter === 'todos' || c.projeto_id === projetoFilter;
      const matchStat = statusFilter === 'todos' || c.status === statusFilter;
      const matchTipo = tipoFilter === 'todos' || c.tipo_conteudo === tipoFilter;
      const matchCat = categoriaFilter === 'todos' || c.categoria === categoriaFilter;

      return matchSearch && matchMes && matchProj && matchStat && matchTipo && matchCat;
    });
  }, [conteudos, searchTerm, mesFilter, projetoFilter, statusFilter, tipoFilter, categoriaFilter]);

  // Indicador e Ação de Limpeza de Filtros
  const hasActiveFilters =
    searchTerm !== '' ||
    mesFilter !== 'todos' ||
    projetoFilter !== 'todos' ||
    statusFilter !== 'todos' ||
    tipoFilter !== 'todos' ||
    categoriaFilter !== 'todos';

  const handleLimparFiltros = () => {
    setSearchTerm('');
    setMesFilter('todos');
    setProjetoFilter('todos');
    setStatusFilter('todos');
    setTipoFilter('todos');
    setCategoriaFilter('todos');
  };

  // Paginação
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, mesFilter, projetoFilter, statusFilter, tipoFilter, categoriaFilter, pageSize]);

  const totalItems = filteredConteudos.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedConteudos = useMemo(() => {
    return filteredConteudos.slice(startIndex, startIndex + pageSize);
  }, [filteredConteudos, startIndex, pageSize]);

  // Base para os Micro-KPIs: atualizada dinamicamente com filtros de Mês, Projeto, Categoria, Formato e Busca (independente do status para demonstrar a proporção real)
  const baseConteudosParaKpis = useMemo(() => {
    return conteudos.filter((c) => {
      const matchSearch =
        searchTerm === '' ||
        c.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.descricao && c.descricao.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.observacoes && c.observacoes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.roteiro_legenda && c.roteiro_legenda.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.projetos_sociais?.nome && c.projetos_sociais.nome.toLowerCase().includes(searchTerm.toLowerCase()));

      const postMes = getMesFromDateStr(c.data_publicacao);
      const matchMes = mesFilter === 'todos' || postMes === Number(mesFilter);

      const matchProj = projetoFilter === 'todos' || c.projeto_id === projetoFilter;
      const matchTipo = tipoFilter === 'todos' || c.tipo_conteudo === tipoFilter;
      const matchCat = categoriaFilter === 'todos' || c.categoria === categoriaFilter;

      return matchSearch && matchMes && matchProj && matchTipo && matchCat;
    });
  }, [conteudos, searchTerm, mesFilter, projetoFilter, tipoFilter, categoriaFilter]);

  // Micro-KPIs Dinâmicos (atualizam instantaneamente com o filtro de mês e demais filtros contextuais)
  const stats = useMemo(() => {
    const total = baseConteudosParaKpis.length;
    const publicados = baseConteudosParaKpis.filter((c) => c.status === 'publicado').length;
    const emProducao = baseConteudosParaKpis.filter((c) => c.status === 'producao' || c.status === 'analise').length;
    const atrasados = baseConteudosParaKpis.filter((c) => c.status === 'em_atraso').length;
    return { total, publicados, emProducao, atrasados };
  }, [baseConteudosParaKpis]);

  // Formatação de data no calendário
  const conteudosByDay = useMemo(() => {
    const map: Record<number, ConteudoItem[]> = {};

    conteudos.forEach((c) => {
      if (!c.data_publicacao) return;
      const d = new Date(c.data_publicacao);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const dia = d.getDate();
        if (!map[dia]) map[dia] = [];
        map[dia].push(c);
      }
    });

    return map;
  }, [conteudos, currentMonth, currentYear]);

  // Lista de dias do grid do calendário
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [currentYear, currentMonth]);

  // Abrir modal de Detalhes do Dia
  const handleOpenDiaDetalhes = (day: number) => {
    const posts = conteudosByDay[day] || [];
    const date = new Date(currentYear, currentMonth, day);
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateFormatted = date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const datePrefill = `${currentYear}-${mm}-${dd}T10:00`;

    setSelectedDiaDetalhes({
      day,
      date,
      dateFormatted,
      datePrefill,
      posts,
    });
  };

  // Helper de badges de status com alto contraste
  const renderStatusBadge = (status: ConteudoItem['status']) => {
    switch (status) {
      case 'publicado':
        return <Badge variant="success" className="whitespace-nowrap">PUBLICADO</Badge>;
      case 'producao':
        return <Badge variant="warning" className="whitespace-nowrap">EM PRODUÇÃO</Badge>;
      case 'analise':
        return <Badge variant="purple" className="whitespace-nowrap">EM ANÁLISE</Badge>;
      case 'em_atraso':
        return <Badge variant="danger" className="whitespace-nowrap">EM ATRASO</Badge>;
      case 'cancelado':
        return <Badge variant="neutral" className="whitespace-nowrap">CANCELADO</Badge>;
      default:
        return <Badge variant="neutral" className="whitespace-nowrap">NÃO INICIADO</Badge>;
    }
  };

  // Helper de badges de formato
  const renderTipoBadge = (tipo: ConteudoItem['tipo_conteudo']) => {
    switch (tipo) {
      case 'reels':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-500/10 text-pink-700 dark:text-pink-300 border border-pink-500/20 flex items-center gap-1 shrink-0">
            <Film className="w-3 h-3" />
            Reels
          </span>
        );
      case 'carrossel':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 flex items-center gap-1 shrink-0">
            <Layers className="w-3 h-3" />
            Carrossel
          </span>
        );
      case 'stories':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 flex items-center gap-1 shrink-0">
            <Sparkles className="w-3 h-3" />
            Stories
          </span>
        );
      case 'video_longo':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 flex items-center gap-1 shrink-0">
            <Film className="w-3 h-3" />
            Vídeo
          </span>
        );
      case 'artigo':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 flex items-center gap-1 shrink-0">
            <FileText className="w-3 h-3" />
            Artigo
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-500/10 text-[var(--text-secondary)] border border-[var(--border-default)] flex items-center gap-1 shrink-0">
            <Layers className="w-3 h-3" />
            Estático
          </span>
        );
    }
  };

  // Colunas da Tabela de Conteúdos
  const columns: Column<ConteudoItem>[] = [
    {
      key: 'data_publicacao',
      header: 'Data & Horário',
      width: '140px',
      render: (item) => {
        const d = new Date(item.data_publicacao);
        const diaSemana = DIAS_SEMANA[d.getDay()];
        return (
          <div className="text-xs font-mono-data space-y-0.5 whitespace-nowrap">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded font-bold text-[10px] bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-secondary)]">
                {diaSemana}
              </span>
              <span className="font-bold text-[var(--text-primary)]">
                {d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
              <Clock className="w-3 h-3 text-[var(--text-muted)]" />
              <span>{d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'titulo',
      header: 'Título & Formato',
      width: '260px',
      render: (item) => {
        const legTexto = (item.roteiro_legenda || '').trim();
        let descricaoExibicao = (item.observacoes || '').trim();
        if (!descricaoExibicao && item.descricao) {
          const descTexto = item.descricao.trim();
          if (descTexto !== legTexto) {
            descricaoExibicao = descTexto;
          }
        }
        return (
          <div className="space-y-1.5 min-w-0 pr-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {renderTipoBadge(item.tipo_conteudo)}
              <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-default)]">
                {item.categoria}
              </span>
            </div>
            {/* Título clicável para abrir janela flutuante com todos os detalhes */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedConteudoDetalhes(item);
              }}
              className="text-left font-bold text-xs sm:text-sm text-[var(--text-primary)] leading-snug line-clamp-2 hover:text-[var(--color-primary)] transition-colors cursor-pointer group flex items-start gap-1"
              title="Clique para abrir detalhes completos da publicação"
            >
              <span className="group-hover:underline">{item.titulo}</span>
            </button>
            {/* Descrição do post ou observações logo abaixo do nome */}
            {descricaoExibicao && (
              <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 italic bg-[var(--bg-secondary)]/40 px-2 py-0.5 rounded border border-[var(--border-default)]/40">
                &quot;{descricaoExibicao}&quot;
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'projeto_id',
      header: 'Projeto & Campanha',
      width: '180px',
      render: (item) => (
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
              style={{ backgroundColor: item.projetos_sociais?.cor_identificacao || '#F2632D' }}
            />
            <span className="font-bold text-[var(--text-primary)] truncate">
              {item.projetos_sociais?.nome || 'Institucional Ádapo'}
            </span>
          </div>
          {item.campanhas_comunicacao && (
            <p className="text-[11px] text-[#93368F] font-semibold truncate flex items-center gap-1">
              <Megaphone className="w-3 h-3 shrink-0" />
              <span className="truncate">{item.campanhas_comunicacao.titulo}</span>
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'responsavel_id',
      header: 'Responsável',
      width: '140px',
      render: (item) => (
        <div className="flex items-center gap-2 text-xs">
          <div className="w-7 h-7 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold text-xs flex items-center justify-center shrink-0 border border-[var(--color-primary)]/20 shadow-2xs">
            {item.voluntarios?.nome_completo?.charAt(0).toUpperCase() || 'V'}
          </div>
          <span className="font-medium text-[var(--text-primary)] truncate">
            {item.voluntarios?.nome_completo?.split(' ')[0] || 'Não atribuído'}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '140px',
      align: 'center',
      className: 'whitespace-nowrap',
      headerClassName: 'whitespace-nowrap',
      render: (item) => renderStatusBadge(item.status),
    },
    {
      key: 'acoes',
      header: 'Ações',
      width: '190px',
      align: 'right',
      className: 'whitespace-nowrap',
      headerClassName: 'whitespace-nowrap',
      render: (item) => {
        const isPublicado = item.status === 'publicado';

        return (
          <div className="flex items-center justify-end gap-1.5">
            {/* Link da Publicação na Rede Social / Inserir Link */}
            {item.link_publicacao ? (
              <a
                href={item.link_publicacao}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-pink-500/10 text-pink-700 dark:text-pink-300 border border-pink-500/25 hover:bg-pink-500/20 transition-all shadow-2xs whitespace-nowrap"
                title="Abrir postagem na rede social"
              >
                <ExternalLink className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
                <span>Ver Post</span>
              </a>
            ) : isPublicado ? (
              item.tipo_conteudo === 'stories' ? (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-500/10 text-[var(--text-muted)] border border-[var(--border-default)] whitespace-nowrap"
                  title="Stories são temporários (24h) e não possuem link permanente fixo"
                >
                  Story (24h)
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleOpenQuickPublish(item)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer whitespace-nowrap"
                  title="Conteúdo marcado como publicado mas sem link. Clique para adicionar."
                >
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>+ Link</span>
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={() => handleOpenQuickPublish(item)}
                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                title="Marcar como Publicado (Inserir Link)"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}

            {/* Link de Produção (Canva / Google Drive) */}
            {item.link_producao && (
              <a
                href={item.link_producao}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)] border border-[var(--border-default)] transition-colors"
                title="Abrir no Canva / Google Drive"
              >
                <Link2 className="w-3.5 h-3.5" />
              </a>
            )}

            {/* Editar Peça */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEditModal(item)}
              className="p-1.5 h-auto text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title="Editar peça"
            >
              <Edit className="w-3.5 h-3.5" />
            </Button>

            {/* Excluir Peça */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteConteudo(item.id)}
              className="p-1.5 h-auto text-rose-600 hover:bg-rose-500/10"
              title="Excluir peça"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      {/* ── 1. MICRO-KPIS DE PRODUÇÃO EDITORIAL (INTERATIVOS & DINÂMICOS) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('todos')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer select-none flex items-center gap-3 ${
            statusFilter === 'todos'
              ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]/20 shadow-xs ring-2 ring-[var(--color-primary)]/25'
              : 'border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] hover:border-[var(--color-primary)]/50'
          }`}
          title="Clique para exibir todos os status"
        >
          <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
                Total de Peças
              </p>
              {statusFilter === 'todos' && (
                <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0" />
              )}
            </div>
            <p className="text-lg sm:text-xl font-display font-extrabold text-[var(--text-primary)]">
              {stats.total}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'publicado' ? 'todos' : 'publicado')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer select-none flex items-center gap-3 ${
            statusFilter === 'publicado'
              ? 'border-emerald-500 bg-emerald-500/10 shadow-xs ring-2 ring-emerald-500/25'
              : 'border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] hover:border-emerald-500/50'
          }`}
          title="Clique para filtrar apenas Publicados"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
                Publicados
              </p>
              {statusFilter === 'publicado' && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              )}
            </div>
            <p className="text-lg sm:text-xl font-display font-extrabold text-emerald-600">
              {stats.publicados}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'producao' ? 'todos' : 'producao')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer select-none flex items-center gap-3 ${
            statusFilter === 'producao'
              ? 'border-amber-500 bg-amber-500/10 shadow-xs ring-2 ring-amber-500/25'
              : 'border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] hover:border-amber-500/50'
          }`}
          title="Clique para filtrar conteúdos Em Produção"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
                Em Produção
              </p>
              {statusFilter === 'producao' && (
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              )}
            </div>
            <p className="text-lg sm:text-xl font-display font-extrabold text-amber-600">
              {stats.emProducao}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'em_atraso' ? 'todos' : 'em_atraso')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer select-none flex items-center gap-3 ${
            statusFilter === 'em_atraso'
              ? 'border-rose-500 bg-rose-500/10 shadow-xs ring-2 ring-rose-500/25'
              : 'border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] hover:border-rose-500/50'
          }`}
          title="Clique para filtrar conteúdos Em Atraso"
        >
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
                Em Atraso
              </p>
              {statusFilter === 'em_atraso' && (
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              )}
            </div>
            <p className="text-lg sm:text-xl font-display font-extrabold text-rose-600">
              {stats.atrasados}
            </p>
          </div>
        </button>
      </div>

      {/* ── 2. BARRA DE CONTROLE: ALTERNADOR TABELA/CALENDÁRIO, FILTROS, EXPORTAR PDF E NOVO CONTEÚDO ── */}
      <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Alternador de Modo de Visualização */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setViewMode('tabela')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'tabela'
                  ? 'bg-[var(--bg-elevated)] text-[var(--color-primary)] shadow-xs border border-[var(--border-default)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span>Tabela Geral</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendario')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'calendario'
                  ? 'bg-[var(--bg-elevated)] text-[var(--color-primary)] shadow-xs border border-[var(--border-default)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Calendário Mensal</span>
            </button>
          </div>

          {/* Botões de Ação Superior (Exportar PDF & Novo Conteúdo) */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="secondary"
              size="sm"
              icon={<Printer className="w-4 h-4 text-[var(--color-primary)]" />}
              onClick={() => setShowPdfModal(true)}
              title="Gerar PDF Timbrado do Calendário Editorial"
              className="w-full sm:w-auto justify-center"
            >
              Exportar PDF
            </Button>
            <Button
              onClick={() => handleOpenNewModal()}
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              className="w-full sm:w-auto justify-center"
            >
              Novo Conteúdo
            </Button>
          </div>
        </div>

        {/* Filtros em Linha */}
        <div className="flex flex-col md:flex-row items-center gap-2.5 pt-1">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Buscar por título, roteiro ou projeto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            {/* Filtro por Mês */}
            <select
              value={mesFilter}
              onChange={(e) => setMesFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none font-semibold cursor-pointer"
            >
              <option value="todos">Todos os Meses</option>
              {MESES_NOMES.map((nome, idx) => (
                <option key={idx} value={String(idx)}>
                  {nome}
                </option>
              ))}
            </select>

            <select
              value={projetoFilter}
              onChange={(e) => setProjetoFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none font-semibold cursor-pointer"
            >
              <option value="todos">Todos os Projetos</option>
              {projetos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none font-semibold cursor-pointer"
            >
              <option value="todos">Todos os Status</option>
              <option value="nao_iniciado">Não Iniciado</option>
              <option value="producao">Em Produção</option>
              <option value="analise">Em Análise</option>
              <option value="em_atraso">Em Atraso</option>
              <option value="publicado">Publicado</option>
              <option value="cancelado">Cancelado</option>
            </select>

            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none font-semibold cursor-pointer"
            >
              <option value="todos">Todos os Formatos</option>
              <option value="reels">Reels</option>
              <option value="carrossel">Carrossel</option>
              <option value="stories">Stories</option>
              <option value="estatico">Estático</option>
              <option value="video_longo">Vídeo</option>
              <option value="artigo">Artigo</option>
            </select>

            <select
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none font-semibold cursor-pointer"
            >
              <option value="todos">Todas Categorias</option>
              <option value="engajamento">Engajamento</option>
              <option value="informacao">Informação</option>
              <option value="cta">CTA / Captação</option>
              <option value="institucional">Institucional</option>
              <option value="depoimento">Depoimento</option>
              <option value="avulso">Avulso</option>
            </select>

            {/* Seletor Rápido de Itens por Página */}
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none font-semibold cursor-pointer"
              title="Quantidade de linhas por página"
            >
              <option value={7}>7 por pág</option>
              <option value={15}>15 por pág</option>
              <option value={30}>30 por pág</option>
            </select>

            {/* Limpar Filtros */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleLimparFiltros}
                className="px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-500/10 border border-rose-500/20 transition-all flex items-center gap-1 cursor-pointer"
                title="Limpar todos os filtros"
              >
                <X className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. VISUALIZAÇÃO: MODO TABELA ── */}
      {viewMode === 'tabela' && (
        <div className="space-y-3">
          <DataTable
            columns={columns}
            data={paginatedConteudos}
            keyExtractor={(c) => c.id}
            emptyMessage="Nenhum conteúdo encontrado para os filtros selecionados."
          />

          {/* ── BARRA DE PAGINAÇÃO ── */}
          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-[var(--shadow-card)] text-xs">
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <span>
                  Exibindo <strong>{startIndex + 1}</strong> a <strong>{Math.min(startIndex + pageSize, totalItems)}</strong> de <strong>{totalItems}</strong> conteúdos
                </span>
                {hasActiveFilters && (
                  <Badge variant="primary" className="text-[10px] whitespace-nowrap">
                    Filtrado
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Seletor de itens por página */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-[var(--text-muted)]">Itens por página:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="px-2 py-1 rounded-lg text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium focus:outline-none focus:border-[var(--color-primary)] cursor-pointer"
                  >
                    <option value={7}>7</option>
                    <option value={15}>15</option>
                    <option value={30}>30</option>
                  </select>
                </div>

                {/* Controles de navegação de páginas */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(1)}
                    className="p-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Primeira página"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Página anterior"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <span className="px-3 py-1 font-semibold text-[var(--text-primary)] whitespace-nowrap">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Próxima página"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className="p-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Última página"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 4. VISUALIZAÇÃO: MODO CALENDÁRIO MENSAL (EXCLUSIVO PARA VISUALIZAÇÃO COM DETALHES AO CLICAR) ── */}
      {viewMode === 'calendario' && (
        <Card className="p-4 sm:p-5 overflow-x-auto space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-colors cursor-pointer"
                title="Mês anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="font-display font-bold text-base sm:text-lg text-[var(--text-primary)] min-w-[190px] text-center">
                {MESES_NOMES[currentMonth]} {currentYear}
              </h3>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-colors cursor-pointer"
                title="Próximo mês"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)] hidden sm:inline-block">
                Clique em qualquer dia para ver os detalhes dos posts programados.
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="text-xs"
              >
                Hoje
              </Button>
            </div>
          </div>

          <div className="min-w-[760px]">
            {/* Cabeçalho dos Dias da Semana */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              {DIAS_SEMANA.map((d, i) => (
                <div key={d} className={`py-1 rounded-lg ${i === 0 ? 'text-rose-500 bg-rose-500/5' : ''}`}>
                  {d}
                </div>
              ))}
            </div>

            {/* Grid de Dias */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="h-28 rounded-2xl bg-[var(--bg-secondary)]/15 border border-dashed border-[var(--border-default)]/40"
                    />
                  );
                }

                const postsDoDia = conteudosByDay[day] || [];
                const isToday =
                  new Date().getDate() === day &&
                  new Date().getMonth() === currentMonth &&
                  new Date().getFullYear() === currentYear;

                return (
                  <div
                    key={`cal-day-${day}`}
                    onClick={() => handleOpenDiaDetalhes(day)}
                    className={`h-28 p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                      isToday
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]/10 shadow-xs'
                        : postsDoDia.length > 0
                        ? 'border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--color-primary)] hover:shadow-xs'
                        : 'border-[var(--border-default)]/60 bg-[var(--bg-elevated)]/60 hover:bg-[var(--bg-elevated)] hover:border-[var(--border-default)]'
                    }`}
                  >
                    {/* Topo da Célula: Dia & Contador */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-extrabold flex items-center justify-center ${
                          isToday
                            ? 'w-6 h-6 rounded-full bg-[var(--color-primary)] text-white'
                            : 'text-[var(--text-primary)]'
                        }`}
                      >
                        {day}
                      </span>
                      {postsDoDia.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-[var(--color-primary-soft)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                          {postsDoDia.length} {postsDoDia.length === 1 ? 'post' : 'posts'}
                        </span>
                      )}
                    </div>

                    {/* Chips Compactos de Posts no Dia */}
                    <div className="space-y-1 overflow-hidden my-auto">
                      {postsDoDia.slice(0, 2).map((post) => {
                        const postTime = post.data_publicacao
                          ? new Date(post.data_publicacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                          : '';

                        return (
                          <div
                            key={post.id}
                            className="text-[10px] truncate px-1.5 py-0.5 rounded-md font-bold border flex items-center justify-between gap-1 shadow-2xs"
                            style={{
                              backgroundColor: `${post.projetos_sociais?.cor_identificacao || '#F2632D'}15`,
                              borderColor: `${post.projetos_sociais?.cor_identificacao || '#F2632D'}35`,
                              color: post.projetos_sociais?.cor_identificacao || '#F2632D',
                            }}
                          >
                            <span className="truncate">{post.titulo}</span>
                            {postTime && <span className="text-[8px] opacity-75 shrink-0">{postTime}</span>}
                          </div>
                        );
                      })}
                      {postsDoDia.length > 2 && (
                        <span className="text-[9px] font-bold text-[var(--text-muted)] pl-1 block">
                          +{postsDoDia.length - 2} mais
                        </span>
                      )}
                    </div>

                    {/* Rodapé da Célula: Indicador de Detalhes */}
                    <div className="text-[9px] font-semibold text-[var(--text-muted)] group-hover:text-[var(--color-primary)] flex items-center justify-end gap-0.5 transition-colors">
                      <span>Ver detalhes</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* ── 5. MODAL: DETALHES DOS POSTS DO DIA (CLIQUE NO CALENDÁRIO MENSAL) ── */}
      {selectedDiaDetalhes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-3xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-[var(--text-primary)] capitalize">
                    {selectedDiaDetalhes.dateFormatted}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    {selectedDiaDetalhes.posts.length === 0
                      ? 'Nenhuma publicação agendada para esta data'
                      : `${selectedDiaDetalhes.posts.length} publicação(ões) programada(s)`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDiaDetalhes(null)}
                className="p-1.5 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Listagem de Peças do Dia */}
            <div className="space-y-3">
              {selectedDiaDetalhes.posts.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--bg-secondary)] text-[var(--text-muted)] flex items-center justify-center mx-auto">
                    <CalendarIcon className="w-6 h-6 opacity-60" />
                  </div>
                  <p className="text-sm font-semibold text-[var(--text-secondary)]">
                    Nenhum conteúdo agendado para este dia.
                  </p>
                  <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                    Você pode agendar um post agora mesmo com horário e projeto definidos.
                  </p>
                  <Button
                    onClick={() => {
                      const prefill = selectedDiaDetalhes.datePrefill;
                      setSelectedDiaDetalhes(null);
                      handleOpenNewModal(prefill);
                    }}
                    size="sm"
                    icon={<Plus className="w-4 h-4" />}
                  >
                    Agendar Post para este Dia
                  </Button>
                </div>
              ) : (
                selectedDiaDetalhes.posts.map((post) => {
                  const d = new Date(post.data_publicacao);
                  const horario = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div
                      key={post.id}
                      className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/40 hover:border-[var(--color-primary)]/40 transition-all space-y-3 shadow-2xs"
                    >
                      {/* Linha 1: Formato, Status, Horário */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {renderTipoBadge(post.tipo_conteudo)}
                          <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-default)]">
                            {post.categoria}
                          </span>
                          {renderStatusBadge(post.status)}
                        </div>

                        <div className="flex items-center gap-1 text-xs font-mono-data font-bold text-[var(--text-primary)]">
                          <Clock className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                          <span>{horario}h</span>
                        </div>
                      </div>

                      {/* Linha 2: Título */}
                      <h4 className="font-display font-bold text-sm sm:text-base text-[var(--text-primary)]">
                        {post.titulo}
                      </h4>

                      {/* Linha 3: Projeto & Responsável */}
                      <div className="flex items-center justify-between gap-2 text-xs flex-wrap pt-1 border-t border-[var(--border-default)]/60">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: post.projetos_sociais?.cor_identificacao || '#F2632D' }}
                          />
                          <span className="font-semibold text-[var(--text-primary)] truncate">
                            {post.projetos_sociais?.nome || 'Institucional Ádapo'}
                          </span>
                          {post.campanhas_comunicacao && (
                            <span className="text-[11px] text-[#93368F] font-bold truncate">
                              • {post.campanhas_comunicacao.titulo}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                          <User className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <span>{post.voluntarios?.nome_completo || 'Sem responsável'}</span>
                        </div>
                      </div>

                      {/* Linha 4: Descrição do Post / Observações */}
                      {(() => {
                        const obs = (post.observacoes || '').trim();
                        const desc = (post.descricao || '').trim();
                        const leg = (post.roteiro_legenda || '').trim();
                        const textoExibir = obs || (desc !== leg ? desc : '');
                        if (!textoExibir) return null;
                        return (
                          <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)] leading-relaxed">
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                              Descrição / Observações:
                            </p>
                            <p className="whitespace-pre-line">{textoExibir}</p>
                          </div>
                        );
                      })()}

                      {/* Roteiro / Legenda Completa */}
                      {post.roteiro_legenda && (
                        <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)] leading-relaxed">
                          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                            Roteiro / Legenda da Publicação:
                          </p>
                          <p className="whitespace-pre-line font-mono-data">{post.roteiro_legenda}</p>
                        </div>
                      )}

                      {/* Linha 5: Links e Ações */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-default)]/60 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          {post.link_publicacao && (
                            <a
                              href={post.link_publicacao}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-pink-500/15 text-pink-700 dark:text-pink-300 border border-pink-500/30 hover:bg-pink-500/25 transition-all"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Abrir Postagem no Ar</span>
                            </a>
                          )}
                          {post.link_producao && (
                            <a
                              href={post.link_producao}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:text-[var(--color-primary)] transition-all"
                            >
                              <Link2 className="w-3.5 h-3.5" />
                              <span>Canva / Drive</span>
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {post.status !== 'publicado' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                              onClick={() => {
                                setSelectedDiaDetalhes(null);
                                handleOpenQuickPublish(post);
                              }}
                            >
                              Publicar
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Edit className="w-3.5 h-3.5" />}
                            onClick={() => {
                              setSelectedDiaDetalhes(null);
                              handleOpenEditModal(post);
                            }}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 className="w-3.5 h-3.5 text-rose-600" />}
                            onClick={async () => {
                              if (confirm('Deseja excluir esta publicação do calendário editorial?')) {
                                await onDeleteConteudo(post.id);
                                setSelectedDiaDetalhes(null);
                              }
                            }}
                          >
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Rodapé do Modal */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-default)]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedDiaDetalhes(null)}
              >
                Fechar
              </Button>
              <Button
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  const prefill = selectedDiaDetalhes.datePrefill;
                  setSelectedDiaDetalhes(null);
                  handleOpenNewModal(prefill);
                }}
              >
                + Novo Conteúdo para este Dia
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL FLUTUANTE: DETALHES COMPLETOS DA PUBLICAÇÃO (CLIQUE NO TÍTULO) ── */}
      {selectedConteudoDetalhes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-3xl shadow-2xl p-5 sm:p-6 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Topo do Modal: Badges e Botão Fechar */}
            <div className="flex items-start justify-between gap-3 border-b border-[var(--border-default)] pb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {renderTipoBadge(selectedConteudoDetalhes.tipo_conteudo)}
                  <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-default)]">
                    {selectedConteudoDetalhes.categoria}
                  </span>
                  {renderStatusBadge(selectedConteudoDetalhes.status)}
                </div>
                <h3 className="font-display font-extrabold text-base sm:text-xl text-[var(--text-primary)] leading-snug">
                  {selectedConteudoDetalhes.titulo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedConteudoDetalhes(null)}
                className="p-1.5 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0"
                title="Fechar janela"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid de Informações Básicas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Data & Horário */}
              <div className="p-3 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-default)] flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                    Data & Horário
                  </p>
                  <p className="text-xs font-bold text-[var(--text-primary)] font-mono-data">
                    {new Date(selectedConteudoDetalhes.data_publicacao).toLocaleDateString('pt-BR', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}{' '}
                    às {new Date(selectedConteudoDetalhes.data_publicacao).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}h
                  </p>
                </div>
              </div>

              {/* Responsável */}
              <div className="p-3 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-default)] flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold text-xs flex items-center justify-center shrink-0">
                  {selectedConteudoDetalhes.voluntarios?.nome_completo?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                    Responsável
                  </p>
                  <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                    {selectedConteudoDetalhes.voluntarios?.nome_completo || 'Não atribuído'}
                  </p>
                </div>
              </div>

              {/* Projeto Social */}
              <div className="p-3 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-default)] flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                  style={{
                    backgroundColor: `${selectedConteudoDetalhes.projetos_sociais?.cor_identificacao || '#F2632D'}20`,
                    color: selectedConteudoDetalhes.projetos_sociais?.cor_identificacao || '#F2632D',
                  }}
                >
                  <FolderKanban className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                    Projeto Social
                  </p>
                  <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                    {selectedConteudoDetalhes.projetos_sociais?.nome || 'Institucional Geral'}
                  </p>
                </div>
              </div>

              {/* Campanha Estratégica */}
              <div className="p-3 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-default)] flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-[#93368F] flex items-center justify-center shrink-0">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                    Campanha Estratégica
                  </p>
                  <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                    {selectedConteudoDetalhes.campanhas_comunicacao?.titulo || 'Nenhuma campanha vinculada'}
                  </p>
                </div>
              </div>
            </div>

            {/* Descrição do Post ou Observações */}
            {(() => {
              const obs = (selectedConteudoDetalhes.observacoes || '').trim();
              const desc = (selectedConteudoDetalhes.descricao || '').trim();
              const leg = (selectedConteudoDetalhes.roteiro_legenda || '').trim();
              const textoExibir = obs || (desc !== leg ? desc : '');
              if (!textoExibir) return null;
              return (
                <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)]/40 border border-[var(--border-default)] space-y-1">
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    <span>Descrição do Post / Observações</span>
                  </p>
                  <p className="text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-line">
                    {textoExibir}
                  </p>
                </div>
              );
            })()}

            {/* Roteiro / Legenda Completa da Publicação */}
            {selectedConteudoDetalhes.roteiro_legenda && (
              <div className="p-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                    <span>Roteiro / Legenda da Publicação</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopyLegenda(selectedConteudoDetalhes.roteiro_legenda || '')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[var(--bg-secondary)] hover:bg-[var(--color-primary-soft)] text-[var(--text-secondary)] hover:text-[var(--color-primary)] border border-[var(--border-default)] transition-colors cursor-pointer"
                  >
                    {copiedLegenda ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar Legenda</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg-secondary)]/60 text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto border border-[var(--border-default)]/40">
                  {selectedConteudoDetalhes.roteiro_legenda}
                </div>
              </div>
            )}

            {/* Links de Publicação e Produção */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {/* Link da Publicação */}
              {selectedConteudoDetalhes.link_publicacao ? (
                <a
                  href={selectedConteudoDetalhes.link_publicacao}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-pink-500/15 text-pink-700 dark:text-pink-300 border border-pink-500/30 hover:bg-pink-500/25 transition-all shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir Postagem no Ar</span>
                </a>
              ) : selectedConteudoDetalhes.status === 'publicado' ? (
                selectedConteudoDetalhes.tipo_conteudo === 'stories' ? (
                  <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-500/10 text-[var(--text-muted)] border border-[var(--border-default)]">
                    Story temporário (24h)
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                    onClick={() => {
                      const item = selectedConteudoDetalhes;
                      setSelectedConteudoDetalhes(null);
                      handleOpenQuickPublish(item);
                    }}
                  >
                    Inserir Link da Publicação
                  </Button>
                )
              ) : null}

              {/* Link de Produção Canva / Drive */}
              {selectedConteudoDetalhes.link_producao && (
                <a
                  href={selectedConteudoDetalhes.link_producao}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)] transition-all"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Abrir no Canva / Google Drive</span>
                </a>
              )}
            </div>

            {/* Rodapé: Botões de Ação */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--border-default)]">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {selectedConteudoDetalhes.status !== 'publicado' && (
                  <Button
                    size="sm"
                    icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    onClick={() => {
                      const item = selectedConteudoDetalhes;
                      setSelectedConteudoDetalhes(null);
                      handleOpenQuickPublish(item);
                    }}
                    className="flex-1 sm:flex-none justify-center"
                  >
                    Marcar como Publicado
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Edit className="w-3.5 h-3.5" />}
                  onClick={() => {
                    const item = selectedConteudoDetalhes;
                    setSelectedConteudoDetalhes(null);
                    handleOpenEditModal(item);
                  }}
                  className="flex-1 sm:flex-none justify-center"
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 className="w-3.5 h-3.5 text-rose-600" />}
                  onClick={async () => {
                    if (confirm('Deseja realmente excluir esta publicação do calendário?')) {
                      const id = selectedConteudoDetalhes.id;
                      setSelectedConteudoDetalhes(null);
                      await onDeleteConteudo(id);
                    }
                  }}
                  className="text-rose-600 hover:bg-rose-500/10 flex-1 sm:flex-none justify-center"
                >
                  Excluir
                </Button>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedConteudoDetalhes(null)}
                className="w-full sm:w-auto justify-center"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. MODAL: CRIAR / EDITAR CONTEÚDO EDITORIAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-[var(--color-primary)]" />
                <h3 className="font-display font-bold text-base sm:text-lg text-[var(--text-primary)]">
                  {editingConteudo ? 'Editar Conteúdo Editorial' : 'Agendar Novo Conteúdo'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                  Título da Peça / Tema do Conteúdo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carrossel com fotos da oficina de circo no Clube das Pipas"
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                    Data e Horário de Publicação *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formDataPub}
                    onChange={(e) => setFormDataPub(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-mono-data"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                    Formato de Conteúdo
                  </label>
                  <select
                    value={formTipo}
                    onChange={(e: any) => setFormTipo(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] font-medium"
                  >
                    <option value="reels">Reels / Vídeo Curto</option>
                    <option value="carrossel">Carrossel de Fotos/Artes</option>
                    <option value="stories">Sequência de Stories</option>
                    <option value="estatico">Post Estático (Foto única)</option>
                    <option value="video_longo">Vídeo Longo / Documentário</option>
                    <option value="artigo">Artigo / Nota de Imprensa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                    Projeto Vinculado (Opcional)
                  </label>
                  <select
                    value={formProjetoId}
                    onChange={(e) => setFormProjetoId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] font-medium"
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
                    Campanha Estratégica (Opcional)
                  </label>
                  <select
                    value={formCampanhaId}
                    onChange={(e) => setFormCampanhaId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] font-medium"
                  >
                    <option value="">Nenhuma campanha vinculada</option>
                    {campanhas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.titulo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                    Status do Fluxo
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e: any) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium"
                  >
                    <option value="nao_iniciado">Não Iniciado</option>
                    <option value="producao">Em Produção</option>
                    <option value="analise">Em Análise</option>
                    <option value="em_atraso">Em Atraso</option>
                    <option value="publicado">Publicado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                    Categoria
                  </label>
                  <select
                    value={formCategoria}
                    onChange={(e: any) => setFormCategoria(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium"
                  >
                    <option value="engajamento">Engajamento</option>
                    <option value="informacao">Informação</option>
                    <option value="cta">CTA / Captação</option>
                    <option value="institucional">Institucional</option>
                    <option value="depoimento">Depoimento</option>
                    <option value="avulso">Avulso</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                    Responsável
                  </label>
                  <select
                    value={formResponsavelId}
                    onChange={(e) => setFormResponsavelId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium"
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

              {/* CAMPO DE LINK NA REDE SOCIAL (OBRIGATÓRIO SE PUBLICADO, EXCETO STORIES) */}
              {formStatus === 'publicado' && (
                <div className="p-3.5 rounded-2xl bg-pink-500/10 border border-pink-500/30 space-y-1.5 animate-in fade-in">
                  <label className="font-bold text-pink-700 dark:text-pink-300 flex items-center gap-1.5">
                    <ExternalLink className="w-4 h-4 text-pink-600" />
                    Link da Publicação na Rede Social {formTipo === 'stories' ? '(Opcional para Stories)' : '*'}
                  </label>
                  <input
                    type="url"
                    required={formTipo !== 'stories'}
                    placeholder={
                      formTipo === 'stories'
                        ? 'Opcional (stories são temporários de 24h e não possuem link fixo)'
                        : 'https://www.instagram.com/p/... ou https://youtube.com/watch?v=...'
                    }
                    value={formLinkPublicacao}
                    onChange={(e) => setFormLinkPublicacao(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-pink-500/40 text-[var(--text-primary)] focus:outline-none focus:border-pink-600 font-medium"
                  />
                  <p className="text-[11px] text-pink-600 dark:text-pink-400">
                    {formTipo === 'stories'
                      ? 'Como stories são conteúdos de 24 horas, a inserção de link não é obrigatória para marcar como publicado.'
                      : 'Obrigatório informar a URL do post no ar para monitoramento de métricas e histórico.'}
                  </p>
                </div>
              )}

              <div>
                <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                  Link de Produção (Canva, Figma ou Google Drive)
                </label>
                <div className="relative">
                  <Link2 className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
                  <input
                    type="url"
                    placeholder="https://canva.com/design/... ou https://drive.google.com/..."
                    value={formLinkProducao}
                    onChange={(e) => setFormLinkProducao(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              {/* DESCRIÇÃO DO POST OU OBSERVAÇÕES (EXIBIDO NA TABELA) */}
              <div>
                <label className="font-semibold text-[var(--text-secondary)] block mb-1 flex items-center justify-between">
                  <span>Descrição do Post ou Observações</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-normal">Exibido abaixo do título na tabela</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Breve resumo, objetivo do post ou orientações rápidas para a equipe..."
                  value={formObservacoes}
                  onChange={(e) => {
                    setFormObservacoes(e.target.value);
                    e.currentTarget.style.height = 'auto';
                    e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                  }}
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] min-h-[60px] resize-y text-xs"
                />
              </div>

              {/* ROTEIRO / LEGENDA COMPLETA DA PUBLICAÇÃO */}
              <div>
                <label className="font-semibold text-[var(--text-secondary)] block mb-1 flex items-center justify-between">
                  <span>Roteiro / Legenda da Publicação</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-normal">Texto completo, hashtags e roteiro</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Insira o texto completo da legenda do post, hashtags, orientações para o designer ou roteiro de gravação do vídeo..."
                  value={formRoteiroLegenda}
                  onChange={(e) => {
                    setFormRoteiroLegenda(e.target.value);
                    e.currentTarget.style.height = 'auto';
                    e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] min-h-[100px] resize-y text-xs font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-default)]">
                <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button size="sm" icon={<Save className="w-4 h-4" />} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Conteúdo'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 7. MODAL RÁPIDO: CONFIRMAR PUBLICAÇÃO & INSERIR LINK ── */}
      {quickPublishItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                  Marcar como Publicado
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQuickPublishItem(null)}
                className="p-1 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmQuickPublish} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] space-y-1">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Peça:</p>
                <p className="font-bold text-sm text-[var(--text-primary)]">{quickPublishItem.titulo}</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[var(--text-primary)] block">
                  Link da Publicação na Rede Social {quickPublishItem.tipo_conteudo === 'stories' ? '(Opcional para Stories)' : '*'}
                </label>
                <input
                  type="url"
                  required={quickPublishItem.tipo_conteudo !== 'stories'}
                  placeholder={
                    quickPublishItem.tipo_conteudo === 'stories'
                      ? 'Opcional (stories não possuem link permanente fixo)'
                      : 'https://www.instagram.com/p/... ou https://tiktok.com/@...'
                  }
                  value={quickPublishUrl}
                  onChange={(e) => setQuickPublishUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 font-medium"
                  autoFocus
                />
                <p className="text-[11px] text-[var(--text-muted)]">
                  {quickPublishItem.tipo_conteudo === 'stories'
                    ? 'Como stories são conteúdos de 24 horas, você pode confirmar a publicação sem inserir link.'
                    : 'Cole o link oficial do post para comprovar a publicação.'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-default)]">
                <Button variant="secondary" size="sm" onClick={() => setQuickPublishItem(null)}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  disabled={quickPublishing}
                >
                  {quickPublishing ? 'Salvando...' : 'Confirmar Publicação'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 8. MODAL: EXPORTAR CALENDÁRIO EDITORIAL EM PAPEL TIMBRADO (PDF) ── */}
      {showPdfModal && (
        <PapelTimbradoModal
          isOpen={showPdfModal}
          onClose={() => setShowPdfModal(false)}
          tituloDocumento="Calendário Editorial de Comunicação"
          subtituloDocumento={`Cronograma de Publicações & Ações | Instituto Ádapo`}
        >
          <div className="space-y-6 text-slate-800 text-xs leading-relaxed">
            {/* Cabeçalho Executivo */}
            <div className="border-b-2 border-[#F2632D] pb-3 space-y-1">
              <div className="flex items-center justify-between">
                <h1 className="text-base font-bold uppercase tracking-wide text-[#F2632D]">
                  Relatório do Calendário Editorial
                </h1>
                <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 border text-slate-700">
                  Total de Peças: {filteredConteudos.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                <strong>Data de Emissão:</strong> {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')} | <strong>Instituto Ádapo</strong>
              </p>
            </div>

            {/* Micro-Resumo de Status */}
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <p className="text-[10px] uppercase font-bold text-slate-500">Total Programado</p>
                <p className="text-base font-bold text-slate-800">{filteredConteudos.length}</p>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded border border-emerald-200">
                <p className="text-[10px] uppercase font-bold text-emerald-700">Publicados</p>
                <p className="text-base font-bold text-emerald-700">
                  {filteredConteudos.filter((c) => c.status === 'publicado').length}
                </p>
              </div>
              <div className="p-2.5 bg-amber-50 rounded border border-amber-200">
                <p className="text-[10px] uppercase font-bold text-amber-700">Em Produção</p>
                <p className="text-base font-bold text-amber-700">
                  {filteredConteudos.filter((c) => c.status === 'producao' || c.status === 'analise').length}
                </p>
              </div>
              <div className="p-2.5 bg-rose-50 rounded border border-rose-200">
                <p className="text-[10px] uppercase font-bold text-rose-700">Em Atraso</p>
                <p className="text-base font-bold text-rose-700">
                  {filteredConteudos.filter((c) => c.status === 'em_atraso').length}
                </p>
              </div>
            </div>

            {/* Tabela de Publicações */}
            <div className="space-y-2">
              <h3 className="font-bold text-[11px] uppercase tracking-wider text-[#F2632D]">
                Cronograma Detalhado de Postagens
              </h3>

              <table className="w-full border-collapse border border-slate-300 text-[10px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="border border-slate-300 p-2 text-left w-24">Data / Hora</th>
                    <th className="border border-slate-300 p-2 text-left w-20">Formato</th>
                    <th className="border border-slate-300 p-2 text-left">Título &amp; Legenda</th>
                    <th className="border border-slate-300 p-2 text-left w-28">Projeto</th>
                    <th className="border border-slate-300 p-2 text-left w-24">Responsável</th>
                    <th className="border border-slate-300 p-2 text-center w-20">Status</th>
                    <th className="border border-slate-300 p-2 text-left w-32">Link do Post</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredConteudos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="border border-slate-300 p-4 text-center text-slate-500">
                        Nenhum conteúdo listado para este relatório.
                      </td>
                    </tr>
                  ) : (
                    filteredConteudos.map((c) => {
                      const d = new Date(c.data_publicacao);
                      const dataFormatada = `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h`;

                      return (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="border border-slate-300 p-1.5 font-bold font-mono">
                            {dataFormatada}
                          </td>
                          <td className="border border-slate-300 p-1.5 uppercase font-semibold">
                            {c.tipo_conteudo}
                          </td>
                          <td className="border border-slate-300 p-1.5">
                            <p className="font-bold text-slate-900">{c.titulo}</p>
                            {(() => {
                              const obs = (c.observacoes || '').trim();
                              const desc = (c.descricao || '').trim();
                              const leg = (c.roteiro_legenda || '').trim();
                              const textoPdf = obs || (desc !== leg ? desc : '');
                              if (!textoPdf) return null;
                              return (
                                <p className="text-[9px] text-slate-600 line-clamp-2 italic">
                                  &quot;{textoPdf}&quot;
                                </p>
                              );
                            })()}
                          </td>
                          <td className="border border-slate-300 p-1.5">
                            {c.projetos_sociais?.nome || 'Institucional'}
                          </td>
                          <td className="border border-slate-300 p-1.5">
                            {c.voluntarios?.nome_completo || 'Não atribuído'}
                          </td>
                          <td className="border border-slate-300 p-1.5 text-center font-bold">
                            {c.status.toUpperCase()}
                          </td>
                          <td className="border border-slate-300 p-1.5 truncate text-[9px]">
                            {c.link_publicacao ? (
                              <a
                                href={c.link_publicacao}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 underline truncate block"
                              >
                                {c.link_publicacao}
                              </a>
                            ) : (
                              <span className="text-slate-400">Pendente</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Assinaturas */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-[10px]">
              <div>
                <div className="border-t border-slate-400 w-48 mx-auto mb-1" />
                <p className="font-bold">Equipe de Comunicação</p>
                <p className="text-slate-500">Instituto Ádapo</p>
              </div>
              <div>
                <div className="border-t border-slate-400 w-48 mx-auto mb-1" />
                <p className="font-bold">Diretoria Executiva</p>
                <p className="text-slate-500">Instituto Ádapo</p>
              </div>
            </div>
          </div>
        </PapelTimbradoModal>
      )}
    </div>
  );
}
