'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PapelTimbradoModal } from '@/components/ui/PapelTimbradoModal';
import { getFaixaAssiduidade } from './PedagogiaFrequencia';
import {
  User,
  Users,
  Search,
  Printer,
  Calendar,
  MapPin,
  Phone,
  Heart,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Eye,
  Sparkles,
  Award,
} from 'lucide-react';

interface BeneficiarioCompleto {
  id: string;
  nome_completo: string;
  data_nascimento: string;
  cpf?: string;
  rg?: string;
  telefone?: string;
  email?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  comunidade?: string;
  cidade?: string;
  uf?: string;
  contatos_emergencia?: any[];
  observacoes?: string;
  inscricao_status?: 'ativo' | 'desligado';
}

interface PedagogiaDossieProps {
  projetoId: string;
  projetoNome: string;
  inscritos: BeneficiarioCompleto[];
}

export function PedagogiaDossie({ projetoId, projetoNome, inscritos = [] }: PedagogiaDossieProps) {
  const [selectedBeneficiarioId, setSelectedBeneficiarioId] = useState<string>(inscritos[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);
  const [historicoFrequencia, setHistoricoFrequencia] = useState<any[]>([]);
  const [historicoSocioemocional, setHistoricoSocioemocional] = useState<any[]>([]);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Histórico global do projeto para calcular a assiduidade de todos os alunos na listagem
  const [todasFrequenciasProjeto, setTodasFrequenciasProjeto] = useState<any[]>([]);
  const [totalAcoesProjeto, setTotalAcoesProjeto] = useState<number>(0);

  useEffect(() => {
    if (!projetoId) return;

    const carregarMetricasGerais = async () => {
      const supabase = createClient();
      const [{ data: freqData }, { count }] = await Promise.all([
        supabase
          .from('frequencias_acao')
          .select('id, beneficiario_id, status, acao_id')
          .eq('projeto_id', projetoId),
        supabase
          .from('acoes_projeto')
          .select('*', { count: 'exact', head: true })
          .eq('projeto_id', projetoId),
      ]);

      if (freqData) setTodasFrequenciasProjeto(freqData);
      if (count !== null) setTotalAcoesProjeto(count);
    };

    carregarMetricasGerais();
  }, [projetoId]);

  useEffect(() => {
    if (!selectedBeneficiarioId && inscritos.length > 0) {
      setSelectedBeneficiarioId(inscritos[0].id);
    }
  }, [inscritos, selectedBeneficiarioId]);

  // Carregar dados de histórico (Frequências e Avaliações Socioemocionais) do aluno selecionado
  useEffect(() => {
    if (!selectedBeneficiarioId || !projetoId) return;

    const carregarHistorico = async () => {
      setLoadingDetalhes(true);
      const supabase = createClient();

      // 1. Frequências nos encontros deste projeto
      const { data: freqData } = await supabase
        .from('frequencias_acao')
        .select('id, status, justificativa, acoes_projeto(id, nome_acao, data_hora)')
        .eq('beneficiario_id', selectedBeneficiarioId)
        .eq('projeto_id', projetoId)
        .order('created_at', { ascending: false });

      setHistoricoFrequencia(freqData || []);

      // 2. Acompanhamentos socioemocionais deste beneficiário
      const { data: socioData } = await supabase
        .from('acompanhamento_socioemocional')
        .select('*')
        .eq('beneficiario_id', selectedBeneficiarioId)
        .eq('projeto_id', projetoId)
        .order('mes_referencia', { ascending: false });

      setHistoricoSocioemocional(socioData || []);
      setLoadingDetalhes(false);
    };

    carregarHistorico();
  }, [selectedBeneficiarioId, projetoId]);

  const beneficiarioAtual = inscritos.find((b) => b.id === selectedBeneficiarioId);

  // Calcular idade
  const calcularIdade = (dataNasc?: string) => {
    if (!dataNasc) return null;
    const nasc = new Date(dataNasc);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      idade--;
    }
    return idade;
  };

  // Mapa de taxa e faixa por aluno
  const mapaAssiduidadeAlunos = useMemo(() => {
    const mapa: Record<string, { taxa: number; faixaInfo: ReturnType<typeof getFaixaAssiduidade> }> = {};

    inscritos.forEach((aluno) => {
      const isDesligado = aluno.inscricao_status === 'desligado';
      const freqAluno = todasFrequenciasProjeto.filter((f) => f.beneficiario_id === aluno.id);
      const presencas = freqAluno.filter((f) => f.status === 'presente').length;
      const totalEncontros = totalAcoesProjeto > 0 ? totalAcoesProjeto : freqAluno.length;

      const taxa = totalEncontros > 0 ? Math.round((presencas / totalEncontros) * 100) : 100;
      const faixaInfo = getFaixaAssiduidade(taxa, isDesligado);

      mapa[aluno.id] = { taxa, faixaInfo };
    });

    return mapa;
  }, [inscritos, todasFrequenciasProjeto, totalAcoesProjeto]);

  // Estatísticas de Frequência do Aluno Selecionado
  const totalEncontros = historicoFrequencia.length;
  const totalPresencas = historicoFrequencia.filter((f) => f.status === 'presente').length;
  const totalFaltas = historicoFrequencia.filter((f) => f.status === 'falta').length;
  const totalJustificadas = historicoFrequencia.filter((f) => f.status === 'justificada').length;
  const taxaAssiduidade =
    totalEncontros > 0
      ? Math.round((totalPresencas / totalEncontros) * 100)
      : (mapaAssiduidadeAlunos[selectedBeneficiarioId]?.taxa ?? 100);

  const faixaAtual =
    mapaAssiduidadeAlunos[selectedBeneficiarioId]?.faixaInfo ||
    getFaixaAssiduidade(taxaAssiduidade, beneficiarioAtual?.inscricao_status === 'desligado');

  const inscritosFiltrados = inscritos.filter((b) =>
    b.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.comunidade && b.comunidade.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (b.bairro && b.bairro.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* ── Topo: Cabeçalho da Seção Dossiê ── */}
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
              <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                Dossiê Individual do Beneficiário
              </h3>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Ficha cadastral, indicadores de assiduidade e histórico de avaliações dos alunos de <strong>{projetoNome}</strong> ({inscritos.length} crianças).
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Lista de Crianças / Alunos com Cor de Assiduidade */}
        <div className="lg:col-span-4 space-y-3">
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Crianças do Projeto ({inscritos.length})
              </h3>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar criança..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
              />
            </div>

            <div className="space-y-1.5 max-h-[550px] overflow-y-auto pr-1 custom-scrollbar">
              {inscritosFiltrados.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] italic text-center py-6">
                  Nenhuma criança encontrada.
                </p>
              ) : (
                inscritosFiltrados.map((aluno) => {
                  const isSelected = aluno.id === selectedBeneficiarioId;
                  const idade = calcularIdade(aluno.data_nascimento);
                  const assiduidade = mapaAssiduidadeAlunos[aluno.id] || {
                    taxa: 100,
                    faixaInfo: getFaixaAssiduidade(100),
                  };

                  return (
                    <button
                      key={aluno.id}
                      type="button"
                      onClick={() => setSelectedBeneficiarioId(aluno.id)}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between gap-3 border cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/40 shadow-xs'
                          : 'bg-[var(--bg-secondary)]/40 border-[var(--border-default)]/60 hover:bg-[var(--bg-secondary)] hover:border-[var(--border-default)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-[var(--color-primary)] text-white shadow-2xs'
                              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-default)]'
                          }`}
                        >
                          {aluno.nome_completo.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                            {aluno.nome_completo}
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)] truncate">
                            {aluno.comunidade || aluno.bairro || 'Território não inf.'} {idade !== null ? `• ${idade} anos` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Tag de Assiduidade com a cor definida */}
                      <div className="shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] border ${assiduidade.faixaInfo.badgeClass}`}
                          title={`Assiduidade: ${assiduidade.faixaInfo.name}`}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: assiduidade.faixaInfo.dotColor }}
                          />
                          {assiduidade.faixaInfo.label}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Coluna Direita: Dossiê Individual Detalhado */}
        <div className="lg:col-span-8 space-y-4">
          {!beneficiarioAtual ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] space-y-3">
              <User className="w-10 h-10 mx-auto text-[var(--text-muted)] opacity-50" />
              <p className="text-sm font-semibold text-[var(--text-secondary)]">Selecione uma criança na lista para abrir seu dossiê.</p>
            </div>
          ) : (
            <>
              {/* Header do Dossiê */}
              <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-default)] pb-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-[var(--color-primary)]/15 text-[var(--color-primary)] font-bold text-base flex items-center justify-center shrink-0 border border-[var(--color-primary)]/25">
                      {beneficiarioAtual.nome_completo.charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm sm:text-base font-display font-bold text-[var(--text-primary)] truncate">
                          {beneficiarioAtual.nome_completo}
                        </h2>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10.5px] border ${faixaAtual.badgeClass}`}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: faixaAtual.dotColor }}
                          />
                          {faixaAtual.label}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">
                        Projeto: <strong className="text-[var(--text-primary)]">{projetoNome}</strong>
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    icon={<Printer className="w-4 h-4" />}
                    onClick={() => setShowPrintModal(true)}
                  >
                    Exportar Dossiê
                  </Button>
                </div>

                {/* Informações Cadastrais & Territoriais */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[var(--bg-secondary)]/70 border border-[var(--border-default)] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[var(--color-primary)]" />
                      Nascimento &amp; Idade
                    </span>
                    <p className="font-semibold text-[var(--text-primary)] text-xs font-mono-data">
                      {beneficiarioAtual.data_nascimento
                        ? `${new Date(beneficiarioAtual.data_nascimento).toLocaleDateString('pt-BR')} (${calcularIdade(beneficiarioAtual.data_nascimento)} anos)`
                        : 'Não informado'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-secondary)]/70 border border-[var(--border-default)] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[var(--color-primary)]" />
                      Território
                    </span>
                    <p className="font-semibold text-[var(--text-primary)] text-xs truncate">
                      {beneficiarioAtual.comunidade || beneficiarioAtual.bairro || 'Sem território'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-secondary)]/70 border border-[var(--border-default)] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[var(--color-primary)]" />
                      Contato
                    </span>
                    <p className="font-semibold text-[var(--text-primary)] text-xs truncate font-mono-data">
                      {beneficiarioAtual.telefone || 'Sem telefone'}
                    </p>
                  </div>
                </div>

                {/* Indicadores de Frequência do Aluno */}
                <div className="p-4 rounded-xl bg-[var(--bg-secondary)]/70 border border-[var(--border-default)] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                      Assiduidade no Projeto
                    </span>
                    <span
                      className="text-xs font-bold font-mono-data px-2 py-0.5 rounded-lg border"
                      style={{
                        color: faixaAtual.dotColor,
                        borderColor: `${faixaAtual.dotColor}40`,
                        backgroundColor: `${faixaAtual.dotColor}10`,
                      }}
                    >
                      {taxaAssiduidade}% de Presença ({faixaAtual.name})
                    </span>
                  </div>

                  <div className="w-full bg-[var(--bg-elevated)] h-2 rounded-full overflow-hidden border border-[var(--border-default)]/60">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${taxaAssiduidade}%`,
                        backgroundColor: faixaAtual.dotColor,
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-0.5">
                    <div className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)]">
                      <p className="text-[10px] text-emerald-600 font-bold">Presenças</p>
                      <p className="font-mono-data font-bold text-sm text-[var(--text-primary)]">{totalPresencas}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)]">
                      <p className="text-[10px] text-rose-500 font-bold">Faltas</p>
                      <p className="font-mono-data font-bold text-sm text-[var(--text-primary)]">{totalFaltas}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)]">
                      <p className="text-[10px] text-yellow-600 font-bold">Justificadas</p>
                      <p className="font-mono-data font-bold text-sm text-[var(--text-primary)]">{totalJustificadas}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Histórico Recente de Presença & Acompanhamentos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Registro de Encontros */}
                <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2.5">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                      Histórico de Presença ({historicoFrequencia.length})
                    </h3>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                    {loadingDetalhes ? (
                      <p className="text-xs text-[var(--text-muted)] italic text-center py-6">Carregando...</p>
                    ) : historicoFrequencia.length === 0 ? (
                      <p className="text-xs text-[var(--text-muted)] italic text-center py-6">Nenhuma presença registrada ainda.</p>
                    ) : (
                      historicoFrequencia.map((item: any) => {
                        const statusConfig = {
                          presente: { label: 'Presente', icon: CheckCircle2, class: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30' },
                          falta: { label: 'Falta', icon: XCircle, class: 'text-rose-500 bg-rose-500/10 border-rose-500/30' },
                          justificada: { label: 'Justificada', icon: AlertCircle, class: 'text-yellow-600 bg-yellow-500/10 border-yellow-500/30' },
                        }[item.status as 'presente' | 'falta' | 'justificada'] || {
                          label: item.status,
                          icon: AlertCircle,
                          class: 'text-slate-500 bg-slate-500/10 border-slate-500/30',
                        };
                        const IconComp = statusConfig.icon;

                        return (
                          <div
                            key={item.id}
                            className="p-2.5 rounded-xl bg-[var(--bg-secondary)]/50 border border-[var(--border-default)] flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                                {item.acoes_projeto?.nome_acao || 'Ação do Projeto'}
                              </p>
                              <p className="text-[10px] text-[var(--text-muted)] font-mono-data">
                                {item.acoes_projeto?.data_hora
                                  ? new Date(item.acoes_projeto.data_hora).toLocaleDateString('pt-BR')
                                  : 'Data não inf.'}
                              </p>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${statusConfig.class}`}>
                              <IconComp className="w-3 h-3" />
                              {statusConfig.label}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 2. Acompanhamento Socioemocional */}
                <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2.5">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-[#93368F]" />
                      Socioemocional ({historicoSocioemocional.length})
                    </h3>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                    {loadingDetalhes ? (
                      <p className="text-xs text-[var(--text-muted)] italic text-center py-6">Carregando...</p>
                    ) : historicoSocioemocional.length === 0 ? (
                      <p className="text-xs text-[var(--text-muted)] italic text-center py-6">Nenhuma avaliação socioemocional lançada.</p>
                    ) : (
                      historicoSocioemocional.map((item: any) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-xl bg-[var(--bg-secondary)]/50 border border-[var(--border-default)] space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[var(--text-primary)]">
                              Mês: {item.mes_referencia || '—'}
                            </span>
                            <Badge variant="primary" className="text-[10px]">
                              Nota: {item.media_geral || '—'}
                            </Badge>
                          </div>
                          {item.parecer_pedagogico && (
                            <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 italic">
                              "{item.parecer_pedagogico}"
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── MODAL: PAPEL TIMBRADO (EXPORTAÇÃO PDF DO DOSSIÊ) ── */}
      {beneficiarioAtual && (
        <PapelTimbradoModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          tituloDocumento="DOSSIÊ PEDAGÓGICO DO BENEFICIÁRIO"
          subtituloDocumento={`Aluno: ${beneficiarioAtual.nome_completo} • Projeto: ${projetoNome}`}
        >
          <div className="space-y-5 text-xs text-slate-900 leading-relaxed">
            {/* 1. Dados Pessoais */}
            <div className="border border-slate-300 rounded-lg overflow-hidden timbrado-avoid-break">
              <div className="bg-slate-100 p-2 font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300">
                1. IDENTIFICAÇÃO CADASTRAL
              </div>
              <div className="p-3 grid grid-cols-2 gap-x-6 gap-y-1 bg-white">
                <p><strong>Nome Completo:</strong> {beneficiarioAtual.nome_completo}</p>
                <p><strong>Data de Nascimento:</strong> {beneficiarioAtual.data_nascimento ? new Date(beneficiarioAtual.data_nascimento).toLocaleDateString('pt-BR') : '—'} ({calcularIdade(beneficiarioAtual.data_nascimento)} anos)</p>
                <p><strong>Território / Bairro:</strong> {beneficiarioAtual.comunidade || beneficiarioAtual.bairro || '—'}</p>
                <p><strong>Telefone:</strong> {beneficiarioAtual.telefone || '—'}</p>
              </div>
            </div>

            {/* 2. Assiduidade */}
            <div className="border border-slate-300 rounded-lg overflow-hidden timbrado-avoid-break">
              <div className="bg-slate-100 p-2 font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300">
                2. INDICADORES DE FREQUÊNCIA &amp; ASSIDUIDADE
              </div>
              <div className="p-3 grid grid-cols-4 gap-2 text-center bg-white">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Encontros</p>
                  <p className="text-base font-bold font-mono">{totalEncontros}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Presenças</p>
                  <p className="text-base font-bold font-mono text-emerald-700">{totalPresencas}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Faltas</p>
                  <p className="text-base font-bold font-mono text-rose-600">{totalFaltas}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Assiduidade</p>
                  <p className="text-base font-bold font-mono text-emerald-800">{taxaAssiduidade}% ({faixaAtual.label})</p>
                </div>
              </div>
            </div>

            {/* Assinaturas */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs timbrado-avoid-break">
              <div className="border-t border-slate-400 pt-2 space-y-0.5">
                <p className="font-bold text-slate-900">Educador Responsável</p>
                <p className="text-slate-500 text-[11px]">Instituto Ádapo</p>
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
