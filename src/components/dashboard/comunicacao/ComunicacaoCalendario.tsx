'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { DataTable, Column } from '@/components/ui/DataTable';
import {
  Calendar as CalendarIcon,
  Table as TableIcon,
  Plus,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
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
} from 'lucide-react';
import { Voluntario } from '@/components/dashboard/voluntarios/VoluntariosEquipe';

export interface ConteudoItem {
  id: string;
  titulo: string;
  data_publicacao: string;
  tipo_conteudo: 'reels' | 'carrossel' | 'stories' | 'estatico' | 'video_longo' | 'artigo';
  descricao?: string | null;
  campanha_id?: string | null;
  projeto_id?: string | null;
  status: 'nao_iniciado' | 'producao' | 'analise' | 'em_atraso' | 'publicado' | 'cancelado';
  responsavel_id?: string | null;
  categoria: 'engajamento' | 'informacao' | 'cta' | 'institucional' | 'avulso' | 'depoimento';
  link_producao?: string | null;
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
  const [projetoFilter, setProjetoFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [categoriaFilter, setCategoriaFilter] = useState('todos');

  // Navegação de Mês para o modo Calendário
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Modal de Criar / Editar Conteúdo
  const [showModal, setShowModal] = useState(false);
  const [editingConteudo, setEditingConteudo] = useState<ConteudoItem | null>(null);
  const [formTitulo, setFormTitulo] = useState('');
  const [formDataPub, setFormDataPub] = useState('');
  const [formTipo, setFormTipo] = useState<ConteudoItem['tipo_conteudo']>('reels');
  const [formDescricao, setFormDescricao] = useState('');
  const [formProjetoId, setFormProjetoId] = useState('');
  const [formCampanhaId, setFormCampanhaId] = useState('');
  const [formStatus, setFormStatus] = useState<ConteudoItem['status']>('nao_iniciado');
  const [formResponsavelId, setFormResponsavelId] = useState('');
  const [formCategoria, setFormCategoria] = useState<ConteudoItem['categoria']>('engajamento');
  const [formLinkProducao, setFormLinkProducao] = useState('');
  const [saving, setSaving] = useState(false);

  const handlePrevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));

  // Abrir Modal para Novo Conteúdo
  const handleOpenNewModal = (datePrefill?: string) => {
    setEditingConteudo(null);
    setFormTitulo('');
    setFormDataPub(datePrefill || new Date().toISOString().slice(0, 16));
    setFormTipo('reels');
    setFormDescricao('');
    setFormProjetoId('');
    setFormCampanhaId('');
    setFormStatus('nao_iniciado');
    setFormResponsavelId('');
    setFormCategoria('engajamento');
    setFormLinkProducao('');
    setShowModal(true);
  };

  // Abrir Modal para Edição
  const handleOpenEditModal = (item: ConteudoItem) => {
    setEditingConteudo(item);
    setFormTitulo(item.titulo);
    setFormDataPub(item.data_publicacao ? item.data_publicacao.slice(0, 16) : '');
    setFormTipo(item.tipo_conteudo);
    setFormDescricao(item.descricao || '');
    setFormProjetoId(item.projeto_id || '');
    setFormCampanhaId(item.campanha_id || '');
    setFormStatus(item.status);
    setFormResponsavelId(item.responsavel_id || '');
    setFormCategoria(item.categoria);
    setFormLinkProducao(item.link_producao || '');
    setShowModal(true);
  };

  // Salvar Formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitulo.trim() || !formDataPub) {
      alert('Informe o título e a data de publicação.');
      return;
    }

    setSaving(true);
    try {
      await onSaveConteudo({
        id: editingConteudo?.id,
        titulo: formTitulo.trim(),
        data_publicacao: formDataPub,
        tipo_conteudo: formTipo,
        descricao: formDescricao.trim() || null,
        projeto_id: formProjetoId || null,
        campanha_id: formCampanhaId || null,
        status: formStatus,
        responsavel_id: formResponsavelId || null,
        categoria: formCategoria,
        link_producao: formLinkProducao.trim() || null,
      });

      setShowModal(false);
    } catch (err: any) {
      alert('Erro ao salvar conteúdo: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Filtragem
  const filteredConteudos = useMemo(() => {
    return conteudos.filter((c) => {
      const matchSearch =
        c.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.descricao && c.descricao.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.projetos_sociais?.nome && c.projetos_sociais.nome.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchProj = projetoFilter === 'todos' || c.projeto_id === projetoFilter;
      const matchStat = statusFilter === 'todos' || c.status === statusFilter;
      const matchTipo = tipoFilter === 'todos' || c.tipo_conteudo === tipoFilter;
      const matchCat = categoriaFilter === 'todos' || c.categoria === categoriaFilter;

      return matchSearch && matchProj && matchStat && matchTipo && matchCat;
    });
  }, [conteudos, searchTerm, projetoFilter, statusFilter, tipoFilter, categoriaFilter]);

  // Estatísticas de Produção
  const stats = useMemo(() => {
    const total = conteudos.length;
    const publicados = conteudos.filter((c) => c.status === 'publicado').length;
    const emProducao = conteudos.filter((c) => c.status === 'producao' || c.status === 'analise').length;
    const atrasados = conteudos.filter((c) => c.status === 'em_atraso').length;
    return { total, publicados, emProducao, atrasados };
  }, [conteudos]);

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

  // Helper de badges de status
  const renderStatusBadge = (status: ConteudoItem['status']) => {
    switch (status) {
      case 'publicado':
        return <Badge variant="success">PUBLICADO</Badge>;
      case 'producao':
        return <Badge variant="warning">EM PRODUÇÃO</Badge>;
      case 'analise':
        return <Badge variant="purple">EM ANÁLISE</Badge>;
      case 'em_atraso':
        return <Badge variant="danger">EM ATRASO</Badge>;
      case 'cancelado':
        return <Badge variant="neutral">CANCELADO</Badge>;
      default:
        return <Badge variant="neutral">NÃO INICIADO</Badge>;
    }
  };

  // Helper de badges de formato
  const renderTipoBadge = (tipo: ConteudoItem['tipo_conteudo']) => {
    switch (tipo) {
      case 'reels':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">Reels</span>;
      case 'carrossel':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">Carrossel</span>;
      case 'stories':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">Stories</span>;
      case 'video_longo':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">Vídeo</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-500/10 text-[var(--text-secondary)] border border-[var(--border-default)]">Estático</span>;
    }
  };

  const columns: Column<ConteudoItem>[] = [
    {
      key: 'data_publicacao',
      header: 'Data & Horário',
      width: '150px',
      render: (item) => {
        const d = new Date(item.data_publicacao);
        return (
          <div className="text-xs font-mono-data">
            <p className="font-bold text-[var(--text-primary)]">
              {d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h
            </p>
          </div>
        );
      },
    },
    {
      key: 'titulo',
      header: 'Título & Formato',
      width: '280px',
      render: (item) => (
        <div className="space-y-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {renderTipoBadge(item.tipo_conteudo)}
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
              {item.categoria}
            </span>
          </div>
          <p className="font-bold text-xs sm:text-sm text-[var(--text-primary)] truncate">
            {item.titulo}
          </p>
          {item.descricao && (
            <p className="text-[11px] text-[var(--text-muted)] line-clamp-1 italic">
              &quot;{item.descricao}&quot;
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'projeto_id',
      header: 'Projeto & Campanha',
      width: '200px',
      render: (item) => (
        <div className="space-y-0.5 text-xs">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: item.projetos_sociais?.cor_identificacao || '#F2632D' }}
            />
            <span className="font-bold text-[var(--text-primary)] truncate">
              {item.projetos_sociais?.nome || 'Institucional Ádapo'}
            </span>
          </div>
          {item.campanhas_comunicacao && (
            <p className="text-[11px] text-[#93368F] font-semibold truncate flex items-center gap-1">
              <Megaphone className="w-3 h-3" />
              {item.campanhas_comunicacao.titulo}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'responsavel_id',
      header: 'Responsável',
      width: '160px',
      render: (item) => (
        <div className="flex items-center gap-2 text-xs">
          <div className="w-6 h-6 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold text-[10px] flex items-center justify-center shrink-0">
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
      render: (item) => renderStatusBadge(item.status),
    },
    {
      key: 'link_producao',
      header: 'Ações & Produção',
      width: '160px',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          {item.link_producao && (
            <a
              href={item.link_producao}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors"
              title="Abrir no Canva / Drive"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenEditModal(item)}
            className="p-1.5 h-auto text-[var(--text-secondary)]"
            title="Editar peça"
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteConteudo(item.id)}
            className="p-1.5 h-auto text-rose-600 hover:bg-rose-500/10"
            title="Excluir"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* ── 1. MICRO-KPIS DE PRODUÇÃO EDITORIAL ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
              Total de Peças
            </p>
            <p className="text-lg sm:text-xl font-display font-extrabold text-[var(--text-primary)]">
              {stats.total}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
              Publicados
            </p>
            <p className="text-lg sm:text-xl font-display font-extrabold text-emerald-600">
              {stats.publicados}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
              Em Produção
            </p>
            <p className="text-lg sm:text-xl font-display font-extrabold text-amber-600">
              {stats.emProducao}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
              Em Atraso
            </p>
            <p className="text-lg sm:text-xl font-display font-extrabold text-rose-600">
              {stats.atrasados}
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. BARRA DE CONTROLE: ALTERNADOR TABELA/CALENDÁRIO, BUSCA E NOVO CONTEÚDO ── */}
      <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Alternador de Modo de Visualização */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setViewMode('tabela')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'tabela'
                  ? 'bg-[var(--bg-elevated)] text-[var(--color-primary)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span>Tabela Geral</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendario')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'calendario'
                  ? 'bg-[var(--bg-elevated)] text-[var(--color-primary)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Calendário Mensal</span>
            </button>
          </div>

          {/* Botão Novo Conteúdo */}
          <Button
            onClick={() => handleOpenNewModal()}
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            className="w-full sm:w-auto justify-center"
          >
            Novo Conteúdo
          </Button>
        </div>

        {/* Filtros em Linha */}
        <div className="flex flex-col md:flex-row items-center gap-2.5 pt-1">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Buscar conteúdo por título, legenda ou projeto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
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
            </select>
          </div>
        </div>
      </div>

      {/* ── 3. VISUALIZAÇÃO: MODO TABELA ── */}
      {viewMode === 'tabela' && (
        <DataTable
          columns={columns}
          data={filteredConteudos}
          keyExtractor={(c) => c.id}
          emptyMessage="Nenhum conteúdo encontrado para os filtros selecionados."
        />
      )}

      {/* ── 4. VISUALIZAÇÃO: MODO CALENDÁRIO MENSAL ── */}
      {viewMode === 'calendario' && (
        <Card className="p-4 sm:p-5 overflow-x-auto space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="font-display font-bold text-base text-[var(--text-primary)] min-w-[170px] text-center">
                {MESES_NOMES[currentMonth]} {currentYear}
              </h3>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <span className="text-xs text-[var(--text-muted)] italic">
              Clique em qualquer dia para agendar nova peça
            </span>
          </div>

          <div className="min-w-[700px]">
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[11px] font-bold text-[var(--text-muted)] uppercase">
              {DIAS_SEMANA.map((d, i) => (
                <div key={d} className={i === 0 ? 'text-rose-500' : ''}>
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="h-32 rounded-xl bg-[var(--bg-secondary)]/20" />;
                }

                const postsDoDia = conteudosByDay[day] || [];
                const mm = String(currentMonth + 1).padStart(2, '0');
                const dd = String(day).padStart(2, '0');
                const datePrefill = `${currentYear}-${mm}-${dd}T10:00`;

                return (
                  <div
                    key={`cal-day-${day}`}
                    onClick={() => handleOpenNewModal(datePrefill)}
                    className="h-32 p-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--color-primary)]/50 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-primary)]">{day}</span>
                      {postsDoDia.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                          {postsDoDia.length} post{postsDoDia.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 overflow-hidden my-1">
                      {postsDoDia.slice(0, 2).map((post) => (
                        <div
                          key={post.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(post);
                          }}
                          className="text-[9px] truncate px-1.5 py-0.5 rounded font-bold border flex items-center justify-between gap-1 shadow-2xs hover:opacity-80"
                          style={{
                            backgroundColor: `${post.projetos_sociais?.cor_identificacao || '#F2632D'}15`,
                            borderColor: `${post.projetos_sociais?.cor_identificacao || '#F2632D'}30`,
                            color: post.projetos_sociais?.cor_identificacao || '#F2632D',
                          }}
                          title={`${post.titulo} (${post.tipo_conteudo})`}
                        >
                          <span className="truncate">{post.titulo}</span>
                          <span className="text-[8px] uppercase">{post.tipo_conteudo.slice(0, 4)}</span>
                        </div>
                      ))}
                      {postsDoDia.length > 2 && (
                        <span className="text-[8px] font-bold text-[var(--text-muted)] pl-1 block">
                          +{postsDoDia.length - 2} peças
                        </span>
                      )}
                    </div>

                    <div className="text-[9px] text-[var(--text-muted)] text-right">
                      + Agendar
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* ── 5. MODAL: CRIAR / EDITAR CONTEÚDO EDITORIAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-[var(--color-primary)]" />
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                  {editingConteudo ? 'Editar Conteúdo Editorial' : 'Agendar Novo Conteúdo'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                  Título da Peça / Ideia do Conteúdo *
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

              <div>
                <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                  Roteiro / Legenda / Observações
                </label>
                <textarea
                  rows={3}
                  placeholder="Insira o texto da legenda, hashtags, orientações para o designer ou roteiro de gravação do vídeo..."
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
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
    </div>
  );
}
