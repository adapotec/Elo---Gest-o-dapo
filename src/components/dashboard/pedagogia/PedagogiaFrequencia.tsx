'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PapelTimbradoModal } from '@/components/ui/PapelTimbradoModal';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Printer,
  Save,
  Users,
  Calendar,
  Search,
  CheckCheck,
  FolderKanban,
  ExternalLink,
  Plus,
  Filter,
  UserX,
  UserCheck,
  X,
  Percent,
  Clock,
} from 'lucide-react';

export interface BeneficiarioInscrito {
  id: string;
  nome_completo: string;
  data_nascimento: string;
  comunidade?: string;
  bairro?: string;
  inscricao_status?: 'ativo' | 'desligado';
}

interface AcaoItem {
  id: string;
  nome_acao: string;
  data_hora: string;
  documento_estruturador?: string;
}

interface FrequenciaRegistro {
  id?: string;
  beneficiario_id: string;
  status: 'presente' | 'falta' | 'justificada';
  justificativa?: string;
}

interface PedagogiaFrequenciaProps {
  projetoId: string;
  projetoNome: string;
  acoes: AcaoItem[];
  inscritos: BeneficiarioInscrito[];
  readOnly?: boolean;
  onRefresh?: () => void;
}

export function getFaixaAssiduidade(taxa: number, isDesligado: boolean = false) {
  if (isDesligado) {
    return {
      label: 'Desligado',
      faixa: 'desligado',
      badgeClass: 'bg-slate-500/15 text-slate-500 border-slate-500/30',
      dotColor: '#64748b',
      borderClass: 'border-slate-500/30',
      bgClass: 'bg-slate-500/5',
      name: 'Desligados',
    };
  }
  if (taxa === 100) {
    return {
      label: '100% Presença',
      faixa: '100',
      badgeClass: 'bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-600/40 font-bold',
      dotColor: '#15803d',
      borderClass: 'border-emerald-600/30',
      bgClass: 'bg-emerald-500/5',
      name: '100% de Presença (Verde Escuro)',
    };
  }
  if (taxa >= 75) {
    return {
      label: `${taxa}% Presença`,
      faixa: '75-99',
      badgeClass: 'bg-green-950/20 text-green-600 dark:text-green-400 border-green-500/40 font-bold',
      dotColor: '#16a34a',
      borderClass: 'border-green-500/30',
      bgClass: 'bg-green-500/5',
      name: '90 a 75% de Presença (Verde Claro)',
    };
  }
  if (taxa >= 50) {
    return {
      label: `${taxa}% Presença`,
      faixa: '50-74',
      badgeClass: 'bg-yellow-950/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/40 font-bold',
      dotColor: '#ca8a04',
      borderClass: 'border-yellow-500/30',
      bgClass: 'bg-yellow-500/5',
      name: '75 a 50% de Presença (Amarelo)',
    };
  }
  return {
    label: `${taxa}% Presença`,
    faixa: '0-49',
    badgeClass: 'bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-500/40 font-bold',
    dotColor: '#d97706',
    borderClass: 'border-amber-500/30',
    bgClass: 'bg-amber-500/5',
    name: '50 a 0% de Presença (Amarelo Escuro)',
  };
}

