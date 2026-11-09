'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Home,
  Info,
  Save,
  FolderKanban,
  UserCheck,
  List,
  LayoutGrid,
  Filter,
  Check,
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
const DIAS_SEMANA_COMPLETO = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
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

  // Voluntário Selecionado / Logado
  const [currentVolunteer, setCurrentVolunteer] = useState<Voluntario | null>(null);
  const [selectedVoluntarioId, setSelectedVoluntarioId] = useState<string>('');

  // Modo de Visualização no Mobile (Opção A: Agenda/Lista vs Grade)
  const [mobileViewMode, setMobileViewMode] = useState<'agenda' | 'grade'>('agenda');
  const [agendaFiltro, setAgendaFiltro] = useState<'todos' | 'com_acoes' | 'fins_de_semana'>('todos');

  // Modal de Marcação de Dia
  const [selectedDayModal, setSelectedDayModal] = useState<number | null>(null);
  const [modalPeriodo, setModalPeriodo] = useState<'integral' | 'manha' | 'tarde' | 'noite'>('integral');
  const [modalStatus, setModalStatus] = useState<'disponivel' | 'indisponivel'>('disponivel');
  const [modalObs, setModalObs] = useState('');
  const [savingDisp, setSavingDisp] = useState(false);

  // Toast Notification Acessível
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    // 1. Carrega imediatamente do cache local sem mismatch de hidratação (0ms)
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

      // 2. Identifica o usuário logado para auto-selecionar sua própria escala (apenas na 1ª carga)
      if (!selectedVoluntarioId) {
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
        } catch {
          if (vols.length > 0) {
            setCurrentVolunteer(vols[0]);
            setSelectedVoluntarioId(vols[0].id);
          }
        }
      }

      // 3. Busca ações cadastradas em projetos e oficinas pedagógicas do mês
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
                origem:
                  a.documento_estruturador?.toLowerCase().includes('oficina') ||
                  a.documento_estruturador?.toLowerCase().includes('aula')
                    ? 'pedagogia'
                    : 'projeto',
                cor: a.projetos_sociais?.cor_identificacao || '#0284C7',
                descricao: a.descricao,
              });
            }
          });
        }
      } catch (evErr) {
        console.warn('Erro ao carregar ações:', evErr);
      }
      setEventos(listaEventos);

      // 4. Carrega disponibilidades do banco Supabase delimitadas ao mês corrente
      const listaDisp: DisponibilidadeRecord[] = [];
      const startOfMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const endOfMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

      try {
        const { data: dispData, error: dispErr } = await supabase
          .from('disponibilidades_voluntarios')
          .select('*, voluntarios(id, nome_completo, avatar_url, email)')
          .gte('data_escala', startOfMonth)
          .lte('data_escala', endOfMonth);

        if (!dispErr && dispData) {
          listaDisp.push(...(dispData as DisponibilidadeRecord[]));
        }
      } catch (dispErr) {
        console.warn('Fallback para cache local de disponibilidades:', dispErr);
      }

      // B. Complementa com cache local se offline
      try {
        const localStored =
          typeof window !== 'undefined'
            ? localStorage.getItem(`elo_disponibilidades_${currentYear}_${currentMonth}`)
            : null;
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
      } catch {}

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
      showToast('Erro ao atualizar dados da escala.', 'error');
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

  // Troca o voluntário ativo para preenchimento de escala
  const handleSelectVolunteer = (volId: string) => {
    setSelectedVoluntarioId(volId);
    const found = voluntarios.find((v) => v.id === volId);
    if (found) setCurrentVolunteer(found);
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

  // Total de dias do mês atual
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  // Lista de dias para o grid do calendário
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [currentYear, currentMonth, daysInMonth]);

  // Lista de dias para o modo Agenda móvel
  const agendaDays = useMemo(() => {
    const list: number[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dayOfWeek = new Date(currentYear, currentMonth, i).getDay();
      const hasEvents = (eventosByDay[i] || []).length > 0;
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      if (agendaFiltro === 'com_acoes' && !hasEvents) continue;
      if (agendaFiltro === 'fins_de_semana' && !isWeekend) continue;

      list.push(i);
    }
    return list;
  }, [currentYear, currentMonth, daysInMonth, agendaFiltro, eventosByDay]);

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
        } catch {}
        return updated;
      });

      setSelectedDayModal(null);
      showToast('Disponibilidade atualizada com sucesso!', 'success');
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      showToast('Erro ao registrar disponibilidade.', 'error');
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
      {/* Toast Notification Acessível */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-3 duration-200"
        >
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold border ${
              toast.type === 'success'
                ? 'bg-[var(--bg-elevated)] border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'bg-[var(--bg-elevated)] border-rose-500 text-rose-600 dark:text-rose-400'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* ── 1. MICRO-KPIS DA ESCALA MENSAL (PURPLE BAN ELIMINADO) ── */}
      {loading && voluntarios.length === 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)]" />
          ))}
        </div>
      ) : (
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
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
                Ações &amp; Encontros
              </p>
              <p className="text-lg sm:text-xl font-display font-extrabold text-sky-600 dark:text-sky-400">
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
                Dias Disponíveis
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
      )}

      {/* ── 2. BARRA DE NAVEGAÇÃO & SELETOR DE VOLUNTÁRIO (COORDENADOR/GESTÃO) ── */}
      <div className="p-3.5 sm:p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Navegação de Mês com Touch Targets de 44px */}
        <div className="flex items-center gap-2 justify-between md:justify-start">
          <button
            onClick={handlePrevMonth}
            className="w-11 h-11 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-colors flex items-center justify-center cursor-pointer touch-manipulation"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="font-display font-bold text-base sm:text-lg text-[var(--text-primary)] min-w-[170px] text-center">
            {MESES_NOMES[currentMonth]} {currentYear}
          </h3>
          <button
            onClick={handleNextMonth}
            className="w-11 h-11 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-colors flex items-center justify-center cursor-pointer touch-manipulation"
            aria-label="Próximo mês"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Seletor Dinâmico de Voluntário (Permite a Coordenadores alterar escala de qualquer voluntário) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="min-w-[240px]">
            <Select
              aria-label="Selecionar voluntário para visualizar e preencher escala"
              value={selectedVoluntarioId}
              onChange={(e) => handleSelectVolunteer(e.target.value)}
              className="text-base sm:text-xs font-semibold"
            >
              {voluntarios.map((vol) => (
                <option key={vol.id} value={vol.id}>
                  {vol.nome_completo} ({vol.area_atuacao || 'Voluntário'})
                </option>
              ))}
            </Select>
          </div>

          {/* Alternador de Visualização no Mobile (Agenda vs Grade) */}
          <div className="flex sm:hidden items-center p-1 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl self-end">
            <button
              type="button"
              onClick={() => setMobileViewMode('agenda')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all min-h-[44px] cursor-pointer ${
                mobileViewMode === 'agenda'
                  ? 'bg-[var(--bg-elevated)] text-[var(--color-primary)] shadow-xs'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Agenda</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileViewMode('grade')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all min-h-[44px] cursor-pointer ${
                mobileViewMode === 'grade'
                  ? 'bg-[var(--bg-elevated)] text-[var(--color-primary)] shadow-xs'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Grade</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. VISUALIZAÇÃO EM AGENDA TÁTIL MOBILE (SM:HIDDEN QUANDO 'AGENDA') ── */}
      {mobileViewMode === 'agenda' && (
        <div className="block sm:hidden space-y-3">
          {/* Filtros da Agenda Mobile */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            <button
              type="button"
              onClick={() => setAgendaFiltro('todos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 min-h-[38px] cursor-pointer transition-colors ${
                agendaFiltro === 'todos'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-secondary)]'
              }`}
            >
              Todos os Dias ({daysInMonth})
            </button>
            <button
              type="button"
              onClick={() => setAgendaFiltro('com_acoes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 min-h-[38px] cursor-pointer transition-colors ${
                agendaFiltro === 'com_acoes'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-secondary)]'
              }`}
            >
              Com Ações ({totalEventosNoMes})
            </button>
            <button
              type="button"
              onClick={() => setAgendaFiltro('fins_de_semana')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 min-h-[38px] cursor-pointer transition-colors ${
                agendaFiltro === 'fins_de_semana'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-secondary)]'
              }`}
            >
              Fins de Semana
            </button>
          </div>

          {/* Lista de Cartões Diários da Agenda */}
          <div className="space-y-2.5">
            {agendaDays.map((day) => {
              const dateObj = new Date(currentYear, currentMonth, day);
              const dayOfWeek = dateObj.getDay();
              const isPrimeiroDom = day === primeiroDomingo;
              const dispsDoDia = disponibilidadesByDay[day] || [];
              const eventosDoDia = eventosByDay[day] || [];
              const minhaDisp = dispsDoDia.find((d) => d.voluntario_id === selectedVoluntarioId);

              return (
                <div
                  key={`agenda-day-${day}`}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    minhaDisp?.status_disponibilidade === 'disponivel'
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : minhaDisp?.status_disponibilidade === 'indisponivel'
                      ? 'border-rose-500/30 bg-rose-500/5'
                      : isPrimeiroDom
                      ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary-soft)]/20'
                      : 'border-[var(--border-default)] bg-[var(--bg-elevated)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Bloco de Data */}
                      <div
                        className={`w-12 h-12 rounded-xl border flex flex-col items-center justify-center shrink-0 ${
                          dayOfWeek === 0
                            ? 'border-rose-400/40 bg-rose-500/10 text-rose-600'
                            : 'border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase leading-none">
                          {DIAS_SEMANA[dayOfWeek]}
                        </span>
                        <span className="text-lg font-display font-extrabold leading-none mt-0.5">
                          {day}
                        </span>
                      </div>

                      {/* Informações de Disponibilidade */}
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isPrimeiroDom && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--color-primary)] text-white shadow-2xs">
                              1º Dom: Família
                            </span>
                          )}
                          {minhaDisp ? (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                minhaDisp.status_disponibilidade === 'disponivel'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-rose-600 text-white'
                              }`}
                            >
                              {minhaDisp.status_disponibilidade === 'disponivel'
                                ? `Disponível (${minhaDisp.periodo})`
                                : 'Indisponível'}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[var(--text-muted)] font-medium">
                              Disponibilidade não informada
                            </span>
                          )}
                        </div>

                        {minhaDisp?.observacao && (
                          <p className="text-xs text-[var(--text-secondary)] line-clamp-1 italic">
                            &quot;{minhaDisp.observacao}&quot;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Botão de Ação Tátil 44px */}
                    <Button
                      size="sm"
                      variant={minhaDisp ? 'secondary' : 'primary'}
                      onClick={() => handleOpenDayModal(day)}
                      className="min-h-[44px] px-3.5 text-xs font-bold shrink-0 cursor-pointer"
                    >
                      {minhaDisp ? 'Alterar' : 'Marcar'}
                    </Button>
                  </div>

                  {/* Ações e Outros Voluntários do Dia */}
                  {(eventosDoDia.length > 0 || dispsDoDia.length > 0) && (
                    <div className="mt-3 pt-2.5 border-t border-[var(--border-default)]/60 flex flex-col gap-2">
                      {eventosDoDia.map((ev) => (
                        <div
                          key={ev.id}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20 flex items-center gap-2"
                        >
                          <FolderKanban className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          <span className="truncate">{ev.titulo}</span>
                        </div>
                      ))}

                      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-1">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Equipe disponível:</span>
                          <div className="flex items-center -space-x-1">
                            {dispsDoDia
                              .filter((d) => d.status_disponibilidade === 'disponivel')
                              .slice(0, 4)
                              .map((d) => (
                                <div
                                  key={d.voluntario_id}
                                  className="w-5 h-5 rounded-full bg-[var(--color-primary-soft)] border border-[var(--bg-elevated)] text-[9px] font-bold text-[var(--color-primary)] flex items-center justify-center shrink-0"
                                  title={d.voluntarios?.nome_completo || 'Voluntário'}
                                >
                                  {d.voluntarios?.nome_completo?.charAt(0).toUpperCase() || 'V'}
                                </div>
                              ))}
                          </div>
                        </div>
                        <span className="font-bold text-[var(--text-primary)]">
                          {dispsDoDia.filter((d) => d.status_disponibilidade === 'disponivel').length} voluntários
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 4. GRADE MENSAL DE DIAS (DESKTOP E OPÇÃO MOBILE 'GRADE') ── */}
      <div className={mobileViewMode === 'grade' ? 'block' : 'hidden sm:block'}>
        <Card className="p-4 sm:p-5 overflow-x-auto space-y-3">
          {/* Legenda dos Tokens e Cores */}
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
                <span className="w-2.5 h-2.5 rounded bg-sky-500" />
                <span className="text-[var(--text-primary)] font-medium">Ações / Oficinas Cadastradas</span>
              </div>
            </div>
            <span className="text-[10px] text-[var(--text-muted)] italic">
              Toque no dia para registrar ou alterar a disponibilidade
            </span>
          </div>

          <div className="min-w-[700px]">
            {/* Cabeçalho dos Dias da Semana */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[11px] font-bold text-[var(--text-muted)] uppercase">
              {DIAS_SEMANA.map((d, i) => (
                <div key={d} className={i === 0 ? 'text-rose-500 font-extrabold' : ''}>
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

                // Disponibilidade do voluntário selecionado neste dia
                const minhaDisp = dispsDoDia.find((d) => d.voluntario_id === selectedVoluntarioId);

                return (
                  <div
                    key={`day-${day}`}
                    onClick={() => handleOpenDayModal(day)}
                    className={`h-32 p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer hover:shadow-md ${
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
                      <span className="text-xs font-bold text-[var(--text-primary)]">{day}</span>
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

                    {/* Ações e Eventos Cadastrados no Dia (Sem Purple Ban) */}
                    <div className="space-y-1 overflow-hidden my-1">
                      {eventosDoDia.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className="text-[9px] truncate px-1.5 py-0.5 rounded font-bold bg-sky-500/10 text-sky-800 dark:text-sky-200 border border-sky-500/20 flex items-center gap-1"
                          title={ev.titulo}
                        >
                          <FolderKanban className="w-2.5 h-2.5 shrink-0 text-sky-600" />
                          <span className="truncate">{ev.titulo}</span>
                        </div>
                      ))}
                      {eventosDoDia.length > 2 && (
                        <span className="text-[8px] font-bold text-sky-600 pl-1 block">
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
      </div>

      {/* ── 5. MODAL DE DISPONIBILIDADE DO DESIGN SYSTEM COM TOKENS OFICIAIS ── */}
      {selectedDayModal !== null && (
        <Modal
          isOpen={selectedDayModal !== null}
          onClose={() => setSelectedDayModal(null)}
          title={`Disponibilidade em ${selectedDayModal} de ${MESES_NOMES[currentMonth]}`}
          subtitle={`Preenchendo escala de: ${currentVolunteer?.nome_completo || 'Voluntário'}`}
          icon={<Calendar className="w-5 h-5 text-[var(--color-primary)]" />}
          footer={
            <div className="flex items-center justify-end gap-2.5 w-full">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setSelectedDayModal(null)}
                className="min-h-[44px]"
              >
                Cancelar
              </Button>
              <Button
                size="md"
                icon={<Save className="w-4 h-4" />}
                disabled={savingDisp}
                onClick={handleSalvarDisponibilidade}
                className="min-h-[44px]"
              >
                {savingDisp ? 'Salvando...' : 'Confirmar Disponibilidade'}
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-sm">
            {/* Botões de Escolha: Disponível vs Indisponível com Touch Targets de 48px */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setModalStatus('disponivel')}
                className={`p-3.5 rounded-xl flex items-center justify-center gap-2 font-bold transition-all cursor-pointer min-h-[48px] ${
                  modalStatus === 'disponivel'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-secondary)]/80'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Estou Disponível
              </button>

              <button
                type="button"
                onClick={() => setModalStatus('indisponivel')}
                className={`p-3.5 rounded-xl flex items-center justify-center gap-2 font-bold transition-all cursor-pointer min-h-[48px] ${
                  modalStatus === 'indisponivel'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-secondary)]/80'
                }`}
              >
                <XCircle className="w-4 h-4" />
                Indisponível
              </button>
            </div>

            {/* Turno / Período (Apenas quando disponível) */}
            {modalStatus === 'disponivel' && (
              <Select
                label="Turno / Período de Disponibilidade"
                value={modalPeriodo}
                onChange={(e) => setModalPeriodo(e.target.value as any)}
              >
                <option value="integral">Integral (Manhã e Tarde)</option>
                <option value="manha">Apenas Manhã</option>
                <option value="tarde">Apenas Tarde</option>
                <option value="noite">Apenas Noite / Encontro</option>
              </Select>
            )}

            {/* Observações com Estilo do Design System e Prevenção de Auto-zoom no iOS */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-secondary)]">
                Observação (Opcional)
              </label>
              <textarea
                value={modalObs}
                onChange={(e) => setModalObs(e.target.value)}
                placeholder="Ex: Disponível para oficinas pedagógicas ou apoio na acolhida comunitária."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl text-base sm:text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)] resize-none"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
