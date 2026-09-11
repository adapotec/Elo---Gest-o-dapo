'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { parseReuniaoFromDB } from '@/lib/services/reuniaoMetadata';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  FolderKanban,
  FileText,
  MapPin,
  Users,
  Search,
  Sparkles,
  Share2,
  ExternalLink,
  X,
  ArrowUpRight,
  LayoutGrid,
  List,
  CalendarDays,
} from 'lucide-react';

export type OrigemEvento = 'acao' | 'reuniao' | 'comunicacao';

export interface EventoCalendario {
  id: string;
  origem: OrigemEvento;
  titulo: string;
  data_hora: string;
  horario_fim?: string | null;
  descricao?: string | null;
  status?: string;
  subtipo?: string;
  local_ou_link?: string | null;
  link_externo?: string | null;
  projeto_id?: string | null;
  projeto_nome?: string;
  projeto_cor?: string;
  projeto_icone?: string;
  link_modulo?: string;
}

interface DiaAgendaState {
  dia: number;
  dataFormatada: string;
  events: EventoCalendario[];
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/**
 * Converte data ISO ou string para a chave de data local 'YYYY-MM-DD',
 * evitando o skew de fuso horário gerado por split('T')[0] em UTC
 */
function getLocalDateKey(dateInput: string | Date): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function CalendarioPage() {
  const [loading, setLoading] = useState(true);
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [projetos, setProjetos] = useState<any[]>([]);

  // Modo de visualização: Grade Mensal ou Lista / Agenda
  const [viewMode, setViewMode] = useState<'grade' | 'lista'>('grade');

  // Navegação de mês
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Filtros
  const [search, setSearch] = useState('');
  const [filterOrigem, setFilterOrigem] = useState<string>('todas');
  const [filterProjetoId, setFilterProjetoId] = useState<string>('todos');

  // Modais Flutuantes (Popups centrais)
  const [selectedEvento, setSelectedEvento] = useState<EventoCalendario | null>(null);
  const [selectedDiaAgenda, setSelectedDiaAgenda] = useState<DiaAgendaState | null>(null);

  // Escutar tecla Escape para fechar qualquer modal ativo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedEvento(null);
        setSelectedDiaAgenda(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const supabase = createClient();

      // Consultas paralelas em Ações de Projetos, Reuniões Institucionais, Posts de Comunicação e Projetos Sociais
      const [respProjetos, respAcoes, respReunioes, respComunicacao] = await Promise.all([
        supabase
          .from('projetos_sociais')
          .select('id, nome, cor_identificacao, icone, status')
          .order('nome', { ascending: true }),
        supabase
          .from('acoes_projeto')
          .select('id, projeto_id, data_hora, nome_acao, descricao, documento_estruturador')
          .order('data_hora', { ascending: true }),
        supabase
          .from('reunioes_institucional')
          .select('*')
          .order('data_hora', { ascending: true }),
        supabase
          .from('conteudos_comunicacao')
          .select('id, titulo, data_publicacao, tipo_conteudo, status, categoria, projeto_id, descricao, link_producao, link_publicacao')
          .order('data_publicacao', { ascending: true }),
      ]);

      const projetosMap = new Map<string, any>();
      (respProjetos.data || []).forEach((p: any) => {
        projetosMap.set(p.id, p);
      });
      setProjetos(respProjetos.data || []);

      const listaUnificada: EventoCalendario[] = [];

      // 1. Mapear Ações de Projetos
      (respAcoes.data || []).forEach((a: any) => {
        if (!a.data_hora) return;
        const proj = a.projeto_id ? projetosMap.get(a.projeto_id) : null;
        listaUnificada.push({
          id: `acao-${a.id}`,
          origem: 'acao',
          titulo: a.nome_acao || 'Ação de Projeto',
          data_hora: a.data_hora,
          descricao: a.descricao,
          subtipo: a.documento_estruturador || 'Ação de Projeto',
          status: 'ativo',
          projeto_id: a.projeto_id,
          projeto_nome: proj ? proj.nome : 'Projeto Social',
          projeto_cor: '#EC4899',
          projeto_icone: proj?.icone || 'FolderKanban',
          link_modulo: a.projeto_id ? `/dashboard/projetos/${a.projeto_id}` : '/dashboard/projetos',
        });
      });

      // 2. Mapear Reuniões Institucionais
      (respReunioes.data || []).forEach((r: any) => {
        if (!r.data_hora) return;
        const parsed = parseReuniaoFromDB(r, projetosMap);
        const tipoFormatado = parsed.tipo ? parsed.tipo.replace('_', ' ') : 'ordinária';
        const linkFinal = parsed.link_virtual || (parsed.local_reuniao && (parsed.local_reuniao.startsWith('http://') || parsed.local_reuniao.startsWith('https://')) ? parsed.local_reuniao : null);

        listaUnificada.push({
          id: `reuniao-${parsed.id}`,
          origem: 'reuniao',
          titulo: parsed.titulo || 'Reunião Institucional',
          data_hora: parsed.data_hora,
          horario_fim: parsed.horario_fim || null,
          descricao: parsed.pauta || parsed.ata || null,
          subtipo: `Reunião ${tipoFormatado}`,
          status: parsed.status || 'agendada',
          local_ou_link: parsed.local_reuniao || 'Sede do Instituto Ádapo',
          link_externo: linkFinal,
          projeto_id: parsed.projeto_id || null,
          projeto_nome: parsed.projeto?.nome || 'Institucional Geral',
          projeto_cor: '#2563EB',
          projeto_icone: 'Calendar',
          link_modulo: '/dashboard/institucional',
        });
      });

      // 3. Mapear Posts e Conteúdos da Comunicação
      (respComunicacao.data || []).forEach((c: any) => {
        if (!c.data_publicacao) return;
        const proj = c.projeto_id ? projetosMap.get(c.projeto_id) : null;
        const tipoConteudo = (c.tipo_conteudo || 'post').toUpperCase();
        listaUnificada.push({
          id: `comunicacao-${c.id}`,
          origem: 'comunicacao',
          titulo: c.titulo || 'Publicação de Comunicação',
          data_hora: c.data_publicacao,
          descricao: c.descricao,
          subtipo: `Post • ${tipoConteudo}`,
          status: c.status || 'planejado',
          local_ou_link: c.link_publicacao || c.link_producao || 'Redes Sociais',
          link_externo: c.link_publicacao || c.link_producao || null,
          projeto_id: c.projeto_id,
          projeto_nome: proj ? proj.nome : 'Comunicação Geral',
          projeto_cor: '#8B5CF6',
          projeto_icone: 'Share2',
          link_modulo: '/dashboard/comunicacao',
        });
      });

      // Ordenar cronologicamente
      listaUnificada.sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());

      setEventos(listaUnificada);
    } catch (err) {
      console.error('Erro ao carregar dados do calendário geral:', err);
    } finally {
      setLoading(false);
    }
  }

  // Navegação do Mês
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filtragem dos eventos
  const filteredEventos = useMemo(() => {
    return eventos.filter((e) => {
      // Filtro de Busca
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchTitulo = e.titulo.toLowerCase().includes(query);
        const matchDesc = e.descricao?.toLowerCase().includes(query);
        const matchProj = e.projeto_nome?.toLowerCase().includes(query);
        const matchSub = e.subtipo?.toLowerCase().includes(query);
        if (!matchTitulo && !matchDesc && !matchProj && !matchSub) return false;
      }

      // Filtro por Origem
      if (filterOrigem !== 'todas' && e.origem !== filterOrigem) return false;

      // Filtro por Projeto
      if (filterProjetoId !== 'todos') {
        if (filterProjetoId === 'geral') {
          if (e.projeto_id) return false;
        } else {
          if (e.projeto_id !== filterProjetoId) return false;
        }
      }

      return true;
    });
  }, [eventos, search, filterOrigem, filterProjetoId]);

  // Montar grade do calendário do mês atual
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: { date: number | null; events: EventoCalendario[] }[] = [];

    // Dias em branco antes do 1º dia
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ date: null, events: [] });
    }

    // Dias do mês
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      const dayEvents = filteredEventos.filter((e) => {
        return getLocalDateKey(e.data_hora) === dayStr;
      });

      days.push({ date: d, events: dayEvents });
    }

    return days;
  }, [currentYear, currentMonth, filteredEventos]);

  // Eventos do mês corrente
  const eventosNoMes = useMemo(() => {
    return filteredEventos.filter((e) => {
      const d = new Date(e.data_hora);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [filteredEventos, currentMonth, currentYear]);

  // Contadores de KPIs do Mês
  const kpiTotalMes = eventosNoMes.length;
  const kpiAcoesMes = eventosNoMes.filter((e) => e.origem === 'acao').length;
  const kpiReunioesMes = eventosNoMes.filter((e) => e.origem === 'reuniao').length;
  const kpiComunicacaoMes = eventosNoMes.filter((e) => e.origem === 'comunicacao').length;

  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;

  const getOrigemBadge = (origem: OrigemEvento) => {
    switch (origem) {
      case 'acao':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20">
            <Sparkles className="w-3 h-3 text-pink-500" />
            AÇÃO DE PROJETO
          </span>
        );
      case 'reuniao':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <CalendarIcon className="w-3 h-3 text-blue-500" />
            REUNIÃO & GOVERNANÇA
          </span>
        );
      case 'comunicacao':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Share2 className="w-3 h-3 text-purple-500" />
            COMUNICAÇÃO & POSTS
          </span>
        );
    }
  };

  const handleOpenDayAgenda = (dayNumber: number | null, dayEvents: EventoCalendario[]) => {
    if (!dayNumber || dayEvents.length === 0) return;
    const dateObj = new Date(currentYear, currentMonth, dayNumber);
    const dataFormatada = dateObj.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    setSelectedDiaAgenda({
      dia: dayNumber,
      dataFormatada,
      events: dayEvents,
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Calendário Geral" subtitle="Carregando eventos institucionais..." />
        <div className="p-12 text-center text-sm text-[var(--text-muted)] animate-pulse">
          Carregando ações, reuniões e publicações da comunicação...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Calendário Geral Institucional"
        subtitle="Visão integrada de ações pedagógicas, reuniões de governança e publicações da comunicação"
      />

      <div className="p-3.5 sm:p-5 lg:p-6 w-full max-w-7xl mx-auto space-y-4 flex-1 overflow-y-auto">
        {/* ── 1. BARRA DE ESTATÍSTICAS HORIZONTAL COMPACTA (ECONOMIZA > 80PX VERTICAIS) ── */}
        <div className="py-2 px-3 sm:px-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-xs flex items-center justify-between gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Resumo do Mês:
            </span>
            <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">
              {kpiTotalMes} eventos totais
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-wrap text-xs">
            <button
              type="button"
              onClick={() => setFilterOrigem(filterOrigem === 'acao' ? 'todas' : 'acao')}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                filterOrigem === 'acao'
                  ? 'bg-pink-500/15 font-bold text-pink-700 dark:text-pink-300 ring-1 ring-pink-500'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title="Filtrar ações de projetos"
            >
              <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0" />
              <span>Ações: <strong>{kpiAcoesMes}</strong></span>
            </button>

            <button
              type="button"
              onClick={() => setFilterOrigem(filterOrigem === 'reuniao' ? 'todas' : 'reuniao')}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                filterOrigem === 'reuniao'
                  ? 'bg-blue-500/15 font-bold text-blue-700 dark:text-blue-300 ring-1 ring-blue-500'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title="Filtrar reuniões e atas"
            >
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <span>Reuniões: <strong>{kpiReunioesMes}</strong></span>
            </button>

            <button
              type="button"
              onClick={() => setFilterOrigem(filterOrigem === 'comunicacao' ? 'todas' : 'comunicacao')}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                filterOrigem === 'comunicacao'
                  ? 'bg-purple-500/15 font-bold text-purple-700 dark:text-purple-300 ring-1 ring-purple-500'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title="Filtrar posts da comunicação"
            >
              <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
              <span>Comunicação: <strong>{kpiComunicacaoMes}</strong></span>
            </button>

            {filterOrigem !== 'todas' && (
              <button
                type="button"
                onClick={() => setFilterOrigem('todas')}
                className="text-[10px] text-[var(--color-primary)] font-semibold hover:underline"
              >
                Limpar filtro
              </button>
            )}
          </div>
        </div>

        {/* ── 2. HEADER DE CONTROLE: NAVEGAÇÃO, MODOS E FILTROS COMPACTOS ── */}
        <Card className="p-3.5 sm:p-4 space-y-3 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Lado Esquerdo: Navegação de Mês */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button size="sm" variant="secondary" onClick={handlePrevMonth} icon={<ChevronLeft className="w-4 h-4" />}>
                <span className="hidden sm:inline">Anterior</span>
              </Button>

              <div className="text-center min-w-[150px] sm:min-w-[190px]">
                <h2 className="font-bold text-base sm:text-lg text-[var(--text-primary)] leading-tight">
                  {MESES_NOMES[currentMonth]} {currentYear}
                </h2>
                <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                  {eventosNoMes.length} programado{eventosNoMes.length !== 1 ? 's' : ''}
                </p>
              </div>

              <Button size="sm" variant="secondary" onClick={handleNextMonth} icon={<ChevronRight className="w-4 h-4" />}>
                <span className="hidden sm:inline">Próximo</span>
              </Button>

              <Button size="sm" variant="ghost" onClick={handleToday} className="text-xs">
                Hoje
              </Button>
            </div>

            {/* Centro: Alternador de Visualização (Grade vs Lista) */}
            <div className="flex items-center self-start sm:self-auto bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-default)] shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grade')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grade'
                    ? 'bg-[var(--bg-elevated)] text-[var(--color-primary)] shadow-2xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                title="Visualização em Grade Mensal"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grade</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('lista')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'lista'
                    ? 'bg-[var(--bg-elevated)] text-[var(--color-primary)] shadow-2xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                title="Visualização em Lista / Agenda Cronológica"
              >
                <List className="w-3.5 h-3.5" />
                <span>Lista ({eventosNoMes.length})</span>
              </button>
            </div>

            {/* Lado Direito: Busca e Filtro por Projeto */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Busca rápida */}
              <div className="relative min-w-[160px] sm:min-w-[200px] flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Buscar ação, reunião, post..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Filtro Projeto */}
              <select
                value={filterProjetoId}
                onChange={(e) => setFilterProjetoId(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] shrink-0 focus:outline-none focus:border-[var(--color-primary)] cursor-pointer max-w-[160px] truncate"
              >
                <option value="todos">Todos os Projetos</option>
                <option value="geral">Institucional Geral</option>
                {projetos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* ── 3. CORPO PRINCIPAL: VISUALIZAÇÃO SELECIONADA (GRADE OU LISTA) ── */}

        {/* MODO A: GRADE MENSAL OTIMIZADA E COMPACTA */}
        {viewMode === 'grade' && (
          <Card className="p-2.5 sm:p-3.5 shadow-xs">
            {/* Dica para dispositivos móveis */}
            <div className="md:hidden flex items-center justify-between pb-1.5 text-[10px] text-[var(--text-muted)] font-medium">
              <span>Arraste lateralmente para navegar nos dias</span>
              <span className="text-xs">👉</span>
            </div>

            <div className="overflow-x-auto custom-scrollbar -mx-1 sm:mx-0 pb-1">
              <div className="min-w-[620px] sm:min-w-0">
                {/* Cabeçalho dos Dias da Semana */}
                <div className="grid grid-cols-7 gap-px bg-[var(--border-default)] border border-[var(--border-default)] rounded-t-xl overflow-hidden">
                  {DIAS_SEMANA.map((dia) => (
                    <div
                      key={dia}
                      className="py-1.5 text-center text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-secondary)]"
                    >
                      {dia}
                    </div>
                  ))}
                </div>

                {/* Células Compactas do Calendário (min-h reduzida para visualização completa) */}
                <div className="grid grid-cols-7 gap-px bg-[var(--border-default)] border-x border-b border-[var(--border-default)] rounded-b-xl overflow-hidden">
                  {calendarDays.map((day, idx) => {
                    const isToday = isCurrentMonth && day.date === today.getDate();
                    const hasEvents = day.events.length > 0;

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (!day.date || !hasEvents) return;
                          if (day.events.length === 1) {
                            setSelectedEvento(day.events[0]);
                          } else {
                            handleOpenDayAgenda(day.date, day.events);
                          }
                        }}
                        className={`min-h-[72px] sm:min-h-[80px] p-1 sm:p-1.5 bg-[var(--bg-elevated)] transition-all flex flex-col justify-between ${
                          day.date
                            ? hasEvents
                              ? 'cursor-pointer hover:bg-[var(--bg-secondary)]/70'
                              : 'hover:bg-[var(--bg-secondary)]/30'
                            : 'bg-[var(--bg-secondary)]/20'
                        } ${isToday ? 'ring-2 ring-inset ring-[#F2632D]' : ''}`}
                      >
                        {day.date && (
                          <>
                            {/* Topo da Célula (Número do Dia e Pontos Indicadores de Categoria) */}
                            <div className="flex items-center justify-between mb-0.5">
                              <span
                                className={`text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                                  isToday
                                    ? 'bg-[#F2632D] text-white shadow-2xs'
                                    : 'text-[var(--text-primary)]'
                                }`}
                              >
                                {day.date}
                              </span>

                              {/* Pontos Coloridos indicando tipos de atividades no dia */}
                              {hasEvents && (
                                <div className="flex items-center gap-1">
                                  {day.events.some((e) => e.origem === 'acao') && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500" title="Ação de Projeto" />
                                  )}
                                  {day.events.some((e) => e.origem === 'reuniao') && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Reunião" />
                                  )}
                                  {day.events.some((e) => e.origem === 'comunicacao') && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" title="Comunicação" />
                                  )}
                                  <span className="text-[9px] font-bold text-[var(--text-muted)] ml-0.5">
                                    {day.events.length}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Pílulas de Eventos (Máximo 2 visíveis diretamente para não inflar a altura) */}
                            <div className="space-y-1 flex-1">
                              {day.events.slice(0, 2).map((evt) => {
                                const isAcao = evt.origem === 'acao';
                                const isReuniao = evt.origem === 'reuniao';

                                const borderStyle = isReuniao
                                  ? 'border-l-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300'
                                  : isAcao
                                  ? 'border-l-pink-500 bg-pink-500/10 text-pink-700 dark:text-pink-300'
                                  : 'border-l-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-300';

                                return (
                                  <button
                                    key={evt.id}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedEvento(evt);
                                    }}
                                    className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate border-l-2 transition-all hover:scale-[1.01] cursor-pointer flex items-center gap-1 ${borderStyle}`}
                                    title={`${evt.titulo} (${evt.subtipo})`}
                                  >
                                    <span className="font-mono-data text-[9px] opacity-75 shrink-0">
                                      {new Date(evt.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className="truncate">{evt.titulo}</span>
                                  </button>
                                );
                              })}

                              {/* Botão para ver todos os eventos do dia */}
                              {day.events.length > 2 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDayAgenda(day.date, day.events);
                                  }}
                                  className="w-full text-center py-0.5 rounded text-[9px] font-bold text-[var(--color-primary)] bg-[var(--color-primary-soft)] hover:opacity-90 transition-opacity cursor-pointer block leading-tight"
                                  title="Clique para ver todos os eventos deste dia"
                                >
                                  +{day.events.length - 2} mais
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* MODO B: LISTA / AGENDA CRONOLÓGICA (SUBSTITUI A GRADE NO MESMO LUGAR) */}
        {viewMode === 'lista' && (
          <Card className="p-4 sm:p-5 space-y-3.5 shadow-xs animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-default)]">
              <div>
                <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-[var(--color-primary)]" />
                  Agenda Cronológica — {MESES_NOMES[currentMonth]} {currentYear}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {eventosNoMes.length} atividades programadas neste período
                </p>
              </div>
            </div>

            {eventosNoMes.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-default)] rounded-xl">
                Nenhum evento registrado para este mês com os filtros aplicados.
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-default)]">
                {eventosNoMes.map((evt) => {
                  const dateObj = new Date(evt.data_hora);
                  const isReuniao = evt.origem === 'reuniao';
                  const isCom = evt.origem === 'comunicacao';

                  return (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedEvento(evt)}
                      className="py-2.5 px-2 -mx-2 rounded-xl hover:bg-[var(--bg-secondary)]/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Box Compacto com a Data */}
                        <div
                          className="p-1.5 rounded-xl text-white font-bold text-center shrink-0 min-w-[44px] shadow-2xs transition-transform group-hover:scale-105"
                          style={{
                            backgroundColor: isReuniao ? '#2563EB' : isCom ? '#8B5CF6' : '#EC4899',
                          }}
                        >
                          <p className="text-[9px] uppercase leading-none opacity-90">
                            {dateObj.toLocaleDateString('pt-BR', { weekday: 'short' })}
                          </p>
                          <p className="text-base font-bold leading-none mt-1">
                            {dateObj.getDate()}
                          </p>
                        </div>

                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getOrigemBadge(evt.origem)}
                            <span className="font-bold text-xs sm:text-sm text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors truncate">
                              {evt.titulo}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-muted)] truncate flex items-center gap-1.5">
                            <strong className="text-[var(--text-secondary)]">{evt.projeto_nome}</strong>
                            <span>•</span>
                            <Clock className="w-3 h-3 inline text-[var(--text-muted)]" />
                            <span>
                              {dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h
                              {evt.horario_fim ? ` às ${new Date(evt.horario_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h` : ''}
                            </span>
                            {evt.local_ou_link && (
                              <>
                                <span>•</span>
                                <span className="truncate">{evt.local_ou_link}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-secondary)]">
                          {evt.subtipo}
                        </span>
                        <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--color-primary)] transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* ── 4. MODAL FLUTUANTE CENTRAL: DETALHES COMPLETOS DO EVENTO (ZERO ROLAGEM) ── */}
      {selectedEvento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-xl rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Faixa Temática Superior com Cor do Módulo */}
            <div
              className="h-2 w-full shrink-0"
              style={{
                backgroundColor:
                  selectedEvento.origem === 'reuniao'
                    ? '#2563EB'
                    : selectedEvento.origem === 'comunicacao'
                    ? '#8B5CF6'
                    : '#EC4899',
              }}
            />

            {/* Cabeçalho do Modal */}
            <div className="p-4 sm:p-5 border-b border-[var(--border-default)] flex items-start justify-between gap-3 bg-[var(--bg-elevated)]">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs"
                  style={{
                    backgroundColor:
                      selectedEvento.origem === 'reuniao'
                        ? '#2563EB'
                        : selectedEvento.origem === 'comunicacao'
                        ? '#8B5CF6'
                        : '#EC4899',
                  }}
                >
                  {selectedEvento.origem === 'reuniao' ? (
                    <CalendarIcon className="w-5 h-5" />
                  ) : selectedEvento.origem === 'comunicacao' ? (
                    <Share2 className="w-5 h-5" />
                  ) : (
                    <FolderKanban className="w-5 h-5" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getOrigemBadge(selectedEvento.origem)}
                    <span className="text-xs font-semibold text-[var(--text-muted)]">•</span>
                    <span className="text-xs font-semibold text-[var(--text-secondary)] truncate">
                      {selectedEvento.projeto_nome}
                    </span>
                  </div>
                  <h3 className="font-bold text-base sm:text-lg text-[var(--text-primary)] leading-snug mt-0.5">
                    {selectedEvento.titulo}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEvento(null)}
                className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer shrink-0"
                aria-label="Fechar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo dos Detalhes (Rolável se o texto for muito extenso) */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
              {/* Grid de Metadados Principais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[var(--bg-secondary)]/50 p-3.5 rounded-xl border border-[var(--border-default)]">
                <div className="flex items-center gap-2.5">
                  <CalendarIcon className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Data</p>
                    <p className="font-semibold text-[var(--text-primary)] capitalize">
                      {new Date(selectedEvento.data_hora).toLocaleDateString('pt-BR', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Horário</p>
                    <p className="font-semibold text-[var(--text-primary)]">
                      {new Date(selectedEvento.data_hora).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}h
                      {selectedEvento.horario_fim && (
                        <> às {new Date(selectedEvento.horario_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h</>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Classificação</p>
                    <p className="font-semibold text-[var(--text-primary)]">{selectedEvento.subtipo}</p>
                  </div>
                </div>

                {selectedEvento.local_ou_link && (
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Local / Canal</p>
                      <p className="font-semibold text-[var(--text-primary)] truncate">{selectedEvento.local_ou_link}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Descrição ou Pauta Detalhada */}
              {selectedEvento.descricao ? (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Descrição & Observações:
                  </p>
                  <p className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">
                    {selectedEvento.descricao}
                  </p>
                </div>
              ) : (
                <p className="text-center py-2 text-[var(--text-muted)] italic">
                  Nenhuma observação ou pauta detalhada inserida para esta atividade.
                </p>
              )}
            </div>

            {/* Rodapé com Ações Diretas */}
            <div className="p-3.5 sm:p-4 border-t border-[var(--border-default)] bg-[var(--bg-secondary)]/40 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                {selectedEvento.link_modulo && (
                  <Link
                    href={selectedEvento.link_modulo}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-xs"
                  >
                    <span>Abrir no Módulo</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                )}

                {selectedEvento.link_externo && (
                  <a
                    href={selectedEvento.link_externo.startsWith('http') ? selectedEvento.link_externo : `https://${selectedEvento.link_externo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] hover:border-[var(--color-primary)] transition-all shadow-2xs"
                  >
                    <span>Acessar Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => setSelectedEvento(null)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. MODAL FLUTUANTE CENTRAL: AGENDA DO DIA COM MÚLTIPLOS EVENTOS ── */}
      {selectedDiaAgenda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho da Agenda do Dia */}
            <div className="p-4 sm:p-5 border-b border-[var(--border-default)] flex items-center justify-between gap-3 bg-[var(--bg-secondary)]/50">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center font-bold text-sm shrink-0">
                  {selectedDiaAgenda.dia}
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)] capitalize leading-tight">
                    {selectedDiaAgenda.dataFormatada}
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                    {selectedDiaAgenda.events.length} atividades programadas
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDiaAgenda(null)}
                className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                aria-label="Fechar agenda do dia"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de Atividades do Dia */}
            <div className="p-4 space-y-2 overflow-y-auto custom-scrollbar flex-1 text-xs">
              {selectedDiaAgenda.events.map((evt) => {
                const dateObj = new Date(evt.data_hora);
                const isReuniao = evt.origem === 'reuniao';
                const isCom = evt.origem === 'comunicacao';

                return (
                  <button
                    key={evt.id}
                    type="button"
                    onClick={() => {
                      setSelectedDiaAgenda(null);
                      setSelectedEvento(evt);
                    }}
                    className="w-full text-left p-3 rounded-xl bg-[var(--bg-secondary)]/60 hover:bg-[var(--bg-secondary)] border border-[var(--border-default)] transition-all flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getOrigemBadge(evt.origem)}
                        <span className="font-mono-data text-[11px] text-[var(--text-muted)] font-semibold">
                          {dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h
                        </span>
                      </div>
                      <p className="font-bold text-xs text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors truncate">
                        {evt.titulo}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] truncate">
                        {evt.projeto_nome} • {evt.subtipo}
                      </p>
                    </div>

                    <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--color-primary)] shrink-0 transition-colors" />
                  </button>
                );
              })}
            </div>

            {/* Rodapé */}
            <div className="p-3 border-t border-[var(--border-default)] bg-[var(--bg-secondary)]/30 text-right">
              <Button size="sm" variant="secondary" onClick={() => setSelectedDiaAgenda(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
