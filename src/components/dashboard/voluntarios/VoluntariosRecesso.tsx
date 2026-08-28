'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
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
  UserCheck,
} from 'lucide-react';
import { Voluntario } from './VoluntariosEquipe';

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

export function VoluntariosRecesso() {
  const supabase = createClient();

  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [recessos, setRecessos] = useState<RecessoRecord[]>([]);
  const [configRecesso, setConfigRecesso] = useState<ConfigRecesso | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeSubTab, setActiveSubTab] = useState<'calendario' | 'tabela' | 'admin'>('calendario');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const [folgaVoluntarioId, setFolgaVoluntarioId] = useState('');
  const [folgaData, setFolgaData] = useState('');
  const [folgaMotivo, setFolgaMotivo] = useState('');
  const [folgaSubmitting, setFolgaSubmitting] = useState(false);
  const [folgaError, setFolgaError] = useState<string | null>(null);
  const [folgaSuccess, setFolgaSuccess] = useState(false);

  const [adminMotivo, setAdminMotivo] = useState('');
  const [adminSaving, setAdminSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentMonth, currentYear]);

  async function loadData() {
    try {
      setLoading(true);
      const [respVol, respRec, respConfig] = await Promise.all([
        supabase.from('voluntarios').select('*').eq('status', 'ativo').order('nome_completo'),
        supabase
          .from('recessos_voluntarios')
          .select('*, voluntarios(*)')
          .eq('mes_referencia', currentMonth + 1)
          .eq('ano_referencia', currentYear),
        supabase
          .from('configuracoes_recesso')
          .select('*')
          .eq('mes', currentMonth + 1)
          .eq('ano', currentYear)
          .maybeSingle(),
      ]);

      setVoluntarios((respVol.data || []) as Voluntario[]);
      setRecessos((respRec.data || []) as RecessoRecord[]);
      setConfigRecesso(respConfig.data as ConfigRecesso | null);
    } catch (err) {
      console.error('Erro ao carregar dados de recesso:', err);
    } finally {
      setLoading(false);
    }
  }

  const primeiroDomingo = getPrimeiroDomingo(currentYear, currentMonth);
  const diaFamiliaAtivo = configRecesso?.dia_familia_ativo !== false;

  const ultimoFds = useMemo(() => getUltimoFinalDeSemana(currentYear, currentMonth), [currentYear, currentMonth]);
  const ultimoFdsDates = useMemo(() => ultimoFds.map((d) => d.getDate()), [ultimoFds]);

  const recessosByDay = useMemo(() => {
    const map: Record<number, RecessoRecord[]> = {};
    recessos.forEach((r) => {
      const day = new Date(r.data_folga + 'T12:00:00').getDate();
      if (!map[day]) map[day] = [];
      map[day].push(r);
    });
    return map;
  }, [recessos]);

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [currentYear, currentMonth]);

  const totalVoluntariosAtivos = voluntarios.length;
  const folgasColetivas = recessos.filter((r) => r.tipo === 'coletiva').length;
  const folgasIndividuais = recessos.filter((r) => r.tipo === 'individual' && r.status === 'aprovada').length;

  const handlePrevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));

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
        await supabase
          .from('configuracoes_recesso')
          .update({
            dia_familia_ativo: newValue,
            motivo_desativacao: newValue ? null : adminMotivo.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', configRecesso.id);
      } else {
        await supabase.from('configuracoes_recesso').insert({
          mes: currentMonth + 1,
          ano: currentYear,
          dia_familia_ativo: newValue,
          motivo_desativacao: newValue ? null : adminMotivo.trim(),
        });
      }

      await loadData();
      setAdminMotivo('');
    } catch (err) {
      console.error('Erro ao alterar Dia da Família:', err);
    } finally {
      setAdminSaving(false);
    }
  };

  const handleSolicitarFolga = async (e: React.FormEvent) => {
    e.preventDefault();
    setFolgaError(null);
    setFolgaSuccess(false);

    if (!folgaVoluntarioId || !folgaData) {
      setFolgaError('Selecione o voluntário e a data desejada.');
      return;
    }

    setFolgaSubmitting(true);
    try {
      const targetDate = new Date(folgaData + 'T12:00:00');
      const mesRef = targetDate.getMonth() + 1;
      const anoRef = targetDate.getFullYear();

      const { error: insertErr } = await supabase.from('recessos_voluntarios').insert({
        voluntario_id: folgaVoluntarioId,
        data_folga: folgaData,
        tipo: 'individual',
        motivo: folgaMotivo.trim() || null,
        status: 'aprovada',
        mes_referencia: mesRef,
        ano_referencia: anoRef,
      });

      if (insertErr) throw insertErr;

      setFolgaSuccess(true);
      setFolgaVoluntarioId('');
      setFolgaData('');
      setFolgaMotivo('');
      await loadData();
    } catch (err: any) {
      setFolgaError(err.message || 'Erro ao registrar folga.');
    } finally {
      setFolgaSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* ── 1. CARDS DE RESUMO DE RECESSOS (MICRO-KPIS COMPACTOS) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1C9C82]/10 text-[#1C9C82] flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
              Equipe Ativa
            </p>
            <p className="text-lg sm:text-xl font-display font-extrabold text-[var(--text-primary)]">
              {totalVoluntariosAtivos}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
            <Home className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
              Dia da Família
            </p>
            <p className="text-sm font-bold text-[var(--text-primary)] truncate">
              {diaFamiliaAtivo ? `Dia ${primeiroDomingo} (Ativo)` : 'Desativado'}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <Coffee className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
              Folgas Coletivas
            </p>
            <p className="text-lg sm:text-xl font-display font-extrabold text-purple-600">
              {folgasColetivas}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
              Folgas Individuais
            </p>
            <p className="text-lg sm:text-xl font-display font-extrabold text-amber-600">
              {folgasIndividuais}
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. NAVEGAÇÃO ENTRE MESES E SUB-ABAS ── */}
      <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-colors cursor-pointer"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="font-display font-bold text-sm sm:text-base text-[var(--text-primary)] min-w-[180px] text-center">
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

        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)]">
          <button
            onClick={() => setActiveSubTab('calendario')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'calendario'
                ? 'bg-[var(--bg-elevated)] text-[var(--color-primary)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Calendário
          </button>
          <button
            onClick={() => setActiveSubTab('tabela')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'tabela'
                ? 'bg-[var(--bg-elevated)] text-[var(--color-primary)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Solicitar Folga
          </button>
          <button
            onClick={() => setActiveSubTab('admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'admin'
                ? 'bg-[var(--bg-elevated)] text-[var(--color-primary)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Dia da Família
          </button>
        </div>
      </div>

      {/* ── 3. CONTEÚDO DAS SUB-ABAS ── */}
      {activeSubTab === 'calendario' && (
        <Card className="p-4 sm:p-5 overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Dias da Semana */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[11px] font-bold text-[var(--text-muted)] uppercase">
              {DIAS_SEMANA.map((d, i) => (
                <div key={d} className={i === 0 ? 'text-red-500' : ''}>
                  {d}
                </div>
              ))}
            </div>

            {/* Grid de Dias */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="h-20 rounded-xl bg-[var(--bg-secondary)]/30" />;
                }

                const isPrimeiroDom = diaFamiliaAtivo && day === primeiroDomingo;
                const isUltimoFds = ultimoFdsDates.includes(day);
                const recessosDoDia = recessosByDay[day] || [];

                return (
                  <div
                    key={`day-${day}`}
                    onClick={() => setSelectedDay(day)}
                    className={`h-20 p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer ${
                      isPrimeiroDom
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]/20'
                        : isUltimoFds
                        ? 'border-purple-300 bg-purple-500/5'
                        : 'border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--color-primary)]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isPrimeiroDom ? 'text-[var(--color-primary)]' : 'text-[var(--text-primary)]'}`}>
                        {day}
                      </span>
                      {isPrimeiroDom && (
                        <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-[var(--color-primary)] text-white">
                          Família
                        </span>
                      )}
                    </div>

                    <div className="space-y-0.5 overflow-hidden">
                      {recessosDoDia.slice(0, 2).map((r) => (
                        <div
                          key={r.id}
                          className="text-[9px] truncate px-1 py-0.5 rounded bg-[var(--bg-secondary)] font-medium text-[var(--text-primary)]"
                        >
                          {r.voluntarios?.nome_completo?.split(' ')[0] || 'Folga'}
                        </div>
                      ))}
                      {recessosDoDia.length > 2 && (
                        <span className="text-[8px] text-[var(--text-muted)] font-bold block">
                          +{recessosDoDia.length - 2} folgas
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {activeSubTab === 'tabela' && (
        <Card className="p-6 max-w-2xl mx-auto space-y-5">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[var(--color-primary)]" />
              Registrar Folga / Recesso Individual
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Agende o recesso do voluntário para atualização do saldo anual e da escala de presença.
            </p>
          </div>

          {folgaError && (
            <div className="p-3 rounded-xl bg-red-500/10 text-red-600 text-xs font-semibold flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              <span>{folgaError}</span>
            </div>
          )}

          {folgaSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Folga registrada com sucesso!</span>
            </div>
          )}

          <form onSubmit={handleSolicitarFolga} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                Voluntário(a) *
              </label>
              <Select
                options={[
                  { value: '', label: 'Selecione um voluntário...' },
                  ...voluntarios.map((v) => ({
                    value: v.id,
                    label: `${v.nome_completo} (${v.area_atuacao || 'Geral'})`,
                  })),
                ]}
                value={folgaVoluntarioId}
                onChange={(e) => setFolgaVoluntarioId(e.target.value)}
              />
            </div>

            <div>
              <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                Data da Folga *
              </label>
              <input
                type="date"
                value={folgaData}
                onChange={(e) => setFolgaData(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                Motivo / Justificativa (Opcional)
              </label>
              <textarea
                value={folgaMotivo}
                onChange={(e) => setFolgaMotivo(e.target.value)}
                rows={3}
                placeholder="Ex: Assuntos pessoais, viagem ou compensação de horas."
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
              />
            </div>

            <Button
              type="submit"
              className="w-full justify-center"
              disabled={folgaSubmitting}
            >
              {folgaSubmitting ? 'Salvando...' : 'Confirmar Registro de Folga'}
            </Button>
          </form>
        </Card>
      )}

      {activeSubTab === 'admin' && (
        <Card className="p-6 max-w-2xl mx-auto space-y-5">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
              <Shield className="w-5 h-5 text-[var(--color-primary)]" />
              Controle Institucional — Dia da Família
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              O Dia da Família ocorre por padrão no 1º domingo de cada mês. Caso haja evento extraordinário que impeça o recesso coletivo, desative e registre o motivo formal.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/40 flex items-center justify-between">
            <div>
              <p className="font-bold text-sm text-[var(--text-primary)]">
                Status no Mês de {MESES_NOMES[currentMonth]}/{currentYear}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {diaFamiliaAtivo ? `Ativo para o dia ${primeiroDomingo}` : 'Desativado formalmente'}
              </p>
            </div>
            <Button
              variant={diaFamiliaAtivo ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleToggleDiaFamilia}
              disabled={adminSaving}
            >
              {diaFamiliaAtivo ? 'Desativar neste Mês' : 'Reativar Dia da Família'}
            </Button>
          </div>

          {!diaFamiliaAtivo && configRecesso?.motivo_desativacao && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 space-y-1">
              <p className="font-bold uppercase tracking-wider text-[10px]">Justificativa Registrada:</p>
              <p>{configRecesso.motivo_desativacao}</p>
            </div>
          )}

          {diaFamiliaAtivo && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Justificativa para eventual desativação:
              </label>
              <textarea
                value={adminMotivo}
                onChange={(e) => setAdminMotivo(e.target.value)}
                placeholder="Ex: Mutirão de Ação Social com a comunidade ou evento de Dia das Crianças."
                rows={2}
                className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
              />
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
