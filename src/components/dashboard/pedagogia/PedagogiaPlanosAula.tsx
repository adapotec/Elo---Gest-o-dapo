'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { PapelTimbradoModal } from '@/components/ui/PapelTimbradoModal';
import {
  BookOpen,
  Plus,
  Save,
  Trash2,
  Printer,
  Calendar,
  Clock,
  Target,
  Sparkles,
  Users,
  CheckCircle2,
  Edit3,
  X,
  FileText,
} from 'lucide-react';

interface MetaProjetoItem {
  id: string;
  descricao: string;
  indicador?: string;
  meta_quantitativa?: number;
}

interface AcaoItem {
  id: string;
  nome_acao: string;
  data_hora: string;
}

export interface PlanoAulaData {
  id?: string;
  projeto_id: string;
  acao_id?: string | null;
  titulo: string;
  oficineiro: string;
  data_oficina: string;
  descricao: string;
  objetivos: string;
  meta_projeto_id: string;
  atividades_dirigidas: string;
  brincadeiras_livres: string;
  recursos_materiais: string;
  avaliacao_encontro: string;
}

interface PedagogiaPlanosAulaProps {
  projetoId: string;
  projetoNome: string;
  metas: MetaProjetoItem[];
  acoes: AcaoItem[];
  voluntarios?: any[];
  onRefresh?: () => void;
}

