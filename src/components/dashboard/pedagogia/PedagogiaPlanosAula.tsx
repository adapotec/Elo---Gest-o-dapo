'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Package,
  Layers,
  HelpCircle,
  FolderKanban,
  UserCheck,
} from 'lucide-react';

export interface MetaProjetoItem {
  id: string;
  descricao: string;
  indicador?: string;
  meta_quantitativa?: number;
}

export interface AcaoItem {
  id: string;
  nome_acao: string;
  data_hora: string;
  documento_estruturador?: string;
}

export interface AtividadePedagogicaItem {
  id: string;
  titulo: string;
  mediador: string;
  descricao: string;
  materiais: string;
  meta_id?: string;
}

export type AtividadePlanoAula = AtividadePedagogicaItem;

export interface PlanoAulaData {
  id?: string;
  projeto_id: string;
  acao_id: string | null;
  titulo: string;
  oficineiro: string;
  data_oficina: string;
  descricao?: string;
  objetivos?: string;
  meta_projeto_id?: string;
  atividades: AtividadePedagogicaItem[];
  observacoes_gerais?: string;
  created_at?: string;
  updated_at?: string;
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

  // Filtro Mensal de Ações no Modal de Plano de Aula
  const currentMonthStr = new Date().toISOString().slice(0, 7); // Ex: "2026-08"

  const mesesDisponiveisAcoes = useMemo(() => {
    return Array.from(
      new Set(
        acoes
          .map((a) => (a.data_hora ? a.data_hora.slice(0, 7) : ''))
          .filter(Boolean)
      )
    ).sort().reverse();
  }, [acoes]);

  const [filtroMesModal, setFiltroMesModal] = useState<string>(() => {
    const hasCurrent = acoes.some((a) => a.data_hora?.startsWith(currentMonthStr));
    if (hasCurrent) return currentMonthStr;
    return mesesDisponiveisAcoes[0] || 'todos';
  });

  const acoesModalFiltradas = useMemo(() => {
    if (filtroMesModal === 'todos') return acoes;
    return acoes.filter((a) => a.data_hora && a.data_hora.startsWith(filtroMesModal));
  }, [acoes, filtroMesModal]);

  // Formulário de Edição
  const [formData, setFormData] = useState<PlanoAulaData>({
    projeto_id: projetoId,
    acao_id: acoes[0]?.id || null,
    titulo: '',
    oficineiro: '',
    data_oficina: new Date().toISOString().split('T')[0],
    descricao: '',
    objetivos: '',
    meta_projeto_id: metas[0]?.id || '',
    atividades: [
      {
        id: crypto.randomUUID(),
        titulo: 'Acolhida & Dinâmica Inicial',
        mediador: voluntarios[0]?.nome_completo || '',
        descricao: '',
        materiais: '',
        meta_id: metas[0]?.id || '',
      },
    ],
    observacoes_gerais: '',
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
      const normalizados: PlanoAulaData[] = data.map((item: any) => {
        let atividadesArr: AtividadePlanoAula[] = [];
        try {
          if (item.atividades_dirigidas && (item.atividades_dirigidas.startsWith('[') || item.atividades_dirigidas.startsWith('{'))) {
            const parsed = JSON.parse(item.atividades_dirigidas);
            if (Array.isArray(parsed)) atividadesArr = parsed;
          }
        } catch {
          // fallback caso seja texto livre antigo
        }

        if (atividadesArr.length === 0) {
          atividadesArr = [
            {
              id: crypto.randomUUID(),
              titulo: item.titulo || 'Atividade Principal',
              mediador: item.oficineiro || '',
              descricao: item.atividades_dirigidas || item.descricao || '',
              materiais: item.recursos_materiais || '',
              meta_id: item.meta_projeto_id || '',
            },
          ];
        }

        return {
          ...item,
          atividades: atividadesArr,
          observacoes_gerais: item.avaliacao_encontro || item.observacoes_gerais || '',
        };
      });

      setPlanos(normalizados);
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarPlanos();
  }, [projetoId]);

