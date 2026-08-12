'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import {
  Heart,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  Coffee,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  Home,
  XCircle,
  Info,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────
interface Voluntario {
  id: string;
  nome_completo: string;
  tipo: string;
  area_atuacao: string | null;
  status: string;
  avatar_url: string | null;
}

interface RecessoRecord {
  id: string;
  voluntario_id: string;
  data_folga: string;
  tipo: 'coletiva' | 'individual';
  motivo: string | null;
  status: 'pendente' | 'aprovada' | 'recusada';
  mes_referencia: number;
  ano_referencia: number;
  voluntarios?: Voluntario;
}

interface ConfigRecesso {
  id?: string;
  mes: number;
  ano: number;
  dia_familia_ativo: boolean;
  motivo_desativacao: string | null;
}

// ─── Constants ───────────────────────────────────────────
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// ─── Helpers ─────────────────────────────────────────────
function getPrimeiroDomingo(year: number, month: number): number {
  const firstDay = new Date(year, month, 1);
  const dayOfWeek = firstDay.getDay();
  return dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
}

function getUltimoFinalDeSemana(year: number, month: number): Date[] {
  const lastDay = new Date(year, month + 1, 0);
  const dates: Date[] = [];
  for (let d = lastDay.getDate(); d >= lastDay.getDate() - 6; d--) {
    const date = new Date(year, month, d);
    if (date.getDay() === 0 || date.getDay() === 6) {
      dates.push(date);
    }
  }
  return dates;
}

