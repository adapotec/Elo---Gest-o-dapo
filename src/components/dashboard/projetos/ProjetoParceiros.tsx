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
  Building2,
  Handshake,
  DollarSign,
  Calendar,
  Plus,
  Save,
  Trash2,
  Printer,
  FileCheck,
  CheckCircle,
  Clock,
  ExternalLink,
  Award,
} from 'lucide-react';

export interface ParceiroProjeto {
  id?: string;
  projeto_id: string;
  fornecedor_id?: string | null;
  nome_parceiro: string;
  tipo_parceria: 'financeira' | 'material' | 'servico' | 'institucional';
  valor_comprometido: number;
  vigencia_inicio?: string | null;
  vigencia_fim?: string | null;
  contrapartidas?: string | null;
  status: 'ativo' | 'em_renovacao' | 'concluido' | 'cancelado';
  observacoes?: string | null;
}

interface ProjetoParceirosProps {
  projetoId: string;
}

export function ProjetoParceiros({ projetoId }: ProjetoParceirosProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parceiros, setParceiros] = useState<ParceiroProjeto[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);

  // Modal Novo Parceiro
  const [showModal, setShowModal] = useState(false);
  const [formParceiro, setFormParceiro] = useState<ParceiroProjeto>({
    projeto_id: projetoId,
    fornecedor_id: '',
    nome_parceiro: '',
    tipo_parceria: 'financeira',
    valor_comprometido: 0,
    vigencia_inicio: new Date().toISOString().split('T')[0],
    vigencia_fim: '',
    contrapartidas: '',
    status: 'ativo',
    observacoes: '',
  });

  // Modal Impressão Prestação de Contas
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedParceiroPrint, setSelectedParceiroPrint] = useState<ParceiroProjeto | null>(null);

  useEffect(() => {
    loadData();
  }, [projetoId]);

  async function loadData() {
    try {
      setLoading(true);
      const supabase = createClient();

      const [respParceiros, respForn] = await Promise.all([
        supabase
          .from('parceiros_projeto')
          .select('*')
          .eq('projeto_id', projetoId)
          .order('created_at', { ascending: false }),
        supabase
          .from('fornecedores')
          .select('id, nome, tipo_pessoa, tax_id')
          .order('nome', { ascending: true }),
      ]);

      setParceiros(respParceiros.data || []);
      setFornecedores(respForn.data || []);
    } catch (err) {
      console.error('Erro ao carregar parceiros do projeto:', err);
    } finally {
      setLoading(false);
    }
  }

  // Ao selecionar um fornecedor existente, preenche o nome automaticamente
  const handleSelectFornecedor = (fornId: string) => {
    const forn = fornecedores.find((f) => f.id === fornId);
    setFormParceiro((prev) => ({
      ...prev,
      fornecedor_id: fornId,
      nome_parceiro: forn ? forn.nome : prev.nome_parceiro,
    }));
  };

  async function handleSaveParceiro() {
    if (!formParceiro.nome_parceiro) return alert('Informe o nome do parceiro/financiador.');
    try {
      setSaving(true);
      const supabase = createClient();

      const { error } = await supabase.from('parceiros_projeto').insert([
        {
          ...formParceiro,
          projeto_id: projetoId,
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      setShowModal(false);
      setFormParceiro({
        projeto_id: projetoId,
        fornecedor_id: '',
        nome_parceiro: '',
        tipo_parceria: 'financeira',
        valor_comprometido: 0,
        vigencia_inicio: new Date().toISOString().split('T')[0],
        vigencia_fim: '',
        contrapartidas: '',
        status: 'ativo',
        observacoes: '',
      });
      loadData();
    } catch (err) {
      console.error('Erro ao salvar parceiro:', err);
      alert('Erro ao salvar convênio/parceiro.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveParceiro(id: string) {
    if (!confirm('Deseja excluir este convênio/parceiro do projeto?')) return;
    try {
      const supabase = createClient();
      await supabase.from('parceiros_projeto').delete().eq('id', id);
      loadData();
    } catch (err) {
      console.error('Erro ao remover parceiro:', err);
    }
  }

  const totalAporte = parceiros.reduce((acc, p) => acc + (p.valor_comprometido || 0), 0);
  const parceirosAtivos = parceiros.filter((p) => p.status === 'ativo').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge variant="success">ATIVO</Badge>;
      case 'em_renovacao':
        return <Badge variant="warning" className="font-bold">EM RENOVAÇÃO</Badge>;
      case 'concluido':
        return <Badge variant="purple">CONCLUÍDO</Badge>;
      case 'cancelado':
      default:
        return <Badge variant="neutral">CANCELADO</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header e Métricas Rápida */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-default)] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Handshake className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[var(--text-primary)]">
              Área de Controle de Parceiros & Financiadores
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Gestão de patrocinadores, convênios institucionais, aportes financeiros e contrapartidas
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={() => setShowModal(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Novo Parceiro / Convênio
        </Button>
      </div>

      {/* Cards Estatísticos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-[#F2632D]">
          <div className="p-3 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Aporte Total Comprometido</p>
            <p className="text-2xl font-bold text-[var(--text-primary)] font-mono">
              R$ {totalAporte.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-l-4 border-l-purple-500">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Parceiros Ativos no Projeto</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{parceirosAtivos} de {parceiros.length}</p>
          </div>
        </Card>
      </div>

      {/* Tabela de Convênios */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-default)]">
          <h4 className="font-bold text-sm text-[var(--text-primary)]">
            Lista de Convênios & Parcerias ({parceiros.length})
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--text-primary)]">
            <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-default)] text-xs font-semibold uppercase text-[var(--text-muted)]">
              <tr>
                <th className="p-3">Parceiro / Financiador</th>
                <th className="p-3">Tipo & Aporte (R$)</th>
                <th className="p-3">Vigência</th>
                <th className="p-3">Contrapartidas Exigidas</th>
                <th className="p-3">Status</th>
                <th className="p-3 w-32 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {parceiros.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[var(--text-muted)]">
                    Nenhum parceiro ou financiador vinculado a este projeto.
                  </td>
                </tr>
              ) : (
                parceiros.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--bg-secondary)]/30">
                    <td className="p-3">
                      <div>
                        <p className="font-bold text-sm text-[var(--text-primary)]">{p.nome_parceiro}</p>
                        {p.observacoes && (
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">{p.observacoes}</p>
                        )}
                      </div>
                    </td>

                    <td className="p-3 space-y-1">
                      <p className="text-xs font-bold text-[var(--color-success)] font-mono">
                        R$ {(p.valor_comprometido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <Badge variant="purple">{p.tipo_parceria.toUpperCase()}</Badge>
                    </td>

                    <td className="p-3 text-xs text-[var(--text-secondary)] space-y-0.5">
                      {p.vigencia_inicio && (
                        <p>
                          Início: {new Date(p.vigencia_inicio).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                      {p.vigencia_fim && (
                        <p className="text-[var(--text-muted)]">
                          Término: {new Date(p.vigencia_fim).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </td>

                    <td className="p-3 text-xs text-[var(--text-secondary)] max-w-xs">
                      {p.contrapartidas || 'Sem contrapartidas registradas'}
                    </td>

                    <td className="p-3">{getStatusBadge(p.status)}</td>

                    <td className="p-3 text-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedParceiroPrint(p);
                          setShowPrintModal(true);
                        }}
                        className="p-1 text-[var(--color-primary)] hover:underline"
                        title="Imprimir Relatório de Prestação de Contas"
                      >
                        <Printer className="w-4 h-4 inline" />
                      </button>

                      <button
                        onClick={() => handleRemoveParceiro(p.id!)}
                        className="p-1 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                        title="Excluir parceiro"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL NOVO PARCEIRO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 space-y-4">
            <h3 className="font-bold text-base text-[var(--text-primary)]">Cadastrar Convênio / Parceiro no Projeto</h3>

            <div className="space-y-3">
              {fornecedores.length > 0 && (
                <Select
                  label="Vincular a Parceiro/Fornecedor já Cadastrado (Opcional)"
                  value={formParceiro.fornecedor_id || ''}
                  onChange={(e) => handleSelectFornecedor(e.target.value)}
                >
                  <option value="">Selecione da lista de parceiros...</option>
                  {fornecedores.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome} ({f.tipo_pessoa})
                    </option>
                  ))}
                </Select>
              )}

              <Input
                label="Razão Social / Nome do Parceiro ou Financiador"
                value={formParceiro.nome_parceiro}
                onChange={(e) => setFormParceiro({ ...formParceiro, nome_parceiro: e.target.value })}
                placeholder="Ex: Fundação Itaú, Empresa X, Doador Anônimo..."
              />

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Tipo de Parceria"
                  value={formParceiro.tipo_parceria}
                  onChange={(e: any) => setFormParceiro({ ...formParceiro, tipo_parceria: e.target.value })}
                >
                  <option value="financeira">Financeira / Patrocínio</option>
                  <option value="material">Doação de Materiais</option>
                  <option value="servico">Prestação de Serviços</option>
                  <option value="institucional">Apoio Institucional</option>
                </Select>

                <Input
                  label="Valor Comprometido (R$)"
                  type="number"
                  step="0.01"
                  value={formParceiro.valor_comprometido}
                  onChange={(e) =>
                    setFormParceiro({ ...formParceiro, valor_comprometido: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Início da Vigência"
                  type="date"
                  value={formParceiro.vigencia_inicio || ''}
                  onChange={(e) => setFormParceiro({ ...formParceiro, vigencia_inicio: e.target.value })}
                />
                <Input
                  label="Término da Vigência"
                  type="date"
                  value={formParceiro.vigencia_fim || ''}
                  onChange={(e) => setFormParceiro({ ...formParceiro, vigencia_fim: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Contrapartidas Exigidas pelo Parceiro
                </label>
                <textarea
                  rows={2}
                  value={formParceiro.contrapartidas || ''}
                  onChange={(e) => setFormParceiro({ ...formParceiro, contrapartidas: e.target.value })}
                  placeholder="Ex: Exposição de marca nos materiais impresso, relatórios trimestrais de impacto..."
                  className="w-full p-2.5 rounded-lg text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)]"
                />
              </div>

              <Select
                label="Status da Parceria"
                value={formParceiro.status}
                onChange={(e: any) => setFormParceiro({ ...formParceiro, status: e.target.value })}
              >
                <option value="ativo">Ativo</option>
                <option value="em_renovacao">Em Renovação</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button size="sm" variant="ghost" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button size="sm" variant="primary" onClick={handleSaveParceiro} disabled={saving}>
                Salvar Convênio
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL IMPRESSÃO PRESTAÇÃO DE CONTAS TIMBRADA */}
      <PapelTimbradoModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        tituloDocumento="RELATÓRIO DE PRESTAÇÃO DE CONTAS & PARCERIA INSTITUCIONAL"
        subtituloDocumento={`Parceiro: ${selectedParceiroPrint?.nome_parceiro || 'Geral'} | Data: ${new Date().toLocaleDateString('pt-BR')}`}
      >
        <div className="space-y-6">
          {selectedParceiroPrint ? (
            <>
              <div className="grid grid-cols-2 gap-4 text-xs border p-3 rounded bg-slate-50">
                <div>
                  <strong>Razão Social / Parceiro:</strong> {selectedParceiroPrint.nome_parceiro}
                </div>
                <div>
                  <strong>Tipo de Parceria:</strong> {selectedParceiroPrint.tipo_parceria.toUpperCase()}
                </div>
                <div>
                  <strong>Valor Aporte Comprometido:</strong> R${' '}
                  {selectedParceiroPrint.valor_comprometido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div>
                  <strong>Status do Convênio:</strong> {selectedParceiroPrint.status.toUpperCase()}
                </div>
                <div>
                  <strong>Início Vigência:</strong>{' '}
                  {selectedParceiroPrint.vigencia_inicio
                    ? new Date(selectedParceiroPrint.vigencia_inicio).toLocaleDateString('pt-BR')
                    : '-'}
                </div>
                <div>
                  <strong>Término Vigência:</strong>{' '}
                  {selectedParceiroPrint.vigencia_fim
                    ? new Date(selectedParceiroPrint.vigencia_fim).toLocaleDateString('pt-BR')
                    : '-'}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs uppercase text-[#F2632D] border-b pb-1">
                  Contrapartidas & Compromissos Assumidos
                </h4>
                <p className="mt-1 text-sm whitespace-pre-line">
                  {selectedParceiroPrint.contrapartidas || 'Sem contrapartidas registradas.'}
                </p>
              </div>

              {selectedParceiroPrint.observacoes && (
                <div>
                  <h4 className="font-bold text-xs uppercase text-slate-700 border-b pb-1">Observações Institucionais</h4>
                  <p className="mt-1 text-sm whitespace-pre-line">{selectedParceiroPrint.observacoes}</p>
                </div>
              )}
            </>
          ) : (
            <table className="w-full text-left text-xs border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300">
                  <th className="p-2 border border-slate-300 font-bold">Parceiro / Financiador</th>
                  <th className="p-2 border border-slate-300 font-bold">Tipo</th>
                  <th className="p-2 border border-slate-300 font-bold">Aporte (R$)</th>
                  <th className="p-2 border border-slate-300 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {parceiros.map((p) => (
                  <tr key={p.id} className="border-b border-slate-200">
                    <td className="p-2 border border-slate-200 font-semibold">{p.nome_parceiro}</td>
                    <td className="p-2 border border-slate-200">{p.tipo_parceria}</td>
                    <td className="p-2 border border-slate-200 font-mono">
                      R$ {p.valor_comprometido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 border border-slate-200 font-bold uppercase">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </PapelTimbradoModal>
    </div>
  );
}
