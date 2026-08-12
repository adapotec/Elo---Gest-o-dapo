'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { PapelTimbradoModal } from '@/components/ui/PapelTimbradoModal';
import {
  Heart,
  Users,
  Brain,
  Globe,
  Plus,
  Save,
  Trash2,
  Printer,
  Calendar,
  Smile,
  AlertTriangle,
  CheckCircle,
  FileText,
  MessageSquare,
} from 'lucide-react';

export interface AcompanhamentoSocioemocionalItem {
  id?: string;
  beneficiario_id: string;
  projeto_id: string;
  data_registro: string;
  mes_referencia: string;
  tipo_registro: string;
  autoestima_expressao: string;
  regulacao_emocional: string;
  vinculos_afetivos: string;
  contexto_familiar_territorial: string;
  acesso_direitos_encaminhamentos: string;
  nivel_desenvolvimento: 'inicial' | 'em_desenvolvimento' | 'consolidado' | 'requer_atencao_especial';
  observacoes_equipe: string;
}

export interface RodaConversaItem {
  id?: string;
  projeto_id: string;
  data_roda: string;
  tema_abordado: string;
  facilitador: string;
  resumo_dinamica: string;
  percepcoes_grupo: string;
  participantes_destaque: string;
}

interface ProjetoSocioemocionalProps {
  projetoId: string;
  inscricoes?: any[]; // Beneficiários inscritos
  voluntarios?: any[];
}

