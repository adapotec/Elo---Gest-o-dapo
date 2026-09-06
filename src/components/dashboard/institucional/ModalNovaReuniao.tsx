'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
  AlertCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface ModalNovaReuniaoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Reuniao>) => Promise<void>;
  initialData?: Reuniao | null;
  projetos: ProjetoResumo[];
  voluntariosSugeridos?: string[];
}

/**
 * Converte um objeto Date em string no formato local "YYYY-MM-DDTHH:mm",
 * evitando o skew de fuso horário gerado por .toISOString()
 */
function formatLocalDatetime(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}`;
}

/**
 * Converte string local "YYYY-MM-DDTHH:mm" para Date local preciso
 */
function parseLocalDatetime(str: string): Date | null {
  if (!str) return null;
  const parts = str.split('T');
  if (parts.length !== 2) return null;
  const [datePart, timePart] = parts;
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  if (
    isNaN(year) ||
    isNaN(month) ||
    isNaN(day) ||
    isNaN(hours) ||
    isNaN(minutes)
  ) {
    return null;
  }
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

/**
 * Formatação amigável de duração em minutos (ex: 90 -> "1h 30min")
 */
function formatDurationHuman(minutos: number): string {
  if (minutos <= 0) return '0 min';
  const horas = Math.floor(minutos / 60);
  const rest = minutos % 60;
  if (horas === 0) return `${rest} min`;
  if (rest === 0) return `${horas}h`;
  return `${horas}h ${rest}min`;
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

  // Estados do formulário
  const [titulo, setTitulo] = useState('');
  const [projetoId, setProjetoId] = useState<string>('');
  const [tipo, setTipo] = useState<TipoReuniao>('ordinaria');
  const [modalidade, setModalidade] = useState<ModalidadeReuniao>('presencial');

  // Horários e Duração
  const [dataHoraInicio, setDataHoraInicio] = useState('');
  const [dataHoraFim, setDataHoraFim] = useState('');
  const [duracaoMinutos, setDuracaoMinutos] = useState<number>(60);

  const [localReuniao, setLocalReuniao] = useState('Sede do Instituto Ádapo');
  const [linkVirtual, setLinkVirtual] = useState('');

  // Pautas
  const [pautasTopicos, setPautasTopicos] = useState<TopicoPauta[]>([]);
  const [novoTopicoTitulo, setNovoTopicoTitulo] = useState('');
  const [novoTopicoTempo, setNovoTopicoTempo] = useState<number>(15);
  const [novoTopicoResp, setNovoTopicoResp] = useState('');

  // Participantes
  const [participantes, setParticipantes] = useState<string[]>([]);
  const [novoParticipante, setNovoParticipante] = useState('');

  const [saving, setSaving] = useState(false);

  // Inicialização ao abrir ou receber dados
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setTitulo(initialData.titulo || '');
      setProjetoId(initialData.projeto_id || '');
      setTipo(initialData.tipo || 'ordinaria');
      setModalidade(initialData.modalidade || 'presencial');

      // Converter data_hora inicial para formato local
      const dInicio = initialData.data_hora
        ? new Date(initialData.data_hora)
        : new Date();
      setDataHoraInicio(formatLocalDatetime(dInicio));

      // Duração e Fim
      let dur = initialData.duracao_estimada_min || 60;
      if (initialData.horario_fim) {
        const dFim = new Date(initialData.horario_fim);
        setDataHoraFim(formatLocalDatetime(dFim));
        const diff = Math.round((dFim.getTime() - dInicio.getTime()) / 60000);
        if (diff > 0) dur = diff;
      } else {
        const dFim = new Date(dInicio.getTime() + dur * 60000);
        setDataHoraFim(formatLocalDatetime(dFim));
      }
      setDuracaoMinutos(dur);

      setLocalReuniao(initialData.local_reuniao || 'Sede do Instituto Ádapo');
      setLinkVirtual(initialData.link_virtual || '');
      setPautasTopicos(
        Array.isArray(initialData.pautas_topicos)
          ? initialData.pautas_topicos
          : []
      );
      setParticipantes(
        Array.isArray(initialData.participantes)
          ? initialData.participantes
          : []
      );
    } else {
      // Nova Reunião: define início na próxima hora cheia
      const now = new Date();
      now.setMinutes(0, 0, 0);
      now.setHours(now.getHours() + 1);

      const durInicial = 60;
      const fimDate = new Date(now.getTime() + durInicial * 60000);

      setTitulo('');
      setProjetoId('');
      setTipo('ordinaria');
      setModalidade('presencial');
      setDataHoraInicio(formatLocalDatetime(now));
      setDataHoraFim(formatLocalDatetime(fimDate));
      setDuracaoMinutos(durInicial);
      setLocalReuniao('Sede do Instituto Ádapo');
      setLinkVirtual('');

      // Pautas padrão sugeridas que somam exatamente 60 min
      setPautasTopicos([
        {
          id: '1',
          titulo: 'Abertura, verificação de quórum e informes gerais',
          tempo_estimado_min: 10,
        },
        {
          id: '2',
          titulo: 'Apresentação dos tópicos principais e pautas de trabalho',
          tempo_estimado_min: 35,
        },
        {
          id: '3',
          titulo: 'Deliberações, definição de responsáveis e encerramento',
          tempo_estimado_min: 15,
        },
      ]);
      setParticipantes([]);
    }
  }, [initialData, isOpen]);

  // Soma de minutos de todas as pautas cadastradas
  const tempoTotalPautas = useMemo(() => {
    return pautasTopicos.reduce(
      (acc, t) => acc + (Number(t.tempo_estimado_min) || 0),
      0
    );
  }, [pautasTopicos]);

  // Alteração de Data/Hora de Início
  const handleInicioChange = (val: string) => {
    setDataHoraInicio(val);
    const dInicio = parseLocalDatetime(val);
    if (!dInicio) return;

    // Recalcula o término mantendo a duração atual
    const novoFim = new Date(dInicio.getTime() + duracaoMinutos * 60000);
    setDataHoraFim(formatLocalDatetime(novoFim));
  };

  // Alteração de Data/Hora de Término (calcula a duração dinamicamente)
  const handleFimChange = (val: string) => {
    setDataHoraFim(val);
    const dInicio = parseLocalDatetime(dataHoraInicio);
    const dFim = parseLocalDatetime(val);

    if (dInicio && dFim) {
      const diffMin = Math.round((dFim.getTime() - dInicio.getTime()) / 60000);
      if (diffMin > 0) {
        setDuracaoMinutos(diffMin);
      }
    }
  };

  // Seleção rápida de duração em minutos (recalcula o término)
  const handleSetDuracao = (minutos: number) => {
    setDuracaoMinutos(minutos);
    const dInicio = parseLocalDatetime(dataHoraInicio);
    if (dInicio) {
      const novoFim = new Date(dInicio.getTime() + minutos * 60000);
      setDataHoraFim(formatLocalDatetime(novoFim));
    }
  };

  // Sincronizar duração da reunião com a soma das pautas
  const handleSincronizarComPautas = () => {
    if (tempoTotalPautas <= 0) return;
    handleSetDuracao(tempoTotalPautas);
  };

  // Adicionar tópico de pauta
  const handleAddTopico = () => {
    if (!novoTopicoTitulo.trim()) return;
    const tempo = Number(novoTopicoTempo) > 0 ? Number(novoTopicoTempo) : 15;
    const novo: TopicoPauta = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      titulo: novoTopicoTitulo.trim(),
      tempo_estimado_min: tempo,
      responsavel: novoTopicoResp.trim() || undefined,
    };
    setPautasTopicos((prev) => [...prev, novo]);
    setNovoTopicoTitulo('');
    setNovoTopicoResp('');
    setNovoTopicoTempo(15);
  };

  // Remover tópico
  const handleRemoveTopico = (id: string) => {
    setPautasTopicos((prev) => prev.filter((t) => t.id !== id));
  };

  // Adicionar participante
  const handleAddParticipante = () => {
    if (!novoParticipante.trim()) return;
    const nome = novoParticipante.trim();
    if (!participantes.includes(nome)) {
      setParticipantes((prev) => [...prev, nome]);
    }
    setNovoParticipante('');
  };

  // Remover participante
  const handleRemoveParticipante = (nome: string) => {
    setParticipantes((prev) => prev.filter((p) => p !== nome));
  };

  // Submissão
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo.trim()) {
      alert('Por favor, informe o título da reunião.');
      return;
    }

    const dInicio = parseLocalDatetime(dataHoraInicio);
    if (!dInicio) {
      alert('Por favor, informe uma data e horário de início válidos.');
      return;
    }

    const dFim = parseLocalDatetime(dataHoraFim);
    if (dFim && dFim.getTime() <= dInicio.getTime()) {
      alert('O horário de término deve ser posterior ao horário de início.');
      return;
    }

    try {
      setSaving(true);

      const pautaTextoCompilada = pautasTopicos
        .map(
          (t, idx) =>
            `${idx + 1}. ${t.titulo}${
              t.tempo_estimado_min ? ` (${t.tempo_estimado_min} min)` : ''
            }${t.responsavel ? ` - Relator: ${t.responsavel}` : ''}`
        )
        .join('\n');

      const payload: Partial<Reuniao> = {
        titulo: titulo.trim(),
        projeto_id: projetoId ? projetoId : null,
        tipo,
        modalidade,
        data_hora: dInicio.toISOString(),
        horario_fim: dFim ? dFim.toISOString() : undefined,
        duracao_estimada_min: duracaoMinutos,
        local_reuniao:
          modalidade === 'online' ? 'Ambiente Virtual' : localReuniao.trim(),
        link_virtual:
          modalidade !== 'presencial' ? linkVirtual.trim() : undefined,
        pauta: pautaTextoCompilada,
        pautas_topicos: pautasTopicos,
        participantes,
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar reunião:', err);
      alert('Erro ao salvar reunião. Verifique os dados e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      {/* Container do Modal sem usar Card para evitar bugs de layout aninhado */}
      <div className="relative w-full max-w-3xl bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Fixo */}
        <div className="shrink-0 px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-elevated)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[var(--text-primary)] leading-tight">
                {isEditing ? 'Editar Reunião' : 'Agendar Nova Reunião'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Defina horários, pautas, participantes e vínculo a projetos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-xl transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário com Scroll Interno Limpo */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-6"
        >
          {/* SEÇÃO 1: IDENTIFICAÇÃO BÁSICA */}
          <div className="space-y-4">
            <Input
              label="Título da Reunião *"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Alinhamento Estratégico do Projeto Canto das Letras"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                  <FolderKanban className="w-4 h-4 text-[var(--color-primary)]" />
                  Vínculo a Projeto Social
                </label>
                <select
                  value={projetoId}
                  onChange={(e) => setProjetoId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-default)] transition-colors focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)] cursor-pointer"
                >
                  <option value="">
                    Institucional Geral (Diretoria / Coordenação Geral)
                  </option>
                  {projetos.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      Projeto: {proj.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  Tipo de Reunião
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoReuniao)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-default)] transition-colors focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)] cursor-pointer"
                >
                  <option value="ordinaria">Ordinária</option>
                  <option value="extraordinaria">Extraordinária</option>
                  <option value="alinhamento_projeto">
                    Alinhamento de Projeto
                  </option>
                  <option value="diretoria">Reunião de Diretoria</option>
                  <option value="assembleia">Assembleia Geral</option>
                  <option value="conselho">
                    Conselho Fiscal / Deliberativo
                  </option>
                  <option value="planejamento">Planejamento Estratégico</option>
                </select>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: PROGRAMAÇÃO, HORÁRIOS & DURAÇÃO */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--color-primary)]" />
                Data, Horários e Modalidade
              </span>

              {/* Seletor de Modalidade (Pills) */}
              <div className="flex items-center gap-1 bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border-default)] self-start sm:self-auto">
                {(['presencial', 'online', 'hibrida'] as ModalidadeReuniao[]).map(
                  (mod) => (
                    <button
                      key={mod}
                      type="button"
                      onClick={() => setModalidade(mod)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all capitalize cursor-pointer ${
                        modalidade === mod
                          ? 'bg-[var(--color-primary)] text-white shadow-xs'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {mod === 'hibrida' ? 'Híbrida' : mod}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Início e Término em 2 colunas amplas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Data e Horário de Início *"
                type="datetime-local"
                value={dataHoraInicio}
                onChange={(e) => handleInicioChange(e.target.value)}
                required
              />

              <Input
                label="Previsão de Término *"
                type="datetime-local"
                value={dataHoraFim}
                onChange={(e) => handleFimChange(e.target.value)}
                required
              />
            </div>

            {/* Faixa de Duração com Cálculo Dinâmico e Botões Rápidos */}
            <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-secondary)]">
                  Duração Calculada:
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[var(--color-primary-soft)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                  {formatDurationHuman(duracaoMinutos)} ({duracaoMinutos} min)
                </span>
              </div>

              {/* Botões de atalho para definir duração */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-[var(--text-muted)] mr-1">
                  Atalhos:
                </span>
                {[30, 45, 60, 90, 120, 180].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleSetDuracao(mins)}
                    className={`px-2 py-1 text-[11px] font-medium rounded-lg border transition-all cursor-pointer ${
                      duracaoMinutos === mins
                        ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                        : 'bg-[var(--bg-secondary)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--color-primary)]'
                    }`}
                  >
                    {formatDurationHuman(mins)}
                  </button>
                ))}
              </div>
            </div>

            {/* Local Físico ou Link Virtual conforme a modalidade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {modalidade !== 'online' && (
                <Input
                  label="Local Físico da Reunião"
                  value={localReuniao}
                  onChange={(e) => setLocalReuniao(e.target.value)}
                  placeholder="Ex: Sede do Instituto Ádapo - Sala de Reuniões"
                />
              )}

              {modalidade !== 'presencial' && (
                <div className={modalidade === 'online' ? 'sm:col-span-2' : ''}>
                  <Input
                    label="Link da Sala Virtual (Google Meet / Zoom / Teams)"
                    value={linkVirtual}
                    onChange={(e) => setLinkVirtual(e.target.value)}
                    placeholder="https://meet.google.com/xyz-abcd-jkl"
                  />
                </div>
              )}
            </div>
          </div>

          {/* SEÇÃO 3: ORDEM DO DIA (PAUTAS E CONTROLE DE TEMPO) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--color-primary)]" />
                  Pautas da Reunião ({pautasTopicos.length})
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  Tempo total estimado das pautas:{' '}
                  <strong className="text-[var(--text-primary)]">
                    {formatDurationHuman(tempoTotalPautas)}
                  </strong>
                </span>
              </div>

              {/* Botão de ajuste quando a soma das pautas difere da duração da reunião */}
              {tempoTotalPautas > 0 && tempoTotalPautas !== duracaoMinutos && (
                <button
                  type="button"
                  onClick={handleSincronizarComPautas}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all cursor-pointer self-start sm:self-auto"
                  title="Ajustar horário de término para corresponder à soma dos tópicos"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Ajustar reunião para {formatDurationHuman(tempoTotalPautas)}
                </button>
              )}
            </div>

            {/* Lista dos tópicos cadastrados */}
            <div className="space-y-2">
              {pautasTopicos.map((topico, idx) => (
                <div
                  key={topico.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] transition-all hover:border-[var(--border-strong)]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center font-bold text-xs shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {topico.titulo}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {topico.tempo_estimado_min || 15} min
                        </span>
                        {topico.responsavel && (
                          <>
                            <span>•</span>
                            <span className="text-purple-600 dark:text-purple-400 font-medium">
                              Relator: {topico.responsavel}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveTopico(topico.id)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Excluir tópico"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {pautasTopicos.length === 0 && (
                <div className="p-4 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-default)] rounded-xl">
                  Nenhum tópico de pauta adicionado. Adicione abaixo para estruturar a ordem do dia.
                </div>
              )}
            </div>

            {/* Card para Adicionar Novo Tópico com Campos Claros e Espaçosos */}
            <div className="p-4 rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] space-y-3">
              <span className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                Adicionar Tópico à Ordem do Dia
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-6 flex flex-col gap-1">
                  <label className="text-[11px] text-[var(--text-muted)] font-medium">
                    Título / Assunto da Pauta *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Prestação de contas e metas do trimestre..."
                    value={novoTopicoTitulo}
                    onChange={(e) => setNovoTopicoTitulo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTopico();
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
                  />
                </div>

                <div className="sm:col-span-3 flex flex-col gap-1">
                  <label className="text-[11px] text-[var(--text-muted)] font-medium">
                    Tempo Previsto
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={5}
                      step={5}
                      value={novoTopicoTempo}
                      onChange={(e) =>
                        setNovoTopicoTempo(Math.max(5, Number(e.target.value)))
                      }
                      className="w-full px-3 py-2 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                    />
                    <span className="text-xs text-[var(--text-muted)] shrink-0">
                      min
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-3 flex flex-col gap-1">
                  <label className="text-[11px] text-[var(--text-muted)] font-medium">
                    Relator (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Nome do relator..."
                    value={novoTopicoResp}
                    onChange={(e) => setNovoTopicoResp(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTopico();
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              {/* Botões de tempo rápido para o novo tópico */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-[var(--text-muted)] mr-1">
                    Duração:
                  </span>
                  {[10, 15, 20, 30, 45].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNovoTopicoTempo(t)}
                      className={`px-2 py-0.5 text-[10px] rounded border transition-colors cursor-pointer ${
                        novoTopicoTempo === t
                          ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                          : 'bg-[var(--bg-secondary)] border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {t}m
                    </button>
                  ))}
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleAddTopico}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Adicionar Pauta
                </Button>
              </div>
            </div>
          </div>

          {/* SEÇÃO 4: PARTICIPANTES CONVOCADOS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--color-primary)]" />
                Participantes Convocados ({participantes.length})
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                Membros notificados para este encontro
              </span>
            </div>

            {/* Badges dos participantes adicionados */}
            <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] min-h-[50px] items-center">
              {participantes.map((nome) => (
                <span
                  key={nome}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] shadow-2xs"
                >
                  {nome}
                  <button
                    type="button"
                    onClick={() => handleRemoveParticipante(nome)}
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Remover"
                  >
                    ×
                  </button>
                </span>
              ))}

              {participantes.length === 0 && (
                <span className="text-xs text-[var(--text-muted)] italic">
                  Nenhum participante nominal cadastrado. Todos os voluntários poderão comparecer.
                </span>
              )}
            </div>

            {/* Input para convidar participante */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nome do membro ou voluntário convidado..."
                value={novoParticipante}
                onChange={(e) => setNovoParticipante(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddParticipante();
                  }
                }}
                className="flex-1 px-3.5 py-2 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
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

          {/* Espaçador inferior para garantir scroll confortável */}
          <div className="h-2" />
        </form>

        {/* Footer Fixo com Resumo & Botões de Ação */}
        <div className="shrink-0 px-6 py-4 border-t border-[var(--border-default)] bg-[var(--bg-secondary)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-[var(--text-muted)] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>
              Previsão:{' '}
              <strong className="text-[var(--text-primary)]">
                {formatDurationHuman(duracaoMinutos)}
              </strong>{' '}
              • Pautas:{' '}
              <strong className="text-[var(--text-primary)]">
                {pautasTopicos.length}
              </strong>
            </span>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving
                ? 'Salvando...'
                : isEditing
                ? 'Salvar Alterações'
                : 'Confirmar Agendamento'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
