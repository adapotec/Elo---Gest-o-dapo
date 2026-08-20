'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { PapelTimbradoModal } from '@/components/ui/PapelTimbradoModal';
import {
  Landmark,
  Plus,
  Calendar,
  Clock,
  Users,
  FileText,
  Save,
  Trash2,
  Printer,
  CheckCircle,
  MapPin,
  ClipboardList,
} from 'lucide-react';

interface Reuniao {
  id?: string;
  titulo: string;
  data_hora: string;
  tipo: 'ordinaria' | 'extraordinaria' | 'assembleia' | 'conselho' | 'planejamento';
  local_reuniao: string;
  pauta: string;
  ata: string;
  participantes: string[];
  status: 'agendada' | 'em_andamento' | 'concluida' | 'cancelada';
}

export default function InstitucionalPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('todos');

  // Modal Nova Reunião
  const [showModal, setShowModal] = useState(false);
  const [formReuniao, setFormReuniao] = useState<Reuniao>({
    titulo: '',
    data_hora: new Date().toISOString().slice(0, 16),
    tipo: 'ordinaria',
    local_reuniao: 'Sede do Instituto Ádapo',
    pauta: '',
    ata: '',
    participantes: [],
    status: 'agendada',
  });

  // Reunião selecionada para edição da ATA
  const [selectedReuniao, setSelectedReuniao] = useState<Reuniao | null>(null);
  const [editingAta, setEditingAta] = useState(false);
  const [ataText, setAtaText] = useState('');

  // Modal de Impressão
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from('reunioes_institucional')
        .select('*')
        .order('data_hora', { ascending: false });

      if (error) {
        console.error('Erro ao buscar reunioes_institucional:', error.message || error);
        setReunioes([]);
      } else {
        setReunioes(
          (data || []).map((r: any) => ({
            ...r,
            participantes: Array.isArray(r.participantes) ? r.participantes : [],
          }))
        );
      }
    } catch (err: any) {
      console.error('Erro ao carregar reuniões:', err?.message || err);
      setReunioes([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveReuniao() {
    if (!formReuniao.titulo) return alert('Preencha o título da reunião.');
    try {
      setSaving(true);
      const supabase = createClient();

      const { error } = await supabase.from('reunioes_institucional').insert([
        {
          ...formReuniao,
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      setShowModal(false);
      setFormReuniao({
        titulo: '',
        data_hora: new Date().toISOString().slice(0, 16),
        tipo: 'ordinaria',
        local_reuniao: 'Sede do Instituto Ádapo',
        pauta: '',
        ata: '',
        participantes: [],
        status: 'agendada',
      });
      loadData();
    } catch (err) {
      console.error('Erro ao salvar reunião:', err);
      alert('Erro ao salvar reunião.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAta() {
    if (!selectedReuniao?.id) return;
    try {
      setSaving(true);
      const supabase = createClient();
      await supabase
        .from('reunioes_institucional')
        .update({ ata: ataText, status: 'concluida', updated_at: new Date().toISOString() })
        .eq('id', selectedReuniao.id);

      setEditingAta(false);
      loadData();
    } catch (err) {
      console.error('Erro ao salvar ata:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveReuniao(id: string) {
    if (!confirm('Deseja excluir esta reunião?')) return;
    try {
      const supabase = createClient();
      await supabase.from('reunioes_institucional').delete().eq('id', id);
      if (selectedReuniao?.id === id) setSelectedReuniao(null);
      loadData();
    } catch (err) {
      console.error('Erro ao excluir reunião:', err);
    }
  }

  const filteredReunioes = reunioes.filter((r) => {
    if (filterStatus === 'todos') return true;
    return r.status === filterStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'concluida':
        return <Badge variant="success">CONCLUÍDA</Badge>;
      case 'em_andamento':
        return <Badge variant="warning">EM ANDAMENTO</Badge>;
      case 'agendada':
        return <Badge variant="purple">AGENDADA</Badge>;
      case 'cancelada':
      default:
        return <Badge variant="danger">CANCELADA</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'extraordinaria':
        return <Badge variant="warning">EXTRAORDINÁRIA</Badge>;
      case 'assembleia':
        return <Badge variant="purple">ASSEMBLEIA</Badge>;
      case 'conselho':
        return <Badge variant="neutral">CONSELHO</Badge>;
      case 'planejamento':
        return <Badge variant="primary">PLANEJAMENTO</Badge>;
      case 'ordinaria':
      default:
        return <Badge variant="neutral">ORDINÁRIA</Badge>;
    }
  };

  const reunioesAgendadas = reunioes.filter((r) => r.status === 'agendada').length;
  const reunioesConcluidas = reunioes.filter((r) => r.status === 'concluida').length;

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Gestão Institucional"
        subtitle="Reuniões, Pautas, Atas e Processos Administrativos do Instituto Ádapo"
        action={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowModal(true)}
          >
            Nova Reunião
          </Button>
        }
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl space-y-6 flex-1 overflow-y-auto">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 flex items-center gap-4 border-l-4 border-l-[#F2632D]">
            <div className="p-3 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Total de Reuniões</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{reunioes.length}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4 border-l-4 border-l-purple-500">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Agendadas</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{reunioesAgendadas}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4 border-l-4 border-l-emerald-500">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Concluídas (com Ata)</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{reunioesConcluidas}</p>
            </div>
          </Card>
        </div>

        {/* LAYOUT MASTER-DETAIL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LISTA DE REUNIÕES */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-default)]">
                <h3 className="font-bold text-sm text-[var(--text-primary)]">Reuniões ({filteredReunioes.length})</h3>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-xs w-32"
                >
                  <option value="todos">Todos</option>
                  <option value="agendada">Agendadas</option>
                  <option value="concluida">Concluídas</option>
                  <option value="cancelada">Canceladas</option>
                </Select>
              </div>

              {filteredReunioes.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-default)] rounded-xl">
                  Nenhuma reunião cadastrada.
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {filteredReunioes.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSelectedReuniao(r);
                        setAtaText(r.ata || '');
                        setEditingAta(false);
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-colors ${
                        selectedReuniao?.id === r.id
                          ? 'bg-[var(--color-primary-soft)] border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]'
                          : 'bg-[var(--bg-secondary)] border-[var(--border-default)] hover:bg-[var(--bg-elevated)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-[var(--text-primary)] truncate">{r.titulo}</p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--text-muted)]">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(r.data_hora).toLocaleDateString('pt-BR')} •{' '}
                              {new Date(r.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        {getStatusBadge(r.status)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* DETALHE DA REUNIÃO SELECIONADA */}
          <div className="lg:col-span-2">
            {!selectedReuniao ? (
              <Card className="p-12 text-center space-y-4">
                <Landmark className="w-12 h-12 mx-auto text-[var(--text-muted)] opacity-50" />
                <div>
                  <h3 className="font-bold text-lg text-[var(--text-primary)]">Selecione uma Reunião</h3>
                  <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto mt-1">
                    Clique em uma reunião da lista para visualizar seus detalhes, pauta, ata e participantes.
                  </p>
                </div>
              </Card>
            ) : (
              <Card className="p-6 space-y-6 border-l-4 border-l-[#F2632D]">
                {/* Header da Reunião */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
                  <div>
                    <h2 className="font-bold text-lg text-[var(--text-primary)]">{selectedReuniao.titulo}</h2>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {getTipoBadge(selectedReuniao.tipo)}
                      {getStatusBadge(selectedReuniao.status)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setShowPrintModal(true);
                      }}
                      icon={<Printer className="w-4 h-4 text-[#F2632D]" />}
                    >
                      Imprimir Ata
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleRemoveReuniao(selectedReuniao.id!)}
                      icon={<Trash2 className="w-4 h-4" />}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>

                {/* Metadados */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[var(--text-secondary)]">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
                    <div>
                      <p className="font-semibold">Data & Horário</p>
                      <p>
                        {new Date(selectedReuniao.data_hora).toLocaleDateString('pt-BR', {
                          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                        })} às {new Date(selectedReuniao.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[var(--text-muted)]" />
                    <div>
                      <p className="font-semibold">Local</p>
                      <p>{selectedReuniao.local_reuniao || 'Não informado'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[var(--text-muted)]" />
                    <div>
                      <p className="font-semibold">Participantes</p>
                      <p>{selectedReuniao.participantes.length > 0 ? selectedReuniao.participantes.join(', ') : 'Não informado'}</p>
                    </div>
                  </div>
                </div>

                {/* Pauta */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-[#F2632D]" />
                    Pauta da Reunião
                  </h4>
                  <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] whitespace-pre-line min-h-[60px]">
                    {selectedReuniao.pauta || 'Pauta não preenchida.'}
                  </div>
                </div>

                {/* Ata */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-500" />
                      Ata da Reunião
                    </h4>
                    {!editingAta ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditingAta(true);
                          setAtaText(selectedReuniao.ata || '');
                        }}
                      >
                        {selectedReuniao.ata ? 'Editar Ata' : 'Redigir Ata'}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleSaveAta}
                        disabled={saving}
                        icon={<Save className="w-4 h-4" />}
                      >
                        {saving ? 'Salvando...' : 'Salvar Ata & Concluir'}
                      </Button>
                    )}
                  </div>

                  {editingAta ? (
                    <textarea
                      rows={10}
                      value={ataText}
                      onChange={(e) => setAtaText(e.target.value)}
                      placeholder="Redija a ata da reunião aqui... Inclua deliberações, encaminhamentos e responsáveis."
                      className="w-full p-4 rounded-xl text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[#F2632D]"
                    />
                  ) : (
                    <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] whitespace-pre-line min-h-[60px]">
                      {selectedReuniao.ata || 'Ata não redigida. Clique em "Redigir Ata" após a reunião.'}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* MODAL NOVA REUNIÃO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 space-y-4">
            <h3 className="font-bold text-base text-[var(--text-primary)]">Agendar Nova Reunião Institucional</h3>

            <div className="space-y-3">
              <Input
                label="Título da Reunião"
                value={formReuniao.titulo}
                onChange={(e) => setFormReuniao({ ...formReuniao, titulo: e.target.value })}
                placeholder="Ex: Reunião Ordinária de Diretoria - Agosto/2026"
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Data e Horário"
                  type="datetime-local"
                  value={formReuniao.data_hora}
                  onChange={(e) => setFormReuniao({ ...formReuniao, data_hora: e.target.value })}
                />

                <Select
                  label="Tipo de Reunião"
                  value={formReuniao.tipo}
                  onChange={(e: any) => setFormReuniao({ ...formReuniao, tipo: e.target.value })}
                >
                  <option value="ordinaria">Ordinária</option>
                  <option value="extraordinaria">Extraordinária</option>
                  <option value="assembleia">Assembleia Geral</option>
                  <option value="conselho">Conselho Fiscal / Administrativo</option>
                  <option value="planejamento">Planejamento Estratégico</option>
                </Select>
              </div>

              <Input
                label="Local"
                value={formReuniao.local_reuniao}
                onChange={(e) => setFormReuniao({ ...formReuniao, local_reuniao: e.target.value })}
                placeholder="Ex: Sede do Instituto Ádapo, Sala Virtual, etc."
              />

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Pauta (Tópicos a Discutir)</label>
                <textarea
                  rows={4}
                  value={formReuniao.pauta}
                  onChange={(e) => setFormReuniao({ ...formReuniao, pauta: e.target.value })}
                  placeholder={"1. Abertura e verificação de quórum\n2. Aprovação da ata anterior\n3. ...\n4. Encaminhamentos e encerramento"}
                  className="w-full p-2.5 rounded-lg text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button size="sm" variant="ghost" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button size="sm" variant="primary" onClick={handleSaveReuniao} disabled={saving}>
                Agendar Reunião
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL IMPRESSÃO ATA EM PAPEL TIMBRADO */}
      <PapelTimbradoModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        tituloDocumento={`ATA DE REUNIÃO ${selectedReuniao?.tipo?.toUpperCase() || ''}`}
        subtituloDocumento={selectedReuniao ? `${selectedReuniao.titulo} | ${new Date(selectedReuniao.data_hora).toLocaleDateString('pt-BR')}` : ''}
      >
        {selectedReuniao && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-xs border p-3 rounded bg-slate-50">
              <div><strong>Reunião:</strong> {selectedReuniao.titulo}</div>
              <div><strong>Tipo:</strong> {selectedReuniao.tipo?.toUpperCase()}</div>
              <div><strong>Data:</strong> {new Date(selectedReuniao.data_hora).toLocaleDateString('pt-BR')}</div>
              <div><strong>Horário:</strong> {new Date(selectedReuniao.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
              <div><strong>Local:</strong> {selectedReuniao.local_reuniao || '-'}</div>
              <div>
                <strong>Participantes:</strong>{' '}
                {selectedReuniao.participantes.length > 0 ? selectedReuniao.participantes.join(', ') : 'Não informado'}
              </div>
            </div>

            <section>
              <h4 className="font-bold text-xs uppercase text-[#F2632D] border-b pb-1">Pauta</h4>
              <p className="mt-1 whitespace-pre-line text-sm">{selectedReuniao.pauta || 'Não preenchida.'}</p>
            </section>

            <section>
              <h4 className="font-bold text-xs uppercase text-emerald-600 border-b pb-1">Ata da Reunião</h4>
              <p className="mt-1 whitespace-pre-line text-sm">{selectedReuniao.ata || 'Ata não redigida.'}</p>
            </section>

            <div className="pt-8 grid grid-cols-2 gap-8 text-xs text-center">
              <div className="border-t border-slate-400 pt-2">
                <p className="font-semibold">Presidente / Coordenador</p>
                <p className="text-slate-500">Assinatura</p>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <p className="font-semibold">Secretário(a) da Reunião</p>
                <p className="text-slate-500">Assinatura</p>
              </div>
            </div>
          </div>
        )}
      </PapelTimbradoModal>
    </div>
  );
}
