'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Reuniao, TopicoPauta, ProjetoResumo, TipoReuniao, ModalidadeReuniao } from '@/types/reuniao';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Video,
  MapPin,
  FolderKanban,
  FileText,
  Users,
} from 'lucide-react';

interface ModalNovaReuniaoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Reuniao>) => Promise<void>;
  initialData?: Reuniao | null;
  projetos: ProjetoResumo[];
  voluntariosSugeridos?: string[];
}

export function ModalNovaReuniao({
  isOpen,
  onClose,
  onSave,
  initialData,
  projetos,
  voluntariosSugeridos = [],
}: ModalNovaReuniaoProps) {
  const isEditing = Boolean(initialData?.id);

  const [titulo, setTitulo] = useState('');
  const [projetoId, setProjetoId] = useState<string>('');
  const [tipo, setTipo] = useState<TipoReuniao>('ordinaria');
  const [modalidade, setModalidade] = useState<ModalidadeReuniao>('presencial');
  const [dataHoraInicio, setDataHoraInicio] = useState('');
  const [dataHoraFim, setDataHoraFim] = useState('');
  const [duracaoMinutos, setDuracaoMinutos] = useState<number>(60);
  const [localReuniao, setLocalReuniao] = useState('Sede do Instituto Ádapo');
  const [linkVirtual, setLinkVirtual] = useState('');
  const [pautasTopicos, setPautasTopicos] = useState<TopicoPauta[]>([]);
  const [novoTopicoTitulo, setNovoTopicoTitulo] = useState('');
  const [novoTopicoTempo, setNovoTopicoTempo] = useState(15);
  const [novoTopicoResp, setNovoTopicoResp] = useState('');
  const [participantes, setParticipantes] = useState<string[]>([]);
  const [novoParticipante, setNovoParticipante] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitulo(initialData.titulo || '');
      setProjetoId(initialData.projeto_id || '');
      setTipo(initialData.tipo || 'ordinaria');
      setModalidade(initialData.modalidade || 'presencial');
      
      const inicio = initialData.data_hora 
        ? new Date(initialData.data_hora).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16);
      setDataHoraInicio(inicio);

      const fim = initialData.horario_fim
        ? new Date(initialData.horario_fim).toISOString().slice(0, 16)
        : '';
      setDataHoraFim(fim);

      setDuracaoMinutos(initialData.duracao_estimada_min || 60);
      setLocalReuniao(initialData.local_reuniao || 'Sede do Instituto Ádapo');
      setLinkVirtual(initialData.link_virtual || '');
      setPautasTopicos(Array.isArray(initialData.pautas_topicos) ? initialData.pautas_topicos : []);
      setParticipantes(Array.isArray(initialData.participantes) ? initialData.participantes : []);
    } else {
      // Valores padrão para nova reunião
      const now = new Date();
      now.setMinutes(0, 0, 0);
      now.setHours(now.getHours() + 1);
      const isoInicio = now.toISOString().slice(0, 16);
      
      const fimDate = new Date(now.getTime() + 60 * 60 * 1000);
      const isoFim = fimDate.toISOString().slice(0, 16);

      setTitulo('');
      setProjetoId('');
      setTipo('ordinaria');
      setModalidade('presencial');
      setDataHoraInicio(isoInicio);
      setDataHoraFim(isoFim);
      setDuracaoMinutos(60);
      setLocalReuniao('Sede do Instituto Ádapo');
      setLinkVirtual('');
      setPautasTopicos([
        { id: '1', titulo: 'Abertura, verificação de quórum e boas-vindas', tempo_estimado_min: 10 },
        { id: '2', titulo: 'Apresentação dos tópicos principais da ordem do dia', tempo_estimado_min: 35 },
        { id: '3', titulo: 'Deliberações, definição de encaminhamentos e encerramento', tempo_estimado_min: 15 },
      ]);
      setParticipantes([]);
    }
  }, [initialData, isOpen]);

  // Recalcular término com base na duração quando data de início muda
  const handleInicioChange = (val: string) => {
    setDataHoraInicio(val);
    if (val && duracaoMinutos) {
      const inicioDate = new Date(val);
      if (!isNaN(inicioDate.getTime())) {
        const fimCalc = new Date(inicioDate.getTime() + duracaoMinutos * 60 * 1000);
        setDataHoraFim(fimCalc.toISOString().slice(0, 16));
      }
    }
  };

  const handleDuracaoChange = (dur: number) => {
    setDuracaoMinutos(dur);
    if (dataHoraInicio && dur > 0) {
      const inicioDate = new Date(dataHoraInicio);
      if (!isNaN(inicioDate.getTime())) {
        const fimCalc = new Date(inicioDate.getTime() + dur * 60 * 1000);
        setDataHoraFim(fimCalc.toISOString().slice(0, 16));
      }
    }
  };

  const handleAddTopico = () => {
    if (!novoTopicoTitulo.trim()) return;
    const novo: TopicoPauta = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      titulo: novoTopicoTitulo.trim(),
      tempo_estimado_min: novoTopicoTempo > 0 ? novoTopicoTempo : 15,
      responsavel: novoTopicoResp.trim() || undefined,
    };
    setPautasTopicos([...pautasTopicos, novo]);
    setNovoTopicoTitulo('');
    setNovoTopicoResp('');
  };

  const handleRemoveTopico = (id: string) => {
    setPautasTopicos(pautasTopicos.filter((t) => t.id !== id));
  };

  const handleAddParticipante = () => {
    if (!novoParticipante.trim()) return;
    if (!participantes.includes(novoParticipante.trim())) {
      setParticipantes([...participantes, novoParticipante.trim()]);
    }
    setNovoParticipante('');
  };

  const handleRemoveParticipante = (nome: string) => {
    setParticipantes(participantes.filter((p) => p !== nome));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      alert('Por favor, informe o título da reunião.');
      return;
    }
    if (!dataHoraInicio) {
      alert('Por favor, defina a data e horário de início.');
      return;
    }

    try {
      setSaving(true);
      // Compilar tópicos de pauta em texto resumido para retrocompatibilidade
      const pautaTextoCompilada = pautasTopicos
        .map((t, idx) => `${idx + 1}. ${t.titulo}${t.tempo_estimado_min ? ` (${t.tempo_estimado_min} min)` : ''}${t.responsavel ? ` - Resp: ${t.responsavel}` : ''}`)
        .join('\n');

      const payload: Partial<Reuniao> = {
        titulo: titulo.trim(),
        projeto_id: projetoId ? projetoId : null,
        tipo,
        modalidade,
        data_hora: new Date(dataHoraInicio).toISOString(),
        horario_fim: dataHoraFim ? new Date(dataHoraFim).toISOString() : undefined,
        duracao_estimada_min: duracaoMinutos,
        local_reuniao: modalidade === 'online' ? 'Ambiente Virtual' : localReuniao.trim(),
        link_virtual: modalidade !== 'presencial' ? linkVirtual.trim() : undefined,
        pauta: pautaTextoCompilada,
        pautas_topicos: pautasTopicos,
        participantes,
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar reunião:', err);
      alert('Ocorreu um erro ao salvar a reunião. Verifique os dados e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <Card className="w-full max-w-2xl p-6 space-y-6 my-8 max-h-[90vh] flex flex-col bg-[var(--bg-elevated)] border-[var(--border-default)] shadow-2xl">
        {/* Header do Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[var(--text-primary)]">
                {isEditing ? 'Editar Reunião' : 'Agendar Nova Reunião'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Preencha os horários, projeto vinculado e pautas a serem discutidas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário com Scroll Interno */}
        <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto pr-1 flex-1">
          {/* Título */}
          <Input
            label="Título da Reunião *"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Alinhamento Semanal do Projeto Canto das Letras"
            required
          />

          {/* Vínculo de Projeto e Tipo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                Vínculo a Projeto Social
              </label>
              <select
                value={projetoId}
                onChange={(e) => setProjetoId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
              >
                <option value="">🏢 Institucional Geral (Diretoria / Coordenação Geral)</option>
                {projetos.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    🌱 Projeto: {proj.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Tipo de Reunião
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoReuniao)}
                className="w-full px-3 py-2 text-sm bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
              >
                <option value="ordinaria">Ordinária</option>
                <option value="extraordinaria">Extraordinária</option>
                <option value="alinhamento_projeto">Alinhamento de Projeto</option>
                <option value="diretoria">Reunião de Diretoria</option>
                <option value="assembleia">Assembleia Geral</option>
                <option value="conselho">Conselho Fiscal / Deliberativo</option>
                <option value="planejamento">Planejamento Estratégico</option>
              </select>
            </div>
          </div>

          {/* Modalidade e Horários */}
          <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[var(--color-primary)]" />
                Data, Horários e Modalidade
              </label>
              
              {/* Seletor de Modalidade */}
              <div className="flex items-center gap-1 bg-[var(--bg-elevated)] p-1 rounded-lg border border-[var(--border-default)]">
                {(['presencial', 'online', 'hibrida'] as ModalidadeReuniao[]).map((mod) => (
                  <button
                    key={mod}
                    type="button"
                    onClick={() => setModalidade(mod)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all capitalize ${
                      modalidade === mod
                        ? 'bg-[var(--color-primary)] text-white shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {mod === 'hibrida' ? 'Híbrida' : mod}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Início *"
                type="datetime-local"
                value={dataHoraInicio}
                onChange={(e) => handleInicioChange(e.target.value)}
                required
              />

              <Input
                label="Previsão de Término"
                type="datetime-local"
                value={dataHoraFim}
                onChange={(e) => setDataHoraFim(e.target.value)}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Duração Estimada
                </label>
                <select
                  value={duracaoMinutos}
                  onChange={(e) => handleDuracaoChange(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>1 hora (60 min)</option>
                  <option value={90}>1h 30 min (90 min)</option>
                  <option value={120}>2 horas (120 min)</option>
                  <option value={180}>3 horas</option>
                </select>
              </div>
            </div>

            {/* Local Físico ou Link Virtual */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {modalidade !== 'online' && (
                <Input
                  label="Local Físico"
                  value={localReuniao}
                  onChange={(e) => setLocalReuniao(e.target.value)}
                  placeholder="Ex: Sede do Instituto Ádapo - Sala 2"
                />
              )}

              {modalidade !== 'presencial' && (
                <div className={modalidade === 'online' ? 'sm:col-span-2' : ''}>
                  <Input
                    label="Link da Sala Virtual (Meet / Zoom / Teams)"
                    value={linkVirtual}
                    onChange={(e) => setLinkVirtual(e.target.value)}
                    placeholder="https://meet.google.com/xyz-abcd-jkl"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Tópicos de Pauta Estruturados */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[var(--color-primary)]" />
                Pautas da Reunião ({pautasTopicos.length})
              </label>
              <span className="text-[11px] text-[var(--text-muted)]">
                Defina os tópicos a serem deliberados
              </span>
            </div>

            {/* Lista dos tópicos adicionados */}
            <div className="space-y-2">
              {pautasTopicos.map((topico, idx) => (
                <div
                  key={topico.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-xs text-[var(--text-primary)]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center font-bold text-[11px] shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-semibold truncate">{topico.titulo}</span>
                    {topico.tempo_estimado_min && (
                      <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded shrink-0">
                        {topico.tempo_estimado_min} min
                      </span>
                    )}
                    {topico.responsavel && (
                      <span className="text-[10px] text-purple-500 bg-purple-500/10 px-1.5 py-0.5 rounded shrink-0">
                        Resp: {topico.responsavel}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTopico(topico.id)}
                    className="text-[var(--text-muted)] hover:text-red-500 p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Adicionar novo tópico */}
            <div className="p-3 rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-7">
                  <input
                    type="text"
                    placeholder="Adicionar novo tópico de pauta..."
                    value={novoTopicoTitulo}
                    onChange={(e) => setNovoTopicoTitulo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTopico();
                      }
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    min={5}
                    step={5}
                    placeholder="Minutos"
                    value={novoTopicoTempo}
                    onChange={(e) => setNovoTopicoTempo(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div className="sm:col-span-3 flex gap-2">
                  <input
                    type="text"
                    placeholder="Responsável"
                    value={novoTopicoResp}
                    onChange={(e) => setNovoTopicoResp(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={handleAddTopico}
                    icon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Participantes Convocados */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[var(--color-primary)]" />
              Participantes Convocados
            </label>

            {/* Badges dos participantes */}
            <div className="flex flex-wrap gap-1.5">
              {participantes.map((nome) => (
                <span
                  key={nome}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)]"
                >
                  {nome}
                  <button
                    type="button"
                    onClick={() => handleRemoveParticipante(nome)}
                    className="text-[var(--text-muted)] hover:text-red-500 ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
              {participantes.length === 0 && (
                <span className="text-xs text-[var(--text-muted)] italic">
                  Nenhum participante adicionado ainda.
                </span>
              )}
            </div>

            {/* Input para adicionar participante */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Nome do membro ou voluntário convocado..."
                value={novoParticipante}
                onChange={(e) => setNovoParticipante(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddParticipante();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleAddParticipante}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Convidar
              </Button>
            </div>
          </div>

          {/* Botões do Rodapé */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-default)]">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={saving}>
              {saving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Confirmar Agendamento'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