function formatDateBR(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Component ───────────────────────────────────────────
export default function RecessoPage() {
  const supabase = createClient();

  // Navigation
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Data
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [recessos, setRecessos] = useState<RecessoRecord[]>([]);
  const [configRecesso, setConfigRecesso] = useState<ConfigRecesso | null>(null);
  const [loading, setLoading] = useState(true);

  // UI state
  const [activeTab, setActiveTab] = useState<'calendario' | 'tabela' | 'admin'>('calendario');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Solicitar Folga form
  const [folgaVoluntarioId, setFolgaVoluntarioId] = useState('');
  const [folgaData, setFolgaData] = useState('');
  const [folgaMotivo, setFolgaMotivo] = useState('');
  const [folgaSubmitting, setFolgaSubmitting] = useState(false);
  const [folgaError, setFolgaError] = useState<string | null>(null);
  const [folgaSuccess, setFolgaSuccess] = useState(false);
  const [showUltimoFdsWarning, setShowUltimoFdsWarning] = useState(false);

  // Admin toggle
  const [adminMotivo, setAdminMotivo] = useState('');
  const [adminSaving, setAdminSaving] = useState(false);

  // ─── Data Loading ──────────────────────────────────────
  useEffect(() => {
    loadData();
  }, [currentMonth, currentYear]);

  async function loadData() {
    try {
      setLoading(true);
      const [respVol, respRec, respConfig] = await Promise.all([
        supabase.from('voluntarios').select('id, nome_completo, tipo, area_atuacao, status, avatar_url').eq('status', 'ativo').order('nome_completo'),
        supabase.from('recessos_voluntarios').select('*, voluntarios(id, nome_completo, tipo, area_atuacao, avatar_url)').eq('mes_referencia', currentMonth + 1).eq('ano_referencia', currentYear),
        supabase.from('configuracoes_recesso').select('*').eq('mes', currentMonth + 1).eq('ano', currentYear).maybeSingle(),
      ]);

      setVoluntarios(respVol.data || []);
      setRecessos((respRec.data || []) as RecessoRecord[]);
      setConfigRecesso(respConfig.data as ConfigRecesso | null);
    } catch (err) {
      console.error('Erro ao carregar dados de recesso:', err);
    } finally {
      setLoading(false);
    }
  }

  // ─── Derived Data ──────────────────────────────────────
  const primeiroDomingo = getPrimeiroDomingo(currentYear, currentMonth);
  const diaFamiliaAtivo = configRecesso?.dia_familia_ativo !== false;

  const ultimoFds = useMemo(() => getUltimoFinalDeSemana(currentYear, currentMonth), [currentYear, currentMonth]);
  const ultimoFdsDates = useMemo(() => ultimoFds.map(d => d.getDate()), [ultimoFds]);

  // Map: day number -> recessos for that day
  const recessosByDay = useMemo(() => {
    const map: Record<number, RecessoRecord[]> = {};
    recessos.forEach(r => {
      const day = new Date(r.data_folga + 'T12:00:00').getDate();
      if (!map[day]) map[day] = [];
      map[day].push(r);
    });
    return map;
  }, [recessos]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [currentYear, currentMonth]);

  // Stats
  const totalVoluntariosAtivos = voluntarios.length;
  const folgasColetivas = recessos.filter(r => r.tipo === 'coletiva').length;
  const folgasIndividuais = recessos.filter(r => r.tipo === 'individual' && r.status === 'aprovada').length;

  // Per-volunteer leave count
  const folgasPorVoluntario = useMemo(() => {
    const map: Record<string, { coletiva: number; individual: number }> = {};
    voluntarios.forEach(v => { map[v.id] = { coletiva: 0, individual: 0 }; });
    recessos.forEach(r => {
      if (r.status === 'aprovada' || r.tipo === 'coletiva') {
        if (!map[r.voluntario_id]) map[r.voluntario_id] = { coletiva: 0, individual: 0 };
        map[r.voluntario_id][r.tipo]++;
      }
    });
    return map;
  }, [voluntarios, recessos]);

  // ─── Navigation ────────────────────────────────────────
  const handlePrevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));

  // ─── Admin: Toggle Dia da Família ──────────────────────
  const handleToggleDiaFamilia = async () => {
    setAdminSaving(true);
    try {
      const newValue = !diaFamiliaAtivo;

      if (!newValue && !adminMotivo.trim()) {
        alert('Por favor, informe o motivo da desativação do Dia da Família.');
        setAdminSaving(false);
        return;
      }

      if (configRecesso?.id) {
        await supabase.from('configuracoes_recesso').update({
          dia_familia_ativo: newValue,
          motivo_desativacao: newValue ? null : adminMotivo.trim(),
          updated_at: new Date().toISOString(),
        }).eq('id', configRecesso.id);
      } else {
        await supabase.from('configuracoes_recesso').insert({
          mes: currentMonth + 1,
          ano: currentYear,
          dia_familia_ativo: newValue,
          motivo_desativacao: newValue ? null : adminMotivo.trim(),
        });
      }

      setAdminMotivo('');
      loadData();
    } catch (err) {
      console.error('Erro ao atualizar configuração:', err);
    } finally {
      setAdminSaving(false);
    }
  };

  // ─── Solicitar Folga Individual ────────────────────────
  const handleFolgaDateChange = (dateStr: string) => {
    setFolgaData(dateStr);
    setShowUltimoFdsWarning(false);

    if (dateStr) {
      const date = new Date(dateStr + 'T12:00:00');
      const isUltimoFds = ultimoFds.some(d =>
        d.getDate() === date.getDate() && d.getMonth() === date.getMonth()
      );
      setShowUltimoFdsWarning(isUltimoFds);
    }
  };

  const handleSubmitFolga = async () => {
    if (!folgaVoluntarioId || !folgaData) {
      setFolgaError('Selecione o voluntário e a data da folga.');
      return;
    }

    setFolgaSubmitting(true);
    setFolgaError(null);

    try {
      const date = new Date(folgaData + 'T12:00:00');

      // Verificar se já tem 1 folga individual no mês
      const existingIndividual = recessos.filter(
        r => r.voluntario_id === folgaVoluntarioId && r.tipo === 'individual' && r.status === 'aprovada'
      );
      if (existingIndividual.length >= 1) {
        setFolgaError('Este voluntário já utilizou sua folga individual neste mês.');
        setFolgaSubmitting(false);
        return;
      }

      const { error } = await supabase.from('recessos_voluntarios').insert({
        voluntario_id: folgaVoluntarioId,
        data_folga: folgaData,
        tipo: 'individual',
        motivo: folgaMotivo || null,
        status: 'aprovada',
        mes_referencia: date.getMonth() + 1,
        ano_referencia: date.getFullYear(),
      });

      if (error) {
        if (error.message.includes('unique')) {
          setFolgaError('Este voluntário já tem uma folga registrada nesta data.');
        } else {
          setFolgaError(error.message);
        }
      } else {
        setFolgaSuccess(true);
        setFolgaVoluntarioId('');
        setFolgaData('');
        setFolgaMotivo('');
        setTimeout(() => setFolgaSuccess(false), 3000);
        loadData();
      }
    } catch (err: any) {
      setFolgaError(err.message || 'Erro ao registrar folga.');
    } finally {
      setFolgaSubmitting(false);
    }
  };

  // ─── Render ────────────────────────────────────────────
  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Saúde & Recesso — Ádapo Cuidar"
        subtitle="Gestão de folgas, bem-estar e saúde dos voluntários do Instituto Ádapo"
        action={
          <Link href="/dashboard/voluntarios">
            <Button variant="secondary" size="sm" icon={<Users className="w-4 h-4" />}>
              Cadastro de Voluntários
            </Button>
          </Link>
        }
      />

      <div className="p-8 space-y-6 flex-1 overflow-y-auto">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Voluntários Ativos</span>
            </div>
            <p className="text-2xl font-bold font-display text-[var(--text-primary)]">{totalVoluntariosAtivos}</p>
          </Card>

          <Card className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-[var(--color-success)]">
              <Home className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Dia da Família</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold font-display text-[var(--text-primary)]">
                {primeiroDomingo}/{String(currentMonth + 1).padStart(2, '0')}
              </p>
              <Badge variant={diaFamiliaAtivo ? 'success' : 'danger'}>
                {diaFamiliaAtivo ? 'ATIVO' : 'DESATIVADO'}
              </Badge>
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-[var(--color-primary)]">
              <Coffee className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Folgas Individuais</span>
            </div>
            <p className="text-2xl font-bold font-display text-[var(--text-primary)]">
              {folgasIndividuais}
              <span className="text-sm font-normal text-[var(--text-muted)]"> / {totalVoluntariosAtivos}</span>
            </p>
          </Card>

          <Card className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-[var(--color-accent-purple)]">
              <Heart className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Total de Folgas</span>
            </div>
            <p className="text-2xl font-bold font-display text-[var(--text-primary)]">
              {folgasColetivas + folgasIndividuais}
              <span className="text-sm font-normal text-[var(--text-muted)]"> este mês</span>
            </p>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('calendario')}
            className={`px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2 ${activeTab === 'calendario' ? 'tab-btn-active' : 'tab-btn-unselected'}`}
          >
            <Calendar className="w-4 h-4" />
            Calendário de Folgas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tabela')}
            className={`px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2 ${activeTab === 'tabela' ? 'tab-btn-active' : 'tab-btn-unselected'}`}
          >
            <Users className="w-4 h-4" />
            Voluntários & Folgas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2 ${activeTab === 'admin' ? 'tab-btn-active' : 'tab-btn-unselected'}`}
          >
            <Shield className="w-4 h-4" />
            Painel do Coordenador
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[var(--text-muted)]">Carregando dados de recesso...</div>
        ) : (
          <>
            {/* ═══════ TAB: CALENDÁRIO ═══════ */}
            {activeTab === 'calendario' && (
              <Card className="p-6 space-y-4">
                {/* Header do Calendário */}
                <div className="flex items-center justify-between">
                  <button type="button" onClick={handlePrevMonth} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
                    <ChevronLeft className="w-5 h-5 text-[var(--text-secondary)]" />
                  </button>
                  <h2 className="text-lg font-bold font-display text-[var(--text-primary)]">
                    {MESES_NOMES[currentMonth]} {currentYear}
                  </h2>
                  <button type="button" onClick={handleNextMonth} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
                    <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
                  </button>
                </div>

                {/* Legenda */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[var(--color-success)]" />
                    <span>Dia da Família (1º Dom)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[var(--color-primary)]" />
                    <span>Folga Individual</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[var(--color-warning)]" />
                    <span>Último Final de Semana (Atenção)</span>
                  </div>
                </div>

                {/* Grade do Calendário */}
                <div className="grid grid-cols-7 gap-1">
                  {DIAS_SEMANA.map(d => (
                    <div key={d} className="text-center text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] py-2">
                      {d}
                    </div>
                  ))}

                  {calendarDays.map((day, i) => {
                    if (day === null) return <div key={`empty-${i}`} className="aspect-square" />;

                    const isPrimeiroDomingo = day === primeiroDomingo;
                    const isToday = isCurrentMonth && today.getDate() === day;
                    const isUltimoFds = ultimoFdsDates.includes(day);
                    const dayRecessos = recessosByDay[day] || [];
                    const hasFolgaIndividual = dayRecessos.some(r => r.tipo === 'individual');

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-all relative border
                          ${isToday ? 'ring-2 ring-[var(--color-primary)] ring-offset-1' : ''}
                          ${selectedDay === day ? 'bg-[var(--color-primary-soft)] border-[var(--color-primary)]' : 'border-transparent hover:bg-[var(--bg-secondary)]'}
                          ${isPrimeiroDomingo && diaFamiliaAtivo ? 'bg-[var(--color-success-soft)]' : ''}
                          ${isUltimoFds ? 'bg-[var(--color-warning-soft)]/50' : ''}
                        `}
                      >
                        <span className={`${isPrimeiroDomingo && diaFamiliaAtivo ? 'text-[var(--color-success)] font-bold' : 'text-[var(--text-primary)]'}`}>
                          {day}
                        </span>

                        {/* Indicators */}
                        <div className="flex items-center gap-0.5">
                          {isPrimeiroDomingo && diaFamiliaAtivo && (
                            <Home className="w-3 h-3 text-[var(--color-success)]" />
                          )}
                          {hasFolgaIndividual && (
                            <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                          )}
                          {dayRecessos.length > 1 && (
                            <span className="text-[9px] font-bold text-[var(--color-primary)]">
                              +{dayRecessos.length}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Detail: Selected Day */}
                {selectedDay !== null && (
                  <div className="mt-4 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] space-y-3">
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      {selectedDay} de {MESES_NOMES[currentMonth]} de {currentYear}
                      {selectedDay === primeiroDomingo && diaFamiliaAtivo && (
                        <Badge variant="success" className="ml-2">Dia da Família</Badge>
                      )}
                    </h3>

                    {(recessosByDay[selectedDay] || []).length === 0 ? (
                      <p className="text-xs text-[var(--text-muted)]">Nenhuma folga registrada neste dia.</p>
                    ) : (
                      <div className="space-y-2">
                        {(recessosByDay[selectedDay] || []).map(r => (
                          <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)]">
                            <div className="w-8 h-8 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold flex items-center justify-center text-xs shrink-0">
                              {r.voluntarios?.nome_completo?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                                {r.voluntarios?.nome_completo || 'Voluntário'}
                              </p>
                              <p className="text-[11px] text-[var(--text-muted)]">
                                {r.tipo === 'coletiva' ? 'Folga Coletiva (Dia da Família)' : 'Folga Individual'}
                                {r.motivo ? ` • ${r.motivo}` : ''}
                              </p>
                            </div>
                            <Badge variant={r.tipo === 'coletiva' ? 'success' : 'primary'} className="shrink-0">
                              {r.tipo === 'coletiva' ? 'Coletiva' : 'Individual'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Solicitar Folga */}
                <div className="mt-4 p-5 rounded-xl border-2 border-dashed border-[var(--border-strong)] bg-[var(--bg-elevated)] space-y-4">
                  <div className="flex items-center gap-2">
                    <Coffee className="w-5 h-5 text-[var(--color-primary)]" />
                    <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">Registrar Folga Individual</h3>
                  </div>

                  {folgaSuccess && (
                    <div className="p-3 rounded-lg bg-[var(--color-success-soft)] text-[var(--color-success)] text-xs font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Folga registrada com sucesso!
                    </div>
                  )}

                  {folgaError && (
                    <div className="p-3 rounded-lg bg-[var(--color-danger-soft)] text-[var(--color-danger)] text-xs font-medium flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      {folgaError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Select
                      label="Voluntário"
                      value={folgaVoluntarioId}
                      onChange={(e) => setFolgaVoluntarioId(e.target.value)}
                      options={[
                        { value: '', label: 'Selecione...' },
                        ...voluntarios.map(v => ({ value: v.id, label: v.nome_completo })),
                      ]}
                    />
                    <div>
                      <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Data da Folga</label>
                      <input
                        type="date"
                        value={folgaData}
                        onChange={(e) => handleFolgaDateChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] focus:outline-none focus:border-[var(--color-primary)]"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Motivo (opcional)</label>
                      <input
                        type="text"
                        value={folgaMotivo}
                        onChange={(e) => setFolgaMotivo(e.target.value)}
                        placeholder="Ex: Consulta médica"
                        className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] focus:outline-none focus:border-[var(--color-primary)] placeholder:text-[var(--text-muted)]"
                      />
                    </div>
                  </div>

                  {showUltimoFdsWarning && (
                    <div className="p-3 rounded-lg bg-[var(--color-warning-soft)] text-[var(--color-warning)] text-xs font-medium flex items-start gap-2 border border-[var(--color-warning)]/20">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Atenção: Último Final de Semana</p>
                        <p>Esta data coincide com o último final de semana do mês, quando ocorrem encontros externos. Recomendamos escolher outro dia. A folga será registrada mediante sua confirmação.</p>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleSubmitFolga}
                    disabled={folgaSubmitting || !folgaVoluntarioId || !folgaData}
                    icon={<Coffee className="w-4 h-4" />}
                    size="sm"
                  >
                    {folgaSubmitting ? 'Registrando...' : 'Confirmar Folga'}
                  </Button>
                </div>
              </Card>
            )}

            {/* ═══════ TAB: TABELA DE VOLUNTÁRIOS & FOLGAS ═══════ */}
            {activeTab === 'tabela' && (
              <Card className="p-0 overflow-hidden">
                <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between">
                  <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                    Controle de Folgas — {MESES_NOMES[currentMonth]} {currentYear}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={handlePrevMonth} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
                      <ChevronLeft className="w-4 h-4 text-[var(--text-secondary)]" />
                    </button>
                    <button type="button" onClick={handleNextMonth} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
                      <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[var(--bg-secondary)]">
                        <th className="text-left px-4 py-3 font-semibold text-[var(--text-muted)] uppercase tracking-wider">Voluntário</th>
                        <th className="text-left px-4 py-3 font-semibold text-[var(--text-muted)] uppercase tracking-wider">Área</th>
                        <th className="text-center px-4 py-3 font-semibold text-[var(--text-muted)] uppercase tracking-wider">Folga Coletiva</th>
                        <th className="text-center px-4 py-3 font-semibold text-[var(--text-muted)] uppercase tracking-wider">Folga Individual</th>
                        <th className="text-center px-4 py-3 font-semibold text-[var(--text-muted)] uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-default)]">
                      {voluntarios.map(v => {
                        const counts = folgasPorVoluntario[v.id] || { coletiva: 0, individual: 0 };
                        const total = counts.coletiva + counts.individual;
                        const individualRec = recessos.find(r => r.voluntario_id === v.id && r.tipo === 'individual' && r.status === 'aprovada');

                        return (
                          <tr key={v.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden">
                                  {v.avatar_url ? (
                                    <img src={v.avatar_url} alt={v.nome_completo} className="w-full h-full object-cover" />
                                  ) : (
                                    v.nome_completo.charAt(0)
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-[var(--text-primary)]">{v.nome_completo}</p>
                                  <p className="text-[10px] text-[var(--text-muted)]">
                                    {v.tipo === 'operacional' ? 'Operacional' : 'Externo'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-[var(--text-secondary)]">{v.area_atuacao || 'Geral'}</td>
                            <td className="px-4 py-3 text-center">
                              {diaFamiliaAtivo ? (
                                <Badge variant="success">
                                  <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                                  {primeiroDomingo}/{String(currentMonth + 1).padStart(2, '0')}
                                </Badge>
                              ) : (
                                <Badge variant="danger">
                                  <XCircle className="w-3 h-3 mr-1 inline" />
                                  Desativada
                                </Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {individualRec ? (
                                <Badge variant="primary">
                                  📅 {formatDateBR(individualRec.data_folga)}
                                </Badge>
                              ) : (
                                <span className="text-[var(--text-muted)] flex items-center justify-center gap-1">
                                  <Clock className="w-3 h-3" /> Pendente
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`font-bold ${total >= 2 ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'}`}>
                                {total}/2
                              </span>
                            </td>
                          </tr>
                        );
                      })}

                      {voluntarios.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-12 text-center text-[var(--text-muted)]">
                            Nenhum voluntário ativo encontrado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* ═══════ TAB: PAINEL DO COORDENADOR ═══════ */}
            {activeTab === 'admin' && (
              <div className="space-y-6">
                {/* Toggle Dia da Família */}
                <Card className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[var(--color-success-soft)] text-[var(--color-success)]">
                      <Home className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                        Dia da Família — 1º Domingo do Mês
                      </h3>
                      <p className="text-xs text-[var(--text-muted)]">
                        Folga coletiva obrigatória para todos os voluntários ativos. O coordenador pode desativar em meses excepcionais.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          Status para {MESES_NOMES[currentMonth]} {currentYear}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          1º Domingo: dia {primeiroDomingo}/{String(currentMonth + 1).padStart(2, '0')}/{currentYear}
                        </p>
                      </div>
                      <Badge variant={diaFamiliaAtivo ? 'success' : 'danger'} className="text-sm px-4 py-1.5">
                        {diaFamiliaAtivo ? '✅ ATIVO' : '⚠️ DESATIVADO'}
                      </Badge>
                    </div>

                    {!diaFamiliaAtivo && configRecesso?.motivo_desativacao && (
                      <div className="p-3 rounded-lg bg-[var(--color-danger-soft)] text-[var(--color-danger)] text-xs flex items-start gap-2">
                        <Info className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Motivo da desativação:</p>
                          <p>{configRecesso.motivo_desativacao}</p>
                        </div>
                      </div>
                    )}

                    {diaFamiliaAtivo && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">
                            Motivo da Desativação (obrigatório)
                          </label>
                          <input
                            type="text"
                            value={adminMotivo}
                            onChange={(e) => setAdminMotivo(e.target.value)}
                            placeholder="Ex: Evento institucional urgente que requer presença de toda a equipe"
                            className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-default)] focus:outline-none focus:border-[var(--color-primary)] placeholder:text-[var(--text-muted)]"
                          />
                        </div>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={handleToggleDiaFamilia}
                          disabled={adminSaving || !adminMotivo.trim()}
                          icon={<XCircle className="w-4 h-4" />}
                        >
                          {adminSaving ? 'Salvando...' : 'Desativar Dia da Família neste mês'}
                        </Button>
                      </div>
                    )}

                    {!diaFamiliaAtivo && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleToggleDiaFamilia}
                        disabled={adminSaving}
                        icon={<CheckCircle2 className="w-4 h-4" />}
                      >
                        {adminSaving ? 'Salvando...' : 'Reativar Dia da Família'}
                      </Button>
                    )}
                  </div>
                </Card>

                {/* Sobre o Sistema */}
                <Card className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                      <Heart className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                        Sobre o Sistema de Recesso
                      </h3>
                    </div>
                  </div>

                  <div className="prose prose-sm text-[var(--text-secondary)] text-xs leading-relaxed space-y-2">
                    <p>
                      A folga, tão negligenciada atualmente devido à pressão por produtividade, é muito importante e essencial neste contexto de voluntariado.
                      O descanso funciona como uma estratégia para a saúde física e mental do sujeito. Pausas auxiliam na redução de níveis de estresse,
                      melhorando o foco e a criatividade, evitando assim, condições de saúde como o <strong>burnout</strong>.
                    </p>
                    <p>
                      O sistema de recesso vem como uma estratégia de <strong>saúde e qualidade de trabalho</strong>, pensando no bem-estar e qualidade de vida
                      dos voluntários do Instituto Ádapo. Reconhecendo o <strong>direito ao descanso</strong> como forma de cuidado e lazer.
                    </p>

                    <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] not-prose space-y-2 mt-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">Regras do Recesso</h4>
                      <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                        <li className="flex items-start gap-2">
                          <Home className="w-3.5 h-3.5 text-[var(--color-success)] shrink-0 mt-0.5" />
                          <span><strong>Folga Coletiva:</strong> Todo 1º Domingo do mês é o Dia da Família — sem atividades.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Coffee className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0 mt-0.5" />
                          <span><strong>Folga Individual:</strong> 1 folga de livre escolha por mês, priorizando presença no último final de semana.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Shield className="w-3.5 h-3.5 text-[var(--color-accent-purple)] shrink-0 mt-0.5" />
                          <span><strong>Override Admin:</strong> O coordenador pode desativar o Dia da Família em meses excepcionais com justificativa.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