export function PedagogiaPlanosAula({
  projetoId,
  projetoNome,
  metas = [],
  acoes = [],
  voluntarios = [],
  onRefresh,
}: PedagogiaPlanosAulaProps) {
  const [planos, setPlanos] = useState<PlanoAulaData[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [planoToPrint, setPlanoToPrint] = useState<PlanoAulaData | null>(null);

  // Formulário de Edição
  const [formData, setFormData] = useState<PlanoAulaData>({
    projeto_id: projetoId,
    acao_id: null,
    titulo: '',
    oficineiro: '',
    data_oficina: new Date().toISOString().split('T')[0],
    descricao: '',
    objetivos: '',
    meta_projeto_id: '',
    atividades_dirigidas: '',
    brincadeiras_livres: '',
    recursos_materiais: '',
    avaliacao_encontro: '',
  });

  // Carregar planos de aula do projeto vigente
  const carregarPlanos = async () => {
    if (!projetoId) return;
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('planos_oficina')
      .select('*')
      .eq('projeto_id', projetoId)
      .order('data_oficina', { ascending: false });

    if (!error && data) {
      setPlanos(data as PlanoAulaData[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarPlanos();
  }, [projetoId]);

  const handleNovoPlano = () => {
    setFormData({
      projeto_id: projetoId,
      acao_id: acoes[0]?.id || null,
      titulo: '',
      oficineiro: '',
      data_oficina: new Date().toISOString().split('T')[0],
      descricao: '',
      objetivos: '',
      meta_projeto_id: metas[0]?.id || '',
      atividades_dirigidas: '',
      brincadeiras_livres: '',
      recursos_materiais: '',
      avaliacao_encontro: '',
    });
    setShowEditorModal(true);
  };

  const handleEditarPlano = (plano: PlanoAulaData) => {
    setFormData(plano);
    setShowEditorModal(true);
  };

  const handleSalvarPlano = async () => {
    if (!formData.titulo.trim() || !formData.oficineiro.trim()) {
      alert('Por favor, preencha o Título da Aula e o Educador/Oficineiro responsável.');
      return;
    }

    setSaving(true);
    setSaveSuccess(false);
    const supabase = createClient();

    const payload = {
      ...formData,
      projeto_id: projetoId,
      updated_at: new Date().toISOString(),
    };

    let saveErr = null;
    if (formData.id) {
      const { error } = await supabase
        .from('planos_oficina')
        .update(payload)
        .eq('id', formData.id);
      saveErr = error;
    } else {
      const { error } = await supabase.from('planos_oficina').insert(payload);
      saveErr = error;
    }

    if (saveErr) {
      alert('Erro ao salvar plano de aula: ' + saveErr.message);
    } else {
      setSaveSuccess(true);
      setShowEditorModal(false);
      carregarPlanos();
      if (onRefresh) onRefresh();
      setTimeout(() => setSaveSuccess(false), 4000);
    }
    setSaving(false);
  };

  const handleExcluirPlano = async (id?: string) => {
    if (!id) return;
    if (!confirm('Deseja realmente excluir este Plano de Aula?')) return;

    const supabase = createClient();
    const { error } = await supabase.from('planos_oficina').delete().eq('id', id);

    if (error) {
      alert('Erro ao excluir: ' + error.message);
    } else {
      carregarPlanos();
      if (onRefresh) onRefresh();
    }
  };

  const handleImprimirPlano = (plano: PlanoAulaData) => {
    setPlanoToPrint(plano);
    setShowPrintModal(true);
  };

  const metaVinculadaAoPlanoPrint = metas.find((m) => m.id === planoToPrint?.meta_projeto_id);

  return (
    <div className="space-y-6">
      {/* Topo: Resumo e Botão Novo Plano */}
      <Card className="p-5 border-[var(--border-default)] bg-[var(--bg-elevated)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[var(--color-primary)]" />
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Planos de Aula do Projeto ({planos.length})
            </h3>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Planejamento socioeducativo, práticas antirracistas, atividades dirigidas e brincadeiras livres vinculadas às metas de <strong>{projetoNome}</strong>.
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleNovoPlano}
        >
          Criar Novo Plano de Aula
        </Button>
      </Card>

      {/* Feedback de Salvamento */}
      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Plano de Aula salvo e sincronizado com o projeto com sucesso!
        </div>
      )}

      {/* Grade de Planos de Aula */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[var(--text-muted)]">Carregando planos de aula...</div>
      ) : planos.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] space-y-3">
          <BookOpen className="w-10 h-10 mx-auto text-[var(--text-muted)] opacity-40" />
          <p className="text-sm font-semibold text-[var(--text-secondary)]">
            Nenhum Plano de Aula cadastrado para o projeto {projetoNome}.
          </p>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
            Clique no botão acima para cadastrar um novo plano estruturado com objetivos, atividades dirigidas, brincadeiras livres e vínculo com as metas.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {planos.map((plano) => {
            const metaObj = metas.find((m) => m.id === plano.meta_projeto_id);
            const acaoObj = acoes.find((a) => a.id === plano.acao_id);

            return (
              <Card
                key={plano.id}
                className="p-5 border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--color-primary)]/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="primary">
                          <Calendar className="w-3 h-3 mr-1" />
                          {plano.data_oficina ? new Date(plano.data_oficina).toLocaleDateString('pt-BR') : 'Data não inf.'}
                        </Badge>
                        {acaoObj && (
                          <Badge variant="neutral">
                            Ação: {acaoObj.nome_acao}
                          </Badge>
                        )}
                      </div>
                      <h4 className="text-base font-display font-bold text-[var(--text-primary)]">
                        {plano.titulo}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleImprimirPlano(plano)}
                        className="p-1.5 rounded-lg border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                        title="Exportar PDF Timbrado"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditarPlano(plano)}
                        className="p-1.5 rounded-lg border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-secondary)]"
                        title="Editar Plano"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluirPlano(plano.id)}
                        className="p-1.5 rounded-lg border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
                        title="Excluir Plano"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                    {plano.descricao || plano.objetivos || 'Sem descrição cadastrada.'}
                  </p>

                  {metaObj && (
                    <div className="p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)]/60 text-[11px] space-y-1">
                      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase flex items-center gap-1">
                        <Target className="w-3 h-3 text-[var(--color-primary)]" />
                        Meta Vinculada do Projeto
                      </span>
                      <p className="font-semibold text-[var(--text-primary)] truncate">{metaObj.descricao}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 text-[var(--text-muted)]">
                    <p>Educador(a): <strong className="text-[var(--text-primary)]">{plano.oficineiro}</strong></p>
                    <p className="text-right">
                      {plano.recursos_materiais ? 'Materiais definidos' : 'Sem materiais'}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* MODAL: CRIAR / EDITAR PLANO DE AULA */}
      {showEditorModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-[var(--bg-elevated)] p-6 rounded-2xl border border-[var(--border-default)] shadow-2xl space-y-5 my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4 shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[var(--color-primary)]" />
                  <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                    {formData.id ? 'Editar Plano de Aula' : 'Novo Plano de Aula Socioeducativo'}
                  </h3>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Projeto Vigente: <strong>{projetoNome}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowEditorModal(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Formulário */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs">
              {/* Linha 1: Título, Educador, Data */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                    Título da Aula / Encontro *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Oficina de Construção de Pipas e Narrativas Ancestrais"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-semibold focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                    Data da Aula *
                  </label>
                  <input
                    type="date"
                    value={formData.data_oficina}
                    onChange={(e) => setFormData({ ...formData, data_oficina: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              {/* Linha 2: Educador(a) / Oficineiro(a) e Vínculo com Encontro */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                    Educador(a) / Oficineiro(a) Responsável *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Carlos Eduardo (Educador Social)"
                    value={formData.oficineiro}
                    onChange={(e) => setFormData({ ...formData, oficineiro: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                    Vincular ao Encontro / Ação da Agenda (Opcional)
                  </label>
                  <select
                    value={formData.acao_id || ''}
                    onChange={(e) => setFormData({ ...formData, acao_id: e.target.value || null })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                  >
                    <option value="">Nenhum encontro vinculado</option>
                    {acoes.map((acao) => (
                      <option key={acao.id} value={acao.id}>
                        {acao.nome_acao} ({new Date(acao.data_hora).toLocaleDateString('pt-BR')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Linha 3: Vínculo com Metas do Projeto */}
              <div className="space-y-1.5 p-3.5 rounded-xl bg-[var(--bg-secondary)]/70 border border-[var(--border-default)]">
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  Meta do Projeto em que esta Aula Contribui
                </label>
                {metas.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] italic">
                    Nenhuma meta cadastrada no projeto {projetoNome}. Cadastre metas na aba Planejamento &gt; Objetivos &amp; Metas.
                  </p>
                ) : (
                  <select
                    value={formData.meta_projeto_id}
                    onChange={(e) => setFormData({ ...formData, meta_projeto_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                  >
                    <option value="">Selecione uma meta vinculada...</option>
                    {metas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.descricao} {m.meta_quantitativa ? `(Meta: ${m.meta_quantitativa})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Linha 4: Objetivos Pedagógicos & Descrição */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                    Objetivos Pedagógicos & Socioeducativos
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Estimular a coordenação motora fina, promover o diálogo sobre respeito mútuo e identidade..."
                    value={formData.objetivos}
                    onChange={(e) => setFormData({ ...formData, objetivos: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                    Descrição Geral da Temática
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Introdução lúdica sobre a história das pipas e roda de escuta sobre os encantamentos da floresta..."
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
                  />
                </div>
              </div>

              {/* Linha 5: Metodologia - Atividades Dirigidas vs Brincadeiras Livres */}
              <div className="space-y-3 pt-2 border-t border-[var(--border-default)]/60">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
                    Metodologia Socioeducativa & Dinâmica do Encontro
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Práticas antirracistas, valorização da diversidade, combate à desigualdade e protagonismo infantil.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--text-secondary)] block">
                      1. Atividades Propostas Dirigidas (Passo a Passo)
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Ex: 1. Acolhimento e roda de escuta (15min); 2. Distribuição das varetas e seda (30min); 3. Montagem orientada das armações..."
                      value={formData.atividades_dirigidas}
                      onChange={(e) => setFormData({ ...formData, atividades_dirigidas: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--text-secondary)] block">
                      2. Brincadeiras Livres & Espaço Lúdico (Quintal)
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Ex: Momento de voo das pipas no quintal com revezamento de linhas, jogos cooperativos e roda livre..."
                      value={formData.brincadeiras_livres}
                      onChange={(e) => setFormData({ ...formData, brincadeiras_livres: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Linha 6: Recursos Materiais & Avaliação */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--border-default)]/60">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                    Recursos & Materiais Necessários
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Varetas de bambu, papel de seda colorido, tesouras sem ponta, cola branca, carretéis de linha..."
                    value={formData.recursos_materiais}
                    onChange={(e) => setFormData({ ...formData, recursos_materiais: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                    Avaliação do Encontro / Diário do Educador
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Todas as crianças conseguiram finalizar seus modelos; alta integração no quintal e colaboração mútua..."
                    value={formData.avaliacao_encontro}
                    onChange={(e) => setFormData({ ...formData, avaliacao_encontro: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-[var(--border-default)] pt-4 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowEditorModal(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Save className="w-4 h-4" />}
                onClick={handleSalvarPlano}
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar Plano de Aula'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE IMPRESSÃO DO PLANO DE AULA EM PAPEL TIMBRADO */}
      <PapelTimbradoModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        tituloDocumento="Plano de Aula Socioeducativo & Metodologia"
        subtituloDocumento={`Projeto: ${projetoNome} • Aula: ${planoToPrint?.titulo || ''}`}
      >
        <div className="space-y-5 text-xs text-slate-800 leading-relaxed">
          {/* Metadados */}
          <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 space-y-1.5 timbrado-avoid-break">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <p><strong>Projeto Social:</strong> {projetoNome}</p>
              <p><strong>Data da Aula:</strong> {planoToPrint?.data_oficina ? new Date(planoToPrint.data_oficina).toLocaleDateString('pt-BR') : '—'}</p>
              <p><strong>Título da Aula:</strong> {planoToPrint?.titulo}</p>
              <p><strong>Educador(a) / Oficineiro(a):</strong> {planoToPrint?.oficineiro}</p>
            </div>
            {metaVinculadaAoPlanoPrint && (
              <p className="pt-1 border-t border-slate-200 text-slate-700">
                <strong>Meta Vinculada do Projeto:</strong> {metaVinculadaAoPlanoPrint.descricao}
              </p>
            )}
          </div>

          {/* Objetivos & Descrição */}
          <div className="border border-slate-300 rounded-lg p-3 space-y-2 timbrado-avoid-break">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b border-slate-300 pb-1">
              1. Objetivos Pedagógicos & Temática
            </h4>
            <p><strong>Objetivos:</strong> {planoToPrint?.objetivos || '—'}</p>
            {planoToPrint?.descricao && (
              <p><strong>Descrição:</strong> {planoToPrint.descricao}</p>
            )}
          </div>

          {/* Dinâmica: Atividades Dirigidas e Brincadeiras Livres */}
          <div className="border border-slate-300 rounded-lg p-3 space-y-3 timbrado-avoid-break">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b border-slate-300 pb-1">
              2. Metodologia Socioeducativa & Dinâmica Prática
            </h4>
            <div className="space-y-2">
              <div>
                <p className="font-semibold text-slate-900">Atividades Propostas Dirigidas:</p>
                <p className="text-slate-700 whitespace-pre-line">{planoToPrint?.atividades_dirigidas || '—'}</p>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <p className="font-semibold text-slate-900">Brincadeiras Livres & Espaço Lúdico (Quintal):</p>
                <p className="text-slate-700 whitespace-pre-line">{planoToPrint?.brincadeiras_livres || '—'}</p>
              </div>
            </div>
          </div>

          {/* Recursos e Avaliação */}
          <div className="grid grid-cols-2 gap-4 timbrado-avoid-break">
            <div className="border border-slate-300 rounded-lg p-3 space-y-1">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b border-slate-300 pb-1">
                3. Recursos & Materiais
              </h4>
              <p className="text-slate-700">{planoToPrint?.recursos_materiais || 'Nenhum material listado.'}</p>
            </div>

            <div className="border border-slate-300 rounded-lg p-3 space-y-1">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b border-slate-300 pb-1">
                4. Avaliação do Educador
              </h4>
              <p className="text-slate-700">{planoToPrint?.avaliacao_encontro || 'Avaliação a ser preenchida após a aula.'}</p>
            </div>
          </div>

          <div className="pt-8 grid grid-cols-2 gap-8 text-center timbrado-avoid-break">
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold">Educador(a) / Oficineiro(a) Responsável</p>
              <p className="text-[10px] text-slate-500">Instituto Ádapo</p>
            </div>
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold">Coordenação Pedagógica</p>
              <p className="text-[10px] text-slate-500">Instituto Ádapo</p>
            </div>
          </div>
        </div>
      </PapelTimbradoModal>
    </div>
  );
}
