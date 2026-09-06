'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
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
  Filter,
  Search,
  Sparkles,
  Share2,
  Video,
  ExternalLink,
  CheckCircle2,
  Megaphone,
  Radio,
  X,
  ArrowUpRight,
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

  // Navegação de mês
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Filtros
  const [search, setSearch] = useState('');
  const [filterOrigem, setFilterOrigem] = useState<string>('todas');
  const [filterProjetoId, setFilterProjetoId] = useState<string>('todos');

  // Evento selecionado para o painel de detalhes
  const [selectedEvento, setSelectedEvento] = useState<EventoCalendario | null>(null);

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
          .select('id, titulo, data_hora, horario_fim, tipo, modalidade, local_reuniao, link_virtual, status, projeto_id, pauta')
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
          projeto_cor: proj?.cor_identificacao || '#10B981',
          projeto_icone: proj?.icone || 'FolderKanban',
          link_modulo: a.projeto_id ? `/dashboard/projetos/${a.projeto_id}` : '/dashboard/projetos',
        });
      });

      // 2. Mapear Reuniões Institucionais
      (respReunioes.data || []).forEach((r: any) => {
        if (!r.data_hora) return;
        const proj = r.projeto_id ? projetosMap.get(r.projeto_id) : null;
        const tipoFormatado = r.tipo ? r.tipo.replace('_', ' ') : 'ordinária';
        listaUnificada.push({
          id: `reuniao-${r.id}`,
          origem: 'reuniao',
          titulo: r.titulo || 'Reunião Institucional',
          data_hora: r.data_hora,
          horario_fim: r.horario_fim,
          descricao: r.pauta,
          subtipo: `Reunião ${tipoFormatado}`,
          status: r.status || 'agendada',
          local_ou_link: r.link_virtual || r.local_reuniao || 'Sede do Instituto Ádapo',
          link_externo: r.link_virtual || null,
          projeto_id: r.projeto_id,
          projeto_nome: proj ? proj.nome : 'Institucional Geral',
          projeto_cor: '#F2632D', // Laranja Institucional
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
          projeto_cor: '#0284C7', // Azul Céu / Comunicação
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-3 h-3" />
            AÇÃO DE PROJETO
          </span>
        );
      case 'reuniao':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F2632D]/10 text-[#F2632D] border border-[#F2632D]/20">
            <CalendarIcon className="w-3 h-3" />
            REUNIÃO & GOVERNANÇA
          </span>
        );
      case 'comunicacao':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <Share2 className="w-3 h-3" />
            COMUNICAÇÃO & POSTS
          </span>
        );
    }
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
        subtitle="Visão agregada de ações pedagógicas, reuniões de governança e publicações da comunicação"
      />

      {/* Container Centralizado Arejado (Design System padrão Elo) */}
      <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 flex-1 overflow-y-auto">
        {/* Micro-KPIs do Mês Selecionado */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-3.5 flex items-center gap-3 border-l-4 border-l-purple-500 shadow-xs">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Total no Mês</p>
              <p className="text-xl font-bold text-[var(--text-primary)] leading-tight">{kpiTotalMes}</p>
            </div>
          </Card>

          <Card className="p-3.5 flex items-center gap-3 border-l-4 border-l-emerald-500 shadow-xs">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Ações de Projetos</p>
              <p className="text-xl font-bold text-[var(--text-primary)] leading-tight">{kpiAcoesMes}</p>
            </div>
          </Card>

          <Card className="p-3.5 flex items-center gap-3 border-l-4 border-l-[#F2632D] shadow-xs">
            <div className="p-2.5 rounded-xl bg-[#F2632D]/10 text-[#F2632D] shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Reuniões & Atas</p>
              <p className="text-xl font-bold text-[var(--text-primary)] leading-tight">{kpiReunioesMes}</p>
            </div>
          </Card>

          <Card className="p-3.5 flex items-center gap-3 border-l-4 border-l-sky-500 shadow-xs">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-500 shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Posts de Comunicação</p>
              <p className="text-xl font-bold text-[var(--text-primary)] leading-tight">{kpiComunicacaoMes}</p>
            </div>
          </Card>
        </div>

        {/* HEADER DE CONTROLE DO CALENDÁRIO: NAVEGAÇÃO & FILTROS */}
        <Card className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Navegação de Mês */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Button size="sm" variant="secondary" onClick={handlePrevMonth} icon={<ChevronLeft className="w-4 h-4" />}>
                Anterior
              </Button>

              <div className="text-center min-w-[170px] sm:min-w-[210px]">
                <h2 className="font-bold text-lg sm:text-xl text-[var(--text-primary)]">
                  {MESES_NOMES[currentMonth]} {currentYear}
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {eventosNoMes.length} evento{eventosNoMes.length !== 1 ? 's' : ''} programado{eventosNoMes.length !== 1 ? 's' : ''}
                </p>
              </div>

              <Button size="sm" variant="secondary" onClick={handleNextMonth} icon={<ChevronRight className="w-4 h-4" />}>
                Próximo
              </Button>

              <Button size="sm" variant="ghost" onClick={handleToday} icon={<CalendarIcon className="w-4 h-4" />}>
                Hoje
              </Button>
            </div>

            {/* Filtros em Linha Única */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-wrap">
              {/* Campo de Busca */}
              <div className="relative min-w-[200px] flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Buscar no calendário..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              {/* Filtro Origem */}
              <select
                value={filterOrigem}
                onChange={(e) => setFilterOrigem(e.target.value)}
                className="px-3 py-1.5 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] shrink-0 focus:outline-none focus:border-[var(--color-primary)] cursor-pointer"
              >
                <option value="todas">Todas as Origens</option>
                <option value="acao">Ações de Projetos</option>
                <option value="reuniao">Reuniões Institucionais</option>
                <option value="comunicacao">Posts da Comunicação</option>
              </select>

              {/* Filtro Projeto */}
              <select
                value={filterProjetoId}
                onChange={(e) => setFilterProjetoId(e.target.value)}
                className="px-3 py-1.5 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] shrink-0 focus:outline-none focus:border-[var(--color-primary)] cursor-pointer"
              >
                <option value="todos">Todos os Projetos</option>
                <option value="geral">Institucional Geral</option>
                {projetos.map((p) => (
                  <option key={p.id} value={p.id}>
                    Projeto: {p.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Legenda Interativa de Cores */}
          <div className="pt-2 border-t border-[var(--border-default)] flex items-center justify-between gap-4 flex-wrap text-xs">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Legenda de Categorias:
            </span>
            <div className="flex items-center gap-4 flex-wrap">
              <button
                type="button"
                onClick={() => setFilterOrigem(filterOrigem === 'acao' ? 'todas' : 'acao')}
                className={`flex items-center gap-1.5 transition-opacity ${
                  filterOrigem === 'acao' || filterOrigem === 'todas' ? 'opacity-100 font-semibold' : 'opacity-40'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-emerald-600 dark:text-emerald-400">Ações de Projetos</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterOrigem(filterOrigem === 'reuniao' ? 'todas' : 'reuniao')}
                className={`flex items-center gap-1.5 transition-opacity ${
                  filterOrigem === 'reuniao' || filterOrigem === 'todas' ? 'opacity-100 font-semibold' : 'opacity-40'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#F2632D]"></span>
                <span className="text-[#F2632D]">Reuniões & Atas</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterOrigem(filterOrigem === 'comunicacao' ? 'todas' : 'comunicacao')}
                className={`flex items-center gap-1.5 transition-opacity ${
                  filterOrigem === 'comunicacao' || filterOrigem === 'todas' ? 'opacity-100 font-semibold' : 'opacity-40'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                <span className="text-sky-600 dark:text-sky-400">Posts de Comunicação</span>
              </button>
            </div>
          </div>
        </Card>

        {/* GRADE MENSAL DO CALENDÁRIO */}
        <Card className="p-3 sm:p-4 overflow-hidden shadow-xs">
          {/* Cabeçalho dos Dias da Semana */}
          <div className="grid grid-cols-7 gap-px bg-[var(--border-default)] border border-[var(--border-default)] rounded-t-xl overflow-hidden">
            {DIAS_SEMANA.map((dia) => (
              <div
                key={dia}
                className="py-2 text-center text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-secondary)]"
              >
                {dia}
              </div>
            ))}
          </div>

          {/* Células do Calendário */}
          <div className="grid grid-cols-7 gap-px bg-[var(--border-default)] border-x border-b border-[var(--border-default)] rounded-b-xl overflow-hidden">
            {calendarDays.map((day, idx) => {
              const isToday = isCurrentMonth && day.date === today.getDate();
              const hasEvents = day.events.length > 0;

              return (
                <div
                  key={idx}
                  className={`min-h-[115px] p-1.5 bg-[var(--bg-elevated)] transition-colors flex flex-col justify-between ${
                    day.date ? 'hover:bg-[var(--bg-secondary)]/60' : 'bg-[var(--bg-secondary)]/25'
                  } ${isToday ? 'ring-2 ring-inset ring-[#F2632D]' : ''}`}
                >
                  {day.date && (
                    <>
                      {/* Topo da Célula (Número do Dia e Badge de Quantidade) */}
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                            isToday
                              ? 'bg-[#F2632D] text-white shadow-xs'
                              : 'text-[var(--text-primary)]'
                          }`}
                        >
                          {day.date}
                        </span>

                        {hasEvents && (
                          <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--bg-secondary)] px-1.5 py-0.2 rounded-full">
                            {day.events.length}
                          </span>
                        )}
                      </div>

                      {/* Eventos do Dia (Max 3 visíveis com cores temáticas) */}
                      <div className="space-y-1 flex-1">
                        {day.events.slice(0, 3).map((evt) => {
                          const isAcao = evt.origem === 'acao';
                          const isReuniao = evt.origem === 'reuniao';

                          const borderStyle = isReuniao
                            ? 'border-l-[#F2632D] bg-[#F2632D]/10 text-[#F2632D]'
                            : isAcao
                            ? 'border-l-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : 'border-l-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300';

                          return (
                            <button
                              key={evt.id}
                              onClick={() => setSelectedEvento(evt)}
                              className={`w-full text-left px-1.5 py-1 rounded-md text-[10px] font-semibold truncate border-l-2 transition-transform hover:scale-[1.02] cursor-pointer block ${borderStyle}`}
                              title={`${evt.titulo} (${evt.subtipo})`}
                            >
                              <span className="truncate block">
                                {new Date(evt.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {evt.titulo}
                              </span>
                            </button>
                          );
                        })}

                        {day.events.length > 3 && (
                          <p className="text-[10px] text-[var(--text-muted)] text-center font-bold pt-0.5">
                            +{day.events.length - 3} outros
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* PAINEL FLUTUANTE / CARD DE DETALHE DO EVENTO SELECIONADO */}
        {selectedEvento && (
          <Card
            className="p-5 sm:p-6 border-l-4 space-y-4 shadow-lg animate-in fade-in duration-150"
            style={{
              borderLeftColor:
                selectedEvento.origem === 'reuniao'
                  ? '#F2632D'
                  : selectedEvento.origem === 'comunicacao'
                  ? '#0284C7'
                  : selectedEvento.projeto_cor || '#10B981',
            }}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{
                      backgroundColor:
                        selectedEvento.origem === 'reuniao'
                          ? '#F2632D'
                          : selectedEvento.origem === 'comunicacao'
                          ? '#0284C7'
                          : selectedEvento.projeto_cor || '#10B981',
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

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getOrigemBadge(selectedEvento.origem)}
                      <span className="text-xs font-semibold text-[var(--text-muted)]">•</span>
                      <span className="text-xs font-medium text-[var(--text-secondary)]">
                        {selectedEvento.projeto_nome}
                      </span>
                    </div>
                    <h3 className="font-bold text-base sm:text-lg text-[var(--text-primary)] mt-0.5">
                      {selectedEvento.titulo}
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[var(--text-secondary)] pt-1">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">Data</p>
                      <p className="capitalize">
                        {new Date(selectedEvento.data_hora).toLocaleDateString('pt-BR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">Horário</p>
                      <p>
                        {new Date(selectedEvento.data_hora).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {selectedEvento.horario_fim && (
                          <> às {new Date(selectedEvento.horario_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">Classificação</p>
                      <p className="font-medium text-[var(--text-primary)]">{selectedEvento.subtipo}</p>
                    </div>
                  </div>
                </div>

                {selectedEvento.local_ou_link && (
                  <div className="flex items-center gap-2 text-xs pt-1">
                    <MapPin className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                    <span className="text-[var(--text-secondary)] truncate">
                      Local / Canal: <strong>{selectedEvento.local_ou_link}</strong>
                    </span>
                  </div>
                )}

                {selectedEvento.descricao && (
                  <p className="text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border-default)] whitespace-pre-line">
                    {selectedEvento.descricao}
                  </p>
                )}
              </div>

              {/* Ações do Evento */}
              <div className="flex sm:flex-col items-center gap-2 shrink-0 self-end sm:self-start">
                {selectedEvento.link_modulo && (
                  <Link
                    href={selectedEvento.link_modulo}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-xs"
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
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all"
                  >
                    <span>Acessar Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedEvento(null)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* LISTA RESUMIDA CRONOLÓGICA DE EVENTOS DO MÊS */}
        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-default)]">
            <div>
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                Cronograma Completo — {MESES_NOMES[currentMonth]} {currentYear} ({eventosNoMes.length})
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Todas as ações, reuniões de governança e publicações planejadas para este período
              </p>
            </div>
          </div>

          {eventosNoMes.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-default)] rounded-xl">
              Nenhum evento registrado para este mês com os filtros aplicados.
            </div>
          ) : (
            <div className="space-y-2.5">
              {eventosNoMes.map((evt) => {
                const dateObj = new Date(evt.data_hora);
                const isReuniao = evt.origem === 'reuniao';
                const isCom = evt.origem === 'comunicacao';

                return (
                  <button
                    key={evt.id}
                    onClick={() => setSelectedEvento(evt)}
                    className="w-full text-left p-3 sm:p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-elevated)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Box com o Dia */}
                      <div
                        className="p-2 rounded-xl text-white font-bold text-center shrink-0 min-w-[48px] shadow-xs"
                        style={{
                          backgroundColor: isReuniao ? '#F2632D' : isCom ? '#0284C7' : evt.projeto_cor || '#10B981',
                        }}
                      >
                        <p className="text-[10px] uppercase leading-tight">
                          {dateObj.toLocaleDateString('pt-BR', { month: 'short' })}
                        </p>
                        <p className="text-lg font-bold leading-none mt-0.5">
                          {dateObj.getDate()}
                        </p>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getOrigemBadge(evt.origem)}
                          <span className="font-bold text-sm text-[var(--text-primary)] truncate">
                            {evt.titulo}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] truncate mt-1">
                          <strong className="text-[var(--text-secondary)]">{evt.projeto_nome}</strong> •{' '}
                          {dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          {evt.local_ou_link ? ` • ${evt.local_ou_link}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-secondary)]">
                        {evt.subtipo}
                      </span>
                      <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)]" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
