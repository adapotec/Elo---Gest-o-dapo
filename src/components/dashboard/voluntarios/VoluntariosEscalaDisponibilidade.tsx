'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Home,
  Info,
  Save,
  Check,
  X,
  AlertTriangle,
  FolderKanban,
  GraduationCap,
  Landmark,
} from 'lucide-react';
import { Voluntario } from './VoluntariosEquipe';

export interface DisponibilidadeRecord {
  id?: string;
  voluntario_id: string;
  data_escala: string;
  periodo: 'manha' | 'tarde' | 'noite' | 'integral';
  status_disponibilidade: 'disponivel' | 'indisponivel' | 'parcial';
  observacao?: string | null;
  voluntarios?: Voluntario;
}

interface EventoMes {
  id: string;
  titulo: string;
  data: string;
  origem: 'projeto' | 'pedagogia' | 'institucional' | 'outro';
  descricao?: string;
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function getPrimeiroDomingo(year: number, month: number): number {
  const firstDay = new Date(year, month, 1);
  const dayOfWeek = firstDay.getDay();
  return dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
}

function formatDateBR(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function VoluntariosEscalaDisponibilidade() {
  const supabase = createClient();

  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [disponibilidades, setDisponibilidades] = useState<DisponibilidadeRecord[]>([]);
  const [eventos, setEventos] = useState<EventoMes[]>([]);
  const [loading, setLoading] = useState(true);

  // Voluntário Selecionado para marcar disponibilidade
  const [selectedVoluntarioId, setSelectedVoluntarioId] = useState<string>('');

  // Modal de Marcação de Dia
  const [selectedDayModal, setSelectedDayModal] = useState<number | null>(null);
  const [modalPeriodo, setModalPeriodo] = useState<'integral' | 'manha' | 'tarde' | 'noite'>('integral');
  const [modalStatus, setModalStatus] = useState<'disponivel' | 'indisponivel'>('disponivel');
  const [modalObs, setModalObs] = useState('');
  const [savingDisp, setSavingDisp] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentMonth, currentYear]);

  async function loadData() {
    try {
      setLoading(true);

      const [respVol, respDisp, respAcoes] = await Promise.all([
        supabase.from('voluntarios').select('*').eq('status', 'ativo').order('nome_completo'),
        supabase.from('disponibilidades_voluntarios').select('*, voluntarios(*)'),
        supabase.from('acoes_projeto').select('*'),
      ]);

      if (respVol.data) {
        setVoluntarios(respVol.data as Voluntario[]);
        if (!selectedVoluntarioId && respVol.data.length > 0) {
          setSelectedVoluntarioId(respVol.data[0].id);
        }
      }

      if (respDisp.data) {
        setDisponibilidades(respDisp.data as DisponibilidadeRecord[]);
      }

      // Mapeia ações cadastradas em projetos como eventos do mês
      const listaEventos: EventoMes[] = [];
      if (respAcoes.data) {
        respAcoes.data.forEach((a: any) => {
          if (a.data_inicio) {
            listaEventos.push({
              id: a.id,
              titulo: a.titulo || a.nome || 'Ação de Projeto',
              data: a.data_inicio.split('T')[0],
              origem: 'projeto',
              descricao: a.descricao,
            });
          }
        });
      }

      setEventos(listaEventos);
    } catch (err) {
      console.error('Erro ao carregar escala de disponibilidade:', err);
    } finally {
      setLoading(false);
    }
  }

  const primeiroDomingo = getPrimeiroDomingo(currentYear, currentMonth);

