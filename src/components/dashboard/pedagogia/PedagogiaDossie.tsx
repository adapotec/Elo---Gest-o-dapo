'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PapelTimbradoModal } from '@/components/ui/PapelTimbradoModal';
import {
  User,
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

  useEffect(() => {
    if (!selectedBeneficiarioId && inscritos.length > 0) {
      setSelectedBeneficiarioId(inscritos[0].id);
    }
  }, [inscritos, selectedBeneficiarioId]);

  // Carregar dados de histórico (Frequências e Avaliações Socioemocionais)
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

  // Estatísticas de Frequência do Aluno
  const totalEncontros = historicoFrequencia.length;
  const totalPresencas = historicoFrequencia.filter((f) => f.status === 'presente').length;
  const totalFaltas = historicoFrequencia.filter((f) => f.status === 'falta').length;
  const totalJustificadas = historicoFrequencia.filter((f) => f.status === 'justificada').length;
  const taxaAssiduidade = totalEncontros > 0 ? Math.round((totalPresencas / totalEncontros) * 100) : 0;

  const inscritosFiltrados = inscritos.filter((b) =>
    b.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.comunidade && b.comunidade.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Coluna Esquerda: Lista de Crianças / Alunos */}
      <div className="lg:col-span-4 space-y-3">
        <Card className="p-4 border-[var(--border-default)] bg-[var(--bg-elevated)] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Crianças do Projeto ({inscritos.length})
            </h3>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar criança..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div className="space-y-1 max-h-[550px] overflow-y-auto pr-1">
            {inscritosFiltrados.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] italic text-center py-6">
                Nenhuma criança encontrada.
              </p>
            ) : (
              inscritosFiltrados.map((aluno) => {
                const isSelected = aluno.id === selectedBeneficiarioId;
                const idade = calcularIdade(aluno.data_nascimento);

                return (
                  <button
                    key={aluno.id}
                    type="button"
                    onClick={() => setSelectedBeneficiarioId(aluno.id)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center gap-3 border ${
                      isSelected
                        ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/40 shadow-xs'
                        : 'bg-[var(--bg-secondary)]/40 border-[var(--border-default)]/60 hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
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
                  </button>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Coluna Direita: Dossiê Individual Detalhado */}
      <div className="lg:col-span-8 space-y-6">
        {!beneficiarioAtual ? (
          <Card className="p-12 text-center border-[var(--border-default)] bg-[var(--bg-elevated)] space-y-3">
            <User className="w-10 h-10 mx-auto text-[var(--text-muted)] opacity-50" />
            <p className="text-sm font-semibold text-[var(--text-secondary)]">Selecione uma criança na lista para abrir seu dossiê.</p>
          </Card>
        ) : (
          <>
            {/* Header do Dossiê */}
            <Card className="p-6 border-[var(--border-default)] bg-[var(--bg-elevated)] space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-default)]/60 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/15 text-[var(--color-primary)] font-bold text-lg flex items-center justify-center shadow-inner">
                    {beneficiarioAtual.nome_completo.charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-0.5">
                    <h2 className="text-base font-display font-bold text-[var(--text-primary)]">
                      {beneficiarioAtual.nome_completo}
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      Projeto Vigente: <strong className="text-[var(--text-primary)]">{projetoNome}</strong>
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  icon={<Printer className="w-4 h-4" />}
                  onClick={() => setShowPrintModal(true)}
                >
                  Exportar Dossiê do Aluno
                </Button>
              </div>

              {/* Informações Cadastrais & Territoriais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-[var(--bg-secondary)]/60 border border-[var(--border-default)] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[var(--color-primary)]" />
                    Nascimento & Idade
                  </span>
                  <p className="font-semibold text-[var(--text-primary)]">
                    {beneficiarioAtual.data_nascimento
                      ? `${new Date(beneficiarioAtual.data_nascimento).toLocaleDateString('pt-BR')} (${calcularIdade(beneficiarioAtual.data_nascimento)} anos)`
                      : 'Não informado'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[var(--bg-secondary)]/60 border border-[var(--border-default)] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[var(--color-primary)]" />
                    Território / Comunidade
                  </span>
                  <p className="font-semibold text-[var(--text-primary)] truncate">
                    {beneficiarioAtual.comunidade || beneficiarioAtual.bairro || 'Sem território'}
                    {beneficiarioAtual.cidade ? ` - ${beneficiarioAtual.cidade}/${beneficiarioAtual.uf}` : ''}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[var(--bg-secondary)]/60 border border-[var(--border-default)] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-1">
                    <Phone className="w-3 h-3 text-[var(--color-primary)]" />
                    Contato / Família
                  </span>
                  <p className="font-semibold text-[var(--text-primary)]">
                    {beneficiarioAtual.telefone || 'Sem telefone informado'}
                  </p>
                </div>
              </div>

              {/* Indicadores de Frequência do Aluno */}
              <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Assiduidade no Projeto
                  </span>
                  <span className="text-xs font-bold text-[var(--color-primary)]">
                    {taxaAssiduidade}% de Presença
                  </span>
                </div>

                <div className="w-full bg-[var(--bg-elevated)] h-2 rounded-full overflow-hidden border border-[var(--border-default)]/60">
                  <div
                    className="h-full bg-[var(--color-primary)] transition-all"
                    style={{ width: `${taxaAssiduidade}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium">Presenças</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{totalPresencas}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 block font-medium">Faltas</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">{totalFaltas}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-medium">Justificadas</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">{totalJustificadas}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Linha do Tempo: Acompanhamento Socioemocional Realizado */}
            <Card className="p-6 border-[var(--border-default)] bg-[var(--bg-elevated)] space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-default)]/60 pb-3">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-[var(--color-primary)]" />
                  <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Histórico de Avaliações Socioemocionais (4 Eixos)
                  </h3>
                </div>
                <Badge variant="neutral">{historicoSocioemocional.length} avaliações</Badge>
              </div>

              {historicoSocioemocional.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] italic py-4 text-center">
                  Nenhuma avaliação socioemocional mensal registrada para este aluno ainda. Registre na aba "Socioemocional".
                </p>
              ) : (
                <div className="space-y-3">
                  {historicoSocioemocional.map((aval) => (
                    <div
                      key={aval.id}
                      className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/50 space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Badge variant="primary">Mês {aval.mes_referencia}</Badge>
                          <span className="text-[var(--text-muted)] text-[11px]">
                            Resp: {aval.responsavel_preenchimento || 'Equipe Pedagógica'}
                          </span>
                        </div>
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {new Date(aval.data_registro || aval.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)]/60 space-y-1">
                          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">Eixo 1: Autoestima & Autonomia</span>
                          <p className="text-[11px] text-[var(--text-primary)] font-medium">
                            {aval.eixo1_expressao_opinioes || '—'}
                          </p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)]/60 space-y-1">
                          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">Eixo 2: Socialização & Coletivo</span>
                          <p className="text-[11px] text-[var(--text-primary)] font-medium">
                            {aval.eixo2_resolucao_conflitos || '—'}
                          </p>
                        </div>
                      </div>

                      {aval.eixo4_evolucao_observada && (
                        <div className="text-xs bg-[var(--bg-elevated)] p-2.5 rounded-lg border border-[var(--border-default)]/60 space-y-0.5">
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block">Evolução Observada</span>
                          <p className="text-[11px] text-[var(--text-secondary)]">{aval.eixo4_evolucao_observada}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Histórico Detalhado de Presenças nos Encontros */}
            <Card className="p-6 border-[var(--border-default)] bg-[var(--bg-elevated)] space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-default)]/60 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[var(--color-primary)]" />
                  <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Histórico de Presenças por Encontro
                  </h3>
                </div>
                <Badge variant="neutral">{historicoFrequencia.length} registros</Badge>
              </div>

              {historicoFrequencia.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] italic py-4 text-center">
                  Nenhuma chamada realizada para este aluno ainda.
                </p>
              ) : (
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[var(--border-default)] text-[var(--text-muted)] uppercase text-[10px] font-bold">
                        <th className="py-2 px-3">Data</th>
                        <th className="py-2 px-3">Encontro / Ação</th>
                        <th className="py-2 px-3 text-center">Status</th>
                        <th className="py-2 px-3">Observação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-default)]/40">
                      {historicoFrequencia.map((item) => (
                        <tr key={item.id} className="hover:bg-[var(--bg-secondary)]/40">
                          <td className="py-2 px-3 text-[var(--text-muted)]">
                            {item.acoes_projeto?.data_hora
                              ? new Date(item.acoes_projeto.data_hora).toLocaleDateString('pt-BR')
                              : '—'}
                          </td>
                          <td className="py-2 px-3 font-medium text-[var(--text-primary)]">
                            {item.acoes_projeto?.nome_acao || 'Ação do Projeto'}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {item.status === 'presente' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" /> Presente
                              </span>
                            ) : item.status === 'falta' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                                <XCircle className="w-3 h-3" /> Falta
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                <AlertCircle className="w-3 h-3" /> Justificada
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-[var(--text-muted)]">
                            {item.justificativa || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
      </div>

      {/* MODAL DE EXPORTAÇÃO DO DOSSIÊ EM PAPEL TIMBRADO */}
      <PapelTimbradoModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        tituloDocumento="Dossiê Pedagógico & Ficha do Aluno"
        subtituloDocumento={`Aluno: ${beneficiarioAtual?.nome_completo || ''} • Projeto: ${projetoNome}`}
      >
        <div className="space-y-5 text-xs text-slate-800 leading-relaxed">
          {/* Dados Pessoais e Territoriais */}
          <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 space-y-2 timbrado-avoid-break">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b border-slate-300 pb-1">
              1. Identificação do Beneficiário
            </h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <p><strong>Nome Completo:</strong> {beneficiarioAtual?.nome_completo}</p>
              <p><strong>Data de Nascimento:</strong> {beneficiarioAtual?.data_nascimento ? new Date(beneficiarioAtual.data_nascimento).toLocaleDateString('pt-BR') : '—'} ({calcularIdade(beneficiarioAtual?.data_nascimento)} anos)</p>
              <p><strong>Território / Comunidade:</strong> {beneficiarioAtual?.comunidade || beneficiarioAtual?.bairro || '—'}</p>
              <p><strong>Cidade/UF:</strong> {beneficiarioAtual?.cidade || '—'} - {beneficiarioAtual?.uf || 'SP'}</p>
              <p><strong>Contato do Responsável:</strong> {beneficiarioAtual?.telefone || '—'}</p>
              <p><strong>Projeto Social Vinculado:</strong> {projetoNome}</p>
            </div>
          </div>

          {/* Resumo de Assiduidade */}
          <div className="border border-slate-300 rounded-lg p-3 space-y-2 timbrado-avoid-break">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b border-slate-300 pb-1">
              2. Frequência & Assiduidade Pedagógica
            </h4>
            <div className="grid grid-cols-4 gap-2 text-center pt-1">
              <p><strong>Total de Encontros:</strong> {totalEncontros}</p>
              <p><strong>Presenças:</strong> {totalPresencas}</p>
              <p><strong>Faltas:</strong> {totalFaltas}</p>
              <p><strong>Taxa de Assiduidade:</strong> {taxaAssiduidade}%</p>
            </div>
          </div>

          {/* Histórico Socioemocional */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b border-slate-300 pb-1 timbrado-avoid-break">
              3. Pareceres de Acompanhamento Socioemocional (4 Eixos Ádapo)
            </h4>
            {historicoSocioemocional.length === 0 ? (
              <p className="italic text-slate-500 text-[11px]">Nenhuma avaliação mensal registrada até o momento.</p>
            ) : (
              historicoSocioemocional.map((aval, idx) => (
                <div key={aval.id || idx} className="border border-slate-300 rounded-lg p-3 space-y-2 timbrado-avoid-break">
                  <div className="flex justify-between border-b border-slate-200 pb-1">
                    <span className="font-bold text-slate-900">Mês de Referência: {aval.mes_referencia}</span>
                    <span className="text-slate-600">Responsável: {aval.responsavel_preenchimento || 'Equipe Pedagógica'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <p><strong>Autoestima & Autonomia:</strong> {aval.eixo1_expressao_opinioes || '—'}</p>
                    <p><strong>Socialização & Coletivo:</strong> {aval.eixo2_resolucao_conflitos || '—'}</p>
                    <p><strong>Adesão aos Encantamentos:</strong> {aval.eixo3_respeito_tempo_ritmo || '—'}</p>
                    <p><strong>Trabalho em Equipe:</strong> {aval.eixo2_trabalho_equipe || '—'}</p>
                  </div>
                  {aval.eixo4_evolucao_observada && (
                    <p className="text-[11px] pt-1"><strong>Evolução Observada:</strong> {aval.eixo4_evolucao_observada}</p>
                  )}
                  {aval.eixo4_pontos_atencao && (
                    <p className="text-[11px]"><strong>Pontos de Atenção:</strong> {aval.eixo4_pontos_atencao}</p>
                  )}
                  {aval.eixo4_intervencao_proposta && (
                    <p className="text-[11px]"><strong>Intervenção Proposta:</strong> {aval.eixo4_intervencao_proposta}</p>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="pt-8 grid grid-cols-2 gap-8 text-center timbrado-avoid-break">
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold">Educador(a) / Terapeuta Responsável</p>
              <p className="text-[10px] text-slate-500">Instituto Ádapo</p>
            </div>
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold">Coordenação Geral</p>
              <p className="text-[10px] text-slate-500">Instituto Ádapo</p>
            </div>
          </div>
        </div>
      </PapelTimbradoModal>
    </div>
  );
}