  const handleNovoPlano = () => {
    const mesInicial = acoes.some((a) => a.data_hora?.startsWith(currentMonthStr))
      ? currentMonthStr
      : (mesesDisponiveisAcoes[0] || 'todos');

    setFiltroMesModal(mesInicial);

    const acoesDoMes = mesInicial === 'todos'
      ? acoes
      : acoes.filter((a) => a.data_hora && a.data_hora.startsWith(mesInicial));

    const acaoInicial = acoesDoMes[0] || acoes[0];
    const dataInicial = acaoInicial?.data_hora
      ? new Date(acaoInicial.data_hora).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    setFormData({
      projeto_id: projetoId,
      acao_id: acaoInicial?.id || null,
      titulo: '',
      oficineiro: '',
      data_oficina: dataInicial,
      descricao: '',
      objetivos: '',
      meta_projeto_id: metas[0]?.id || '',
      atividades: [
        {
          id: crypto.randomUUID(),
          titulo: 'Acolhida & Dinâmica Inicial',
          mediador: '',
          descricao: '',
          materiais: '',
          meta_id: metas[0]?.id || '',
        },
      ],
      observacoes_gerais: '',
    });
    setShowEditorModal(true);
  };

  const handleEditarPlano = (plano: PlanoAulaData) => {
    if (plano.acao_id) {
      const acaoObj = acoes.find((a) => a.id === plano.acao_id);
      if (acaoObj?.data_hora) {
        setFiltroMesModal(acaoObj.data_hora.slice(0, 7));
      } else {
        setFiltroMesModal('todos');
      }
    } else {
      setFiltroMesModal('todos');
    }

    setFormData(plano);
    setShowEditorModal(true);
  };

  // Handlers da Grade de Atividades
  const handleAddAtividade = () => {
    setFormData((prev) => ({
      ...prev,
      atividades: [
        ...prev.atividades,
        {
          id: crypto.randomUUID(),
          titulo: `Atividade ${prev.atividades.length + 1}`,
          mediador: prev.oficineiro || '',
          descricao: '',
          materiais: '',
          meta_id: metas[0]?.id || '',
        },
      ],
    }));
  };

