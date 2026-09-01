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
  Check,
  X,
  Umbrella,
  HelpCircle,
  FileCheck,
  Edit3,
  Trash2,
  Filter,
  Plus,
  Save,
} from 'lucide-react';
import { Voluntario } from './VoluntariosEquipe';

export interface RecessoRecord {
  id: string;
  voluntario_id: string;
  data_folga: string;
  data_fim?: string | null;
  dias_qtd?: number | null;
  tipo: 'coletiva' | 'individual' | 'recesso_15_dias';
  motivo: string | null;
  motivo_recusa?: string | null;
  status: 'pendente' | 'aprovada' | 'recusada';
  mes_referencia: number;
  ano_referencia: number;
  created_at?: string;
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
  return dates.sort((a, b) => a.getDate() - b.getDate());
}

function formatDateBR(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

interface VoluntariosRecessoProps {
  showAprovacoes?: boolean;
  showSolicitar?: boolean;
  defaultSubTab?: 'calendario' | 'solicitar' | 'aprovacoes';
}

export function VoluntariosRecesso({
  showAprovacoes = true,
  showSolicitar = true,
  defaultSubTab = 'calendario',
}: VoluntariosRecessoProps) {
  const supabase = createClient();

  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [recessos, setRecessos] = useState<RecessoRecord[]>([]);
  const [configRecesso, setConfigRecesso] = useState<ConfigRecesso | null>(null);
  const [loading, setLoading] = useState(true);

  // Sub-abas: 'calendario' | 'solicitar' | 'aprovacoes'
  const getInitialTab = (): 'calendario' | 'solicitar' | 'aprovacoes' => {
    if (!showAprovacoes && defaultSubTab === 'aprovacoes') return 'calendario';
    if (!showSolicitar && defaultSubTab === 'solicitar') return showAprovacoes ? 'aprovacoes' : 'calendario';
    return defaultSubTab;
  };

  const [activeSubTab, setActiveSubTab] = useState<'calendario' | 'solicitar' | 'aprovacoes'>(getInitialTab);
  const [selectedDayModal, setSelectedDayModal] = useState<number | null>(null);
  const [showRegrasInfo, setShowRegrasInfo] = useState(false);

  // Formulário de Solicitação
  const [tipoSol, setTipoSol] = useState<'folga_individual' | 'recesso_15_dias'>('folga_individual');
  const [solVoluntarioId, setSolVoluntarioId] = useState('');
  const [solDataInicio, setSolDataInicio] = useState('');
  const [solMotivo, setSolMotivo] = useState('');
  const [solSubmitting, setSolSubmitting] = useState(false);
  const [solError, setSolError] = useState<string | null>(null);
  const [solSuccess, setSolSuccess] = useState<string | null>(null);

  // Gestão & Diretoria Administrativa
  const [adminFilterStatus, setAdminFilterStatus] = useState<'pendente' | 'aprovada' | 'recusada' | 'todos'>('todos');
  const [adminMotivo, setAdminMotivo] = useState('');
  const [adminSaving, setAdminSaving] = useState(false);
  const [recusaModalId, setRecusaModalId] = useState<string | null>(null);
  const [motivoRecusaTexto, setMotivoRecusaTexto] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Modal de Edição Direta pela Diretoria
  const [editingRecord, setEditingRecord] = useState<RecessoRecord | null>(null);
  const [editDataInicio, setEditDataInicio] = useState('');
  const [editDataFim, setEditDataFim] = useState('');
  const [editTipo, setEditTipo] = useState<'individual' | 'recesso_15_dias' | 'coletiva'>('individual');
  const [editStatus, setEditStatus] = useState<'pendente' | 'aprovada' | 'recusada'>('aprovada');
  const [editMotivo, setEditMotivo] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

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
          .order('data_folga', { ascending: false }),
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

  // Checa se uma data ou período inclui o último final de semana
  const verificaIntersecaoUltimoFds = (dataInicioStr: string, is15Dias: boolean) => {
    if (!dataInicioStr) return false;
    const inicio = new Date(dataInicioStr + 'T12:00:00');
    const qtdDias = is15Dias ? 15 : 1;

    for (let i = 0; i < qtdDias; i++) {
      const cur = new Date(inicio);
      cur.setDate(inicio.getDate() + i);
      if (cur.getFullYear() === currentYear && cur.getMonth() === currentMonth) {
        if (ultimoFdsDates.includes(cur.getDate())) {
          return true;
        }
      }
    }
    return false;
  };

  const isUltimoFdsWarning = verificaIntersecaoUltimoFds(solDataInicio, tipoSol === 'recesso_15_dias');

  // Recessos e Folgas APROVADOS por dia do mês atual (apenas aprovadas aparecem no calendário)
  const recessosAprovadosByDay = useMemo(() => {
    const map: Record<number, RecessoRecord[]> = {};

    recessos
      .filter((r) => r.status === 'aprovada')
      .forEach((r) => {
        const start = new Date(r.data_folga + 'T12:00:00');
        const dias = r.dias_qtd || (r.tipo === 'recesso_15_dias' ? 15 : 1);

        for (let i = 0; i < dias; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);

          if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
            const dayNum = d.getDate();
            if (!map[dayNum]) map[dayNum] = [];
            map[dayNum].push(r);
          }
        }
      });
    return map;
  }, [recessos, currentMonth, currentYear]);

  // Lista de dias para o grid do calendário
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [currentYear, currentMonth]);

  // Estatísticas
  const totalVoluntariosAtivos = voluntarios.length;
  const folgasIndividuaisAprovadas = recessos.filter(
    (r) => r.tipo === 'individual' && r.status === 'aprovada' && r.mes_referencia === currentMonth + 1
  ).length;
  const recessos15DiasAprovados = recessos.filter(
    (r) => r.tipo === 'recesso_15_dias' && r.status === 'aprovada' && r.ano_referencia === currentYear
  ).length;
  const pendentesAprovacao = recessos.filter((r) => r.status === 'pendente');

  const handlePrevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));

  // Alternar Dia da Família (Diretor Administrativo)
  const handleToggleDiaFamilia = async () => {
    setAdminSaving(true);
    try {
      const newValue = !diaFamiliaAtivo;

      if (!newValue && !adminMotivo.trim()) {
        alert('Por favor, informe o motivo formal da desativação do Dia da Família.');
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

  // Enviar Solicitação (Folga Mensal ou Recesso de 15 Dias)
  const handleEnviarSolicitacao = async (e: React.FormEvent) => {
    e.preventDefault();
    setSolError(null);
    setSolSuccess(null);

    if (!solVoluntarioId || !solDataInicio) {
      setSolError('Selecione o voluntário e a data de início desejada.');
      return;
    }

    setSolSubmitting(true);
    try {
      const start = new Date(solDataInicio + 'T12:00:00');
      const mesRef = start.getMonth() + 1;
      const anoRef = start.getFullYear();

      let dataFim = null;
      let diasQtd = 1;

      if (tipoSol === 'recesso_15_dias') {
        diasQtd = 15;
        const fim = new Date(start);
        fim.setDate(start.getDate() + 14);
        dataFim = fim.toISOString().split('T')[0];
      }

      // Converte tipoSol para o valor aceito pela constraint do banco ('individual' ou 'recesso_15_dias')
      const tipoBanco = tipoSol === 'folga_individual' ? 'individual' : 'recesso_15_dias';

      const { error: insertErr } = await supabase.from('recessos_voluntarios').insert({
        voluntario_id: solVoluntarioId,
        data_folga: solDataInicio,
        data_fim: dataFim,
        dias_qtd: diasQtd,
        tipo: tipoBanco,
        motivo: solMotivo.trim() || null,
        status: 'pendente',
        mes_referencia: mesRef,
        ano_referencia: anoRef,
      });

      if (insertErr) throw insertErr;

      setSolSuccess(
        tipoSol === 'recesso_15_dias'
          ? 'Solicitação de Recesso de 15 dias enviada com sucesso! Aguardando aprovação da Diretoria.'
          : 'Solicitação de 2ª Folga Mensal enviada com sucesso! Aguardando aprovação da Diretoria.'
      );
      setSolVoluntarioId('');
      setSolDataInicio('');
      setSolMotivo('');
      await loadData();
    } catch (err: any) {
      setSolError(err.message || 'Erro ao registrar solicitação.');
    } finally {
      setSolSubmitting(false);
    }
  };

  // Aprovar Solicitação (Diretor)
  const handleAprovarSolicitacao = async (id: string) => {
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from('recessos_voluntarios')
        .update({
          status: 'aprovada',
          motivo_recusa: null,
        })
        .eq('id', id);

      if (error) throw error;
      await loadData();
    } catch (err: any) {
      alert('Erro ao aprovar solicitação: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Recusar Solicitação (Diretor)
  const handleConfirmarRecusa = async () => {
    if (!recusaModalId) return;
    setProcessingId(recusaModalId);
    try {
      const { error } = await supabase
        .from('recessos_voluntarios')
        .update({
          status: 'recusada',
          motivo_recusa: motivoRecusaTexto.trim() || 'Necessidade operacional em atividades externas.',
        })
        .eq('id', recusaModalId);

      if (error) throw error;
      setRecusaModalId(null);
      setMotivoRecusaTexto('');
      await loadData();
    } catch (err: any) {
      alert('Erro ao recusar solicitação: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Abrir Modal de Edição (Diretoria)
  const handleOpenEditModal = (rec: RecessoRecord) => {
    setEditingRecord(rec);
    setEditDataInicio(rec.data_folga);
    setEditDataFim(rec.data_fim || '');
    setEditTipo(rec.tipo);
    setEditStatus(rec.status);
    setEditMotivo(rec.motivo || '');
  };

  // Salvar Edição Completa (Diretoria)
  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    setSavingEdit(true);

    try {
      const start = new Date(editDataInicio + 'T12:00:00');
      const mesRef = start.getMonth() + 1;
      const anoRef = start.getFullYear();

      let dataFim = editDataFim || null;
      let diasQtd = editTipo === 'recesso_15_dias' ? 15 : 1;

      if (editTipo === 'recesso_15_dias' && !dataFim) {
        const fim = new Date(start);
        fim.setDate(start.getDate() + 14);
        dataFim = fim.toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('recessos_voluntarios')
        .update({
          data_folga: editDataInicio,
          data_fim: dataFim,
          dias_qtd: diasQtd,
          tipo: editTipo,
          status: editStatus,
          motivo: editMotivo.trim() || null,
          mes_referencia: mesRef,
          ano_referencia: anoRef,
        })
        .eq('id', editingRecord.id);

      if (error) throw error;

      setEditingRecord(null);
      await loadData();
    } catch (err: any) {
      alert('Erro ao salvar alteração: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // Excluir Registro (Diretoria)
  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('Tem certeza de que deseja remover este registro de folga/recesso?')) return;
    setProcessingId(id);
    try {
      const { error } = await supabase.from('recessos_voluntarios').delete().eq('id', id);
      if (error) throw error;
      await loadData();
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Filtragem na aba da Diretoria
  const listaDiretoriaFiltrada = useMemo(() => {
    if (adminFilterStatus === 'todos') return recessos;
    return recessos.filter((r) => r.status === adminFilterStatus);
  }, [recessos, adminFilterStatus]);

  return (
    <div className="space-y-5">
      {/* ── 1. MICRO-KPIS COMPACTOS DE RECESSOS & FOLGAS ── */}
      <div className={`grid grid-cols-2 ${showAprovacoes ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-3`}>
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
              1ª Folga (Família)
            </p>
            <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
              {diaFamiliaAtivo ? `Dia ${primeiroDomingo}` : 'Desativado'}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#93368F]/10 text-[#93368F] flex items-center justify-center shrink-0">
            <Coffee className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
              2ª Folga Aprovada
            </p>
            <p className="text-lg sm:text-xl font-display font-extrabold text-[#93368F]">
              {folgasIndividuaisAprovadas}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F9C859]/20 text-[#8B4A2E] flex items-center justify-center shrink-0">
            <Umbrella className="w-4 h-4 text-[#F2632D]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
              Recessos 15 Dias
            </p>
            <p className="text-lg sm:text-xl font-display font-extrabold text-[var(--color-primary)]">
              {recessos15DiasAprovados}
            </p>
          </div>
        </div>

        {showAprovacoes && (
          <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex items-center gap-3 col-span-2 lg:col-span-1">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
                Aprovações Pendentes
              </p>
              <div className="flex items-center gap-1.5">
                <span className={`text-lg sm:text-xl font-display font-extrabold ${pendentesAprovacao.length > 0 ? 'text-rose-600 animate-pulse' : 'text-[var(--text-primary)]'}`}>
                  {pendentesAprovacao.length}
                </span>
                {pendentesAprovacao.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/10 text-rose-600">
                    Ação
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 2. NAVEGAÇÃO ENTRE MESES E SUB-ABAS (MINIMALISTA) ── */}
      <div className="p-3 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
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

          {/* Botão informativo (?) com Popover de Regras */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRegrasInfo(!showRegrasInfo)}
              className="p-1.5 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
              title="Entender regras de folga e recesso"
              aria-label="Regras de folga e recesso"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {showRegrasInfo && (
              <div className="absolute left-0 top-9 z-40 w-72 sm:w-80 p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-2xl space-y-2.5 animate-in fade-in zoom-in-95 duration-150 text-xs">
                <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-1.5">
                  <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-[var(--color-primary)]" />
                    Regras de Folgas &amp; Recessos
                  </span>
                  <button
                    onClick={() => setShowRegrasInfo(false)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2 text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  <p>
                    <strong className="text-[var(--text-primary)]">1ª Folga Mensal (Dia da Família):</strong> Ocorre automaticamente no 1º domingo do mês para toda a equipe.
                  </p>
                  <p>
                    <strong className="text-[var(--text-primary)]">2ª Folga Mensal (1 Dia):</strong> Livre escolha de data no mês, sujeita à aprovação da Diretoria.
                  </p>
                  <p>
                    <strong className="text-[var(--text-primary)]">Recesso Anual (15 Dias):</strong> Período contínuo de descanso anual para voluntários ativos.
                  </p>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                    O último fim de semana de cada mês é prioritário para ações externas com a comunidade.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sub-navegação em Pílulas */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)]">
          <button
            onClick={() => setActiveSubTab('calendario')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'calendario'
                ? 'bg-[var(--bg-elevated)] text-[var(--color-primary)] shadow-xs font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Calendário Mensal
          </button>
          {showSolicitar && (
            <button
              onClick={() => setActiveSubTab('solicitar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === 'solicitar'
                  ? 'bg-[var(--bg-elevated)] text-[var(--color-primary)] shadow-xs font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Solicitar Folga / Recesso
            </button>
          )}
          {showAprovacoes && (
            <button
              onClick={() => setActiveSubTab('aprovacoes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer relative ${
                activeSubTab === 'aprovacoes'
                  ? 'bg-[var(--bg-elevated)] text-[var(--color-primary)] shadow-xs font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>Aprovações &amp; Diretoria</span>
              {pendentesAprovacao.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── 3. CONTEÚDO DAS SUB-ABAS ── */}

      {/* ========================================================================= */}
      {/* SUB-ABA 1: CALENDÁRIO MENSAL (APENAS APROVADAS SÃO EXIBIDAS) */}
      {/* ========================================================================= */}
      {activeSubTab === 'calendario' && (
        <Card className="p-4 sm:p-5 overflow-x-auto space-y-3">
          {/* Legenda Compacta */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pb-2 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[var(--color-primary)]" />
                <span className="text-[var(--text-primary)] font-medium">1º Dom: Dia da Família</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-purple-500" />
                <span className="text-[var(--text-primary)] font-medium">Último FDS: Ações Externas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                <span className="text-[var(--text-primary)] font-medium">Folgas / Recessos Aprovados</span>
              </div>
            </div>
            <span className="text-[10px] text-[var(--text-muted)] italic">
              Clique em qualquer dia para ver a escala detalhada
            </span>
          </div>

          <div className="min-w-[650px]">
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
                  return <div key={`empty-${idx}`} className="h-24 rounded-xl bg-[var(--bg-secondary)]/20" />;
                }

                const isPrimeiroDom = diaFamiliaAtivo && day === primeiroDomingo;
                const isUltimoFds = ultimoFdsDates.includes(day);
                const recessosDoDia = recessosAprovadosByDay[day] || [];

                return (
                  <div
                    key={`day-${day}`}
                    onClick={() => setSelectedDayModal(day)}
                    className={`h-24 p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer hover:shadow-xs ${
                      isPrimeiroDom
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]/25'
                        : isUltimoFds
                        ? 'border-purple-300 bg-purple-500/5'
                        : 'border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--color-primary)]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isPrimeiroDom ? 'text-[var(--color-primary)]' : isUltimoFds ? 'text-purple-600' : 'text-[var(--text-primary)]'}`}>
                        {day}
                      </span>
                      {isPrimeiroDom && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[var(--color-primary)] text-white shadow-2xs">
                          Família
                        </span>
                      )}
                      {isUltimoFds && !isPrimeiroDom && (
                        <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                          Externo
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 overflow-hidden">
                      {recessosDoDia.slice(0, 2).map((r) => (
                        <div
                          key={r.id}
                          className={`text-[9px] truncate px-1.5 py-0.5 rounded font-medium flex items-center gap-1 ${
                            r.tipo === 'recesso_15_dias'
                              ? 'bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-500/20'
                              : 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 border border-emerald-500/20'
                          }`}
                        >
                          {r.tipo === 'recesso_15_dias' ? (
                            <Umbrella className="w-2.5 h-2.5 shrink-0 text-amber-600" />
                          ) : (
                            <Coffee className="w-2.5 h-2.5 shrink-0 text-emerald-600" />
                          )}
                          <span className="truncate">{r.voluntarios?.nome_completo?.split(' ')[0] || 'Voluntário'}</span>
                        </div>
                      ))}
                      {recessosDoDia.length > 2 && (
                        <span className="text-[8px] text-[var(--text-muted)] font-bold block pl-1">
                          +{recessosDoDia.length - 2} escalas
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

      {/* ========================================================================= */}
      {/* SUB-ABA 2: SOLICITAR FOLGA MENSAL OU RECESSO DE 15 DIAS */}
      {/* ========================================================================= */}
      {activeSubTab === 'solicitar' && (
        <Card className="p-6 max-w-2xl mx-auto space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[var(--color-primary)]" />
              <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                Solicitação de Folga ou Recesso
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowRegrasInfo(true)}
              className="text-[11px] text-[var(--text-muted)] hover:text-[var(--color-primary)] flex items-center gap-1 font-semibold cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Ver Regras
            </button>
          </div>

          {/* Seleção do Tipo de Solicitação */}
          <div className="grid grid-cols-2 gap-3 p-1.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)]">
            <button
              type="button"
              onClick={() => setTipoSol('folga_individual')}
              className={`p-3 rounded-xl text-left transition-all cursor-pointer ${
                tipoSol === 'folga_individual'
                  ? 'bg-[var(--bg-elevated)] border border-[var(--color-primary)] ring-1 ring-[var(--color-primary)] shadow-xs'
                  : 'border border-transparent opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Coffee className="w-4 h-4 text-[#93368F]" />
                <span className="font-bold text-xs text-[var(--text-primary)]">
                  2ª Folga Mensal (1 Dia)
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Livre escolha para um dia no mês vigente.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setTipoSol('recesso_15_dias')}
              className={`p-3 rounded-xl text-left transition-all cursor-pointer ${
                tipoSol === 'recesso_15_dias'
                  ? 'bg-[var(--bg-elevated)] border border-[var(--color-primary)] ring-1 ring-[var(--color-primary)] shadow-xs'
                  : 'border border-transparent opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Umbrella className="w-4 h-4 text-[var(--color-primary)]" />
                <span className="font-bold text-xs text-[var(--text-primary)]">
                  Recesso Anual (15 Dias)
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Período contínuo de 15 dias para descanso.
              </p>
            </button>
          </div>

          {/* Mensagens de Sucesso / Erro */}
          {solError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{solError}</span>
            </div>
          )}

          {solSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{solSuccess}</span>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleEnviarSolicitacao} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                Voluntário(a) Solicitante *
              </label>
              <Select
                options={[
                  { value: '', label: 'Selecione o voluntário...' },
                  ...voluntarios.map((v) => ({
                    value: v.id,
                    label: `${v.nome_completo} (${v.area_atuacao || 'Geral'})`,
                  })),
                ]}
                value={solVoluntarioId}
                onChange={(e) => setSolVoluntarioId(e.target.value)}
              />
            </div>

            <div>
              <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                {tipoSol === 'recesso_15_dias' ? 'Data de Início do Recesso (15 Dias Consecutivos) *' : 'Data Escolhida para a 2ª Folga *'}
              </label>
              <input
                type="date"
                value={solDataInicio}
                onChange={(e) => setSolDataInicio(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] font-mono-data"
                required
              />
              {tipoSol === 'recesso_15_dias' && solDataInicio && (
                <p className="text-[11px] text-[var(--text-muted)] mt-1 font-mono-data">
                  Período: {formatDateBR(solDataInicio)} até {
                    (() => {
                      const f = new Date(solDataInicio + 'T12:00:00');
                      f.setDate(f.getDate() + 14);
                      return formatDateBR(f.toISOString().split('T')[0]);
                    })()
                  } (15 dias)
                </p>
              )}
            </div>

            {/* Aviso de Último Fim de Semana */}
            {isUltimoFdsWarning && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs leading-relaxed space-y-1 animate-in fade-in">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Aviso: Coincide com o Último Final de Semana do Mês</span>
                </div>
                <p className="text-[11px]">
                  Data dedicada prioritariamente a ações externas comunitárias. O pedido será encaminhado para deliberação da Diretoria.
                </p>
              </div>
            )}

            <div>
              <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                Justificativa / Observação (Opcional)
              </label>
              <textarea
                value={solMotivo}
                onChange={(e) => setSolMotivo(e.target.value)}
                rows={2}
                placeholder="Ex: Assuntos acadêmicos, viagem ou compromisso familiar."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] resize-none font-medium"
              />
            </div>

            <Button
              type="submit"
              className="w-full justify-center py-2.5 text-xs font-bold"
              disabled={solSubmitting}
            >
              {solSubmitting ? 'Enviando Solicitação...' : 'Enviar Solicitação para a Diretoria'}
            </Button>
          </form>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SUB-ABA 3: APROVAÇÕES & DIRETORIA ADMINISTRATIVA (PODER TOTAL DE GERÊNCIA) */}
      {/* ========================================================================= */}
      {activeSubTab === 'aprovacoes' && (
        <div className="space-y-5 max-w-4xl mx-auto">
          {/* Card 1: Controle do Dia da Família */}
          <Card className="p-5 space-y-4 border-l-4 border-l-[var(--color-primary)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h3 className="font-display font-bold text-sm sm:text-base text-[var(--text-primary)] flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[var(--color-primary)]" />
                  Controle do Dia da Família (1º Domingo)
                </h3>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Status em {MESES_NOMES[currentMonth]}/{currentYear}:{' '}
                  <strong className={diaFamiliaAtivo ? 'text-emerald-600' : 'text-amber-600'}>
                    {diaFamiliaAtivo ? `ATIVO (Folga no Dia ${primeiroDomingo})` : 'DESATIVADO'}
                  </strong>
                </p>
              </div>

              <Button
                variant={diaFamiliaAtivo ? 'secondary' : 'primary'}
                size="sm"
                onClick={handleToggleDiaFamilia}
                disabled={adminSaving}
                className="shrink-0 text-xs"
              >
                {diaFamiliaAtivo ? 'Desativar neste Mês' : 'Reativar Dia da Família'}
              </Button>
            </div>

            {diaFamiliaAtivo && (
              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-semibold text-[var(--text-muted)]">
                  Justificativa formal caso deseje desativar:
                </label>
                <input
                  type="text"
                  value={adminMotivo}
                  onChange={(e) => setAdminMotivo(e.target.value)}
                  placeholder="Ex: Mutirão social extraordinário ou celebração do Dia das Crianças."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
            )}
          </Card>

          {/* Card 2: Painel Central de Gerenciamento & Edição de Todas as Solicitações */}
          <Card className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-default)] pb-3">
              <div>
                <h3 className="font-display font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-[#93368F]" />
                  Gerenciamento de Todas as Escalas &amp; Folgas
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  O Diretor Administrativo pode aprovar, editar, corrigir ou cancelar qualquer solicitação.
                </p>
              </div>

              {/* Filtros de Status */}
              <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-default)] text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setAdminFilterStatus('todos')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${adminFilterStatus === 'todos' ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-xs font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                >
                  Todas ({recessos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAdminFilterStatus('pendente')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${adminFilterStatus === 'pendente' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 shadow-xs font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                >
                  Pendentes ({pendentesAprovacao.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAdminFilterStatus('aprovada')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${adminFilterStatus === 'aprovada' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                >
                  Aprovadas
                </button>
                <button
                  type="button"
                  onClick={() => setAdminFilterStatus('recusada')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${adminFilterStatus === 'recusada' ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 shadow-xs font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                >
                  Recusadas
                </button>
              </div>
            </div>

            {listaDiretoriaFiltrada.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)]/30 rounded-2xl border border-dashed border-[var(--border-default)]">
                Nenhum registro de folga ou recesso encontrado com o filtro selecionado.
              </div>
            ) : (
              <div className="space-y-3">
                {listaDiretoriaFiltrada.map((item) => {
                  const isExternoWarning = verificaIntersecaoUltimoFds(
                    item.data_folga,
                    item.tipo === 'recesso_15_dias'
                  );

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-[var(--color-primary)]/40"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-[var(--text-primary)]">
                            {item.voluntarios?.nome_completo || 'Voluntário'}
                          </span>
                          <Badge variant={item.tipo === 'recesso_15_dias' ? 'warning' : 'purple'}>
                            {item.tipo === 'recesso_15_dias' ? 'Recesso 15 Dias' : '2ª Folga Mensal'}
                          </Badge>
                          <Badge
                            variant={
                              item.status === 'aprovada'
                                ? 'success'
                                : item.status === 'pendente'
                                ? 'warning'
                                : 'danger'
                            }
                          >
                            {item.status.toUpperCase()}
                          </Badge>
                          {isExternoWarning && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Último FDS
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[var(--text-secondary)] font-mono-data">
                          Data: <strong>{formatDateBR(item.data_folga)}</strong>
                          {item.data_fim && ` até ${formatDateBR(item.data_fim)} (${item.dias_qtd || 15} dias)`}
                        </p>

                        {item.motivo && (
                          <p className="text-xs text-[var(--text-muted)] italic">
                            &quot;{item.motivo}&quot;
                          </p>
                        )}

                        {item.motivo_recusa && (
                          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                            Motivo da Recusa: {item.motivo_recusa}
                          </p>
                        )}
                      </div>

                      {/* Ações da Diretoria: Aprovar, Recusar, Editar, Excluir */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center flex-wrap">
                        {item.status !== 'aprovada' && (
                          <Button
                            size="sm"
                            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={processingId === item.id}
                            onClick={() => handleAprovarSolicitacao(item.id)}
                            icon={<Check className="w-3.5 h-3.5" />}
                          >
                            Aprovar
                          </Button>
                        )}

                        {item.status !== 'recusada' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-xs text-rose-600 hover:bg-rose-500/10"
                            disabled={processingId === item.id}
                            onClick={() => setRecusaModalId(item.id)}
                            icon={<X className="w-3.5 h-3.5" />}
                          >
                            Recusar
                          </Button>
                        )}

                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleOpenEditModal(item)}
                          icon={<Edit3 className="w-3.5 h-3.5" />}
                          title="Editar escala"
                        >
                          Editar
                        </Button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(item.id)}
                          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Excluir escala"
                          aria-label="Excluir escala"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── MODAL: EDIÇÃO DIRETA PELA DIRETORIA ── */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[var(--color-primary)]" />
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                  Editar Registro de Escala / Folga
                </h3>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-1 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                  Voluntário
                </label>
                <input
                  type="text"
                  disabled
                  value={editingRecord.voluntarios?.nome_completo || 'Voluntário'}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-bold disabled:opacity-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                    Tipo de Escala
                  </label>
                  <select
                    value={editTipo}
                    onChange={(e: any) => setEditTipo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] font-medium"
                  >
                    <option value="individual">2ª Folga Mensal</option>
                    <option value="recesso_15_dias">Recesso 15 Dias</option>
                    <option value="coletiva">Folga Coletiva</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                    Status da Solicitação
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e: any) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] font-medium"
                  >
                    <option value="aprovada">Aprovada</option>
                    <option value="pendente">Pendente</option>
                    <option value="recusada">Recusada</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                    Data de Início *
                  </label>
                  <input
                    type="date"
                    value={editDataInicio}
                    onChange={(e) => setEditDataInicio(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-mono-data"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                    Data de Término (Opcional)
                  </label>
                  <input
                    type="date"
                    value={editDataFim}
                    onChange={(e) => setEditDataFim(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-mono-data"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                  Justificativa / Motivo
                </label>
                <textarea
                  value={editMotivo}
                  onChange={(e) => setEditMotivo(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-default)]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditingRecord(null)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                icon={<Save className="w-4 h-4" />}
                disabled={savingEdit}
                onClick={handleSaveEdit}
              >
                {savingEdit ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: MOTIVO DE RECUSA ── */}
      {recusaModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="space-y-1">
              <h3 className="font-display font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-500" />
                Recusar Solicitação de Folga/Recesso
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Informe o motivo da recusa para o registro do voluntário.
              </p>
            </div>

            <textarea
              value={motivoRecusaTexto}
              onChange={(e) => setMotivoRecusaTexto(e.target.value)}
              placeholder="Ex: Necessidade de escala no último fim de semana em virtude de ação comunitária externa."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-rose-500 resize-none"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRecusaModalId(null)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white"
                onClick={handleConfirmarRecusa}
              >
                Confirmar Recusa
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: DETALHES DO DIA CLICADO NO CALENDÁRIO ── */}
      {selectedDayModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                Escala de {selectedDayModal} de {MESES_NOMES[currentMonth]} de {currentYear}
              </h3>
              <button
                onClick={() => setSelectedDayModal(null)}
                className="p-1 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {diaFamiliaAtivo && selectedDayModal === primeiroDomingo && (
                <div className="p-3 rounded-xl bg-[var(--color-primary-soft)] border border-[var(--color-primary)]/20 text-[var(--color-primary)] font-bold flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  <span>Dia da Família — Folga Coletiva para toda a equipe.</span>
                </div>
              )}

              {ultimoFdsDates.includes(selectedDayModal) && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-400/20 text-purple-700 dark:text-purple-300 font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Último FDS: Encontros com público externo (Presença prioritária).</span>
                </div>
              )}

              {recessosAprovadosByDay[selectedDayModal]?.length === 0 && (!diaFamiliaAtivo || selectedDayModal !== primeiroDomingo) && (
                <p className="text-[var(--text-muted)] py-4 text-center">
                  Nenhum voluntário de folga ou recesso neste dia.
                </p>
              )}

              {recessosAprovadosByDay[selectedDayModal]?.map((r) => (
                <div key={r.id} className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--text-primary)]">{r.voluntarios?.nome_completo}</span>
                    <Badge variant={r.tipo === 'recesso_15_dias' ? 'warning' : 'success'}>
                      {r.tipo === 'recesso_15_dias' ? 'Recesso 15 Dias' : '2ª Folga Aprovada'}
                    </Badge>
                  </div>
                  {r.motivo && <p className="text-[11px] text-[var(--text-muted)] italic">&quot;{r.motivo}&quot;</p>}
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <Button size="sm" onClick={() => setSelectedDayModal(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
