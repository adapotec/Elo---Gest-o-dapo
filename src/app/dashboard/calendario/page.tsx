'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  FolderKanban,
  BookOpen,
  FileText,
  MapPin,
  Users,
  Filter,
} from 'lucide-react';

interface AcaoCalendario {
  id: string;
  projeto_id: string;
  data_hora: string;
  nome_acao: string;
  descricao: string | null;
  documento_estruturador: string | null;
  projeto_nome?: string;
  projeto_cor?: string;
  projeto_icone?: string;
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function CalendarioPage() {
  const [loading, setLoading] = useState(true);
  const [acoes, setAcoes] = useState<AcaoCalendario[]>([]);
  const [projetos, setProjetos] = useState<any[]>([]);

  // Navegação de mês
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Filtros
  const [filterProjetoId, setFilterProjetoId] = useState<string>('todos');
  const [filterDocumento, setFilterDocumento] = useState<string>('todos');

  // Evento selecionado para detail panel
  const [selectedEvento, setSelectedEvento] = useState<AcaoCalendario | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const supabase = createClient();

      const [respAcoes, respProjetos] = await Promise.all([
        supabase
          .from('acoes_projeto')
          .select('*, projetos_sociais(nome, cor_identificacao, icone)')
          .order('data_hora', { ascending: true }),
        supabase
          .from('projetos_sociais')
          .select('id, nome, cor_identificacao, icone, status')
          .order('nome', { ascending: true }),
      ]);

      const acoesFormatted = (respAcoes.data || []).map((a: any) => ({
        ...a,
        projeto_nome: a.projetos_sociais?.nome || 'Projeto',
        projeto_cor: a.projetos_sociais?.cor_identificacao || '#F2632D',
        projeto_icone: a.projetos_sociais?.icone || 'FolderKanban',
      }));

      setAcoes(acoesFormatted);
      setProjetos(respProjetos.data || []);
    } catch (err) {
      console.error('Erro ao carregar dados do calendário:', err);
    } finally {
      setLoading(false);
    }
  }

  // Navegação
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filtragem
  const filteredAcoes = useMemo(() => {
    return acoes.filter((a) => {
      if (filterProjetoId !== 'todos' && a.projeto_id !== filterProjetoId) return false;
      if (filterDocumento !== 'todos' && a.documento_estruturador !== filterDocumento) return false;
      return true;
    });
  }, [acoes, filterProjetoId, filterDocumento]);

  // Montar grade do calendário
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: { date: number | null; events: AcaoCalendario[] }[] = [];

    // Dias em branco antes do 1o dia
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ date: null, events: [] });
    }

    // Dias do mês
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      const dayEvents = filteredAcoes.filter((a) => {
        const eventDate = a.data_hora.split('T')[0];
        return eventDate === dayStr;
      });

      days.push({ date: d, events: dayEvents });
    }

    return days;
  }, [currentYear, currentMonth, filteredAcoes]);

  // Resumo do mês
  const eventosNoMes = filteredAcoes.filter((a) => {
    const d = new Date(a.data_hora);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Calendário Geral" subtitle="Carregando..." />
        <div className="p-12 text-center text-sm text-[var(--text-muted)]">Carregando calendário institucional...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Calendário Geral Institucional"
        subtitle="Visão agregada de todas as ações, encontros e eventos de todos os projetos"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl space-y-6 flex-1 overflow-y-auto">
        {/* HEADER DE NAVEGAÇÃO DO CALENDÁRIO */}
        <Card className="p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Navegação de Mês */}
            <div className="flex items-center gap-3">
              <Button size="sm" variant="ghost" onClick={handlePrevMonth} icon={<ChevronLeft className="w-4 h-4" />}>
                Anterior
              </Button>

              <div className="text-center min-w-[200px]">
                <h2 className="font-display font-bold text-xl text-[var(--text-primary)]">
                  {MESES_NOMES[currentMonth]} {currentYear}
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {eventosNoMes.length} evento{eventosNoMes.length !== 1 ? 's' : ''} neste mês
                </p>
              </div>

              <Button size="sm" variant="ghost" onClick={handleNextMonth} icon={<ChevronRight className="w-4 h-4" />}>
                Próximo
              </Button>

              <Button size="sm" variant="secondary" onClick={handleToday} icon={<Calendar className="w-4 h-4" />}>
                Hoje
              </Button>
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <Filter className="w-3.5 h-3.5" />
                <span className="font-semibold">Filtros:</span>
              </div>

              <Select
                value={filterProjetoId}
                onChange={(e) => setFilterProjetoId(e.target.value)}
                className="text-xs w-44"
              >
                <option value="todos">Todos os Projetos</option>
                {projetos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </Select>

              <Select
                value={filterDocumento}
                onChange={(e) => setFilterDocumento(e.target.value)}
                className="text-xs w-44"
              >
                <option value="todos">Todos os Tipos</option>
                <option value="Plano de Aula">Plano de Aula</option>
                <option value="Programação de Ação">Programação de Ação</option>
              </Select>
            </div>
          </div>
        </Card>

        {/* GRID DO CALENDÁRIO */}
        <Card className="p-4 overflow-hidden">
          {/* Cabeçalho Dias da Semana */}
          <div className="grid grid-cols-7 gap-px bg-[var(--border-default)] border border-[var(--border-default)] rounded-t-xl overflow-hidden">
            {DIAS_SEMANA.map((dia) => (
              <div
                key={dia}
                className="py-2.5 text-center text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-secondary)]"
              >
                {dia}
              </div>
            ))}
          </div>

          {/* Corpo do Calendário */}
          <div className="grid grid-cols-7 gap-px bg-[var(--border-default)] border-x border-b border-[var(--border-default)] rounded-b-xl overflow-hidden">
            {calendarDays.map((day, idx) => {
              const isToday = isCurrentMonth && day.date === today.getDate();
              const hasEvents = day.events.length > 0;

              return (
                <div
                  key={idx}
                  className={`min-h-[100px] p-1.5 bg-[var(--bg-elevated)] transition-colors ${
                    day.date ? 'hover:bg-[var(--bg-secondary)]/50 cursor-pointer' : 'bg-[var(--bg-secondary)]/20'
                  } ${isToday ? 'ring-2 ring-inset ring-[#F2632D]' : ''}`}
                >
                  {day.date && (
                    <>
                      {/* Número do Dia */}
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                            isToday
                              ? 'bg-[#F2632D] text-white'
                              : 'text-[var(--text-primary)]'
                          }`}
                        >
                          {day.date}
                        </span>

                        {hasEvents && (
                          <span className="text-[9px] font-bold text-[var(--text-muted)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded-full">
                            {day.events.length}
                          </span>
                        )}
                      </div>

                      {/* Eventos do Dia (Max 3 visíveis) */}
                      <div className="space-y-0.5">
                        {day.events.slice(0, 3).map((evt) => (
                          <button
                            key={evt.id}
                            onClick={() => setSelectedEvento(evt)}
                            className="w-full text-left px-1.5 py-0.5 rounded text-[10px] font-semibold truncate transition-opacity hover:opacity-80"
                            style={{
                              backgroundColor: `${evt.projeto_cor}20`,
                              color: evt.projeto_cor,
                              borderLeft: `2px solid ${evt.projeto_cor}`,
                            }}
                            title={`${evt.nome_acao} — ${evt.projeto_nome}`}
                          >
                            {evt.nome_acao}
                          </button>
                        ))}

                        {day.events.length > 3 && (
                          <p className="text-[9px] text-[var(--text-muted)] text-center font-semibold">
                            +{day.events.length - 3} mais
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

        {/* PAINEL DE DETALHE DO EVENTO SELECIONADO */}
        {selectedEvento && (
          <Card className="p-6 border-l-4" style={{ borderLeftColor: selectedEvento.projeto_cor }}>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ backgroundColor: selectedEvento.projeto_cor }}
                  >
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[var(--text-primary)]">
                      {selectedEvento.nome_acao}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      Projeto: <span className="font-semibold" style={{ color: selectedEvento.projeto_cor }}>{selectedEvento.projeto_nome}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[var(--text-secondary)]">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
                    <div>
                      <p className="font-semibold">Data</p>
                      <p>{new Date(selectedEvento.data_hora).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[var(--text-muted)]" />
                    <div>
                      <p className="font-semibold">Horário</p>
                      <p>{new Date(selectedEvento.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[var(--text-muted)]" />
                    <div>
                      <p className="font-semibold">Tipo de Documento</p>
                      <Badge variant="purple">{selectedEvento.documento_estruturador || 'Plano de Aula'}</Badge>
                    </div>
                  </div>
                </div>

                {selectedEvento.descricao && (
                  <p className="text-xs text-[var(--text-muted)] border-t border-[var(--border-default)] pt-3">
                    {selectedEvento.descricao}
                  </p>
                )}
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedEvento(null)}
              >
                Fechar
              </Button>
            </div>
          </Card>
        )}

        {/* LISTA RESUMIDA DE EVENTOS DO MÊS */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-default)]">
            <h3 className="font-bold text-sm text-[var(--text-primary)]">
              Próximos Eventos — {MESES_NOMES[currentMonth]} {currentYear} ({eventosNoMes.length})
            </h3>
          </div>

          {eventosNoMes.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-default)] rounded-xl">
              Nenhum evento cadastrado para este mês {filterProjetoId !== 'todos' ? 'com os filtros selecionados' : ''}.
            </div>
          ) : (
            <div className="space-y-2">
              {eventosNoMes.map((evt) => (
                <button
                  key={evt.id}
                  onClick={() => setSelectedEvento(evt)}
                  className="w-full text-left p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-elevated)] transition-colors flex items-center gap-4"
                >
                  <div
                    className="p-2.5 rounded-lg text-white font-bold text-center shrink-0 min-w-[44px]"
                    style={{ backgroundColor: evt.projeto_cor }}
                  >
                    <p className="text-[10px] uppercase leading-tight">
                      {new Date(evt.data_hora).toLocaleDateString('pt-BR', { month: 'short' })}
                    </p>
                    <p className="text-base font-mono leading-none">
                      {new Date(evt.data_hora).getDate()}
                    </p>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-[var(--text-primary)] truncate">{evt.nome_acao}</p>
                      <Badge variant="purple">{evt.documento_estruturador || 'Plano de Aula'}</Badge>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {evt.projeto_nome} • {new Date(evt.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      {evt.descricao ? ` • ${evt.descricao}` : ''}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
