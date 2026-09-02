'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
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
  UserCheck,
} from 'lucide-react';
import { Voluntario } from './VoluntariosEquipe';
import { getVoluntarios, getCachedVoluntariosSync } from '@/lib/services/voluntariosService';

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
  cor?: string;
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

export function VoluntariosEscalaDisponibilidade() {
  const supabase = createClient();

  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [disponibilidades, setDisponibilidades] = useState<DisponibilidadeRecord[]>([]);
  const [eventos, setEventos] = useState<EventoMes[]>([]);
  const [loading, setLoading] = useState(true);

  // Voluntário Logado (Auto-selecionado)
  const [currentVolunteer, setCurrentVolunteer] = useState<Voluntario | null>(null);
  const [selectedVoluntarioId, setSelectedVoluntarioId] = useState<string>('');

  // Modal de Marcação de Dia
  const [selectedDayModal, setSelectedDayModal] = useState<number | null>(null);
  const [modalPeriodo, setModalPeriodo] = useState<'integral' | 'manha' | 'tarde' | 'noite'>('integral');
  const [modalStatus, setModalStatus] = useState<'disponivel' | 'indisponivel'>('disponivel');
  const [modalObs, setModalObs] = useState('');
  const [savingDisp, setSavingDisp] = useState(false);

  useEffect(() => {
    // 1. Carrega imediatamente do cache local sem causar mismatch de hidratação (0ms)
    const cached = getCachedVoluntariosSync('ativo');
    if (cached.length > 0) {
      setVoluntarios(cached);
      setLoading(false);
    }
    loadData();
  }, [currentMonth, currentYear]);

  async function loadData() {
    try {
      // 1. Busca voluntários ativos via cache rápido
      const vols = await getVoluntarios({ status: 'ativo' });
      setVoluntarios(vols);

      // 2. Identifica o usuário logado para auto-selecionar sua própria escala
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('nome_completo, email')
            .eq('id', authData.user.id)
            .maybeSingle();

          const userEmail = authData.user.email?.toLowerCase();
          const userName = profile?.nome_completo?.toLowerCase();

          const matchedVol = vols.find(
            (v) =>
              (v.auth_user_id && v.auth_user_id === authData.user.id) ||
              (v.email && userEmail && v.email.toLowerCase() === userEmail) ||
              (v.nome_completo && userName && v.nome_completo.toLowerCase() === userName)
          );

          if (matchedVol) {
            setCurrentVolunteer(matchedVol);
            setSelectedVoluntarioId(matchedVol.id);
          } else if (vols.length > 0) {
            setCurrentVolunteer(vols[0]);
            setSelectedVoluntarioId(vols[0].id);
          }
        } else if (vols.length > 0) {
          setCurrentVolunteer(vols[0]);
          setSelectedVoluntarioId(vols[0].id);
        }
      } catch (authErr) {
        if (vols.length > 0) {
          setCurrentVolunteer(vols[0]);
          setSelectedVoluntarioId(vols[0].id);
        }
      }

      // 3. Busca ações cadastradas em projetos e oficinas pedagógicas (consulta segura sem 400)
      const listaEventos: EventoMes[] = [];

      try {
        const { data: acoesData } = await supabase
          .from('acoes_projeto')
          .select('id, nome_acao, data_hora, descricao, documento_estruturador, projetos_sociais(nome, cor_identificacao)')
          .order('data_hora', { ascending: true });

        if (acoesData) {
          acoesData.forEach((a: any) => {
            if (a.data_hora) {
              const dt = a.data_hora.split('T')[0];
              listaEventos.push({
                id: `acao-${a.id}`,
                titulo: a.nome_acao || 'Ação do Projeto',
                data: dt,
                origem: a.documento_estruturador?.toLowerCase().includes('oficina') || a.documento_estruturador?.toLowerCase().includes('aula') ? 'pedagogia' : 'projeto',
                cor: a.projetos_sociais?.cor_identificacao || '#F2632D',
                descricao: a.descricao,
              });
            }
          });
        }
      } catch (evErr) {
        console.warn('Erro ao carregar ações:', evErr);
      }

      setEventos(listaEventos);

      // 4. Carrega disponibilidades do banco Supabase com fallback local
      const listaDisp: DisponibilidadeRecord[] = [];

      // A. Busca disponibilidades na tabela oficial criada no Supabase
      try {
        const { data: dispData, error: dispErr } = await supabase
          .from('disponibilidades_voluntarios')
          .select('*, voluntarios(id, nome_completo, avatar_url, email)');

        if (!dispErr && dispData) {
          listaDisp.push(...(dispData as DisponibilidadeRecord[]));
        }
      } catch (dispErr) {
        console.warn('Fallback para cache local de disponibilidades:', dispErr);
      }

      // B. Complementa com cache local se offline
      try {
        const localStored = typeof window !== 'undefined' ? localStorage.getItem(`elo_disponibilidades_${currentYear}_${currentMonth}`) : null;
        if (localStored) {
          const parsed = JSON.parse(localStored);
          if (Array.isArray(parsed)) {
            parsed.forEach((localItem: DisponibilidadeRecord) => {
              const alreadyIn = listaDisp.some(
                (d) => d.voluntario_id === localItem.voluntario_id && d.data_escala === localItem.data_escala
              );
              if (!alreadyIn) listaDisp.push(localItem);
            });
          }
        }
      } catch (e) {}

      // C. Folgas e recessos aprovados do banco (tabela recessos_voluntarios)
      try {
        const { data: recData } = await supabase
          .from('recessos_voluntarios')
          .select('id, voluntario_id, data_folga, tipo, motivo, status, voluntarios(id, nome_completo, avatar_url, email)')
          .eq('mes_referencia', currentMonth + 1)
          .eq('ano_referencia', currentYear)
          .eq('status', 'aprovada');

        if (recData) {
          recData.forEach((r: any) => {
            const alreadyIn = listaDisp.some(
              (d) => d.voluntario_id === r.voluntario_id && d.data_escala === r.data_folga
            );
            if (!alreadyIn) {
              listaDisp.push({
                id: `recesso-${r.id}`,
                voluntario_id: r.voluntario_id,
                data_escala: r.data_folga,
                periodo: 'integral',
                status_disponibilidade: 'indisponivel',
                observacao: r.motivo || 'Recesso / Folga Aprovada',
                voluntarios: r.voluntarios,
              });
            }
          });
        }
      } catch (recErr) {
        console.warn('Erro ao verificar recessos:', recErr);
      }

      setDisponibilidades(listaDisp);
    } catch (err) {
      console.error('Erro geral ao carregar dados:', err);
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

  // Mapa de Eventos / Ações por dia do mês atual
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

      const novoRegistro: DisponibilidadeRecord = {
        voluntario_id: selectedVoluntarioId,
        data_escala: dateStr,
        periodo: modalPeriodo,
        status_disponibilidade: modalStatus,
        observacao: modalObs.trim() || null,
        voluntarios: currentVolunteer || undefined,
      };

      // Salva no banco de dados Supabase na tabela oficial disponibilidades_voluntarios
      try {
        await supabase.from('disponibilidades_voluntarios').upsert(
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
      } catch (upsertErr) {
        console.warn('Erro ao salvar no banco remoto:', upsertErr);
      }

      // Se marcado como indisponível, registra também no controle oficial de recessos
      if (modalStatus === 'indisponivel') {
        try {
          await supabase.from('recessos_voluntarios').upsert(
            {
              voluntario_id: selectedVoluntarioId,
              data_folga: dateStr,
              tipo: 'individual',
              motivo: modalObs.trim() || 'Indisponibilidade informada na Escala Mensal',
              status: 'aprovada',
              mes_referencia: currentMonth + 1,
              ano_referencia: currentYear,
            },
            { onConflict: 'voluntario_id,data_folga' }
          );
        } catch (e) {
          console.warn('Erro ao sincronizar indisponibilidade:', e);
        }
      }

      // Atualiza estado e cache local
      setDisponibilidades((prev) => {
        const filtered = prev.filter(
          (d) => !(d.voluntario_id === selectedVoluntarioId && d.data_escala === dateStr)
        );
        const updated = [...filtered, novoRegistro];
        try {
          localStorage.setItem(`elo_disponibilidades_${currentYear}_${currentMonth}`, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      setSelectedDayModal(null);
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
    } finally {
      setSavingDisp(false);
    }
  };

  // Estatísticas do Mês
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

  const meusDiasDisponiveis = useMemo(() => {
    return disponibilidades.filter((d) => {
      const parts = d.data_escala.split('-');
      return (
        d.voluntario_id === selectedVoluntarioId &&
        d.status_disponibilidade === 'disponivel' &&
        parts.length === 3 &&
        parseInt(parts[0], 10) === currentYear &&
        parseInt(parts[1], 10) - 1 === currentMonth
      );
    }).length;
  }, [disponibilidades, selectedVoluntarioId, currentMonth, currentYear]);

  return (
    <div className="space-y-5">
      {/* ── 1. MICRO-KPIS DA ESCALA MENSAL (SEM INDICADOR DE INTEGRAÇÃO) ── */}
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
              Minha Disponibilidade
            </p>
            <p className="text-lg sm:text-xl font-display font-extrabold text-emerald-600">
              {meusDiasDisponiveis} Dias
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

      {/* ── 2. NAVEGAÇÃO DE MÊS & VOLUNTÁRIO LOGADO EM DESTAQUE ── */}
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

        {/* Identificação do Voluntário Logado (Auto-selecionado) */}
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] w-full sm:w-auto">
          <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold text-xs flex items-center justify-center shrink-0">
            {currentVolunteer?.avatar_url ? (
              <img src={currentVolunteer.avatar_url} alt="Avatar" className="w-full h-full rounded-lg object-cover" />
            ) : (
              currentVolunteer?.nome_completo?.charAt(0).toUpperCase() || 'V'
            )}
          </div>
          <div className="min-w-0 text-xs">
            <span className="text-[10px] text-[var(--text-muted)] block font-medium">
              Preenchendo escala de:
            </span>
            <span className="font-bold text-[var(--text-primary)] truncate block">
              {currentVolunteer?.nome_completo || 'Voluntário Conectado'}
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. CALENDÁRIO INTERATIVO DE DISPONIBILIDADE COM AÇÕES VISÍVEIS ── */}
      <Card className="p-4 sm:p-5 overflow-x-auto space-y-3">
        {/* Legenda */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pb-2 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
              <span className="text-[var(--text-primary)] font-medium">Estou Disponível</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-rose-500" />
              <span className="text-[var(--text-primary)] font-medium">Indisponível</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-purple-500" />
              <span className="text-[var(--text-primary)] font-medium">Ações / Oficinas Cadastradas</span>
            </div>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] italic">
            Clique no dia para marcar sua disponibilidade
          </span>
        </div>

        <div className="min-w-[720px]">
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
                return <div key={`empty-${idx}`} className="h-32 rounded-xl bg-[var(--bg-secondary)]/20" />;
              }

              const isPrimeiroDom = day === primeiroDomingo;
              const dispsDoDia = disponibilidadesByDay[day] || [];
              const eventosDoDia = eventosByDay[day] || [];

              // Disponibilidade do voluntário logado neste dia
              const minhaDisp = dispsDoDia.find((d) => d.voluntario_id === selectedVoluntarioId);

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => handleOpenDayModal(day)}
                  className={`h-32 p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer hover:shadow-xs ${
                    minhaDisp?.status_disponibilidade === 'disponivel'
                      ? 'border-emerald-500/60 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                      : minhaDisp?.status_disponibilidade === 'indisponivel'
                      ? 'border-rose-500/40 bg-rose-500/5'
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
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {minhaDisp.status_disponibilidade === 'disponivel' ? 'Disponível' : 'Indisponível'}
                      </span>
                    )}
                  </div>

                  {/* Ações e Eventos Cadastrados no Dia */}
                  <div className="space-y-1 overflow-hidden my-1">
                    {eventosDoDia.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className="text-[9px] truncate px-1.5 py-0.5 rounded font-bold bg-purple-500/15 text-purple-900 dark:text-purple-200 border border-purple-500/20 flex items-center gap-1"
                        title={ev.titulo}
                      >
                        <FolderKanban className="w-2.5 h-2.5 shrink-0 text-purple-600" />
                        <span className="truncate">{ev.titulo}</span>
                      </div>
                    ))}
                    {eventosDoDia.length > 2 && (
                      <span className="text-[8px] font-bold text-purple-600 pl-1 block">
                        +{eventosDoDia.length - 2} ações
                      </span>
                    )}
                  </div>

                  {/* Voluntários Disponíveis no Dia */}
                  <div className="flex items-center justify-between pt-0.5 border-t border-[var(--border-default)]/40 text-[9px]">
                    <div className="flex items-center gap-0.5 flex-wrap">
                      {dispsDoDia
                        .filter((d) => d.status_disponibilidade === 'disponivel')
                        .slice(0, 3)
                        .map((d) => (
                          <div
                            key={d.voluntario_id}
                            className="w-4 h-4 rounded-full bg-[var(--color-primary-soft)] border border-[var(--border-default)] text-[8px] font-bold text-[var(--color-primary)] flex items-center justify-center shrink-0"
                            title={`${d.voluntarios?.nome_completo || 'Voluntário'} (${d.periodo})`}
                          >
                            {d.voluntarios?.nome_completo?.charAt(0).toUpperCase() || 'V'}
                          </div>
                        ))}
                    </div>
                    <span className="font-mono-data font-bold text-[var(--text-muted)]">
                      {dispsDoDia.filter((d) => d.status_disponibilidade === 'disponivel').length} disp.
                    </span>
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
                    {currentVolunteer?.nome_completo || 'Voluntário'}
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
