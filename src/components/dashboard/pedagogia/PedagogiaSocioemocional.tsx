'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PapelTimbradoModal } from '@/components/ui/PapelTimbradoModal';
import {
  Heart,
  Save,
  Printer,
  Sparkles,
  Users,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileText,
  Smile,
  Shield,
  MessageSquareHeart,
  Plus,
} from 'lucide-react';

interface BeneficiarioItem {
  id: string;
  nome_completo: string;
  data_nascimento: string;
  comunidade?: string;
  bairro?: string;
}

interface PedagogiaSocioemocionalProps {
  projetoId: string;
  projetoNome: string;
  inscritos: BeneficiarioItem[];
  voluntarios?: any[];
  onRefresh?: () => void;
}

export function PedagogiaSocioemocional({
  projetoId,
  projetoNome,
  inscritos = [],
  voluntarios = [],
  onRefresh,
}: PedagogiaSocioemocionalProps) {
  const [subTab, setSubTab] = useState<'fichas' | 'formulario'>('fichas');
  const [selectedBeneficiarioId, setSelectedBeneficiarioId] = useState<string>(inscritos[0]?.id || '');
  const [mesReferencia, setMesReferencia] = useState<string>(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [responsavel, setResponsavel] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [todasFichasProjeto, setTodasFichasProjeto] = useState<any[]>([]);
  const [loadingFichas, setLoadingFichas] = useState(false);
  const [showDevolutivaModal, setShowDevolutivaModal] = useState(false);
  const [fichaParaDevolutiva, setFichaParaDevolutiva] = useState<any | null>(null);

  // Estado do formulário de 4 Eixos
  const [formData, setFormData] = useState({
    id: undefined as string | undefined,
    // Eixo 1: Autoestima e Autonomia
    eixo1_expressao_opinioes: 'Em desenvolvimento',
    eixo1_enfrentamento_desafios: 'Pede ajuda facilmente',
    eixo1_autoimagem: 'Demonstra pertencimento',
    // Eixo 2: Socialização e Cooperação
    eixo2_resolucao_conflitos: 'Tenta conversar',
    eixo2_trabalho_equipe: 'Participa quando incentivada',
    eixo2_cuidado_espaco: 'Colabora quando solicitado',
    // Eixo 3: Adesão aos "Encantamentos"
    eixo3_respeito_tempo_ritmo: 'Segue a rotina com apoio',
    eixo3_escuta_ativa: 'Ouve com esforço',
    eixo3_apoio_mutuo: 'Auxilia quando orientada',
    // Eixo 4: Registro Qualitativo (Diário de Bordo)
    eixo4_evolucao_observada: '',
    eixo4_pontos_atencao: '',
    eixo4_intervencao_proposta: '',
  });

  // Carregar todas as fichas do projeto
  const carregarFichasProjeto = async () => {
    if (!projetoId) return;
    setLoadingFichas(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('acompanhamento_socioemocional')
      .select('*, beneficiarios:beneficiario_id(id, nome_completo, data_nascimento, comunidade, bairro)')
      .eq('projeto_id', projetoId)
      .order('mes_referencia', { ascending: false });

    if (!error && data) {
      setTodasFichasProjeto(data);
    }
    setLoadingFichas(false);
  };

  useEffect(() => {
    carregarFichasProjeto();
  }, [projetoId]);

  useEffect(() => {
    if (!selectedBeneficiarioId && inscritos.length > 0) {
      setSelectedBeneficiarioId(inscritos[0].id);
    }
  }, [inscritos, selectedBeneficiarioId]);

  // Carregar avaliação existente deste aluno para o mês selecionado
  const carregarAvaliacaoAluno = async (beneficiarioId: string, mes: string) => {
    if (!beneficiarioId || !projetoId || !mes) return;
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('acompanhamento_socioemocional')
      .select('*')
      .eq('beneficiario_id', beneficiarioId)
      .eq('projeto_id', projetoId)
      .eq('mes_referencia', mes)
      .maybeSingle();

    if (data && !error) {
      setFormData({
        id: data.id,
        eixo1_expressao_opinioes: data.eixo1_expressao_opinioes || 'Em desenvolvimento',
        eixo1_enfrentamento_desafios: data.eixo1_enfrentamento_desafios || 'Pede ajuda facilmente',
        eixo1_autoimagem: data.eixo1_autoimagem || 'Demonstra pertencimento',
        eixo2_resolucao_conflitos: data.eixo2_resolucao_conflitos || 'Tenta conversar',
        eixo2_trabalho_equipe: data.eixo2_trabalho_equipe || 'Participa quando incentivada',
        eixo2_cuidado_espaco: data.eixo2_cuidado_espaco || 'Colabora quando solicitado',
        eixo3_respeito_tempo_ritmo: data.eixo3_respeito_tempo_ritmo || 'Segue a rotina com apoio',
        eixo3_escuta_ativa: data.eixo3_escuta_ativa || 'Ouve com esforço',
        eixo3_apoio_mutuo: data.eixo3_apoio_mutuo || 'Auxilia quando orientada',
        eixo4_evolucao_observada: data.eixo4_evolucao_observada || '',
        eixo4_pontos_atencao: data.eixo4_pontos_atencao || '',
        eixo4_intervencao_proposta: data.eixo4_intervencao_proposta || '',
      });
      setResponsavel(data.responsavel_preenchimento || '');
    } else {
      setFormData({
        id: undefined,
        eixo1_expressao_opinioes: 'Em desenvolvimento',
        eixo1_enfrentamento_desafios: 'Pede ajuda facilmente',
        eixo1_autoimagem: 'Demonstra pertencimento',
        eixo2_resolucao_conflitos: 'Tenta conversar',
        eixo2_trabalho_equipe: 'Participa quando incentivada',
        eixo2_cuidado_espaco: 'Colabora quando solicitado',
        eixo3_respeito_tempo_ritmo: 'Segue a rotina com apoio',
        eixo3_escuta_ativa: 'Ouve com esforço',
        eixo3_apoio_mutuo: 'Auxilia quando orientada',
        eixo4_evolucao_observada: '',
        eixo4_pontos_atencao: '',
        eixo4_intervencao_proposta: '',
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (subTab === 'formulario') {
      carregarAvaliacaoAluno(selectedBeneficiarioId, mesReferencia);
    }
  }, [selectedBeneficiarioId, projetoId, mesReferencia, subTab]);

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

  const handleEditarFicha = (ficha: any) => {
    setSelectedBeneficiarioId(ficha.beneficiario_id);
    setMesReferencia(ficha.mes_referencia);
    setFormData({
      id: ficha.id,
      eixo1_expressao_opinioes: ficha.eixo1_expressao_opinioes || 'Em desenvolvimento',
      eixo1_enfrentamento_desafios: ficha.eixo1_enfrentamento_desafios || 'Pede ajuda facilmente',
      eixo1_autoimagem: ficha.eixo1_autoimagem || 'Demonstra pertencimento',
      eixo2_resolucao_conflitos: ficha.eixo2_resolucao_conflitos || 'Tenta conversar',
      eixo2_trabalho_equipe: ficha.eixo2_trabalho_equipe || 'Participa quando incentivada',
      eixo2_cuidado_espaco: ficha.eixo2_cuidado_espaco || 'Colabora quando solicitado',
      eixo3_respeito_tempo_ritmo: ficha.eixo3_respeito_tempo_ritmo || 'Segue a rotina com apoio',
      eixo3_escuta_ativa: ficha.eixo3_escuta_ativa || 'Ouve com esforço',
      eixo3_apoio_mutuo: ficha.eixo3_apoio_mutuo || 'Auxilia quando orientada',
      eixo4_evolucao_observada: ficha.eixo4_evolucao_observada || '',
      eixo4_pontos_atencao: ficha.eixo4_pontos_atencao || '',
      eixo4_intervencao_proposta: ficha.eixo4_intervencao_proposta || '',
    });
    setResponsavel(ficha.responsavel_preenchimento || '');
    setSubTab('formulario');
  };

  const handleNovaFicha = () => {
    setFormData({
      id: undefined,
      eixo1_expressao_opinioes: 'Em desenvolvimento',
      eixo1_enfrentamento_desafios: 'Pede ajuda facilmente',
      eixo1_autoimagem: 'Demonstra pertencimento',
      eixo2_resolucao_conflitos: 'Tenta conversar',
      eixo2_trabalho_equipe: 'Participa quando incentivada',
      eixo2_cuidado_espaco: 'Colabora quando solicitado',
      eixo3_respeito_tempo_ritmo: 'Segue a rotina com apoio',
      eixo3_escuta_ativa: 'Ouve com esforço',
      eixo3_apoio_mutuo: 'Auxilia quando orientada',
      eixo4_evolucao_observada: '',
      eixo4_pontos_atencao: '',
      eixo4_intervencao_proposta: '',
    });
    setSubTab('formulario');
  };

  const handleExcluirFicha = async (fichaId: string) => {
    if (!confirm('Deseja realmente excluir esta ficha de acompanhamento socioemocional?')) return;
    const supabase = createClient();
    const { error } = await supabase.from('acompanhamento_socioemocional').delete().eq('id', fichaId);
    if (error) {
      alert('Erro ao excluir ficha: ' + error.message);
    } else {
      carregarFichasProjeto();
      if (onRefresh) onRefresh();
    }
  };

  const handleAbrirDevolutiva = (ficha?: any) => {
    if (ficha) {
      setFichaParaDevolutiva(ficha);
    } else {
      setFichaParaDevolutiva({
        ...formData,
        beneficiarios: beneficiarioAtual,
        responsavel_preenchimento: responsavel,
        mes_referencia: mesReferencia,
      });
    }
    setShowDevolutivaModal(true);
  };

  const handleSalvar = async () => {
    if (!selectedBeneficiarioId || !projetoId) return;
    setSaving(true);
    setSaveSuccess(false);

    const supabase = createClient();
    const payload = {
      beneficiario_id: selectedBeneficiarioId,
      projeto_id: projetoId,
      mes_referencia: mesReferencia,
      data_registro: new Date().toISOString().split('T')[0],
      responsavel_preenchimento: responsavel || 'Equipe Pedagógica',
      idade_referencia: calcularIdade(beneficiarioAtual?.data_nascimento),
      eixo1_expressao_opinioes: formData.eixo1_expressao_opinioes,
      eixo1_enfrentamento_desafios: formData.eixo1_enfrentamento_desafios,
      eixo1_autoimagem: formData.eixo1_autoimagem,
      eixo2_resolucao_conflitos: formData.eixo2_resolucao_conflitos,
      eixo2_trabalho_equipe: formData.eixo2_trabalho_equipe,
      eixo2_cuidado_espaco: formData.eixo2_cuidado_espaco,
      eixo3_respeito_tempo_ritmo: formData.eixo3_respeito_tempo_ritmo,
      eixo3_escuta_ativa: formData.eixo3_escuta_ativa,
      eixo3_apoio_mutuo: formData.eixo3_apoio_mutuo,
      eixo4_evolucao_observada: formData.eixo4_evolucao_observada || null,
      eixo4_pontos_atencao: formData.eixo4_pontos_atencao || null,
      eixo4_intervencao_proposta: formData.eixo4_intervencao_proposta || null,
      updated_at: new Date().toISOString(),
    };

    let saveErr = null;
    if (formData.id) {
      const { error } = await supabase
        .from('acompanhamento_socioemocional')
        .update(payload)
        .eq('id', formData.id);
      saveErr = error;
    } else {
      const { data: newRow, error } = await supabase
        .from('acompanhamento_socioemocional')
        .insert(payload)
        .select('id')
        .single();
      saveErr = error;
      if (newRow) {
        setFormData((prev) => ({ ...prev, id: newRow.id }));
      }
    }

    if (saveErr) {
      alert('Erro ao salvar avaliação socioemocional: ' + saveErr.message);
    } else {
      setSaveSuccess(true);
      carregarFichasProjeto();
      setTimeout(() => setSaveSuccess(false), 4000);
      if (onRefresh) onRefresh();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* ── Topo: Cabeçalho da Seção e Navegação Interna ── */}
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-default)] pb-4">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
              <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                Acompanhamento Socioemocional (4 Eixos Ádapo)
              </h3>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Avaliação contínua do desenvolvimento socioemocional, convivência e plano de acolhimento para <strong>{projetoNome}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {subTab === 'fichas' ? (
              <Button
                size="sm"
                variant="primary"
                icon={<Heart className="w-4 h-4" />}
                onClick={handleNovaFicha}
              >
                Nova Avaliação Socioemocional
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSubTab('fichas')}
                >
                  Ver Fichas Salvas
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<MessageSquareHeart className="w-4 h-4 text-[var(--color-primary)]" />}
                  onClick={() => handleAbrirDevolutiva()}
                  disabled={!beneficiarioAtual}
                >
                  Devolutiva à Família
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Save className="w-4 h-4" />}
                  onClick={handleSalvar}
                  disabled={saving || !beneficiarioAtual}
                >
                  {saving ? 'Salvando...' : 'Salvar Ficha'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Sub-navegação em Pílulas */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab('fichas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'fichas'
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/80'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Fichas Cadastradas ({todasFichasProjeto.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('formulario')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'formulario'
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/80'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            {formData.id ? 'Editar Ficha Ativa' : 'Preencher Nova Ficha'}
          </button>
        </div>
      </div>

      {/* Feedback de Salvamento com Alto Contraste */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-white" />
          Ficha de Acompanhamento Socioemocional gravada com sucesso no sistema!
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          VISUALIZAÇÃO 1: CONSULTA DE FICHAS CADASTRADAS (BAIXA CARGA COGNITIVA)
      ═══════════════════════════════════════════════════════════════ */}
      {subTab === 'fichas' && (
        <div className="space-y-4">
          {loadingFichas ? (
            <div className="p-12 text-center text-xs text-[var(--text-muted)]">Carregando fichas socioemocionais...</div>
          ) : todasFichasProjeto.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] space-y-3">
              <Heart className="w-10 h-10 mx-auto text-[var(--text-muted)] opacity-40" />
              <p className="text-sm font-semibold text-[var(--text-secondary)]">
                Nenhuma avaliação socioemocional registrada para {projetoNome}.
              </p>
              <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                Registre o acompanhamento contínuo dos 4 eixos (Autoestima, Socialização, Regras e Registro Qualitativo) e gere a devolutiva em PDF timbrado para as famílias.
              </p>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={handleNovaFicha}
              >
                Preencher Primeira Avaliação
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {todasFichasProjeto.map((ficha) => {
                const beneficiarioObj = ficha.beneficiarios || inscritos.find((b) => b.id === ficha.beneficiario_id);
                return (
                  <div
                    key={ficha.id}
                    className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] hover:border-[var(--color-primary)]/40 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Topo do card: Aluno e Mês */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <h4 className="font-display font-bold text-sm text-[var(--text-primary)] truncate">
                            {beneficiarioObj?.nome_completo || 'Aluno Não Identificado'}
                          </h4>
                          <div className="flex items-center gap-2 flex-wrap text-xs text-[var(--text-muted)]">
                            <Badge variant="primary">
                              <Calendar className="w-3 h-3 mr-1" />
                              Mês: {ficha.mes_referencia}
                            </Badge>
                            <span>•</span>
                            <span>Resp: <strong className="text-[var(--text-secondary)]">{ficha.responsavel_preenchimento || 'Equipe'}</strong></span>
                          </div>
                        </div>

                        {/* Botões de Ação do Card */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAbrirDevolutiva(ficha)}
                            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors cursor-pointer"
                            title="Visualizar Devolutiva Timbrada (PDF)"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditarFicha(ficha)}
                            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                            title="Editar Ficha"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExcluirFicha(ficha.id)}
                            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors cursor-pointer"
                            title="Excluir Ficha"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Resumo dos 4 Eixos em Pílulas */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <div className="p-2 rounded-xl bg-[var(--bg-secondary)]/60 border border-[var(--border-default)]">
                          <span className="font-bold text-[var(--text-muted)] block text-[10px] uppercase">Autoestima:</span>
                          <span className="text-[var(--text-secondary)] truncate block">{ficha.eixo1_expressao_opinioes}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-[var(--bg-secondary)]/60 border border-[var(--border-default)]">
                          <span className="font-bold text-[var(--text-muted)] block text-[10px] uppercase">Socialização:</span>
                          <span className="text-[var(--text-secondary)] truncate block">{ficha.eixo2_resolucao_conflitos}</span>
                        </div>
                      </div>

                      {/* Síntese Qualitativa / Avanços */}
                      {ficha.eixo4_evolucao_observada && (
                        <div className="p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                          <strong className="text-[var(--text-primary)]">Avanços:</strong> {ficha.eixo4_evolucao_observada}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[var(--border-default)] flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => handleAbrirDevolutiva(ficha)}
                        className="text-[var(--color-primary)] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <MessageSquareHeart className="w-3.5 h-3.5" />
                        Ver Devolutiva à Família
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditarFicha(ficha)}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold cursor-pointer"
                      >
                        Editar Ficha →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          VISUALIZAÇÃO 2: FORMULÁRIO COMPLETO DOS 4 EIXOS
      ═══════════════════════════════════════════════════════════════ */}
      {subTab === 'formulario' && (
        <div className="space-y-6">
          {/* Seleção de Criança, Mês e Responsável */}
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Seletor de Criança */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                  Criança / Beneficiário *
                </label>
                {inscritos.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] italic">Nenhum aluno inscrito.</p>
                ) : (
                  <select
                    value={selectedBeneficiarioId}
                    onChange={(e) => setSelectedBeneficiarioId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-semibold focus:outline-none focus:border-[var(--color-primary)] cursor-pointer transition-all"
                  >
                    {inscritos.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nome_completo}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Mês de Referência */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                  Mês de Referência
                </label>
                <input
                  type="month"
                  value={mesReferencia}
                  onChange={(e) => setMesReferencia(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-mono-data focus:outline-none focus:border-[var(--color-primary)] transition-all"
                />
              </div>

              {/* Responsável pelo Preenchimento (Voluntários Cadastrados + Custom) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                  Responsável pelo Preenchimento
                </label>
                <div className="space-y-1.5">
                  <select
                    value={
                      voluntarios.some((v) => v.nome_completo === responsavel)
                        ? responsavel
                        : responsavel
                        ? '__CUSTOM__'
                        : ''
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__CUSTOM__') {
                        setResponsavel('');
                      } else {
                        setResponsavel(val);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium focus:outline-none focus:border-[var(--color-primary)] cursor-pointer transition-all"
                  >
                    <option value="">Selecione o voluntário da equipe...</option>
                    {voluntarios.map((v) => (
                      <option key={v.id} value={v.nome_completo}>
                        {v.nome_completo} {v.area_atuacao ? `(${v.area_atuacao})` : ''}
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Digitar outro nome / equipe externa...</option>
                  </select>

                  {(!voluntarios.some((v) => v.nome_completo === responsavel) || responsavel === '') && (
                    <input
                      type="text"
                      placeholder="Ex: Educadora Ana / Psicóloga Bruna"
                      value={responsavel}
                      onChange={(e) => setResponsavel(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium focus:outline-none focus:border-[var(--color-primary)] transition-all"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Metadados da Criança */}
            {beneficiarioAtual && (
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--border-default)] text-xs text-[var(--text-muted)]">
                <Badge variant="primary">{projetoNome}</Badge>
                <span>•</span>
                <span>Nascimento: <strong className="text-[var(--text-primary)] font-mono-data">{beneficiarioAtual.data_nascimento ? new Date(beneficiarioAtual.data_nascimento).toLocaleDateString('pt-BR') : '—'}</strong></span>
                <span>•</span>
                <span>Idade: <strong className="text-[var(--text-primary)]">{calcularIdade(beneficiarioAtual.data_nascimento)} anos</strong></span>
                <span>•</span>
                <span>Território: <strong className="text-[var(--text-primary)]">{beneficiarioAtual.comunidade || beneficiarioAtual.bairro || '—'}</strong></span>
                {formData.id && (
                  <Badge variant="neutral" className="ml-auto">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" />
                    Ficha cadastrada para este mês
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* ── FORMULÁRIO DOS 4 EIXOS ── */}
          <div className="space-y-4">
            {/* EIXO 1: Autoestima e Autonomia */}
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] p-4 sm:p-5 space-y-4">
              <div className="border-b border-[var(--border-default)] pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                  <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    Eixo 1: Autoestima e Autonomia (O Sentir e o Fazer)
                  </h3>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Observar como a criança se percebe, se expressa e lida com seus sentimentos e limites.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* Expressão de Opiniões */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] space-y-2">
                  <label className="font-semibold text-[var(--text-primary)] block">
                    Expressão de Opiniões
                  </label>
                  <p className="text-[10px] text-[var(--text-muted)] leading-tight">
                    A criança consegue verbalizar o que sente e expor suas ideias nas rodas de conversa e escuta?
                  </p>
                  <div className="space-y-1.5 pt-1">
                    {['Dificuldade em se expressar', 'Expressa-se com incentivo', 'Expressa-se espontaneamente'].map((opcao) => (
                      <label key={opcao} className="flex items-center gap-2 cursor-pointer text-[11px] text-[var(--text-secondary)]">
                        <input
                          type="radio"
                          name="eixo1_expressao_opinioes"
                          value={opcao}
                          checked={formData.eixo1_expressao_opinioes === opcao}
                          onChange={(e) => setFormData({ ...formData, eixo1_expressao_opinioes: e.target.value })}
                          className="text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                        />
                        <span>{opcao}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Enfrentamento de Desafios */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] space-y-2">
                  <label className="font-semibold text-[var(--text-primary)] block">
                    Enfrentamento de Desafios
                  </label>
                  <p className="text-[10px] text-[var(--text-muted)] leading-tight">
                    Diante de tarefas complexas (construção de pipas, nós, desenho), persiste ou desiste com facilidade?
                  </p>
                  <div className="space-y-1.5 pt-1">
                    {['Frustra-se e desiste', 'Persiste com mediação', 'Enfrenta e busca soluções autônomas'].map((opcao) => (
                      <label key={opcao} className="flex items-center gap-2 cursor-pointer text-[11px] text-[var(--text-secondary)]">
                        <input
                          type="radio"
                          name="eixo1_enfrentamento_desafios"
                          value={opcao}
                          checked={formData.eixo1_enfrentamento_desafios === opcao}
                          onChange={(e) => setFormData({ ...formData, eixo1_enfrentamento_desafios: e.target.value })}
                          className="text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                        />
                        <span>{opcao}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Autoimagem e Identidade */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] space-y-2">
                  <label className="font-semibold text-[var(--text-primary)] block">
                    Autoimagem e Identidade Positiva
                  </label>
                  <p className="text-[10px] text-[var(--text-muted)] leading-tight">
                    Demonstra orgulho de suas características, sua história familiar e sua comunidade?
                  </p>
                  <div className="space-y-1.5 pt-1">
                    {['Em desenvolvimento', 'Demonstra pertencimento', 'Expressa orgulho de suas raízes'].map((opcao) => (
                      <label key={opcao} className="flex items-center gap-2 cursor-pointer text-[11px] text-[var(--text-secondary)]">
                        <input
                          type="radio"
                          name="eixo1_autoimagem"
                          value={opcao}
                          checked={formData.eixo1_autoimagem === opcao}
                          onChange={(e) => setFormData({ ...formData, eixo1_autoimagem: e.target.value })}
                          className="text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                        />
                        <span>{opcao}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* EIXO 2: Socialização e Cooperação */}
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] p-4 sm:p-5 space-y-4">
              <div className="border-b border-[var(--border-default)] pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                  <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    Eixo 2: Socialização e Cooperação (O Viver em Coletivo)
                  </h3>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Observar a interação com os colegas e com a equipe pedagógica.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* Resolução de Conflitos */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] space-y-2">
                  <label className="font-semibold text-[var(--text-primary)] block">
                    Resolução de Conflitos
                  </label>
                  <p className="text-[10px] text-[var(--text-muted)] leading-tight">
                    Utiliza o diálogo e a escuta para resolver pequenos desentendimentos ou necessita de mediação constante?
                  </p>
                  <div className="space-y-1.5 pt-1">
                    {['Necessita de mediação', 'Tenta conversar', 'Consegue mediar de forma pacífica'].map((opcao) => (
                      <label key={opcao} className="flex items-center gap-2 cursor-pointer text-[11px] text-[var(--text-secondary)]">
                        <input
                          type="radio"
                          name="eixo2_resolucao_conflitos"
                          value={opcao}
                          checked={formData.eixo2_resolucao_conflitos === opcao}
                          onChange={(e) => setFormData({ ...formData, eixo2_resolucao_conflitos: e.target.value })}
                          className="text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                        />
                        <span>{opcao}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Trabalho em Equipe */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] space-y-2">
                  <label className="font-semibold text-[var(--text-primary)] block">
                    Trabalho em Equipe
                  </label>
                  <p className="text-[10px] text-[var(--text-muted)] leading-tight">
                    Colabora com os colegas nas atividades coletivas?
                  </p>
                  <div className="space-y-1.5 pt-1">
                    {['Prefere atividades isoladas', 'Participa quando incentivada', 'É muito colaborativa'].map((opcao) => (
                      <label key={opcao} className="flex items-center gap-2 cursor-pointer text-[11px] text-[var(--text-secondary)]">
                        <input
                          type="radio"
                          name="eixo2_trabalho_equipe"
                          value={opcao}
                          checked={formData.eixo2_trabalho_equipe === opcao}
                          onChange={(e) => setFormData({ ...formData, eixo2_trabalho_equipe: e.target.value })}
                          className="text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                        />
                        <span>{opcao}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Cuidado com o Espaço Comum */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] space-y-2">
                  <label className="font-semibold text-[var(--text-primary)] block">
                    Cuidado com o Espaço Comum
                  </label>
                  <p className="text-[10px] text-[var(--text-muted)] leading-tight">
                    Zela pelos materiais pedagógicos e pela limpeza do quintal ao final do encontro?
                  </p>
                  <div className="space-y-1.5 pt-1">
                    {['Em desenvolvimento', 'Colabora quando solicitado', 'Espontaneamente zelosa'].map((opcao) => (
                      <label key={opcao} className="flex items-center gap-2 cursor-pointer text-[11px] text-[var(--text-secondary)]">
                        <input
                          type="radio"
                          name="eixo2_cuidado_espaco"
                          value={opcao}
                          checked={formData.eixo2_cuidado_espaco === opcao}
                          onChange={(e) => setFormData({ ...formData, eixo2_cuidado_espaco: e.target.value })}
                          className="text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                        />
                        <span>{opcao}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* EIXO 3: Adesão aos "Encantamentos" (Regras Lúdicas da Natureza) */}
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] p-4 sm:p-5 space-y-4">
              <div className="border-b border-[var(--border-default)] pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                  <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    Eixo 3: Adesão aos "Encantamentos" (Regras Lúdicas)
                  </h3>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  No Ádapo, os combinados éticos são apresentados como "encantamentos" inspirados na floresta e na natureza.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* Respeito ao Tempo e Ritmo */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] space-y-2">
                  <label className="font-semibold text-[var(--text-primary)] block">
                    Respeito ao Tempo e Ritmo
                  </label>
                  <p className="text-[10px] text-[var(--text-muted)] leading-tight">
                    Adapta-se bem à rotina e horários das atividades (lanche, alongamento, oficinas)?
                  </p>
                  <div className="space-y-1.5 pt-1">
                    {['Apresenta resistência ao ritmo', 'Segue a rotina com apoio', 'Flui muito bem no ritmo do grupo'].map((opcao) => (
                      <label key={opcao} className="flex items-center gap-2 cursor-pointer text-[11px] text-[var(--text-secondary)]">
                        <input
                          type="radio"
                          name="eixo3_respeito_tempo_ritmo"
                          value={opcao}
                          checked={formData.eixo3_respeito_tempo_ritmo === opcao}
                          onChange={(e) => setFormData({ ...formData, eixo3_respeito_tempo_ritmo: e.target.value })}
                          className="text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                        />
                        <span>{opcao}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Escuta Ativa */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] space-y-2">
                  <label className="font-semibold text-[var(--text-primary)] block">
                    Escuta Ativa
                  </label>
                  <p className="text-[10px] text-[var(--text-muted)] leading-tight">
                    Consegue ouvir os colegas nas rodas de conversa sem interrompê-los?
                  </p>
                  <div className="space-y-1.5 pt-1">
                    {['Interrompe com frequência', 'Ouve com esforço', 'Escuta de forma empática e atenta'].map((opcao) => (
                      <label key={opcao} className="flex items-center gap-2 cursor-pointer text-[11px] text-[var(--text-secondary)]">
                        <input
                          type="radio"
                          name="eixo3_escuta_ativa"
                          value={opcao}
                          checked={formData.eixo3_escuta_ativa === opcao}
                          onChange={(e) => setFormData({ ...formData, eixo3_escuta_ativa: e.target.value })}
                          className="text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                        />
                        <span>{opcao}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Apoio Mútuo */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] space-y-2">
                  <label className="font-semibold text-[var(--text-primary)] block">
                    Apoio Mútuo & Empatia
                  </label>
                  <p className="text-[10px] text-[var(--text-muted)] leading-tight">
                    Demonstra empatia e ajuda crianças que apresentam dificuldades?
                  </p>
                  <div className="space-y-1.5 pt-1">
                    {['Focada no próprio fazer', 'Auxilia quando orientada', 'Identifica a necessidade do outro e ajuda'].map((opcao) => (
                      <label key={opcao} className="flex items-center gap-2 cursor-pointer text-[11px] text-[var(--text-secondary)]">
                        <input
                          type="radio"
                          name="eixo3_apoio_mutuo"
                          value={opcao}
                          checked={formData.eixo3_apoio_mutuo === opcao}
                          onChange={(e) => setFormData({ ...formData, eixo3_apoio_mutuo: e.target.value })}
                          className="text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                        />
                        <span>{opcao}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* EIXO 4: Registro Qualitativo (Diário de Bordo & Devolutiva) */}
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] p-4 sm:p-5 space-y-4">
              <div className="border-b border-[var(--border-default)] pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                  <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    Eixo 4: Registro Qualitativo & Orientações para a Família
                  </h3>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Anotações descritivas, evolução de comportamento, pontos de atenção e plano compartilhado com a família.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                {/* Evolução Observada */}
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--text-primary)] block">
                    1. Evolução Observada (Avanços do Mês)
                  </label>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    Descreva avanços significativos de comportamento, autonomia ou socialização ao longo do mês.
                  </p>
                  <textarea
                    rows={3}
                    placeholder="Ex: Demonstrou maior segurança para expressar suas opiniões nas rodas e participou ativamente das dinâmicas..."
                    value={formData.eixo4_evolucao_observada}
                    onChange={(e) => setFormData({ ...formData, eixo4_evolucao_observada: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] resize-none leading-relaxed transition-all"
                  />
                </div>

                {/* Pontos de Atenção */}
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--text-primary)] block">
                    2. Pontos de Atenção (Acolhimento Específico)
                  </label>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    Registrar comportamentos que indicam necessidade de acolhimento específico ou busca ativa.
                  </p>
                  <textarea
                    rows={3}
                    placeholder="Ex: Apresentou momentos de retração em dias de atividades com som alto..."
                    value={formData.eixo4_pontos_atencao}
                    onChange={(e) => setFormData({ ...formData, eixo4_pontos_atencao: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] resize-none leading-relaxed transition-all"
                  />
                </div>

                {/* Intervenção Proposta & Orientações para a Família */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                      3. Intervenção Proposta & Orientações Compartilhadas com a Família
                    </label>
                    <span className="text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary-soft)] px-2 py-0.5 rounded-full">
                      Exibido na Devolutiva Timbrada
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    Ações de apoio e orientações práticas para a família continuar estimulando em casa no cotidiano.
                  </p>
                  <textarea
                    rows={3}
                    placeholder="Ex: Estimular o diálogo aberto em casa, valorizar as produções da criança e apoiar momentos de escuta e rotina..."
                    value={formData.eixo4_intervencao_proposta}
                    onChange={(e) => setFormData({ ...formData, eixo4_intervencao_proposta: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] resize-none leading-relaxed transition-all"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-default)] flex items-center justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSubTab('fichas')}
                >
                  Cancelar / Voltar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Save className="w-4 h-4" />}
                  onClick={handleSalvar}
                  disabled={saving || !beneficiarioAtual}
                >
                  {saving ? 'Salvando...' : 'Salvar Ficha Socioemocional'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DEVOLUTIVA ÀS FAMÍLIAS EM PAPEL TIMBRADO */}
      <PapelTimbradoModal
        isOpen={showDevolutivaModal}
        onClose={() => {
          setShowDevolutivaModal(false);
          setFichaParaDevolutiva(null);
        }}
        tituloDocumento="Devolutiva Socioemocional & Pedagógica à Família"
        subtituloDocumento={`Aluno: ${
          fichaParaDevolutiva?.beneficiarios?.nome_completo ||
          beneficiarioAtual?.nome_completo ||
          ''
        } • Mês: ${fichaParaDevolutiva?.mes_referencia || mesReferencia}`}
      >
        <div className="space-y-5 text-xs text-slate-800 leading-relaxed">
          {/* Identificação e Acolhimento */}
          <div className="border border-slate-300 rounded-xl p-3.5 bg-slate-50 space-y-1.5 timbrado-avoid-break">
            <p><strong>Nome da Criança:</strong> {fichaParaDevolutiva?.beneficiarios?.nome_completo || beneficiarioAtual?.nome_completo}</p>
            <p><strong>Projeto / Oficina:</strong> {projetoNome}</p>
            <p><strong>Mês de Referência:</strong> {fichaParaDevolutiva?.mes_referencia || mesReferencia}</p>
            <p><strong>Responsável pelo Acompanhamento:</strong> {fichaParaDevolutiva?.responsavel_preenchimento || responsavel || 'Equipe Pedagógica e Socioemocional'}</p>
          </div>

          <p className="italic text-slate-600 timbrado-avoid-break">
            Prezada família, este documento sintetiza a trajetória de convivência, autonomia e aprendizado da criança durante as atividades socioeducativas do Instituto Ádapo neste mês.
          </p>

          {/* Síntese dos Eixos */}
          <div className="border border-slate-300 rounded-xl p-4 space-y-3 timbrado-avoid-break">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b border-slate-300 pb-1">
              Desenvolvimento Socioemocional & Convivência
            </h4>
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div>
                <p className="font-semibold text-slate-900">Autoestima & Autonomia:</p>
                <p className="text-slate-700">{fichaParaDevolutiva?.eixo1_expressao_opinioes || formData.eixo1_expressao_opinioes} • {fichaParaDevolutiva?.eixo1_autoimagem || formData.eixo1_autoimagem}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Socialização & Coletivo:</p>
                <p className="text-slate-700">{fichaParaDevolutiva?.eixo2_resolucao_conflitos || formData.eixo2_resolucao_conflitos} • {fichaParaDevolutiva?.eixo2_trabalho_equipe || formData.eixo2_trabalho_equipe}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Respeito à Rotina & Ritmo:</p>
                <p className="text-slate-700">{fichaParaDevolutiva?.eixo3_respeito_tempo_ritmo || formData.eixo3_respeito_tempo_ritmo}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Escuta & Empatia:</p>
                <p className="text-slate-700">{fichaParaDevolutiva?.eixo3_escuta_ativa || formData.eixo3_escuta_ativa} • {fichaParaDevolutiva?.eixo3_apoio_mutuo || formData.eixo3_apoio_mutuo}</p>
              </div>
            </div>
          </div>

          {/* Avanços Observados */}
          {(fichaParaDevolutiva?.eixo4_evolucao_observada || formData.eixo4_evolucao_observada) && (
            <div className="border border-slate-300 rounded-xl p-3.5 space-y-1 timbrado-avoid-break">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] text-emerald-800">
                Avanços e Conquistas no Mês
              </h4>
              <p className="text-[11px] text-slate-700">{fichaParaDevolutiva?.eixo4_evolucao_observada || formData.eixo4_evolucao_observada}</p>
            </div>
          )}

          {/* Plano Compartilhado com a Família */}
          <div className="border border-slate-300 rounded-xl p-3.5 space-y-1 timbrado-avoid-break">
            <h4 className="font-bold text-slate-900 uppercase text-[11px]">
              Orientações & Apoio Compartilhado com a Família
            </h4>
            <p className="text-[11px] text-slate-700">
              {fichaParaDevolutiva?.eixo4_intervencao_proposta ||
                formData.eixo4_intervencao_proposta ||
                'Continuar estimulando o diálogo aberto em casa, valorizando as produções e conquistas diárias da criança e incentivando a escuta empática.'}
            </p>
          </div>

          <div className="pt-8 grid grid-cols-2 gap-8 text-center timbrado-avoid-break">
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold">Educador(a) / Técnico(a) Responsável</p>
              <p className="text-[10px] text-slate-500">Instituto Ádapo</p>
            </div>
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold">Assinatura do Pai / Mãe / Cuidador</p>
              <p className="text-[10px] text-slate-500">Rede de Apoio Doméstico</p>
            </div>
          </div>
        </div>
      </PapelTimbradoModal>
    </div>
  );
}