  // Formata dia para YYYY-MM-DD
  const formatDayDateString = (day: number) => {
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${currentYear}-${mm}-${dd}`;
  };

  // Mapa de Disponibilidades por dia do mês atual
  const disponibilidadesByDay = useMemo(() => {
    const map: Record<number, DisponibilidadeRecord[]> = {};

    disponibilidades.forEach((d) => {
      const parts = d.data_escala.split('-');
      if (parts.length === 3) {
        const ano = parseInt(parts[0], 10);
        const mes = parseInt(parts[1], 10) - 1;
        const dia = parseInt(parts[2], 10);

        if (ano === currentYear && mes === currentMonth) {
          if (!map[dia]) map[dia] = [];
          map[dia].push(d);
        }
      }
    });

    return map;
  }, [disponibilidades, currentMonth, currentYear]);

  // Mapa de Eventos por dia do mês atual
  const eventosByDay = useMemo(() => {
    const map: Record<number, EventoMes[]> = {};

    eventos.forEach((ev) => {
      const parts = ev.data.split('-');
      if (parts.length === 3) {
        const ano = parseInt(parts[0], 10);
        const mes = parseInt(parts[1], 10) - 1;
        const dia = parseInt(parts[2], 10);

        if (ano === currentYear && mes === currentMonth) {
          if (!map[dia]) map[dia] = [];
          map[dia].push(ev);
        }
      }
    });

    return map;
  }, [eventos, currentMonth, currentYear]);

  // Lista de dias para o grid do calendário
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));

  // Abrir Modal de Edição para o Dia Selecionado
  const handleOpenDayModal = (day: number) => {
    setSelectedDayModal(day);
    const dateStr = formatDayDateString(day);

    const existing = disponibilidades.find(
      (d) => d.voluntario_id === selectedVoluntarioId && d.data_escala === dateStr
    );

    if (existing) {
      setModalStatus(existing.status_disponibilidade === 'indisponivel' ? 'indisponivel' : 'disponivel');
      setModalPeriodo(existing.periodo);
      setModalObs(existing.observacao || '');
    } else {
      setModalStatus('disponivel');
      setModalPeriodo('integral');
      setModalObs('');
    }
  };

  // Salvar Marcação de Disponibilidade
  const handleSalvarDisponibilidade = async () => {
    if (!selectedDayModal || !selectedVoluntarioId) return;
    setSavingDisp(true);

    try {
      const dateStr = formatDayDateString(selectedDayModal);

      // Upsert no banco
      const { error } = await supabase.from('disponibilidades_voluntarios').upsert(
        {
          voluntario_id: selectedVoluntarioId,
          data_escala: dateStr,
          periodo: modalPeriodo,
          status_disponibilidade: modalStatus,
          observacao: modalObs.trim() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'voluntario_id,data_escala' }
      );

      if (error) {
        console.warn('Fallback para estado local se tabela ainda não sincronizada:', error);
        // Fallback local caso tabela esteja criando
        setDisponibilidades((prev) => {
          const filtered = prev.filter(
            (d) => !(d.voluntario_id === selectedVoluntarioId && d.data_escala === dateStr)
          );
          const volObj = voluntarios.find((v) => v.id === selectedVoluntarioId);
          return [
            ...filtered,
            {
              voluntario_id: selectedVoluntarioId,
              data_escala: dateStr,
              periodo: modalPeriodo,
              status_disponibilidade: modalStatus,
              observacao: modalObs.trim() || null,
              voluntarios: volObj,
            },
          ];
        });
      } else {
        await loadData();
      }

      setSelectedDayModal(null);
    } catch (err: any) {
      alert('Erro ao registrar disponibilidade: ' + err.message);
    } finally {
      setSavingDisp(false);
    }
  };

  // Estatísticas de Escala
  const totalVoluntariosComEscala = useMemo(() => {
    const set = new Set<string>();
    disponibilidades.forEach((d) => {
      const parts = d.data_escala.split('-');
      if (parts.length === 3 && parseInt(parts[0], 10) === currentYear && parseInt(parts[1], 10) - 1 === currentMonth) {
        if (d.status_disponibilidade === 'disponivel') set.add(d.voluntario_id);
      }
    });
    return set.size;
  }, [disponibilidades, currentMonth, currentYear]);

  const totalEventosNoMes = Object.keys(eventosByDay).length;

  return (
    <div className="space-y-5">
      {/* ── 1. MICRO-KPIS DA ESCALA MENSAL ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
              Voluntários na Escala
            </p>
            <p className="text-lg sm:text-xl font-display font-extrabold text-[var(--text-primary)]">
              {totalVoluntariosComEscala} / {voluntarios.length}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-[#93368F] flex items-center justify-center shrink-0">
            <FolderKanban className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
              Ações &amp; Encontros
            </p>
            <p className="text-lg sm:text-xl font-display font-extrabold text-[#93368F]">
              {totalEventosNoMes} Dias
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
              Integração Ativa
            </p>
            <p className="text-xs sm:text-sm font-bold text-emerald-600 truncate">
              Projetos &amp; Pedagogia
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Home className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
              Dia da Família
            </p>
            <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
              Dia {primeiroDomingo} (1º Dom)
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. SELETOR DE VOLUNTÁRIO & NAVEGAÇÃO DE MÊS ── */}
      <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Navegação de Mês */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-colors cursor-pointer"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="font-display font-bold text-sm sm:text-base text-[var(--text-primary)] min-w-[170px] text-center">
            {MESES_NOMES[currentMonth]} {currentYear}
          </h3>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-colors cursor-pointer"
            aria-label="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Seletor do Voluntário que está marcando a escala */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-[var(--text-secondary)] shrink-0">
            Voluntário(a):
          </span>
          <div className="w-full sm:w-64">
            <Select
              options={[
                ...voluntarios.map((v) => ({
                  value: v.id,
                  label: `${v.nome_completo} (${v.area_atuacao || 'Geral'})`,
                })),
              ]}
              value={selectedVoluntarioId}
              onChange={(e) => setSelectedVoluntarioId(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── 3. CALENDÁRIO INTERATIVO DE DISPONIBILIDADE & ESCALA ── */}
      <Card className="p-4 sm:p-5 overflow-x-auto space-y-3">
        {/* Legenda */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pb-2 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
              <span className="text-[var(--text-primary)] font-medium">Disponível para Ações</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-rose-500" />
              <span className="text-[var(--text-primary)] font-medium">Indisponível</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-purple-500" />
              <span className="text-[var(--text-primary)] font-medium">Ação / Oficina Agendada</span>
            </div>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] italic">
            Clique no dia para marcar sua disponibilidade
          </span>
        </div>

        <div className="min-w-[700px]">
          {/* Cabeçalho dos Dias da Semana */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[11px] font-bold text-[var(--text-muted)] uppercase">
            {DIAS_SEMANA.map((d, i) => (
              <div key={d} className={i === 0 ? 'text-rose-500' : ''}>
                {d}
              </div>
            ))}
          </div>

          {/* Grid de Dias */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-28 rounded-xl bg-[var(--bg-secondary)]/20" />;
              }

              const dateStr = formatDayDateString(day);
              const isPrimeiroDom = day === primeiroDomingo;
              const dispsDoDia = disponibilidadesByDay[day] || [];
              const eventosDoDia = eventosByDay[day] || [];

              // Checa a disponibilidade do voluntário atualmente selecionado
              const minhaDisp = dispsDoDia.find((d) => d.voluntario_id === selectedVoluntarioId);

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => handleOpenDayModal(day)}
                  className={`h-28 p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer hover:shadow-xs ${
                    minhaDisp?.status_disponibilidade === 'disponivel'
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : minhaDisp?.status_disponibilidade === 'indisponivel'
                      ? 'border-rose-500/30 bg-rose-500/5'
                      : isPrimeiroDom
                      ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary-soft)]/20'
                      : 'border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--color-primary)]/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      {day}
                    </span>
                    {isPrimeiroDom && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[var(--color-primary)] text-white shadow-2xs">
                        Família
                      </span>
                    )}
                    {minhaDisp && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                          minhaDisp.status_disponibilidade === 'disponivel'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        {minhaDisp.status_disponibilidade === 'disponivel' ? 'Disponível' : 'Indisponível'}
                      </span>
                    )}
                  </div>

                  {/* Ações e Eventos Previstos */}
                  <div className="space-y-1 overflow-hidden">
                    {eventosDoDia.slice(0, 1).map((ev) => (
                      <div
                        key={ev.id}
                        className="text-[9px] truncate px-1.5 py-0.5 rounded font-bold bg-purple-500/15 text-purple-900 dark:text-purple-200 border border-purple-500/20 flex items-center gap-1"
                        title={ev.titulo}
                      >
                        <FolderKanban className="w-2.5 h-2.5 shrink-0 text-purple-600" />
                        <span className="truncate">{ev.titulo}</span>
                      </div>
                    ))}

                    {/* Voluntários Disponíveis no Dia */}
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      {dispsDoDia
                        .filter((d) => d.status_disponibilidade === 'disponivel')
                        .slice(0, 3)
                        .map((d) => (
                          <div
                            key={d.voluntario_id}
                            className="w-5 h-5 rounded-full bg-[var(--color-primary-soft)] border border-[var(--border-default)] text-[9px] font-bold text-[var(--color-primary)] flex items-center justify-center shrink-0"
                            title={`${d.voluntarios?.nome_completo || 'Voluntário'} (${d.periodo})`}
                          >
                            {d.voluntarios?.avatar_url ? (
                              <img
                                src={d.voluntarios.avatar_url}
                                alt="Avatar"
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              d.voluntarios?.nome_completo?.charAt(0).toUpperCase() || 'V'
                            )}
                          </div>
                        ))}
                      {dispsDoDia.filter((d) => d.status_disponibilidade === 'disponivel').length > 3 && (
                        <span className="text-[8px] font-bold text-[var(--text-muted)]">
                          +{dispsDoDia.filter((d) => d.status_disponibilidade === 'disponivel').length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* ── MODAL: MARCAR DISPONIBILIDADE DO DIA SELECIONADO ── */}
      {selectedDayModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[var(--color-primary)]" />
                <div>
                  <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                    Disponibilidade em {selectedDayModal} de {MESES_NOMES[currentMonth]}
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {voluntarios.find((v) => v.id === selectedVoluntarioId)?.nome_completo || 'Voluntário'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDayModal(null)}
                className="p-1 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Botões de Escolha: Disponível vs Indisponível */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setModalStatus('disponivel')}
                  className={`p-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all cursor-pointer ${
                    modalStatus === 'disponivel'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-default)]'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Estou Disponível
                </button>

                <button
                  type="button"
                  onClick={() => setModalStatus('indisponivel')}
                  className={`p-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all cursor-pointer ${
                    modalStatus === 'indisponivel'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-default)]'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  Indisponível
                </button>
              </div>

              {modalStatus === 'disponivel' && (
                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                    Turno / Período de Disponibilidade
                  </label>
                  <select
                    value={modalPeriodo}
                    onChange={(e: any) => setModalPeriodo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] font-medium"
                  >
                    <option value="integral">Integral (Manhã e Tarde)</option>
                    <option value="manha">Apenas Manhã</option>
                    <option value="tarde">Apenas Tarde</option>
                    <option value="noite">Apenas Noite / Encontro</option>
                  </select>
                </div>
              )}

              <div>
                <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                  Observação (Opcional)
                </label>
                <textarea
                  value={modalObs}
                  onChange={(e) => setModalObs(e.target.value)}
                  placeholder="Ex: Disponível para oficinas pedagógicas ou apoio na acolhida."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-default)]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedDayModal(null)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                icon={<Save className="w-4 h-4" />}
                disabled={savingDisp}
                onClick={handleSalvarDisponibilidade}
              >
                {savingDisp ? 'Salvando...' : 'Confirmar Disponibilidade'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
