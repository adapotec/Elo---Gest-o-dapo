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
  Megaphone,
  Image,
  Video,
  Share2,
  Plus,
  Save,
  Trash2,
  Printer,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';

export interface PecaComunicacao {
  id?: string;
  projeto_id: string;
  acao_id?: string | null;
  titulo_peca: string;
  tipo_midia: 'post_instagram' | 'banner' | 'video_reels' | 'story' | 'cartaz' | 'outro';
  canal_divulgacao: 'Instagram' | 'WhatsApp' | 'Site' | 'Impresso' | 'Outro';
  status: 'pendente' | 'em_producao' | 'aprovado' | 'publicado';
  link_midia?: string | null;
  prazo_entrega?: string | null;
  responsavel_comunicacao?: string | null;
  observacoes?: string | null;
}

interface ProjetoComunicacaoProps {
  projetoId: string;
  acoes?: any[];
  inscricoes?: any[]; // Beneficiários inscritos
  voluntarios?: any[];
}

export function ProjetoComunicacao({
  projetoId,
  acoes = [],
  inscricoes = [],
  voluntarios = [],
}: ProjetoComunicacaoProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pecas, setPecas] = useState<PecaComunicacao[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('todos');

  // Modal Nova Peça
  const [showPecaModal, setShowPecaModal] = useState(false);
  const [formPeca, setFormPeca] = useState<PecaComunicacao>({
    projeto_id: projetoId,
    titulo_peca: '',
    tipo_midia: 'post_instagram',
    canal_divulgacao: 'Instagram',
    status: 'pendente',
    link_midia: '',
    prazo_entrega: new Date().toISOString().split('T')[0],
    responsavel_comunicacao: '',
    observacoes: '',
  });

  // Modal Impressão
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    loadPecas();
  }, [projetoId]);

  async function loadPecas() {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from('pecas_comunicacao_projeto')
        .select('*')
        .eq('projeto_id', projetoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPecas(data || []);
    } catch (err) {
      console.error('Erro ao carregar peças de comunicação:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePeca() {
    if (!formPeca.titulo_peca) return alert('Preencha o título da peça.');
    try {
      setSaving(true);
      const supabase = createClient();

      const { error } = await supabase.from('pecas_comunicacao_projeto').insert([
        {
          ...formPeca,
          projeto_id: projetoId,
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      setShowPecaModal(false);
      setFormPeca({
        projeto_id: projetoId,
        titulo_peca: '',
        tipo_midia: 'post_instagram',
        canal_divulgacao: 'Instagram',
        status: 'pendente',
        link_midia: '',
        prazo_entrega: new Date().toISOString().split('T')[0],
        responsavel_comunicacao: '',
        observacoes: '',
      });
      loadPecas();
    } catch (err) {
      console.error('Erro ao salvar peça:', err);
      alert('Erro ao salvar peça de comunicação.');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateStatus(pecaId: string, newStatus: PecaComunicacao['status']) {
    try {
      const supabase = createClient();
      await supabase
        .from('pecas_comunicacao_projeto')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', pecaId);

      loadPecas();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  }

  async function handleRemovePeca(pecaId: string) {
    if (!confirm('Deseja excluir esta peça de comunicação?')) return;
    try {
      const supabase = createClient();
      await supabase.from('pecas_comunicacao_projeto').delete().eq('id', pecaId);
      loadPecas();
    } catch (err) {
      console.error('Erro ao remover peça:', err);
    }
  }

  const filteredPecas = pecas.filter((p) => {
    if (filterStatus === 'todos') return true;
    return p.status === filterStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'publicado':
        return <Badge variant="success">PUBLICADO</Badge>;
      case 'aprovado':
        return <Badge variant="purple">APROVADO</Badge>;
      case 'em_producao':
        return <Badge variant="warning">EM PRODUÇÃO</Badge>;
      case 'pendente':
      default:
        return <Badge variant="neutral">PENDENTE</Badge>;
    }
  };

  // Cálculo de autorização de imagem dos beneficiários
  const totalInscritos = inscricoes.length;
  const autorizadosCount = inscricoes.filter(
    (i) => i.beneficiarios?.autorizacao_imagem || i.autorizacao_imagem
  ).length;
  const pctAutorizados = totalInscritos > 0 ? Math.round((autorizadosCount / totalInscritos) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header e Ações Rápidas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-default)] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[var(--text-primary)]">
              Área da Equipe de Comunicação & Marketing
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Gestão de peças, materiais de divulgação, status de produção e controle de uso de imagem
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowPrintModal(true)}
            icon={<Printer className="w-4 h-4 text-[#F2632D]" />}
          >
            Relatório de Comunicação
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setShowPecaModal(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Nova Peça / Arte
          </Button>
        </div>
      </div>

      {/* PAINEL DE CONTROLE DE USO DE IMAGEM */}
      <Card className="p-5 border-l-4 border-l-emerald-500 bg-emerald-500/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                Controle de Consentimento & Uso de Imagem
                <span className="text-xs font-normal text-emerald-600 font-mono font-bold">
                  ({autorizadosCount}/{totalInscritos} autorizados • {pctAutorizados}%)
                </span>
              </h4>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Verifique se as crianças/atendidos em fotos e vídeos possuem o Termo de Consentimento assinado no cadastro.
              </p>
            </div>
          </div>

          <Badge variant={pctAutorizados > 70 ? 'success' : 'warning'}>
            {pctAutorizados}% COM AUTORIZAÇÃO
          </Badge>
        </div>

        {/* Lista resumida de inscritos */}
        {inscricoes.length > 0 && (
          <div className="mt-4 pt-3 border-t border-emerald-500/20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {inscricoes.slice(0, 6).map((i) => {
              const b = i.beneficiarios || i;
              const hasConsent = b.autorizacao_imagem;
              return (
                <div
                  key={b.id || i.beneficiario_id}
                  className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-[var(--text-primary)] truncate max-w-[140px]">
                    {b.nome_completo || 'Atendido'}
                  </span>
                  {hasConsent ? (
                    <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Imagem OK
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Sem Termo
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* GESTÃO DE PEÇAS & ARTES DE DIVULGAÇÃO */}
      <Card className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-3">
            <Share2 className="w-5 h-5 text-[#F2632D]" />
            <h4 className="font-bold text-sm text-[var(--text-primary)]">
              Quadro de Peças & Artes de Divulgação ({pecas.length})
            </h4>
          </div>

          {/* Filtro de Status */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)] font-semibold">Status:</span>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs"
            >
              <option value="todos">Todos os Status</option>
              <option value="pendente">Pendente</option>
              <option value="em_producao">Em Produção</option>
              <option value="aprovado">Aprovado</option>
              <option value="publicado">Publicado</option>
            </Select>
          </div>
        </div>

        {/* Tabela de Peças */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--text-primary)]">
            <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-default)] text-xs font-semibold uppercase text-[var(--text-muted)]">
              <tr>
                <th className="p-3">Título da Peça / Arte</th>
                <th className="p-3">Tipo & Canal</th>
                <th className="p-3">Prazo & Responsável</th>
                <th className="p-3">Status</th>
                <th className="p-3 w-28 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {filteredPecas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[var(--text-muted)]">
                    Nenhuma peça de comunicação cadastrada com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredPecas.map((peca) => (
                  <tr key={peca.id} className="hover:bg-[var(--bg-secondary)]/30">
                    <td className="p-3">
                      <div>
                        <p className="font-bold text-sm text-[var(--text-primary)]">{peca.titulo_peca}</p>
                        {peca.link_midia && (
                          <a
                            href={peca.link_midia}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#F2632D] hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <ExternalLink className="w-3 h-3" /> Ver Mídia / Link
                          </a>
                        )}
                        {peca.observacoes && (
                          <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">
                            {peca.observacoes}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="p-3 space-y-1">
                      <p className="text-xs font-semibold text-[var(--text-primary)]">{peca.tipo_midia}</p>
                      <Badge variant="purple">{peca.canal_divulgacao}</Badge>
                    </td>

                    <td className="p-3 space-y-0.5 text-xs text-[var(--text-secondary)]">
                      {peca.prazo_entrega && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <span>{new Date(peca.prazo_entrega).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                      {peca.responsavel_comunicacao && (
                        <p className="text-[var(--text-muted)]">{peca.responsavel_comunicacao}</p>
                      )}
                    </td>

                    <td className="p-3">
                      <Select
                        value={peca.status}
                        onChange={(e) => handleUpdateStatus(peca.id!, e.target.value as any)}
                        className="text-xs font-bold"
                      >
                        <option value="pendente">Pendente</option>
                        <option value="em_producao">Em Produção</option>
                        <option value="aprovado">Aprovado</option>
                        <option value="publicado">Publicado</option>
                      </Select>
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleRemovePeca(peca.id!)}
                        className="p-1 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                        title="Excluir peça"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL NOVA PEÇA */}
      {showPecaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 space-y-4">
            <h3 className="font-bold text-base text-[var(--text-primary)]">Nova Peça / Arte de Comunicação</h3>

            <div className="space-y-3">
              <Input
                label="Título da Peça ou Arte"
                value={formPeca.titulo_peca}
                onChange={(e) => setFormPeca({ ...formPeca, titulo_peca: e.target.value })}
                placeholder="Ex: Post de Lançamento da Oficina, Banner Impresso..."
              />

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Tipo de Mídia"
                  value={formPeca.tipo_midia}
                  onChange={(e: any) => setFormPeca({ ...formPeca, tipo_midia: e.target.value })}
                >
                  <option value="post_instagram">Post Instagram</option>
                  <option value="video_reels">Vídeo / Reels</option>
                  <option value="story">Story</option>
                  <option value="banner">Banner</option>
                  <option value="cartaz">Cartaz Impresso</option>
                  <option value="outro">Outro</option>
                </Select>

                <Select
                  label="Canal de Divulgação"
                  value={formPeca.canal_divulgacao}
                  onChange={(e: any) => setFormPeca({ ...formPeca, canal_divulgacao: e.target.value })}
                >
                  <option value="Instagram">Instagram</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Site">Site Institucional</option>
                  <option value="Impresso">Material Impresso</option>
                  <option value="Outro">Outro</option>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Prazo de Entrega"
                  type="date"
                  value={formPeca.prazo_entrega || ''}
                  onChange={(e) => setFormPeca({ ...formPeca, prazo_entrega: e.target.value })}
                />
                <Input
                  label="Responsável pela Arte"
                  value={formPeca.responsavel_comunicacao || ''}
                  onChange={(e) => setFormPeca({ ...formPeca, responsavel_comunicacao: e.target.value })}
                  placeholder="Nome do designer/voluntário"
                />
              </div>

              <Input
                label="Link da Mídia / Canva / Google Drive"
                value={formPeca.link_midia || ''}
                onChange={(e) => setFormPeca({ ...formPeca, link_midia: e.target.value })}
                placeholder="https://canva.com/..."
              />

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Observações</label>
                <textarea
                  rows={2}
                  value={formPeca.observacoes || ''}
                  onChange={(e) => setFormPeca({ ...formPeca, observacoes: e.target.value })}
                  placeholder="Especificações de tamanho, paleta de cores ou texto do post..."
                  className="w-full p-2.5 rounded-lg text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button size="sm" variant="ghost" onClick={() => setShowPecaModal(false)}>
                Cancelar
              </Button>
              <Button size="sm" variant="primary" onClick={handleSavePeca} disabled={saving}>
                Salvar Peça
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL IMPRESSÃO TIMBRADA */}
      <PapelTimbradoModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        tituloDocumento="RELATÓRIO DE COMUNICAÇÃO & MÍDIAS DO PROJETO"
        subtituloDocumento={`Data: ${new Date().toLocaleDateString('pt-BR')} | Total de Peças Mapeadas: ${pecas.length}`}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-xs border p-3 rounded bg-slate-50">
            <div>
              <strong>Total de Peças:</strong> {pecas.length}
            </div>
            <div>
              <strong>Beneficiários com Uso de Imagem Autorizado:</strong> {autorizadosCount} de {totalInscritos} ({pctAutorizados}%)
            </div>
          </div>

          <table className="w-full text-left text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="p-2 border border-slate-300 font-bold">Título da Peça</th>
                <th className="p-2 border border-slate-300 font-bold">Tipo & Canal</th>
                <th className="p-2 border border-slate-300 font-bold">Prazo</th>
                <th className="p-2 border border-slate-300 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {pecas.map((peca) => (
                <tr key={peca.id} className="border-b border-slate-200">
                  <td className="p-2 border border-slate-200 font-semibold">{peca.titulo_peca}</td>
                  <td className="p-2 border border-slate-200">
                    {peca.tipo_midia} ({peca.canal_divulgacao})
                  </td>
                  <td className="p-2 border border-slate-200">
                    {peca.prazo_entrega ? new Date(peca.prazo_entrega).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="p-2 border border-slate-200 font-bold uppercase">{peca.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PapelTimbradoModal>
    </div>
  );
}