  const handleUpdateAtividade = (index: number, field: keyof AtividadePlanoAula, value: string) => {
    setFormData((prev) => {
      const updated = [...prev.atividades];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, atividades: updated };
    });
  };

  const handleRemoveAtividade = (index: number) => {
    if (formData.atividades.length <= 1) {
      alert('O plano de aula deve conter pelo menos uma atividade.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      atividades: prev.atividades.filter((_, i) => i !== index),
    }));
  };

  const handleSalvarPlano = async () => {
    if (!formData.titulo.trim()) {
      alert('Por favor, preencha o Título do Encontro / Plano de Aula.');
      return;
    }

    const educadorPrincipal = formData.oficineiro || formData.atividades[0]?.mediador || 'Educador Responsável';

    setSaving(true);
    setSaveSuccess(false);
    const supabase = createClient();

    // Consolidar materiais de todas as atividades
    const todosMateriais = formData.atividades
      .map((a) => a.materiais)
      .filter(Boolean)
      .join(', ');

    const payload = {
      projeto_id: projetoId,
      acao_id: formData.acao_id || null,
      titulo: formData.titulo.trim(),
      oficineiro: educadorPrincipal,
      data_oficina: formData.data_oficina,
      descricao: formData.descricao?.trim() || '',
      objetivos: formData.descricao?.trim() || '',
      meta_projeto_id: formData.atividades[0]?.meta_id || metas[0]?.id || null,
      atividades_dirigidas: JSON.stringify(formData.atividades),
      recursos_materiais: todosMateriais,
      avaliacao_encontro: formData.observacoes_gerais?.trim() || '',
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

  const [expandedPlanos, setExpandedPlanos] = useState<Record<string, boolean>>({});

  const toggleExpandPlano = (id?: string) => {
    if (!id) return;
    setExpandedPlanos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* ── Topo: Resumo e Botão Novo Plano (Padrão Idêntico a Projetos) ── */}
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
              <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                Planos de Aula & Metodologia
              </h3>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Planejamento pedagógico vinculado às ações do cronograma e metas de <strong>{projetoNome}</strong> ({planos.length} planos cadastrados).
            </p>
          </div>

          <Button
            size="sm"
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleNovoPlano}
          >
            Novo Plano de Aula
          </Button>
        </div>
      </div>

      {/* Feedback de Salvamento com Alto Contraste */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-white" />
          Plano de Aula e Atividades gravados com sucesso!
        </div>
      )}

      {/* ── Grade de Planos de Aula (Baixa Carga Cognitiva) ── */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[var(--text-muted)]">Carregando planos de aula...</div>
      ) : planos.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] space-y-3">
          <BookOpen className="w-10 h-10 mx-auto text-[var(--text-muted)] opacity-40" />
          <p className="text-sm font-semibold text-[var(--text-secondary)]">
            Nenhum Plano de Aula cadastrado para {projetoNome}.
          </p>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
            Clique no botão acima para vincular uma ação cadastrada, definir o encontro e estruturar atividades pedagógicas com mediadores e metas.
          </p>
          <Button
            size="sm"
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleNovoPlano}
          >
            Criar Primeiro Plano de Aula
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {planos.map((plano) => {
            const acaoObj = acoes.find((a) => a.id === plano.acao_id);
            const totalAtividades = Array.isArray(plano.atividades) ? plano.atividades.length : 1;
            const isExpanded = !!(plano.id && expandedPlanos[plano.id]);

            return (
              <div
                key={plano.id}
                className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] hover:border-[var(--color-primary)]/40 transition-all flex flex-col justify-between"
              >
                {/* Cabeçalho do Card */}
                <div className="p-5 space-y-3 flex-1">
                  {/* Badges e Ações do card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      <Badge variant="primary">
                        <Calendar className="w-3 h-3 mr-1" />
                        {plano.data_oficina
                          ? new Date(plano.data_oficina + 'T00:00:00').toLocaleDateString('pt-BR')
                          : 'Data não inf.'}
                      </Badge>
                      {acaoObj ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                          <FolderKanban className="w-3 h-3" />
                          Ação: {acaoObj.nome_acao}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/10 text-[var(--text-muted)] border border-slate-500/20">
                          Encontro Geral
                        </span>
                      )}
                    </div>

                    {/* Botões de ação */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleImprimirPlano(plano)}
                        className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors cursor-pointer"
                        title="Visualizar / PDF Timbrado"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditarPlano(plano)}
                        className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                        title="Editar Plano"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluirPlano(plano.id)}
                        className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors cursor-pointer"
                        title="Excluir Plano"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Título do Encontro */}
                  <h4 className="text-sm font-display font-bold text-[var(--text-primary)] leading-snug">
                    {plano.titulo}
                  </h4>

                  {/* Descrição Geral Resumida */}
                  {plano.descricao && (
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                      {plano.descricao}
                    </p>
                  )}

                  {/* Detalhes Expansíveis das Atividades (Accordion Inteligente) */}
                  {Array.isArray(plano.atividades) && plano.atividades.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={() => toggleExpandPlano(plano.id)}
                        className="text-[11px] font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1.5 cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        {isExpanded
                          ? `Ocultar atividades (${plano.atividades.length}) ▲`
                          : `Ver roteiro de atividades (${plano.atividades.length}) ▼`}
                      </button>

                      {isExpanded && (
                        <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                          {plano.atividades.map((ativ, aIdx) => {
                            const metaAtiv = metas.find((m) => m.id === ativ.meta_id);
                            return (
                              <div
                                key={ativ.id || aIdx}
                                className="p-3 rounded-xl bg-[var(--bg-secondary)]/60 border border-[var(--border-default)] text-xs space-y-1.5"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-[var(--text-primary)] truncate block">
                                    {aIdx + 1}. {ativ.titulo}
                                  </span>
                                  {ativ.mediador && (
                                    <span className="text-[10px] font-medium text-[var(--text-muted)] shrink-0">
                                      {ativ.mediador}
                                    </span>
                                  )}
                                </div>
                                {ativ.descricao && (
                                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                                    {ativ.descricao}
                                  </p>
                                )}
                                {metaAtiv && (
                                  <div className="pt-1 border-t border-[var(--border-default)]/40 flex items-start gap-1.5 text-[11px] text-[var(--color-primary)]">
                                    <Target className="w-3 h-3 shrink-0 mt-0.5" />
                                    <span className="leading-tight">
                                      <strong>Meta:</strong> {metaAtiv.descricao}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Rodapé do card */}
                <div className="px-5 py-3 border-t border-[var(--border-default)]/60 text-xs text-[var(--text-muted)] flex items-center justify-between bg-[var(--bg-secondary)]/30 rounded-b-2xl">
                  <span>
                    Educador:{' '}
                    {plano.oficineiro ? (
                      <strong className="text-[var(--text-primary)]">{plano.oficineiro}</strong>
                    ) : (
                      <em className="text-[var(--text-muted)] font-normal">Não informado</em>
                    )}
                  </span>
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                    {totalAtividades} {totalAtividades === 1 ? 'atividade' : 'atividades'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODAL: CRIAR / EDITAR PLANO DE AULA (ESTRUTURA INTEGRADA)
      ═══════════════════════════════════════════════════════════════ */}
      {showEditorModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-3xl bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-default)] shadow-2xl my-6 sm:my-10 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border-default)] shrink-0">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
                  <h3 className="font-display font-bold text-base sm:text-lg text-[var(--text-primary)]">
                    {formData.id ? 'Editar Plano de Aula' : 'Novo Plano de Aula'}
                  </h3>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Projeto: <strong>{projetoNome}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowEditorModal(false)}
                className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Formulário */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
              {/* 1. Vincular Ação Cadastrada do Cronograma */}
              <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-[11px] font-bold text-[var(--color-primary)] uppercase tracking-wider flex items-center gap-1.5">
                    <FolderKanban className="w-3.5 h-3.5" />
                    Ação Cadastrada do Cronograma a Vincular *
                  </label>

                  {/* Filtro Mensal no Modal */}
                  {acoes.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[var(--color-primary)]" />
                        Mês:
                      </span>
                      <select
                        value={filtroMesModal}
                        onChange={(e) => setFiltroMesModal(e.target.value)}
                        className="px-2 py-1 rounded-lg text-xs font-semibold bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] cursor-pointer shadow-sm"
                        aria-label="Filtrar Ações por Mês"
                      >
                        <option value="todos">Todos os Meses ({acoes.length})</option>
                        {mesesDisponiveisAcoes.map((m) => {
                          const [ano, mes] = m.split('-');
                          const nomeMes = new Date(Number(ano), Number(mes) - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
                          const countMes = acoes.filter((a) => a.data_hora && a.data_hora.startsWith(m)).length;
                          const isVigente = m === currentMonthStr;

                          return (
                            <option key={m} value={m}>
                              {nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)} {isVigente ? '(Mês Vigente)' : ''} ({countMes})
                            </option>
                          );
                        })}
                      </select>

                      {filtroMesModal !== currentMonthStr && acoes.some((a) => a.data_hora?.startsWith(currentMonthStr)) && (
                        <button
                          type="button"
                          onClick={() => setFiltroMesModal(currentMonthStr)}
                          className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-colors cursor-pointer"
                          title="Ir para o mês vigente"
                        >
                          Vigente
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {acoes.length === 0 ? (
                  <p className="text-xs text-amber-600 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                    Nenhuma ação cadastrada no cronograma deste projeto. Cadastre uma ação na aba "Execução & Monitoramento" ou preencha como encontro geral.
                  </p>
                ) : acoesModalFiltradas.length === 0 ? (
                  <p className="text-xs text-amber-600 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                    Nenhuma ação cadastrada neste mês de referência. Selecione "Todos os Meses" no filtro acima ou alterne para outro mês.
                  </p>
                ) : (
                  <select
                    value={formData.acao_id || ''}
                    onChange={(e) => {
                      const selectedAcaoId = e.target.value || null;
                      const acaoObj = acoes.find((a) => a.id === selectedAcaoId);
                      setFormData({
                        ...formData,
                        acao_id: selectedAcaoId,
                        titulo: formData.titulo || (acaoObj ? acaoObj.nome_acao : ''),
                        data_oficina: acaoObj?.data_hora
                          ? new Date(acaoObj.data_hora).toISOString().split('T')[0]
                          : formData.data_oficina,
                      });
                    }}
                    className="w-full p-2.5 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] font-semibold focus:outline-none focus:border-[var(--color-primary)] cursor-pointer transition-colors"
                  >
                    <option value="">Selecione a ação cadastrada no projeto...</option>
                    {acoesModalFiltradas.map((acao) => (
                      <option key={acao.id} value={acao.id}>
                        {acao.nome_acao} — {new Date(acao.data_hora).toLocaleDateString('pt-BR')} ({new Date(acao.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* 2. Título do Encontro, Data e Educador Responsável */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                    Título do Encontro / Aula *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Oficina 01 - Acolhimento, Dinâmica Coletiva e Construção"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-semibold focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                      Data da Oficina *
                    </label>
                    <input
                      type="date"
                      value={formData.data_oficina}
                      onChange={(e) => setFormData({ ...formData, data_oficina: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors font-mono-data"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                      Educador / Oficineiro Responsável Geral
                    </label>
                    <div className="space-y-1.5">
                      <select
                        value={
                          voluntarios.some((v) => v.nome_completo === formData.oficineiro)
                            ? formData.oficineiro
                            : formData.oficineiro
                            ? '__CUSTOM__'
                            : ''
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '__CUSTOM__') {
                            setFormData({ ...formData, oficineiro: '' });
                          } else {
                            setFormData({ ...formData, oficineiro: val });
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] cursor-pointer transition-colors"
                      >
                        <option value="">Selecione o educador (opcional)...</option>
                        {voluntarios.map((v) => (
                          <option key={v.id} value={v.nome_completo}>
                            {v.nome_completo} {v.area_atuacao ? `(${v.area_atuacao})` : ''}
                          </option>
                        ))}
                        <option value="__CUSTOM__">+ Digitar nome personalizado / externo...</option>
                      </select>

                      {(!voluntarios.some((v) => v.nome_completo === formData.oficineiro) || formData.oficineiro === '') && (
                        <input
                          type="text"
                          placeholder="Digite o nome do educador / oficineiro responsável..."
                          value={formData.oficineiro}
                          onChange={(e) => setFormData({ ...formData, oficineiro: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] transition-colors"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Descrição Geral do Encontro */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                  Descrição Geral do Encontro / Objetivos Pedagógicos
                </label>
                <textarea
                  rows={2}
                  placeholder="Contextualize os objetivos, proposta temática e acolhida do encontro..."
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full p-3 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] resize-none leading-relaxed transition-colors"
                />
              </div>

              {/* 4. Cadastrar Atividades (Estrutura Completa) */}
              <div className="space-y-3 pt-2 border-t border-[var(--border-default)]">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[var(--color-primary)]" />
                      Atividades & Dinâmicas do Plano de Aula ({formData.atividades.length})
                    </h4>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Defina as atividades com mediador, descrição detalhada, materiais e vínculo com metas
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={handleAddAtividade}
                  >
                    Adicionar Atividade
                  </Button>
                </div>

                <div className="space-y-3">
                  {formData.atividades.map((ativ, aIdx) => (
                    <div
                      key={ativ.id || aIdx}
                      className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/40 space-y-3 shadow-sm"
                    >
                      {/* Topo da Atividade */}
                      <div className="flex items-center justify-between border-b border-[var(--border-default)]/60 pb-2">
                        <span className="font-bold text-xs text-[var(--color-primary)]">
                          Atividade {aIdx + 1}
                        </span>
                        {formData.atividades.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAtividade(aIdx)}
                            className="text-xs text-[var(--color-danger)] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            Remover
                          </button>
                        )}
                      </div>

                      {/* Linha 1 da Atividade: Título e Mediador / Oficineiro */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-[var(--text-secondary)] block">
                            Título da Atividade *
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Roda de Acolhida e Apresentação"
                            value={ativ.titulo}
                            onChange={(e) => handleUpdateAtividade(aIdx, 'titulo', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] font-semibold focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-[var(--text-secondary)] block">
                            Mediador / Oficineiro Responsável *
                          </label>
                          <div className="space-y-1.5">
                            <select
                              value={
                                voluntarios.some((v) => v.nome_completo === ativ.mediador)
                                  ? ativ.mediador
                                  : ativ.mediador
                                  ? '__CUSTOM__'
                                  : ''
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '__CUSTOM__') {
                                  handleUpdateAtividade(aIdx, 'mediador', '');
                                } else {
                                  handleUpdateAtividade(aIdx, 'mediador', val);
                                }
                              }}
                              className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] cursor-pointer transition-colors"
                            >
                              <option value="">Selecione o voluntário...</option>
                              {voluntarios.map((v) => (
                                <option key={v.id} value={v.nome_completo}>
                                  {v.nome_completo} {v.area_atuacao ? `(${v.area_atuacao})` : ''}
                                </option>
                              ))}
                              <option value="__CUSTOM__">+ Digitar nome personalizado / externo...</option>
                            </select>

                            {(!voluntarios.some((v) => v.nome_completo === ativ.mediador) || ativ.mediador === '') && (
                              <input
                                type="text"
                                placeholder="Digite o nome do mediador / oficineiro externo..."
                                value={ativ.mediador}
                                onChange={(e) => handleUpdateAtividade(aIdx, 'mediador', e.target.value)}
                                className="w-full px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] transition-colors"
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Descrição em Texto Corrido da Atividade */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-[var(--text-secondary)] block">
                          Descrição da Atividade (Texto corrido da dinâmica e metodologia)
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Descreva passo a passo como a atividade será conduzida com os alunos/participantes..."
                          value={ativ.descricao}
                          onChange={(e) => handleUpdateAtividade(aIdx, 'descricao', e.target.value)}
                          className="w-full p-2.5 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] resize-none leading-relaxed transition-colors"
                        />
                      </div>

                      {/* Linha 3 da Atividade: Materiais e Meta do Projeto */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                            <Package className="w-3 h-3 text-[var(--color-primary)]" />
                            Materiais Necessários
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Varetas de bambu, papel de seda, cola, tesoura"
                            value={ativ.materiais}
                            onChange={(e) => handleUpdateAtividade(aIdx, 'materiais', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                          />
                        </div>

                        <div className="space-y-1 relative">
                          <label className="text-[11px] font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                            <Target className="w-3 h-3 text-[var(--color-primary)]" />
                            A qual meta essa atividade contribui?
                          </label>
                          {/* Custom Meta Selector - exibe texto completo sem truncamento */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const dropdownId = `meta-dropdown-${aIdx}`;
                                const el = document.getElementById(dropdownId);
                                if (el) {
                                  el.style.display = el.style.display === 'none' ? 'block' : 'none';
                                }
                              }}
                              className="w-full px-3 py-2.5 rounded-xl text-xs text-left bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] hover:border-[var(--color-primary)]/60 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                            >
                              <span className="whitespace-normal leading-relaxed">
                                {ativ.meta_id
                                  ? (metas.find(m => m.id === ativ.meta_id)?.descricao || 'Meta não encontrada')
                                  : 'Selecione uma meta do projeto...'}
                              </span>
                              <svg className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            <div
                              id={`meta-dropdown-${aIdx}`}
                              style={{ display: 'none' }}
                              className="absolute z-50 top-full left-0 right-0 mt-1 max-h-[240px] overflow-y-auto rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-xl"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateAtividade(aIdx, 'meta_id', '');
                                  const el = document.getElementById(`meta-dropdown-${aIdx}`);
                                  if (el) el.style.display = 'none';
                                }}
                                className={`w-full text-left px-3 py-2.5 text-xs border-b border-[var(--border-default)]/50 transition-colors cursor-pointer ${
                                  !ativ.meta_id ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold' : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]'
                                }`}
                              >
                                Nenhuma meta selecionada
                              </button>
                              {metas.map((m, mIdx) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    handleUpdateAtividade(aIdx, 'meta_id', m.id);
                                    const el = document.getElementById(`meta-dropdown-${aIdx}`);
                                    if (el) el.style.display = 'none';
                                  }}
                                  className={`w-full text-left px-3 py-2.5 text-xs transition-colors whitespace-normal leading-relaxed cursor-pointer ${
                                    mIdx < metas.length - 1 ? 'border-b border-[var(--border-default)]/30' : ''
                                  } ${
                                    ativ.meta_id === m.id
                                      ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold'
                                      : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                                  }`}
                                >
                                  <span className="flex items-start gap-2">
                                    <Target className="w-3 h-3 mt-0.5 shrink-0 text-[var(--color-primary)]" />
                                    <span>{m.descricao}</span>
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  ))}

                  {/* Botão de Adicionar Nova Atividade fixo na parte inferior da lista */}
                  <button
                    type="button"
                    onClick={handleAddAtividade}
                    className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-[var(--border-default)] hover:border-[var(--color-primary)] bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]/70 text-[var(--color-primary)] text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm group"
                  >
                    <Plus className="w-4 h-4 transition-transform group-hover:scale-110" />
                    <span>Adicionar Nova Atividade / Dinâmica ao Roteiro</span>
                  </button>
                </div>
              </div>

              {/* 5. Observações Gerais */}
              <div className="space-y-1 pt-2 border-t border-[var(--border-default)]">
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                  Observações Gerais da Pedagogia
                </label>
                <textarea
                  rows={2}
                  placeholder="Orientações complementares, adaptações metodológicas ou avisos para a equipe..."
                  value={formData.observacoes_gerais}
                  onChange={(e) => setFormData({ ...formData, observacoes_gerais: e.target.value })}
                  className="w-full p-3 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] resize-none leading-relaxed transition-colors"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 p-4 sm:p-5 border-t border-[var(--border-default)] shrink-0 bg-[var(--bg-secondary)]/40 rounded-b-2xl">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowEditorModal(false)}
                disabled={saving}
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
                {saving ? 'Salvando Plano...' : 'Salvar Plano de Aula'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODAL: PAPEL TIMBRADO INSTITUCIONAL DO PLANO DE AULA
      ═══════════════════════════════════════════════════════════════ */}
      {showPrintModal && planoToPrint && (
        <PapelTimbradoModal
          isOpen={showPrintModal}
          onClose={() => {
            setShowPrintModal(false);
            setPlanoToPrint(null);
          }}
          tituloDocumento="PLANO DE AULA & DIRETRIZ PEDAGÓGICA"
          subtituloDocumento={`Projeto Social: ${projetoNome}`}
        >
          <div className="space-y-5 text-slate-800 text-xs leading-relaxed">
            {/* Header com Metadados */}
            <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-bold text-slate-900 block">Título do Encontro:</span>
                  <span className="text-slate-700">{planoToPrint.titulo}</span>
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
                  <span className="text-slate-700">{planoToPrint.oficineiro}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Ação Vinculada no Cronograma:</span>
                  <span className="text-slate-700">
                    {acoes.find((a) => a.id === planoToPrint.acao_id)?.nome_acao || 'Encontro Geral'}
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
                2. Atividades Pedagógicas, Metodologia e Vinculação às Metas
              </h4>

              {Array.isArray(planoToPrint.atividades) && planoToPrint.atividades.length > 0 ? (
                <div className="space-y-3">
                  {planoToPrint.atividades.map((ativ, idx) => {
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
                            <span className="font-bold text-slate-800">Meta Vinculada: </span>
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

            {/* Bloco de Assinatura */}
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
    </div>
  );
}
