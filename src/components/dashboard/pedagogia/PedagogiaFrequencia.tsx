'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
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
} from 'lucide-react';

interface BeneficiarioInscrito {
  id: string;
  nome_completo: string;
  data_nascimento: string;
  comunidade?: string;
  bairro?: string;
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
  onRefresh?: () => void;
}

export function PedagogiaFrequencia({
  projetoId,
  projetoNome,
  acoes = [],
  inscritos = [],
  onRefresh,
}: PedagogiaFrequenciaProps) {
  const [selectedAcaoId, setSelectedAcaoId] = useState<string>(acoes[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [frequencias, setFrequencias] = useState<Record<string, FrequenciaRegistro>>({});
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Atualizar ação selecionada se a lista mudar
  useEffect(() => {
    if (!selectedAcaoId && acoes.length > 0) {
      setSelectedAcaoId(acoes[0].id);
    }
  }, [acoes, selectedAcaoId]);

  // Carregar chamada existente da ação selecionada
  useEffect(() => {
    if (!selectedAcaoId || !projetoId) return;

    const carregarFrequencias = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('frequencias_acao')
        .select('*')
        .eq('acao_id', selectedAcaoId);

      if (!error && data) {
        const mapa: Record<string, FrequenciaRegistro> = {};
        data.forEach((item: any) => {
          mapa[item.beneficiario_id] = {
            id: item.id,
            beneficiario_id: item.beneficiario_id,
            status: item.status || 'presente',
            justificativa: item.justificativa || '',
          };
        });

        // Inicializar os que ainda não foram marcados como 'presente' por padrão
        inscritos.forEach((b) => {
          if (!mapa[b.id]) {
            mapa[b.id] = {
              beneficiario_id: b.id,
              status: 'presente',
              justificativa: '',
            };
          }
        });

        setFrequencias(mapa);
      } else {
        // Inicializar todos como presente se não houver registros
        const mapa: Record<string, FrequenciaRegistro> = {};
        inscritos.forEach((b) => {
          mapa[b.id] = {
            beneficiario_id: b.id,
            status: 'presente',
            justificativa: '',
          };
        });
        setFrequencias(mapa);
      }
      setLoading(false);
    };

    carregarFrequencias();
  }, [selectedAcaoId, projetoId, inscritos]);

  const acaoAtual = acoes.find((a) => a.id === selectedAcaoId);

  const handleStatusChange = (beneficiarioId: string, status: 'presente' | 'falta' | 'justificada') => {
    setFrequencias((prev) => ({
      ...prev,
      [beneficiarioId]: {
        ...prev[beneficiarioId],
        beneficiario_id: beneficiarioId,
        status,
      },
    }));
  };

  const handleJustificativaChange = (beneficiarioId: string, justificativa: string) => {
    setFrequencias((prev) => ({
      ...prev,
      [beneficiarioId]: {
        ...prev[beneficiarioId],
        beneficiario_id: beneficiarioId,
        justificativa,
      },
    }));
  };

  const handleMarcarTodos = (status: 'presente' | 'falta') => {
    setFrequencias((prev) => {
      const updated = { ...prev };
      inscritos.forEach((b) => {
        updated[b.id] = {
          ...updated[b.id],
          beneficiario_id: b.id,
          status,
        };
      });
      return updated;
    });
  };

  const handleSalvarFrequencia = async () => {
    if (!selectedAcaoId || !projetoId) return;
    setSaving(true);
    setSaveSuccess(false);

    const supabase = createClient();
    const rowsToUpsert = Object.values(frequencias).map((item) => ({
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
      alert('Erro ao salvar frequência: ' + error.message);
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      if (onRefresh) onRefresh();
    }
    setSaving(false);
  };

  // Métricas
  const totalInscritos = inscritos.length;
  const totalPresentes = Object.values(frequencias).filter((f) => f.status === 'presente').length;
  const totalFaltas = Object.values(frequencias).filter((f) => f.status === 'falta').length;
  const totalJustificadas = Object.values(frequencias).filter((f) => f.status === 'justificada').length;
  const taxaAssiduidade = totalInscritos > 0 ? Math.round((totalPresentes / totalInscritos) * 100) : 0;

  // Filtragem
  const inscritosFiltrados = inscritos.filter((b) =>
    b.nome_completo.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (b.comunidade && b.comunidade.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* ── Painel Principal de Frequência (Padrão Idêntico a Projetos) ── */}
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] p-6 space-y-6">
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-default)] pb-4">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
              <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                Frequência & Registro de Presença
              </h3>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Controle de presença dos beneficiários nas ações e encontros do projeto <strong>{projetoNome}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="secondary"
              icon={<Printer className="w-4 h-4" />}
              onClick={() => setShowPrintModal(true)}
              disabled={!acaoAtual || totalInscritos === 0}
            >
              Exportar Presença
            </Button>
            <Button
              size="sm"
              variant="primary"
              icon={<Save className="w-4 h-4" />}
              onClick={handleSalvarFrequencia}
              disabled={saving || !acaoAtual || totalInscritos === 0}
            >
              {saving ? 'Salvando...' : 'Salvar Chamada'}
            </Button>
          </div>
        </div>

        {/* Feedback de Salvamento com Alto Contraste */}
        {saveSuccess && (
          <div className="p-4 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-white" />
            Chamada de frequência registrada com sucesso no sistema!
          </div>
        )}

        {/* Seletor de Encontro & Métricas Bento */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[var(--bg-secondary)]/50 border border-[var(--border-default)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Encontro Selecionado:
              </span>
              {acoes.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] italic">
                  Nenhum encontro cadastrado. Cadastre ações no cronograma do projeto.
                </p>
              ) : (
                <select
                  value={selectedAcaoId}
                  onChange={(e) => setSelectedAcaoId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] font-semibold focus:outline-none focus:border-[var(--color-primary)] cursor-pointer transition-all"
                >
                  {acoes.map((acao) => (
                    <option key={acao.id} value={acao.id}>
                      {acao.nome_acao} — {new Date(acao.data_hora).toLocaleDateString('pt-BR')}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {acaoAtual && (
              <Badge variant="primary">
                <Calendar className="w-3 h-3 mr-1" />
                {new Date(acaoAtual.data_hora).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
              </Badge>
            )}
          </div>

          {/* 4 Mini-Cards Bento de Métricas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)]/40 border border-[var(--border-default)] text-center space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Inscritos</span>
              <span className="text-lg font-bold font-mono-data text-[var(--text-primary)] block leading-tight">{totalInscritos}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 block">Presentes</span>
              <span className="text-lg font-bold font-mono-data text-emerald-600 dark:text-emerald-400 block leading-tight">{totalPresentes}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-300 block">Faltas</span>
              <span className="text-lg font-bold font-mono-data text-rose-600 dark:text-rose-400 block leading-tight">{totalFaltas}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-center space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-[var(--color-primary)] block">Assiduidade</span>
              <span className="text-lg font-bold font-mono-data text-[var(--color-primary)] block leading-tight">{taxaAssiduidade}%</span>
            </div>
          </div>
        </div>

        {/* ── Barra de Busca e Ações em Lote ── */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar aluno por nome ou comunidade..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleMarcarTodos('presente')}
                className="px-3 py-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--color-primary)]/50 transition-colors font-semibold cursor-pointer"
              >
                Marcar Todos Presentes
              </button>
              <button
                type="button"
                onClick={() => handleMarcarTodos('falta')}
                className="px-3 py-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-rose-500 hover:border-rose-300 transition-colors font-semibold cursor-pointer"
              >
                Marcar Todos Ausentes
              </button>
            </div>
          </div>
        </div>

        {totalInscritos === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-[var(--border-default)] rounded-2xl text-xs text-[var(--text-muted)] space-y-2">
            <Users className="w-8 h-8 mx-auto text-[var(--text-muted)] opacity-50" />
            <p className="font-semibold text-sm text-[var(--text-secondary)]">Nenhum beneficiário inscrito neste projeto.</p>
            <p>Vincule beneficiários na aba de Inscrições do Projeto ou na página de Beneficiários.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-default)] text-[var(--text-muted)] uppercase text-[11px] font-bold">
                  <th className="py-2.5 px-3">Aluno / Beneficiário</th>
                  <th className="py-2.5 px-3">Comunidade / Bairro</th>
                  <th className="py-2.5 px-3 text-center">Status da Presença</th>
                  <th className="py-2.5 px-3">Justificativa / Observação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]/60">
                {inscritosFiltrados.map((aluno, index) => {
                  const freq = frequencias[aluno.id] || { status: 'presente', justificativa: '' };

                  return (
                    <tr key={aluno.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold text-xs flex items-center justify-center shrink-0">
                            {aluno.nome_completo.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-[var(--text-primary)] block">
                              {index + 1}. {aluno.nome_completo}
                            </span>
                            {aluno.data_nascimento && (
                              <span className="text-[10px] text-[var(--text-muted)] font-mono-data">
                                Nasc: {new Date(aluno.data_nascimento).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-[var(--text-secondary)]">
                        {aluno.comunidade || aluno.bairro || '—'}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex rounded-xl border border-[var(--border-default)] p-1 bg-[var(--bg-elevated)] gap-1">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(aluno.id, 'presente')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                              freq.status === 'presente'
                                ? 'bg-emerald-500 text-white shadow-xs'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Presente
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(aluno.id, 'falta')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                              freq.status === 'falta'
                                ? 'bg-rose-500 text-white shadow-xs'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                            }`}
                          >
                            <XCircle className="w-3 h-3" />
                            Falta
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(aluno.id, 'justificada')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                              freq.status === 'justificada'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                            }`}
                          >
                            <AlertCircle className="w-3 h-3" />
                            Justificada
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <input
                          type="text"
                          placeholder={freq.status === 'falta' ? 'Motivo da ausência...' : 'Observação...'}
                          value={freq.justificativa || ''}
                          onChange={(e) => handleJustificativaChange(aluno.id, e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE IMPRESSÃO DA LISTA DE PRESENÇA EM PAPEL TIMBRADO */}
      <PapelTimbradoModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        tituloDocumento="Lista de Presença & Frequência Pedagógica"
        subtituloDocumento={`Projeto: ${projetoNome} • Ação: ${acaoAtual?.nome_acao || ''}`}
      >
        <div className="space-y-4 text-xs text-slate-800 leading-relaxed">
          <div className="grid grid-cols-2 gap-2 border-b border-slate-300 pb-3 timbrado-avoid-break">
            <p><strong>Projeto Social:</strong> {projetoNome}</p>
            <p><strong>Ação / Encontro:</strong> {acaoAtual?.nome_acao}</p>
            <p><strong>Data:</strong> {acaoAtual?.data_hora ? new Date(acaoAtual.data_hora).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}</p>
            <p><strong>Total de Alunos:</strong> {totalInscritos} ({totalPresentes} Presentes, {totalFaltas} Faltas, {totalJustificadas} Justificadas)</p>
          </div>

          <table className="w-full text-xs text-left border-collapse border border-slate-300">
            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
              <tr>
                <th className="p-2 border border-slate-300 w-12 text-center">Nº</th>
                <th className="p-2 border border-slate-300">Nome do Aluno / Beneficiário</th>
                <th className="p-2 border border-slate-300">Comunidade</th>
                <th className="p-2 border border-slate-300 w-24 text-center">Situação</th>
                <th className="p-2 border border-slate-300">Observação / Justificativa</th>
                <th className="p-2 border border-slate-300 w-36 text-center">Assinatura / Visto</th>
              </tr>
            </thead>
            <tbody>
              {inscritos.map((aluno, idx) => {
                const freq = frequencias[aluno.id] || { status: 'presente' };
                return (
                  <tr key={aluno.id} className="border-b border-slate-200 timbrado-avoid-break">
                    <td className="p-2 border border-slate-300 text-center font-bold">{idx + 1}</td>
                    <td className="p-2 border border-slate-300 font-medium">{aluno.nome_completo}</td>
                    <td className="p-2 border border-slate-300">{aluno.comunidade || aluno.bairro || '—'}</td>
                    <td className="p-2 border border-slate-300 text-center font-bold">
                      {freq.status === 'presente' ? 'PRESENTE' : freq.status === 'falta' ? 'FALTA' : 'JUSTIFICADA'}
                    </td>
                    <td className="p-2 border border-slate-300 text-slate-600">{freq.justificativa || '—'}</td>
                    <td className="p-2 border border-slate-300"></td>
                  </tr>
                );
              })}
            </tbody>
          </table>

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
