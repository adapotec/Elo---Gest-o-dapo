'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PapelTimbradoModal } from '@/components/ui/PapelTimbradoModal';
import {
  BookOpen,
  GraduationCap,
  Calendar,
  Users,
  Heart,
  ExternalLink,
  Printer,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  Target,
  RefreshCw,
  Eye,
  Percent,
} from 'lucide-react';

interface ProjetoPedagogiaResumoProps {
  projetoId: string;
  projetoNome: string;
  corIdentificacao?: string;
  acoes?: any[];
  inscritos?: any[];
  metas?: any[];
  voluntarios?: any[];
}

export function ProjetoPedagogiaResumo({
  projetoId,
  projetoNome,
  corIdentificacao = '#93368F',
  acoes = [],
  inscritos = [],
  metas = [],
  voluntarios = [],
}: ProjetoPedagogiaResumoProps) {
  const supabase = createClient();

  // Estados de dados pedagógicos consolidados
  const [loading, setLoading] = useState(true);
  const [planosAula, setPlanosAula] = useState<any[]>([]);
  const [fichasSocioemocionais, setFichasSocioemocionais] = useState<any[]>([]);
  const [frequencias, setFrequencias] = useState<any[]>([]);

  // Sub-abas de visualização executiva
  const [viewTab, setViewTab] = useState<'planos' | 'frequencia' | 'socioemocional'>('planos');

  // Estado de Accordion expandido para planos de aula
  const [expandedPlanoId, setExpandedPlanoId] = useState<string | null>(null);

  // Modais de Documentos Timbrados
  const [planoToPrint, setPlanoToPrint] = useState<any | null>(null);
  const [frequenciaAcaoToPrint, setFrequenciaAcaoToPrint] = useState<{ acao: any; registros: any[] } | null>(null);
  const [fichaToPrint, setFichaToPrint] = useState<any | null>(null);

  // Carrega os dados pedagógicos reais deste projeto
  const carregarDadosPedagogicos = async () => {
    try {
      setLoading(true);

      // 1. Planos de Aula
      const { data: planosData } = await supabase
        .from('planos_aula')
        .select('*')
        .eq('projeto_id', projetoId)
        .order('data_oficina', { ascending: false });

      setPlanosAula(planosData || []);

      // 2. Acompanhamento Socioemocional
      const { data: socioData } = await supabase
        .from('acompanhamento_socioemocional')
        .select('*, beneficiarios(nome_completo, data_nascimento, comunidade)')
        .eq('projeto_id', projetoId)
        .order('mes_referencia', { ascending: false });

      setFichasSocioemocionais(socioData || []);

      // 3. Frequências das Ações
      if (acoes.length > 0) {
        const acoesIds = acoes.map((a) => a.id);
        const { data: freqData } = await supabase
          .from('frequencias_acoes')
          .select('*, beneficiarios(nome_completo)')
          .in('acao_id', acoesIds);

        setFrequencias(freqData || []);
      } else {
        setFrequencias([]);
      }
    } catch (err) {
      console.error('Erro ao carregar dados pedagógicos do projeto:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projetoId) {
      carregarDadosPedagogicos();
    }
  }, [projetoId, acoes]);

  // Cálculos de Indicadores de Alto Nível
  const totalInscritos = inscritos.length;
  const totalPlanos = planosAula.length;
  const totalFichas = fichasSocioemocionais.length;

  // Cálculo da taxa média de presença
  const totalRegistrosFreq = frequencias.length;
  const totalPresentes = frequencias.filter((f) => f.status === 'presente').length;
  const taxaMediaPresenca =
    totalRegistrosFreq > 0 ? Math.round((totalPresentes / totalRegistrosFreq) * 100) : null;

  return (
    <div className="space-y-6">
      {/* ── CABEÇALHO DO PAINEL EXECUTIVO DE PEDAGOGIA ── */}
      <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-default)] pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0"
              style={{ backgroundColor: corIdentificacao || '#93368F' }}
            >
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                  Acompanhamento Pedagógico do Projeto
                </h3>
                <Badge variant="purple">Modo Somente Visualização</Badge>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Visão executiva e relatórios dos trabalhos pedagógicos vinculados a <strong>{projetoNome}</strong>.
              </p>
            </div>
          </div>

          {/* Botão de Redirecionamento para a Pedagogia onde os materiais são editáveis */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/dashboard/pedagogia">
              <Button size="sm" variant="primary" icon={<ExternalLink className="w-4 h-4" />}>
                Abrir Gestão Pedagógica (Edição)
              </Button>
            </Link>
          </div>
        </div>

        {/* Banner Informativo Soft */}
        <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-purple-950 dark:text-purple-200">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>
              Nesta seção você acompanha o progresso pedagógico e <strong>extrai documentos timbrados</strong>. A criação de novos planos e edição de materiais é centralizada no módulo de Pedagogia.
            </span>
          </div>
          <Link
            href="/dashboard/pedagogia"
            className="shrink-0 font-bold text-purple-700 dark:text-purple-300 hover:underline flex items-center gap-1"
          >
            Editar na Pedagogia →
          </Link>
        </div>

        {/* ── 4 CARDS BENTO DE INDICADORES PEDAGÓGICOS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          {/* Card 1: Planos de Aula */}
          <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/50 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Planos Criados</span>
              <BookOpen className="w-4 h-4 text-[#93368F]" />
            </div>
            <p className="text-xl font-bold font-mono-data text-[var(--text-primary)]">
              {totalPlanos}
            </p>
            <span className="text-[10px] text-[var(--text-muted)]">Oficinas estruturadas</span>
          </div>

          {/* Card 2: Índice de Frequência */}
          <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/50 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Frequência Média</span>
              <Percent className="w-4 h-4 text-[#1C9C82]" />
            </div>
            <p className="text-xl font-bold font-mono-data text-[var(--text-primary)]">
              {taxaMediaPresenca !== null ? `${taxaMediaPresenca}%` : '—'}
            </p>
            <span className="text-[10px] text-[var(--color-success)] font-medium">Presença nas oficinas</span>
          </div>

          {/* Card 3: Acompanhamento Socioemocional */}
          <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/50 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Fichas Socioemocionais</span>
              <Heart className="w-4 h-4 text-[#F2632D]" />
            </div>
            <p className="text-xl font-bold font-mono-data text-[var(--text-primary)]">
              {totalFichas}
            </p>
            <span className="text-[10px] text-[var(--text-muted)]">Avaliações individuais</span>
          </div>

          {/* Card 4: Alunos Atendidos */}
          <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/50 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Alunos Inscritos</span>
              <Users className="w-4 h-4 text-[#3B82F6]" />
            </div>
            <p className="text-xl font-bold font-mono-data text-[var(--text-primary)]">
              {totalInscritos}
            </p>
            <span className="text-[10px] text-[var(--text-muted)]">Público participante</span>
          </div>
        </div>
      </div>

      {/* ── BARRA DE SELEÇÃO DE VISÕES EXECUTIVAS (TABS BENTO) ── */}
      <div className="p-2 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)]">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setViewTab('planos')}
            className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all text-xs font-bold cursor-pointer ${
              viewTab === 'planos'
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-sm'
                : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#93368F]" />
            <span>Planos de Aula & Metodologia ({totalPlanos})</span>
          </button>

          <button
            type="button"
            onClick={() => setViewTab('frequencia')}
            className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all text-xs font-bold cursor-pointer ${
              viewTab === 'frequencia'
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-sm'
                : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Calendar className="w-4 h-4 text-[#1C9C82]" />
            <span>Índice de Frequência & Chamadas</span>
          </button>

          <button
            type="button"
            onClick={() => setViewTab('socioemocional')}
            className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all text-xs font-bold cursor-pointer ${
              viewTab === 'socioemocional'
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-sm'
                : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Heart className="w-4 h-4 text-[#F2632D]" />
            <span>Acompanhamento Socioemocional ({totalFichas})</span>
          </button>
        </div>
      </div>

      {/* ── CONTEÚDO DA SUB-ABA ATIVA ── */}
      {loading ? (
        <div className="p-12 text-center rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] flex flex-col items-center justify-center gap-3 text-xs text-[var(--text-muted)]">
          <RefreshCw className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
          <span>Carregando dados pedagógicos do projeto...</span>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* VISÃO 1: PLANOS DE AULA CADASTRADOS & EXPORTAÇÃO TIMBRADA */}
          {/* ========================================================================= */}
          {viewTab === 'planos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h4 className="font-display font-bold text-sm text-[var(--text-primary)]">
                    Planos de Aula do Projeto ({planosAula.length})
                  </h4>
                  <p className="text-xs text-[var(--text-muted)]">
                    Consulte as dinâmicas planejadas e extraia os documentos em papel timbrado.
                  </p>
                </div>
                <Link href="/dashboard/pedagogia">
                  <Button size="sm" variant="secondary" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                    Criar Novo Plano na Pedagogia
                  </Button>
                </Link>
              </div>

              {planosAula.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-[var(--border-default)] rounded-2xl bg-[var(--bg-elevated)] space-y-2">
                  <BookOpen className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
                  <p className="text-xs text-[var(--text-muted)] font-medium">
                    Nenhum plano de aula cadastrado para este projeto até o momento.
                  </p>
                  <Link href="/dashboard/pedagogia">
                    <Button size="sm" variant="primary" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                      Acessar Pedagogia para Criar Plano
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {planosAula.map((plano, idx) => {
                    const isExpanded = expandedPlanoId === plano.id;
                    const numAtividades = Array.isArray(plano.atividades) ? plano.atividades.length : 0;
                    const acaoVinculada = acoes.find((a) => a.id === plano.acao_id);

                    return (
                      <div
                        key={plano.id || idx}
                        className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-xs transition-all overflow-hidden"
                      >
                        {/* Cabeçalho do Card */}
                        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-secondary)]/30 border-b border-[var(--border-default)]/60">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-[#93368F]/10 text-[#93368F] flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                              {idx + 1}
                            </div>
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="font-display font-bold text-sm sm:text-base text-[var(--text-primary)] leading-tight">
                                  {plano.titulo || 'Oficina Pedagógica'}
                                </h5>
                                {plano.oficineiro && (
                                  <Badge variant="neutral">Educador: {plano.oficineiro}</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] flex-wrap">
                                <span className="flex items-center gap-1 font-mono-data">
                                  <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                                  {plano.data_oficina
                                    ? new Date(plano.data_oficina + 'T00:00:00').toLocaleDateString('pt-BR')
                                    : 'Data a definir'}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Target className="w-3.5 h-3.5 text-[#93368F]" />
                                  Ação: {acaoVinculada?.nome_acao || 'Geral / Cronograma'}
                                </span>
                                <span>•</span>
                                <span>{numAtividades} atividade{numAtividades !== 1 ? 's' : ''} planejada{numAtividades !== 1 ? 's' : ''}</span>
                              </div>
                            </div>
                          </div>

                          {/* Botões de Ação: Exportar Timbrado + Accordion */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <Button
                              size="sm"
                              variant="secondary"
                              icon={<Printer className="w-3.5 h-3.5 text-[var(--color-primary)]" />}
                              onClick={() => setPlanoToPrint(plano)}
                            >
                              Extrair Timbrado
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              onClick={() => setExpandedPlanoId(isExpanded ? null : plano.id)}
                            >
                              {isExpanded ? 'Recolher' : 'Ver Detalhes'}
                            </Button>
                          </div>
                        </div>

                        {/* Conteúdo Expandido (Accordion de Consulta dos Materiais e Atividades) */}
                        {isExpanded && (
                          <div className="p-4 sm:p-5 space-y-4 bg-[var(--bg-elevated)] animate-in fade-in duration-150">
                            {/* Proposta / Descrição */}
                            {plano.descricao && (
                              <div className="space-y-1">
                                <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                  Proposta Socioeducativa & Objetivos
                                </span>
                                <p className="text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap bg-[var(--bg-secondary)]/40 p-3 rounded-xl border border-[var(--border-default)]">
                                  {plano.descricao}
                                </p>
                              </div>
                            )}

                            {/* Grade de Atividades Detalhadas */}
                            <div className="space-y-2">
                              <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                Grade de Dinâmicas & Materiais ({numAtividades})
                              </span>

                              {numAtividades === 0 ? (
                                <p className="text-xs text-[var(--text-muted)] italic">
                                  Nenhuma atividade individual cadastrada neste plano.
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {plano.atividades.map((ativ: any, aIdx: number) => {
                                    const metaObj = metas.find((m) => m.id === ativ.meta_id);
                                    return (
                                      <div
                                        key={ativ.id || aIdx}
                                        className="p-3.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/30 space-y-2 text-xs"
                                      >
                                        <div className="flex items-center justify-between border-b border-[var(--border-default)]/60 pb-1.5">
                                          <span className="font-bold text-[var(--text-primary)]">
                                            {aIdx + 1}. {ativ.titulo || 'Atividade'}
                                          </span>
                                          {ativ.mediador && (
                                            <span className="text-[11px] text-[var(--text-muted)] font-medium">
                                              {ativ.mediador}
                                            </span>
                                          )}
                                        </div>

                                        {ativ.descricao && (
                                          <p className="text-[11.5px] text-[var(--text-secondary)] leading-relaxed">
                                            {ativ.descricao}
                                          </p>
                                        )}

                                        <div className="space-y-1 pt-1 border-t border-[var(--border-default)]/40 text-[11px]">
                                          {ativ.materiais && (
                                            <div>
                                              <strong className="text-[var(--text-secondary)]">Materiais: </strong>
                                              <span className="text-[var(--text-muted)]">{ativ.materiais}</span>
                                            </div>
                                          )}
                                          {metaObj && (
                                            <div>
                                              <strong className="text-[var(--color-primary)]">Meta Vinculada: </strong>
                                              <span className="text-[var(--text-secondary)]">{metaObj.descricao}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Observações Gerais */}
                            {plano.observacoes_gerais && (
                              <div className="space-y-1 pt-2 border-t border-[var(--border-default)]/60">
                                <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                  Observações e Avaliação Pedagógica
                                </span>
                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
                                  {plano.observacoes_gerais}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* VISÃO 2: FREQUÊNCIA DAS AÇÕES & EXTRAÇÃO DE CHAMADA */}
          {/* ========================================================================= */}
          {viewTab === 'frequencia' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h4 className="font-display font-bold text-sm text-[var(--text-primary)]">
                    Acompanhamento de Frequência por Ação
                  </h4>
                  <p className="text-xs text-[var(--text-muted)]">
                    Percentual de presença registrado nas oficinas e lista de chamada para impressão.
                  </p>
                </div>
                <Link href="/dashboard/pedagogia">
                  <Button size="sm" variant="secondary" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                    Lançar Frequência na Pedagogia
                  </Button>
                </Link>
              </div>

              {acoes.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-[var(--border-default)] rounded-2xl bg-[var(--bg-elevated)] space-y-2">
                  <Calendar className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
                  <p className="text-xs text-[var(--text-muted)]">
                    Nenhuma ação cadastrada no cronograma deste projeto para registro de chamada.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {acoes.map((acao, aIdx) => {
                    const regsAcao = frequencias.filter((f) => f.acao_id === acao.id);
                    const totalRegs = regsAcao.length;
                    const presentes = regsAcao.filter((f) => f.status === 'presente').length;
                    const faltas = regsAcao.filter((f) => f.status === 'falta').length;
                    const percentual = totalRegs > 0 ? Math.round((presentes / totalRegs) * 100) : null;

                    return (
                      <div
                        key={acao.id || aIdx}
                        className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2 border-b border-[var(--border-default)] pb-2.5">
                          <div className="min-w-0 space-y-0.5">
                            <h5 className="font-display font-bold text-sm text-[var(--text-primary)] truncate">
                              {acao.nome_acao}
                            </h5>
                            <span className="text-xs text-[var(--text-muted)] font-mono-data">
                              {acao.data_hora
                                ? new Date(acao.data_hora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                                : 'Data não informada'}
                            </span>
                          </div>
                          {percentual !== null ? (
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                percentual >= 75
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                              }`}
                            >
                              {percentual}% Presença
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                              Não lançada
                            </span>
                          )}
                        </div>

                        {/* Indicadores numéricos da chamada */}
                        <div className="grid grid-cols-3 gap-2 text-center text-xs py-1">
                          <div className="p-2 rounded-xl bg-[var(--bg-secondary)]/50">
                            <span className="text-[10px] text-[var(--text-muted)] block">Lançados</span>
                            <span className="font-bold text-[var(--text-primary)] font-mono-data">{totalRegs}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-emerald-500/10">
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block">Presentes</span>
                            <span className="font-bold text-emerald-800 dark:text-emerald-200 font-mono-data">{presentes}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-red-500/10">
                            <span className="text-[10px] text-red-700 dark:text-red-300 block">Faltas</span>
                            <span className="font-bold text-red-800 dark:text-red-200 font-mono-data">{faltas}</span>
                          </div>
                        </div>

                        {/* Botão de Exportação de Lista de Chamada Timbrada */}
                        <div className="pt-2 border-t border-[var(--border-default)]/60 flex justify-end">
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={<Printer className="w-3.5 h-3.5 text-[var(--color-primary)]" />}
                            onClick={() => setFrequenciaAcaoToPrint({ acao, registros: regsAcao })}
                          >
                            Lista de Chamada Timbrada
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* VISÃO 3: ACOMPANHAMENTO SOCIOEMOCIONAL & RELATÓRIOS */}
          {/* ========================================================================= */}
          {viewTab === 'socioemocional' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h4 className="font-display font-bold text-sm text-[var(--text-primary)]">
                    Fichas de Acompanhamento Socioemocional ({fichasSocioemocionais.length})
                  </h4>
                  <p className="text-xs text-[var(--text-muted)]">
                    Observações de desenvolvimento individual, convivência comunitária e relatórios timbrados.
                  </p>
                </div>
                <Link href="/dashboard/pedagogia">
                  <Button size="sm" variant="secondary" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                    Nova Avaliação na Pedagogia
                  </Button>
                </Link>
              </div>

              {fichasSocioemocionais.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-[var(--border-default)] rounded-2xl bg-[var(--bg-elevated)] space-y-2">
                  <Heart className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
                  <p className="text-xs text-[var(--text-muted)]">
                    Nenhuma ficha socioemocional registrada para os alunos deste projeto até o momento.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {fichasSocioemocionais.map((ficha, fIdx) => {
                    const alunoNome = ficha.beneficiarios?.nome_completo || 'Aluno(a)';
                    const mes = ficha.mes_referencia || '—';

                    return (
                      <div
                        key={ficha.id || fIdx}
                        className="p-4 sm:p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2 border-b border-[var(--border-default)] pb-2.5">
                          <div className="min-w-0 space-y-0.5">
                            <h5 className="font-display font-bold text-sm text-[var(--text-primary)] truncate">
                              {alunoNome}
                            </h5>
                            <span className="text-xs text-[var(--text-muted)]">
                              Mês de Referência: <strong className="text-[var(--text-primary)]">{mes}</strong>
                            </span>
                          </div>
                          {ficha.responsavel && (
                            <Badge variant="neutral">Avaliador: {ficha.responsavel}</Badge>
                          )}
                        </div>

                        {/* Síntese Qualitativa */}
                        {ficha.observacoes_gerais ? (
                          <p className="text-xs text-[var(--text-secondary)] line-clamp-3 leading-relaxed bg-[var(--bg-secondary)]/40 p-2.5 rounded-xl border border-[var(--border-default)]">
                            {ficha.observacoes_gerais}
                          </p>
                        ) : (
                          <p className="text-xs text-[var(--text-muted)] italic">
                            Ficha com dimensões avaliadas registrada pela equipe.
                          </p>
                        )}

                        <div className="pt-2 border-t border-[var(--border-default)]/60 flex justify-end">
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={<Printer className="w-3.5 h-3.5 text-[var(--color-primary)]" />}
                            onClick={() => setFichaToPrint(ficha)}
                          >
                            Ficha Timbrada (PDF)
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: EXPORTAR PLANO DE AULA EM PAPEL TIMBRADO */}
      {/* ========================================================================= */}
      {planoToPrint && (
        <PapelTimbradoModal
          isOpen={!!planoToPrint}
          onClose={() => setPlanoToPrint(null)}
          tituloDocumento="PLANO DE AULA & DIRETRIZ PEDAGÓGICA"
          subtituloDocumento={`Projeto Social: ${projetoNome}`}
        >
          <div className="space-y-5 text-slate-800 text-xs leading-relaxed">
            {/* Header com Metadados */}
            <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-bold text-slate-900 block">Título da Oficina:</span>
                  <span className="text-slate-700">{planoToPrint.titulo || 'Oficina Pedagógica'}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Data do Encontro:</span>
                  <span className="text-slate-700">
                    {planoToPrint.data_oficina
                      ? new Date(planoToPrint.data_oficina + 'T00:00:00').toLocaleDateString('pt-BR')
                      : 'Não informada'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                <div>
                  <span className="font-bold text-slate-900 block">Educador / Responsável:</span>
                  <span className="text-slate-700">{planoToPrint.oficineiro || 'Equipe Pedagógica'}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Ação Vinculada:</span>
                  <span className="text-slate-700">
                    {acoes.find((a) => a.id === planoToPrint.acao_id)?.nome_acao || 'Cronograma Geral'}
                  </span>
                </div>
              </div>
            </div>

            {/* 1. Descrição Geral / Objetivos */}
            {planoToPrint.descricao && (
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b border-slate-300 pb-1">
                  1. Descrição Geral do Encontro & Proposta Socioeducativa
                </h4>
                <p className="text-slate-700 whitespace-pre-wrap">{planoToPrint.descricao}</p>
              </div>
            )}

            {/* 2. Grade de Atividades Pedagógicas */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b border-slate-300 pb-1">
                2. Atividades Pedagógicas, Metodologia e Materiais
              </h4>

              {Array.isArray(planoToPrint.atividades) && planoToPrint.atividades.length > 0 ? (
                <div className="space-y-3">
                  {planoToPrint.atividades.map((ativ: any, idx: number) => {
                    const metaObj = metas.find((m) => m.id === ativ.meta_id);
                    return (
                      <div
                        key={ativ.id || idx}
                        className="p-3 rounded-lg border border-slate-300 bg-white space-y-1.5"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                          <span className="font-bold text-slate-900">
                            Atividade {idx + 1}: {ativ.titulo}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-600">
                            Mediador: {ativ.mediador || 'Não informado'}
                          </span>
                        </div>

                        {ativ.descricao && (
                          <div className="text-slate-700 whitespace-pre-wrap text-[11.5px]">
                            {ativ.descricao}
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-[11px]">
                          <div>
                            <span className="font-bold text-slate-800">Materiais: </span>
                            <span className="text-slate-600">{ativ.materiais || '—'}</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-800">Meta do Projeto: </span>
                            <span className="text-slate-600">{metaObj?.descricao || '—'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 italic">Nenhuma atividade detalhada cadastrada.</p>
              )}
            </div>

            {/* 3. Observações Gerais */}
            {planoToPrint.observacoes_gerais && (
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b border-slate-300 pb-1">
                  3. Observações Gerais & Avaliação
                </h4>
                <p className="text-slate-700 whitespace-pre-wrap">{planoToPrint.observacoes_gerais}</p>
              </div>
            )}

            {/* Bloco de Assinaturas */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-slate-400 pt-2 space-y-0.5">
                <p className="font-bold text-slate-900">{planoToPrint.oficineiro || 'Educador(a) Social'}</p>
                <p className="text-slate-500 text-[11px]">Responsável pela Mediação Pedagógica</p>
              </div>
              <div className="border-t border-slate-400 pt-2 space-y-0.5">
                <p className="font-bold text-slate-900">Coordenação Pedagógica</p>
                <p className="text-slate-500 text-[11px]">Instituto Ádapo</p>
              </div>
            </div>
          </div>
        </PapelTimbradoModal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EXPORTAR LISTA DE CHAMADA EM PAPEL TIMBRADO */}
      {/* ========================================================================= */}
      {frequenciaAcaoToPrint && (
        <PapelTimbradoModal
          isOpen={!!frequenciaAcaoToPrint}
          onClose={() => setFrequenciaAcaoToPrint(null)}
          tituloDocumento="LISTA DE PRESENÇA & REGISTRO DE FREQUÊNCIA"
          subtituloDocumento={`Ação: ${frequenciaAcaoToPrint.acao?.nome_acao} • Projeto: ${projetoNome}`}
        >
          <div className="space-y-5 text-slate-800 text-xs leading-relaxed">
            <div className="p-3 rounded-lg border border-slate-300 bg-slate-50 grid grid-cols-2 gap-2 text-xs">
              <div>
                <strong>Ação / Encontro:</strong> {frequenciaAcaoToPrint.acao?.nome_acao}
              </div>
              <div>
                <strong>Data e Horário:</strong>{' '}
                {frequenciaAcaoToPrint.acao?.data_hora
                  ? new Date(frequenciaAcaoToPrint.acao.data_hora).toLocaleString('pt-BR')
                  : '—'}
              </div>
            </div>

            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 border border-slate-300 w-12 text-center">Nº</th>
                  <th className="p-2 border border-slate-300">Nome do(a) Beneficiário(a)</th>
                  <th className="p-2 border border-slate-300 w-28 text-center">Status</th>
                  <th className="p-2 border border-slate-300 w-44">Assinatura / Justificativa</th>
                </tr>
              </thead>
              <tbody>
                {inscritos.map((insc, idx) => {
                  const reg = frequenciaAcaoToPrint.registros.find((r) => r.beneficiario_id === insc.id);
                  const status = reg ? reg.status : '—';

                  return (
                    <tr key={insc.id || idx} className="border-b border-slate-200">
                      <td className="p-2 border border-slate-300 text-center font-bold">{idx + 1}</td>
                      <td className="p-2 border border-slate-300 font-medium">{insc.nome_completo}</td>
                      <td className="p-2 border border-slate-300 text-center font-bold">
                        {status === 'presente' && <span className="text-emerald-700">Presente</span>}
                        {status === 'falta' && <span className="text-red-700">Falta</span>}
                        {status === 'justificada' && <span className="text-amber-700">Justificada</span>}
                        {status === '—' && <span className="text-slate-400">—</span>}
                      </td>
                      <td className="p-2 border border-slate-300 text-slate-600">
                        {reg?.justificativa || ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-slate-400 pt-2 space-y-0.5">
                <p className="font-bold text-slate-900">Educador(a) Responsável</p>
                <p className="text-slate-500 text-[11px]">Mediação Social</p>
              </div>
              <div className="border-t border-slate-400 pt-2 space-y-0.5">
                <p className="font-bold text-slate-900">Coordenação de Projetos</p>
                <p className="text-slate-500 text-[11px]">Instituto Ádapo</p>
              </div>
            </div>
          </div>
        </PapelTimbradoModal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EXPORTAR FICHA SOCIOEMOCIONAL EM PAPEL TIMBRADO */}
      {/* ========================================================================= */}
      {fichaToPrint && (
        <PapelTimbradoModal
          isOpen={!!fichaToPrint}
          onClose={() => setFichaToPrint(null)}
          tituloDocumento="AVALIAÇÃO E DESENVOLVIMENTO SOCIOEMOCIONAL"
          subtituloDocumento={`Beneficiário(a): ${fichaToPrint.beneficiarios?.nome_completo || 'Aluno'} • Projeto: ${projetoNome}`}
        >
          <div className="space-y-5 text-slate-800 text-xs leading-relaxed">
            <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 grid grid-cols-2 gap-2 text-xs">
              <div>
                <strong>Aluno(a):</strong> {fichaToPrint.beneficiarios?.nome_completo}
              </div>
              <div>
                <strong>Mês de Referência:</strong> {fichaToPrint.mes_referencia}
              </div>
              <div>
                <strong>Comunidade/Território:</strong> {fichaToPrint.beneficiarios?.comunidade || '—'}
              </div>
              <div>
                <strong>Responsável pela Avaliação:</strong> {fichaToPrint.responsavel || 'Equipe Pedagógica'}
              </div>
            </div>

            {fichaToPrint.observacoes_gerais && (
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b border-slate-300 pb-1">
                  Síntese do Desenvolvimento & Observações do Educador
                </h4>
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {fichaToPrint.observacoes_gerais}
                </p>
              </div>
            )}

            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-slate-400 pt-2 space-y-0.5">
                <p className="font-bold text-slate-900">{fichaToPrint.responsavel || 'Educador(a) Social'}</p>
                <p className="text-slate-500 text-[11px]">Acompanhamento Pedagógico</p>
              </div>
              <div className="border-t border-slate-400 pt-2 space-y-0.5">
                <p className="font-bold text-slate-900">Coordenação Pedagógica</p>
                <p className="text-slate-500 text-[11px]">Instituto Ádapo</p>
              </div>
            </div>
          </div>
        </PapelTimbradoModal>
      )}
    </div>
  );
}