export function ProjetoSocioemocional({
  projetoId,
  inscricoes = [],
  voluntarios = [],
}: ProjetoSocioemocionalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'individual' | 'rodas'>('individual');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  // Lista de acompanhamentos e rodas do banco
  const [acompanhamentos, setAcompanhamentos] = useState<AcompanhamentoSocioemocionalItem[]>([]);
  const [rodas, setRodas] = useState<RodaConversaItem[]>([]);

  // Formulário Acompanhamento Individual
  const [selectedBeneficiarioId, setSelectedBeneficiarioId] = useState<string>(
    inscricoes[0]?.beneficiarios?.id || inscricoes[0]?.beneficiario_id || ''
  );

  const [formIndividual, setFormIndividual] = useState<AcompanhamentoSocioemocionalItem>({
    beneficiario_id: '',
    projeto_id: projetoId,
    data_registro: new Date().toISOString().split('T')[0],
    mes_referencia: new Date().toISOString().substring(0, 7),
    tipo_registro: 'monitoramento_mensal',
    autoestima_expressao: '',
    regulacao_emocional: '',
    vinculos_afetivos: '',
    contexto_familiar_territorial: '',
    acesso_direitos_encaminhamentos: '',
    nivel_desenvolvimento: 'em_desenvolvimento',
    observacoes_equipe: '',
  });

  // Formulário Roda de Conversa
  const [formRoda, setFormRoda] = useState<RodaConversaItem>({
    projeto_id: projetoId,
    data_roda: new Date().toISOString().split('T')[0],
    tema_abordado: '',
    facilitador: '',
    resumo_dinamica: '',
    percepcoes_grupo: '',
    participantes_destaque: '',
  });
  const [showRodaModal, setShowRodaModal] = useState(false);

  // Modal Impressão
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [projetoId]);

  async function loadData() {
    try {
      setLoading(true);
      const supabase = createClient();

      const [respAcomp, respRodas] = await Promise.all([
        supabase
          .from('acompanhamento_socioemocional')
          .select('*')
          .eq('projeto_id', projetoId)
          .order('data_registro', { ascending: false }),
        supabase
          .from('rodas_conversa_psicossocial')
          .select('*')
          .eq('projeto_id', projetoId)
          .order('data_roda', { ascending: false }),
      ]);

      setAcompanhamentos(respAcomp.data || []);
      setRodas(respRodas.data || []);
    } catch (err) {
      console.error('Erro ao carregar dados socioemocionais:', err);
    } finally {
      setLoading(false);
    }
  }

  // Carregar registro do beneficiário selecionado se existir no mês atual
  useEffect(() => {
    if (selectedBeneficiarioId) {
      const regExistente = acompanhamentos.find(
        (a) => a.beneficiario_id === selectedBeneficiarioId
      );
      if (regExistente) {
        setFormIndividual(regExistente);
      } else {
        setFormIndividual({
          beneficiario_id: selectedBeneficiarioId,
          projeto_id: projetoId,
          data_registro: new Date().toISOString().split('T')[0],
          mes_referencia: new Date().toISOString().substring(0, 7),
          tipo_registro: 'monitoramento_mensal',
          autoestima_expressao: '',
          regulacao_emocional: '',
          vinculos_afetivos: '',
          contexto_familiar_territorial: '',
          acesso_direitos_encaminhamentos: '',
          nivel_desenvolvimento: 'em_desenvolvimento',
          observacoes_equipe: '',
        });
      }
    }
  }, [selectedBeneficiarioId, acompanhamentos]);

  async function handleSaveIndividual() {
    if (!selectedBeneficiarioId) return alert('Selecione um beneficiário.');
    try {
      setSaving(true);
      const supabase = createClient();

      const payload = {
        ...formIndividual,
        beneficiario_id: selectedBeneficiarioId,
        projeto_id: projetoId,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('acompanhamento_socioemocional')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;

      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
      loadData();
    } catch (err) {
      console.error('Erro ao salvar ficha socioemocional:', err);
      alert('Erro ao salvar ficha socioemocional.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveRoda() {
    if (!formRoda.tema_abordado) return alert('Preencha o tema abordado.');
    try {
      setSaving(true);
      const supabase = createClient();

      const { error } = await supabase
        .from('rodas_conversa_psicossocial')
        .insert([{ ...formRoda, projeto_id: projetoId }]);

      if (error) throw error;

      setShowRodaModal(false);
      setFormRoda({
        projeto_id: projetoId,
        data_roda: new Date().toISOString().split('T')[0],
        tema_abordado: '',
        facilitador: '',
        resumo_dinamica: '',
        percepcoes_grupo: '',
        participantes_destaque: '',
      });
      loadData();
    } catch (err) {
      console.error('Erro ao registrar roda de conversa:', err);
      alert('Erro ao registrar roda de conversa.');
    } finally {
      setSaving(false);
    }
  }

  const getBeneficiarioNome = (bId: string) => {
    const insc = inscricoes.find(
      (i) => i.beneficiarios?.id === bId || i.beneficiario_id === bId
    );
    return (
      insc?.beneficiarios?.nome_completo ||
      insc?.beneficiario_nome ||
      'Beneficiário'
    );
  };

  const getNivelBadgeVariant = (nivel: string) => {
    switch (nivel) {
      case 'consolidado':
        return 'success';
      case 'em_desenvolvimento':
        return 'purple';
      case 'inicial':
        return 'neutral';
      case 'requer_atencao_especial':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Navegação entre Sub-abas */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[var(--border-default)] pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('individual')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
              activeSubTab === 'individual'
                ? 'bg-[#F2632D] text-white shadow-md'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
            }`}
          >
            <Brain className="w-4 h-4" />
            Ficha de Monitoramento Mensal (Psico + Social)
          </button>

          <button
            onClick={() => setActiveSubTab('rodas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
              activeSubTab === 'rodas'
                ? 'bg-[#F2632D] text-white shadow-md'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Rodas de Conversa Psicossociais ({rodas.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowPrintModal(true)}
            icon={<Printer className="w-4 h-4 text-[#F2632D]" />}
          >
            Relatório Timbrado
          </Button>

          {activeSubTab === 'rodas' && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => setShowRodaModal(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Nova Roda de Conversa
            </Button>
          )}
        </div>
      </div>

      {/* SUB-ABA 1: FICHA DE MONITORAMENTO INDIVIDUAL */}
      {activeSubTab === 'individual' && (
        <div className="space-y-6">
          <Card className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
              <div className="space-y-1 w-full md:w-auto">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Selecione o Atendido / Beneficiário Inscrito:
                </label>
                <Select
                  value={selectedBeneficiarioId}
                  onChange={(e) => setSelectedBeneficiarioId(e.target.value)}
                  className="w-full md:w-80 font-bold"
                >
                  {inscricoes.map((i) => {
                    const b = i.beneficiarios || i;
                    return (
                      <option key={b.id || i.beneficiario_id} value={b.id || i.beneficiario_id}>
                        {b.nome_completo || 'Beneficiário sem nome'}
                      </option>
                    );
                  })}
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Nível de Desenvolvimento:</label>
                  <Select
                    value={formIndividual.nivel_desenvolvimento}
                    onChange={(e: any) =>
                      setFormIndividual({ ...formIndividual, nivel_desenvolvimento: e.target.value })
                    }
                    className="text-xs font-bold"
                  >
                    <option value="inicial">Inicial / Entrada no Ádapo</option>
                    <option value="em_desenvolvimento">Em Desenvolvimento</option>
                    <option value="consolidado">Consolidado / Amadurecido</option>
                    <option value="requer_atencao_especial">Requer Atenção Especial / Apoio Intensivo</option>
                  </Select>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSaveIndividual}
                  disabled={saving}
                  icon={<Save className="w-4 h-4" />}
                >
                  {saving ? 'Salvando...' : 'Salvar Ficha'}
                </Button>
              </div>
            </div>

            {successMsg && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Ficha de Acompanhamento Socioemocional salva com sucesso!</span>
              </div>
            )}

            {/* SEÇÕES DAS DIMENSÕES PSICO + SOCIAL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* DIMENSÃO 1: PSÍQUICA (SUBJETIVA / EMOCIONAL) */}
              <div className="space-y-4 p-5 rounded-xl bg-[var(--bg-secondary)]/40 border border-[var(--border-default)]">
                <div className="flex items-center gap-2 text-[#F2632D]">
                  <Brain className="w-5 h-5" />
                  <h4 className="font-bold text-sm text-[var(--text-primary)]">
                    Dimensão Psíquica (Emocional & Subjetiva)
                  </h4>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">
                    1. Autoestima, Expressão & Autorrespeito
                  </label>
                  <textarea
                    rows={3}
                    value={formIndividual.autoestima_expressao}
                    onChange={(e) =>
                      setFormIndividual({ ...formIndividual, autoestima_expressao: e.target.value })
                    }
                    placeholder="Como a criança se percebe, expressa sentimentos e lida com sua identidade?"
                    className="w-full p-3 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[#F2632D]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">
                    2. Regulação Emocional & Comportamento
                  </label>
                  <textarea
                    rows={3}
                    value={formIndividual.regulacao_emocional}
                    onChange={(e) =>
                      setFormIndividual({ ...formIndividual, regulacao_emocional: e.target.value })
                    }
                    placeholder="Controle de ansiedade, impulsividade, paciência e estratégias de autorregulação..."
                    className="w-full p-3 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[#F2632D]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">
                    3. Vínculos Afetivos & Pertencimento no Ádapo
                  </label>
                  <textarea
                    rows={3}
                    value={formIndividual.vinculos_afetivos}
                    onChange={(e) =>
                      setFormIndividual({ ...formIndividual, vinculos_afetivos: e.target.value })
                    }
                    placeholder="Interação com pares, confiança nos educadores e sentimento de segurança no grupo..."
                    className="w-full p-3 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[#F2632D]"
                  />
                </div>
              </div>

              {/* DIMENSÃO 2: SOCIAL (TERRITÓRIO & DIREITOS) */}
              <div className="space-y-4 p-5 rounded-xl bg-[var(--bg-secondary)]/40 border border-[var(--border-default)]">
                <div className="flex items-center gap-2 text-purple-500">
                  <Globe className="w-5 h-5" />
                  <h4 className="font-bold text-sm text-[var(--text-primary)]">
                    Dimensão Social (Território, Família & Direitos)
                  </h4>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">
                    4. Contexto Familiar, Escolar & Vulnerabilidades do Território
                  </label>
                  <textarea
                    rows={3}
                    value={formIndividual.contexto_familiar_territorial}
                    onChange={(e) =>
                      setFormIndividual({
                        ...formIndividual,
                        contexto_familiar_territorial: e.target.value,
                      })
                    }
                    placeholder="Como os desafios do território (moradia, violência, vulnerabilidade financeira) impactam o atendido?"
                    className="w-full p-3 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[#F2632D]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">
                    5. Acesso a Direitos & Encaminhamentos (CRAS, CREAS, Saúde)
                  </label>
                  <textarea
                    rows={3}
                    value={formIndividual.acesso_direitos_encaminhamentos}
                    onChange={(e) =>
                      setFormIndividual({
                        ...formIndividual,
                        acesso_direitos_encaminhamentos: e.target.value,
                      })
                    }
                    placeholder="Registros de apoio social, violações de direitos observadas e articulações da rede..."
                    className="w-full p-3 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[#F2632D]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">
                    6. Observações & Síntese da Equipe Multidisciplinar
                  </label>
                  <textarea
                    rows={3}
                    value={formIndividual.observacoes_equipe}
                    onChange={(e) =>
                      setFormIndividual({ ...formIndividual, observacoes_equipe: e.target.value })
                    }
                    placeholder="Recomendações da equipe para as próximas aulas e dinâmicas..."
                    className="w-full p-3 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[#F2632D]"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* SUB-ABA 2: RODAS DE CONVERSA PSICOSSOCIAIS */}
      {activeSubTab === 'rodas' && (
        <div className="space-y-6">
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-default)]">
              <div>
                <h3 className="font-bold text-base text-[var(--text-primary)]">
                  Rodas de Conversa Psicossociais (Encontros Mensais)
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Espaço de escuta coletiva para discutir emoções, temas do território e fortalecimento comunitário
                </p>
              </div>

              <Button
                size="sm"
                variant="primary"
                onClick={() => setShowRodaModal(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Nova Roda
              </Button>
            </div>

            {rodas.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-default)] rounded-xl">
                Nenhuma Roda de Conversa registrada neste projeto.
              </div>
            ) : (
              <div className="space-y-4">
                {rodas.map((roda) => (
                  <div
                    key={roda.id}
                    className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-default)] pb-2">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-[#F2632D]" />
                        <h4 className="font-bold text-sm text-[var(--text-primary)]">{roda.tema_abordado}</h4>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(roda.data_roda).toLocaleDateString('pt-BR')}</span>
                        {roda.facilitador && <span>• Facilitador: {roda.facilitador}</span>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <strong className="text-[var(--text-secondary)] block">Dinâmica Realizada:</strong>
                        <p className="text-[var(--text-muted)] mt-1 whitespace-pre-line">{roda.resumo_dinamica || '-'}</p>
                      </div>
                      <div>
                        <strong className="text-[var(--text-secondary)] block">Percepções & Reações do Grupo:</strong>
                        <p className="text-[var(--text-muted)] mt-1 whitespace-pre-line">{roda.percepcoes_grupo || '-'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* MODAL NOVA RODA DE CONVERSA */}
      {showRodaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 space-y-4">
            <h3 className="font-bold text-base text-[var(--text-primary)]">Registrar Nova Roda de Conversa</h3>

            <div className="space-y-3">
              <Input
                label="Tema Abordado"
                value={formRoda.tema_abordado}
                onChange={(e) => setFormRoda({ ...formRoda, tema_abordado: e.target.value })}
                placeholder="Ex: Emoções no Território, Regulação de Raiva, Convivência..."
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Data do Encontro"
                  type="date"
                  value={formRoda.data_roda}
                  onChange={(e) => setFormRoda({ ...formRoda, data_roda: e.target.value })}
                />
                <Input
                  label="Facilitador / Condutor"
                  value={formRoda.facilitador}
                  onChange={(e) => setFormRoda({ ...formRoda, facilitador: e.target.value })}
                  placeholder="Nome do profissional/voluntário"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Resumo da Dinâmica</label>
                <textarea
                  rows={3}
                  value={formRoda.resumo_dinamica}
                  onChange={(e) => setFormRoda({ ...formRoda, resumo_dinamica: e.target.value })}
                  placeholder="Descreva as atividades e estímulos realizados..."
                  className="w-full p-2.5 rounded-lg text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Percepções da Equipe sobre o Grupo
                </label>
                <textarea
                  rows={3}
                  value={formRoda.percepcoes_grupo}
                  onChange={(e) => setFormRoda({ ...formRoda, percepcoes_grupo: e.target.value })}
                  placeholder="Como o grupo reagiu? Quais angústias ou evoluções foram manifestadas?"
                  className="w-full p-2.5 rounded-lg text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button size="sm" variant="ghost" onClick={() => setShowRodaModal(false)}>
                Cancelar
              </Button>
              <Button size="sm" variant="primary" onClick={handleSaveRoda} disabled={saving}>
                Salvar Roda de Conversa
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL DE IMPRESSÃO PAPEL TIMBRADO ÁDAPO */}
      <PapelTimbradoModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        tituloDocumento="RELATÓRIO DE ACOMPANHAMENTO SOCIOEMOCIONAL & PSICOSSOCIAL"
        subtituloDocumento={`Atendido: ${getBeneficiarioNome(selectedBeneficiarioId)} | Mês: ${formIndividual.mes_referencia}`}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-xs border p-3 rounded bg-slate-50">
            <div>
              <strong>Atendido:</strong> {getBeneficiarioNome(selectedBeneficiarioId)}
            </div>
            <div>
              <strong>Nível de Desenvolvimento:</strong> {formIndividual.nivel_desenvolvimento}
            </div>
            <div>
              <strong>Data do Registro:</strong> {new Date(formIndividual.data_registro).toLocaleDateString('pt-BR')}
            </div>
            <div>
              <strong>Mês Referência:</strong> {formIndividual.mes_referencia}
            </div>
          </div>

          <div className="space-y-4">
            <section>
              <h4 className="font-bold text-xs uppercase text-[#F2632D] border-b pb-1">
                1. Dimensão Psíquica — Autoestima, Expressão & Sentimentos
              </h4>
              <p className="mt-1 whitespace-pre-line text-sm">
                {formIndividual.autoestima_expressao || 'Sem registros.'}
              </p>
            </section>

            <section>
              <h4 className="font-bold text-xs uppercase text-[#F2632D] border-b pb-1">
                2. Dimensão Psíquica — Regulação Emocional & Comportamental
              </h4>
              <p className="mt-1 whitespace-pre-line text-sm">
                {formIndividual.regulacao_emocional || 'Sem registros.'}
              </p>
            </section>

            <section>
              <h4 className="font-bold text-xs uppercase text-[#F2632D] border-b pb-1">
                3. Dimensão Psíquica — Vínculos Afetivos & Pertencimento
              </h4>
              <p className="mt-1 whitespace-pre-line text-sm">
                {formIndividual.vinculos_afetivos || 'Sem registros.'}
              </p>
            </section>

            <section>
              <h4 className="font-bold text-xs uppercase text-purple-600 border-b pb-1">
                4. Dimensão Social — Contexto Familiar, Escolar & Território
              </h4>
              <p className="mt-1 whitespace-pre-line text-sm">
                {formIndividual.contexto_familiar_territorial || 'Sem registros.'}
              </p>
            </section>

            <section>
              <h4 className="font-bold text-xs uppercase text-purple-600 border-b pb-1">
                5. Dimensão Social — Acesso a Direitos & Encaminhamentos
              </h4>
              <p className="mt-1 whitespace-pre-line text-sm">
                {formIndividual.acesso_direitos_encaminhamentos || 'Sem registros.'}
              </p>
            </section>

            {formIndividual.observacoes_equipe && (
              <section>
                <h4 className="font-bold text-xs uppercase text-slate-700 border-b pb-1">
                  6. Síntese & Recomendações da Equipe
                </h4>
                <p className="mt-1 whitespace-pre-line text-sm">{formIndividual.observacoes_equipe}</p>
              </section>
            )}
          </div>
        </div>
      </PapelTimbradoModal>
    </div>
  );
}