export function PedagogiaFrequencia({
  projetoId,
  projetoNome,
  acoes = [],
  inscritos = [],
  readOnly = false,
  onRefresh,
}: PedagogiaFrequenciaProps) {
  const hojeStr = new Date().toISOString().split('T')[0];
  const mesAtualStr = hojeStr.slice(0, 7);

  // Filtro de Período dos Indicadores
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>('anteriores'); // 'anteriores' | 'mes_atual' | 'YYYY-MM' | 'todos'
  const [filtroFaixaCard, setFiltroFaixaCard] = useState<string>('todas'); // 'todas' | '100' | '75-99' | '50-74' | '0-49' | 'desligados'
  const [buscaAluno, setBuscaAluno] = useState('');

  // Modal de Chamada / Adicionar Frequência
  const [showChamadaModal, setShowChamadaModal] = useState(false);
  const [selectedAcaoId, setSelectedAcaoId] = useState<string>(acoes[0]?.id || '');
  const [frequenciasModal, setFrequenciasModal] = useState<Record<string, FrequenciaRegistro>>({});
  const [loadingModal, setLoadingModal] = useState(false);
  const [savingModal, setSavingModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Modal de Impressão Papel Timbrado
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Todos os registros históricos de frequência do projeto
  const [todasFrequencias, setTodasFrequencias] = useState<any[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  // Carregar todo o histórico de frequências do projeto para alimentar os indicadores
  const carregarHistoricoFrequencias = async () => {
    if (!projetoId) return;
    setLoadingHistorico(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('frequencias_acao')
      .select('id, acao_id, beneficiario_id, status, justificativa, acoes_projeto(id, data_hora, nome_acao)')
      .eq('projeto_id', projetoId);

    if (!error && data) {
      setTodasFrequencias(data);
    }
    setLoadingHistorico(false);
  };

  useEffect(() => {
    carregarHistoricoFrequencias();
  }, [projetoId]);

  // Meses disponíveis com encontros
  const mesesDisponiveis = useMemo(() => {
    return Array.from(
      new Set(
        acoes
          .map((a) => (a.data_hora ? a.data_hora.slice(0, 7) : ''))
          .filter(Boolean)
      )
    ).sort().reverse();
  }, [acoes]);

  // Ações filtradas para a base de cálculo dos indicadores
  const acoesBaseCalculo = useMemo(() => {
    return acoes.filter((a) => {
      if (!a.data_hora) return false;
      const dataAcao = a.data_hora.slice(0, 10);
      const mesAcao = a.data_hora.slice(0, 7);

      if (filtroPeriodo === 'anteriores') {
        return dataAcao <= hojeStr;
      }
      if (filtroPeriodo === 'mes_atual') {
        return mesAcao === mesAtualStr;
      }
      if (filtroPeriodo === 'todos') {
        return true;
      }
      // Mês específico
      return mesAcao === filtroPeriodo;
    });
  }, [acoes, filtroPeriodo, hojeStr, mesAtualStr]);

  const acoesIdsBase = useMemo(() => {
    return new Set(acoesBaseCalculo.map((a) => a.id));
  }, [acoesBaseCalculo]);

  // Mapa de frequências filtradas pela base de ações
  const frequenciasFiltradas = useMemo(() => {
    return todasFrequencias.filter((f) => acoesIdsBase.has(f.acao_id));
  }, [todasFrequencias, acoesIdsBase]);

  // Cálculo individual da taxa de assiduidade por aluno
  const alunosComMetricas = useMemo(() => {
    const totalEncontros = acoesBaseCalculo.length;

    return inscritos.map((aluno) => {
      const isDesligado = aluno.inscricao_status === 'desligado';
      const freqAluno = frequenciasFiltradas.filter((f) => f.beneficiario_id === aluno.id);

      const presencas = freqAluno.filter((f) => f.status === 'presente').length;
      const faltas = freqAluno.filter((f) => f.status === 'falta').length;
      const justificadas = freqAluno.filter((f) => f.status === 'justificada').length;
      const totalRegistros = freqAluno.length;

      // Base de taxa: se houver encontros no período, calcula presenças / totalEncontros
      const divisor = totalEncontros > 0 ? totalEncontros : (totalRegistros > 0 ? totalRegistros : 1);
      const taxa = totalEncontros > 0 || totalRegistros > 0 ? Math.round((presencas / divisor) * 100) : 100;

      const faixaInfo = getFaixaAssiduidade(taxa, isDesligado);

      return {
        ...aluno,
        presencas,
        faltas,
        justificadas,
        totalEncontros: totalEncontros > 0 ? totalEncontros : totalRegistros,
        taxa,
        faixaInfo,
        isDesligado,
      };
    });
  }, [inscritos, acoesBaseCalculo, frequenciasFiltradas]);

  // Contagem dos 7 Cards de Indicadores em Destaque
  const metricasCards = useMemo(() => {
    const totalInscritos = alunosComMetricas.length;
    const alunosAtivos = alunosComMetricas.filter((a) => !a.isDesligado);
    const alunosDesligados = alunosComMetricas.filter((a) => a.isDesligado);

    const count100 = alunosAtivos.filter((a) => a.faixaInfo.faixa === '100').length;
    const count75_99 = alunosAtivos.filter((a) => a.faixaInfo.faixa === '75-99').length;
    const count50_74 = alunosAtivos.filter((a) => a.faixaInfo.faixa === '50-74').length;
    const count0_49 = alunosAtivos.filter((a) => a.faixaInfo.faixa === '0-49').length;

    const somaTaxas = alunosAtivos.reduce((acc, a) => acc + a.taxa, 0);
    const taxaGeral = alunosAtivos.length > 0 ? Math.round(somaTaxas / alunosAtivos.length) : 0;

    return {
      totalInscritos,
      totalAtivos: alunosAtivos.length,
      totalDesligados: alunosDesligados.length,
      taxaGeral,
      count100,
      count75_99,
      count50_74,
      count0_49,
    };
  }, [alunosComMetricas]);

  // Lista de alunos filtrados por busca e por clique nos cards
  const alunosExibicao = useMemo(() => {
    return alunosComMetricas.filter((a) => {
      const matchBusca =
        a.nome_completo.toLowerCase().includes(buscaAluno.toLowerCase()) ||
        (a.comunidade && a.comunidade.toLowerCase().includes(buscaAluno.toLowerCase())) ||
        (a.bairro && a.bairro.toLowerCase().includes(buscaAluno.toLowerCase()));

      if (!matchBusca) return false;

      if (filtroFaixaCard === 'todas') return true;
      if (filtroFaixaCard === 'desligados') return a.isDesligado;
      if (filtroFaixaCard === '100') return !a.isDesligado && a.faixaInfo.faixa === '100';
      if (filtroFaixaCard === '75-99') return !a.isDesligado && a.faixaInfo.faixa === '75-99';
      if (filtroFaixaCard === '50-74') return !a.isDesligado && a.faixaInfo.faixa === '50-74';
      if (filtroFaixaCard === '0-49') return !a.isDesligado && a.faixaInfo.faixa === '0-49';

      return true;
    });
  }, [alunosComMetricas, buscaAluno, filtroFaixaCard]);

  // ── FUNÇÕES DO MODAL DE CHAMADA ──
  const acaoModalAtual = useMemo(() => {
    return acoes.find((a) => a.id === selectedAcaoId) || acoes[0];
  }, [acoes, selectedAcaoId]);

  // Carregar dados de chamada ao abrir modal ou trocar ação
  useEffect(() => {
    if (!showChamadaModal || !selectedAcaoId || !projetoId) return;

    const carregarChamadaAcao = async () => {
      setLoadingModal(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('frequencias_acao')
        .select('*')
        .eq('acao_id', selectedAcaoId);

      const mapa: Record<string, FrequenciaRegistro> = {};
      if (!error && data) {
        data.forEach((item: any) => {
          mapa[item.beneficiario_id] = {
            id: item.id,
            beneficiario_id: item.beneficiario_id,
            status: item.status || 'presente',
            justificativa: item.justificativa || '',
          };
        });
      }

      // Alunos ativos iniciam como presente por padrão se não houver registro
      inscritos.forEach((b) => {
        if (!mapa[b.id]) {
          mapa[b.id] = {
            beneficiario_id: b.id,
            status: 'presente',
            justificativa: '',
          };
        }
      });

      setFrequenciasModal(mapa);
      setLoadingModal(false);
    };

    carregarChamadaAcao();
  }, [showChamadaModal, selectedAcaoId, projetoId, inscritos]);

  const handleStatusChangeModal = (beneficiarioId: string, status: 'presente' | 'falta' | 'justificada') => {
    setFrequenciasModal((prev) => ({
      ...prev,
      [beneficiarioId]: {
        ...prev[beneficiarioId],
        beneficiario_id: beneficiarioId,
        status,
      },
    }));
  };

  const handleMarcarTodosModal = (status: 'presente' | 'falta') => {
    setFrequenciasModal((prev) => {
      const updated = { ...prev };
      inscritos
        .filter((b) => b.inscricao_status !== 'desligado')
        .forEach((b) => {
          updated[b.id] = {
            ...updated[b.id],
            beneficiario_id: b.id,
            status,
          };
        });
      return updated;
    });
  };

  const handleSalvarChamadaModal = async () => {
    if (!selectedAcaoId || !projetoId) return;
    setSavingModal(true);
    setSaveSuccess(false);

    const supabase = createClient();
    const rowsToUpsert = Object.values(frequenciasModal).map((item) => ({
      acao_id: selectedAcaoId,
      projeto_id: projetoId,
      beneficiario_id: item.beneficiario_id,
      status: item.status,
      justificativa: item.justificativa || null,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('frequencias_acao')
      .upsert(rowsToUpsert, { onConflict: 'acao_id,beneficiario_id' });

    if (error) {
      alert('Erro ao salvar chamada: ' + error.message);
    } else {
      setSaveSuccess(true);
      await carregarHistoricoFrequencias();
      if (onRefresh) onRefresh();
      setTimeout(() => {
        setSaveSuccess(false);
        setShowChamadaModal(false);
      }, 1200);
    }
    setSavingModal(false);
  };

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════════
          PAINEL PRINCIPAL: DASHBOARD EXECUTIVO DE FREQUÊNCIA
      ═══════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] p-6 space-y-6">
        {/* Cabeçalho e Filtros Rápidos */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-default)] pb-4">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
              <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                Indicadores de Frequência &amp; Assiduidade
              </h3>
              {readOnly && <Badge variant="neutral">Visualização</Badge>}
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Métricas consolidadas de presença dos alunos do projeto <strong>{projetoNome}</strong> ({acoesBaseCalculo.length} encontros considerados).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Seletor de Período Temporal */}
            <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-default)] text-xs">
              <button
                type="button"
                onClick={() => setFiltroPeriodo('anteriores')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  filtroPeriodo === 'anteriores'
                    ? 'bg-[var(--color-primary)] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Até Hoje
              </button>
              <button
                type="button"
                onClick={() => setFiltroPeriodo('mes_atual')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  filtroPeriodo === 'mes_atual'
                    ? 'bg-[var(--color-primary)] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Mês Atual
              </button>
              <select
                value={filtroPeriodo.includes('-') ? filtroPeriodo : ''}
                onChange={(e) => e.target.value && setFiltroPeriodo(e.target.value)}
                className="px-2 py-1 rounded-lg bg-transparent text-xs font-semibold text-[var(--text-primary)] focus:outline-none cursor-pointer"
              >
                <option value="">Outro mês...</option>
                {mesesDisponiveis.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <Button
              size="sm"
              variant="secondary"
              icon={<Printer className="w-4 h-4" />}
              onClick={() => setShowPrintModal(true)}
              disabled={metricasCards.totalInscritos === 0}
            >
              Exportar
            </Button>

            {!readOnly && (
              <Button
                size="sm"
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  if (acoes.length > 0 && !selectedAcaoId) {
                    setSelectedAcaoId(acoes[0].id);
                  }
                  setShowChamadaModal(true);
                }}
              >
                Adicionar Frequência
              </Button>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            CARDS EM DESTAQUE COM NÚMERO DE CRIANÇAS POR FAIXA DE CORES
        ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {/* Card 1: Total de Inscritos */}
          <button
            type="button"
            onClick={() => setFiltroFaixaCard('todas')}
            className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
              filtroFaixaCard === 'todas'
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] shadow-sm'
                : 'border-[var(--border-default)] bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)]">
              <span>TOTAL INSCRITOS</span>
              <Users className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-bold font-mono-data text-[var(--text-primary)]">
                {metricasCards.totalInscritos}
              </span>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                {metricasCards.totalAtivos} ativos
              </p>
            </div>
          </button>

          {/* Card 2: % Assiduidade Geral */}
          <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/30 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)]">
              <span>ASSIDUIDADE</span>
              <Percent className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-bold font-mono-data text-[var(--text-primary)]">
                {metricasCards.taxaGeral}%
              </span>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Média geral</p>
            </div>
          </div>

          {/* Card 3: 100% de Presença (Verde Escuro) */}
          <button
            type="button"
            onClick={() => setFiltroFaixaCard(filtroFaixaCard === '100' ? 'todas' : '100')}
            className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
              filtroFaixaCard === '100'
                ? 'border-emerald-600 bg-emerald-950/30 shadow-sm ring-2 ring-emerald-600/30'
                : 'border-emerald-600/30 bg-emerald-950/10 hover:bg-emerald-950/20'
            }`}
          >
            <div className="flex items-center justify-between text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400">
              <span>100% PRESENÇA</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#15803d]" />
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-bold font-mono-data text-emerald-600 dark:text-emerald-400">
                {metricasCards.count100}
              </span>
              <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/70 mt-0.5">
                Verde Escuro
              </p>
            </div>
          </button>

          {/* Card 4: 90% a 75% de Presença (Verde Claro) */}
          <button
            type="button"
            onClick={() => setFiltroFaixaCard(filtroFaixaCard === '75-99' ? 'todas' : '75-99')}
            className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
              filtroFaixaCard === '75-99'
                ? 'border-green-500 bg-green-950/30 shadow-sm ring-2 ring-green-500/30'
                : 'border-green-500/30 bg-green-950/10 hover:bg-green-950/20'
            }`}
          >
            <div className="flex items-center justify-between text-[10.5px] font-bold text-green-600 dark:text-green-400">
              <span>90% A 75%</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a]" />
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-bold font-mono-data text-green-600 dark:text-green-400">
                {metricasCards.count75_99}
              </span>
              <p className="text-[10px] text-green-700/80 dark:text-green-400/70 mt-0.5">
                Verde Claro
              </p>
            </div>
          </button>

          {/* Card 5: 75% a 50% de Presença (Amarelo) */}
          <button
            type="button"
            onClick={() => setFiltroFaixaCard(filtroFaixaCard === '50-74' ? 'todas' : '50-74')}
            className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
              filtroFaixaCard === '50-74'
                ? 'border-yellow-500 bg-yellow-950/30 shadow-sm ring-2 ring-yellow-500/30'
                : 'border-yellow-500/30 bg-yellow-950/10 hover:bg-yellow-950/20'
            }`}
          >
            <div className="flex items-center justify-between text-[10.5px] font-bold text-yellow-600 dark:text-yellow-400">
              <span>75% A 50%</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#ca8a04]" />
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-bold font-mono-data text-yellow-600 dark:text-yellow-400">
                {metricasCards.count50_74}
              </span>
              <p className="text-[10px] text-yellow-700/80 dark:text-yellow-400/70 mt-0.5">
                Amarelo
              </p>
            </div>
          </button>

          {/* Card 6: 50% a 0% de Presença (Amarelo Escuro) */}
          <button
            type="button"
            onClick={() => setFiltroFaixaCard(filtroFaixaCard === '0-49' ? 'todas' : '0-49')}
            className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
              filtroFaixaCard === '0-49'
                ? 'border-amber-500 bg-amber-950/30 shadow-sm ring-2 ring-amber-500/30'
                : 'border-amber-500/30 bg-amber-950/10 hover:bg-amber-950/20'
            }`}
          >
            <div className="flex items-center justify-between text-[10.5px] font-bold text-amber-600 dark:text-amber-400">
              <span>50% A 0%</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#d97706]" />
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-bold font-mono-data text-amber-600 dark:text-amber-400">
                {metricasCards.count0_49}
              </span>
              <p className="text-[10px] text-amber-700/80 dark:text-amber-400/70 mt-0.5">
                Amarelo Escuro
              </p>
            </div>
          </button>

          {/* Card 7: Desligados */}
          <button
            type="button"
            onClick={() => setFiltroFaixaCard(filtroFaixaCard === 'desligados' ? 'todas' : 'desligados')}
            className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
              filtroFaixaCard === 'desligados'
                ? 'border-slate-500 bg-slate-900/30 shadow-sm ring-2 ring-slate-500/30'
                : 'border-slate-500/30 bg-slate-900/10 hover:bg-slate-900/20'
            }`}
          >
            <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-400">
              <span>DESLIGADOS</span>
              <UserX className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-bold font-mono-data text-slate-400">
                {metricasCards.totalDesligados}
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5">Inativos</p>
            </div>
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            LISTA EXECUTIVA DE ALUNOS COM TAXA & CORES
        ═══════════════════════════════════════════════════════════════ */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Lista de Alunos &amp; Frequência ({alunosExibicao.length})
              </h4>
              {filtroFaixaCard !== 'todas' && (
                <button
                  type="button"
                  onClick={() => setFiltroFaixaCard('todas')}
                  className="text-[10px] text-[var(--color-primary)] hover:underline cursor-pointer"
                >
                  Limpar filtro de card
                </button>
              )}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nome ou território..."
                value={buscaAluno}
                onChange={(e) => setBuscaAluno(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] focus:outline-none focus:border-[var(--color-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>
          </div>

          <div className="border border-[var(--border-default)] rounded-2xl overflow-hidden bg-[var(--bg-elevated)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-secondary)]/60 border-b border-[var(--border-default)] text-[11px] font-bold text-[var(--text-secondary)] uppercase">
                    <th className="py-3 px-4">Criança / Aluno</th>
                    <th className="py-3 px-4">Território</th>
                    <th className="py-3 px-4 text-center">Presenças</th>
                    <th className="py-3 px-4 text-center">Faltas</th>
                    <th className="py-3 px-4 text-center">Justificadas</th>
                    <th className="py-3 px-4 text-center">Assiduidade</th>
                    <th className="py-3 px-4 text-center">Faixa / Indicador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-default)]">
                  {alunosExibicao.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-[var(--text-muted)] italic">
                        Nenhum aluno encontrado para os critérios selecionados.
                      </td>
                    </tr>
                  ) : (
                    alunosExibicao.map((aluno) => {
                      return (
                        <tr
                          key={aluno.id}
                          className="hover:bg-[var(--bg-secondary)]/40 transition-colors"
                        >
                          <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: aluno.faixaInfo.dotColor }}
                              />
                              <span className="truncate">{aluno.nome_completo}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[var(--text-secondary)]">
                            {aluno.comunidade || aluno.bairro || '—'}
                          </td>
                          <td className="py-3 px-4 text-center font-mono-data font-semibold text-emerald-600 dark:text-emerald-400">
                            {aluno.presencas}
                          </td>
                          <td className="py-3 px-4 text-center font-mono-data font-semibold text-rose-500">
                            {aluno.faltas}
                          </td>
                          <td className="py-3 px-4 text-center font-mono-data text-yellow-600 dark:text-yellow-400">
                            {aluno.justificadas}
                          </td>
                          <td className="py-3 px-4 text-center font-mono-data font-bold text-[var(--text-primary)]">
                            {aluno.isDesligado ? '—' : `${aluno.taxa}%`}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] border ${aluno.faixaInfo.badgeClass}`}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: aluno.faixaInfo.dotColor }}
                              />
                              {aluno.faixaInfo.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL: ADICIONAR / EDITAR FREQUÊNCIA (CHAMADA DO ENCONTRO)
      ═══════════════════════════════════════════════════════════════ */}
      {showChamadaModal && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in duration-200">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header do Modal */}
            <div className="p-4 sm:p-5 border-b border-[var(--border-default)] bg-[var(--bg-secondary)]/40 flex items-center justify-between gap-3 shrink-0">
              <div>
                <h3 className="font-display font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[var(--color-primary)]" />
                  Registro de Presença / Chamada
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Selecione o encontro e marque a presença de cada criança do projeto.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowChamadaModal(false)}
                className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Controles do Modal: Seletor de Encontro & Ações em Massa */}
            <div className="p-4 sm:p-5 border-b border-[var(--border-default)] bg-[var(--bg-secondary)]/20 space-y-3 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 max-w-md">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] block mb-1">
                    Encontro / Ação do Projeto:
                  </label>
                  <select
                    value={selectedAcaoId}
                    onChange={(e) => setSelectedAcaoId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] font-semibold focus:outline-none focus:border-[var(--color-primary)] cursor-pointer"
                  >
                    {acoes.length === 0 ? (
                      <option value="">Nenhum encontro cadastrado</option>
                    ) : (
                      acoes.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.data_hora ? new Date(a.data_hora).toLocaleDateString('pt-BR') : ''} • {a.nome_acao}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    icon={<CheckCheck className="w-3.5 h-3.5 text-emerald-600" />}
                    onClick={() => handleMarcarTodosModal('presente')}
                  >
                    Todos Presentes
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    icon={<XCircle className="w-3.5 h-3.5 text-rose-500" />}
                    onClick={() => handleMarcarTodosModal('falta')}
                  >
                    Todas Faltas
                  </Button>
                </div>
              </div>
            </div>

            {/* Lista de Alunos para Chamada */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2 custom-scrollbar">
              {loadingModal ? (
                <div className="py-12 text-center text-xs text-[var(--text-muted)]">Carregando chamada...</div>
              ) : (
                inscritos
                  .filter((b) => b.inscricao_status !== 'desligado')
                  .map((b) => {
                    const reg = frequenciasModal[b.id] || { status: 'presente' };
                    // Calcular taxa para mostrar a badge de cor
                    const alunoMetrica = alunosComMetricas.find((a) => a.id === b.id);
                    const faixa = alunoMetrica?.faixaInfo || getFaixaAssiduidade(100);

                    return (
                      <div
                        key={b.id}
                        className="p-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[var(--color-primary)]/40 transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: faixa.dotColor }}
                            title={`Histórico: ${faixa.name}`}
                          />
                          <div className="min-w-0 space-y-0.5">
                            <p className="font-semibold text-xs text-[var(--text-primary)] truncate">
                              {b.nome_completo}
                            </p>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold ${faixa.badgeClass}`}
                              >
                                {faixa.label}
                              </span>
                              <span className="text-[10px] text-[var(--text-muted)] truncate">
                                {b.comunidade || b.bairro || ''}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Botões de Chamada */}
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleStatusChangeModal(b.id, 'presente')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              reg.status === 'presente'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Presente
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChangeModal(b.id, 'falta')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              reg.status === 'falta'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Falta
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChangeModal(b.id, 'justificada')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              reg.status === 'justificada'
                                ? 'bg-yellow-500 text-white shadow-xs'
                                : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                            Justificada
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Footer do Modal */}
            <div className="p-4 sm:p-5 border-t border-[var(--border-default)] bg-[var(--bg-secondary)]/40 flex items-center justify-between gap-3 shrink-0">
              {saveSuccess ? (
                <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Chamada salva com sucesso!
                </div>
              ) : (
                <div className="text-[11px] text-[var(--text-muted)]">
                  Total de {inscritos.filter((b) => b.inscricao_status !== 'desligado').length} alunos ativos
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowChamadaModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  icon={<Save className="w-4 h-4" />}
                  onClick={handleSalvarChamadaModal}
                  disabled={savingModal || !selectedAcaoId}
                >
                  {savingModal ? 'Salvando...' : 'Salvar Chamada'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODAL: PAPEL TIMBRADO (RELATÓRIO DE FREQUÊNCIA EM PDF)
      ═══════════════════════════════════════════════════════════════ */}
      <PapelTimbradoModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        tituloDocumento="RELATÓRIO EXECUTIVO DE FREQUÊNCIA & ASSIDUIDADE"
        subtituloDocumento={`Projeto: ${projetoNome} • Período: ${filtroPeriodo === 'anteriores' ? 'Histórico até Hoje' : filtroPeriodo}`}
      >
        <div className="space-y-5 text-xs text-slate-900 leading-relaxed">
          {/* Quadro de Indicadores */}
          <div className="grid grid-cols-4 gap-3 text-center border border-slate-300 rounded-lg p-3 bg-slate-50 timbrado-avoid-break">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Total Inscritos</p>
              <p className="text-lg font-bold font-mono">{metricasCards.totalInscritos}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Taxa Assiduidade</p>
              <p className="text-lg font-bold font-mono text-emerald-700">{metricasCards.taxaGeral}%</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">100% Presença</p>
              <p className="text-lg font-bold font-mono text-emerald-800">{metricasCards.count100}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Desligados</p>
              <p className="text-lg font-bold font-mono text-slate-600">{metricasCards.totalDesligados}</p>
            </div>
          </div>

          {/* Tabela de Alunos */}
          <div className="border border-slate-300 rounded-lg overflow-hidden timbrado-avoid-break">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-[10px] text-slate-700">
                  <th className="py-2 px-3">Criança / Aluno</th>
                  <th className="py-2 px-3">Bairro / Região</th>
                  <th className="py-2 px-3 text-center">Presenças</th>
                  <th className="py-2 px-3 text-center">Faltas</th>
                  <th className="py-2 px-3 text-center">Assiduidade</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {alunosComMetricas.map((aluno) => (
                  <tr key={aluno.id}>
                    <td className="py-1.5 px-3 font-semibold text-slate-800">{aluno.nome_completo}</td>
                    <td className="py-1.5 px-3 text-slate-600">{aluno.comunidade || aluno.bairro || '—'}</td>
                    <td className="py-1.5 px-3 text-center font-mono">{aluno.presencas}</td>
                    <td className="py-1.5 px-3 text-center font-mono">{aluno.faltas}</td>
                    <td className="py-1.5 px-3 text-center font-mono font-bold">
                      {aluno.isDesligado ? '—' : `${aluno.taxa}%`}
                    </td>
                    <td className="py-1.5 px-3 text-center">
                      <span className="text-[10px] font-bold">
                        {aluno.faixaInfo.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Assinaturas */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs timbrado-avoid-break">
            <div className="border-t border-slate-400 pt-2 space-y-0.5">
              <p className="font-bold text-slate-900">Educador / Responsável pela Chamada</p>
              <p className="text-slate-500 text-[11px]">Instituto Ádapo</p>
            </div>
            <div className="border-t border-slate-400 pt-2 space-y-0.5">
              <p className="font-bold text-slate-900">Coordenação Pedagógica</p>
              <p className="text-slate-500 text-[11px]">Instituto Ádapo</p>
            </div>
          </div>
        </div>
      </PapelTimbradoModal>
    </div>
  );
}
