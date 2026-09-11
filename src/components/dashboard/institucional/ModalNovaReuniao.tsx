'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import {
  Reuniao,
  TopicoPauta,
  ProjetoResumo,
  TipoReuniao,
  ModalidadeReuniao,
} from '@/types/reuniao';
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
  Sparkles,
  CheckCircle2,
  Search,
  UserCheck,
  UserPlus,
  ListPlus,
  Edit2,
  Check,
  HelpCircle,
} from 'lucide-react';

export interface VoluntarioItem {
  id: string;
  nome_completo: string;
  email?: string;
  telefone?: string;
  avatar_url?: string | null;
  area_atuacao?: string | null;
}

interface ModalNovaReuniaoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Reuniao>) => Promise<void>;
  initialData?: Reuniao | null;
  projetos: ProjetoResumo[];
  voluntarios?: VoluntarioItem[];
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
  voluntarios: voluntariosProp = [],
}: ModalNovaReuniaoProps) {
  const isEditing = Boolean(initialData?.id);

  // Estados do formulário básico
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

  // ── ESTADOS DE PAUTAS ──
  const [pautasTopicos, setPautasTopicos] = useState<TopicoPauta[]>([]);
  const [novoTopicoTitulo, setNovoTopicoTitulo] = useState('');
  const [novoTopicoTempo, setNovoTopicoTempo] = useState<number>(15);
  const [novoTopicoResp, setNovoTopicoResp] = useState('');
  const [modoLotePautas, setModoLotePautas] = useState(false);
  const [textoLotePautas, setTextoLotePautas] = useState('');

  // ── ESTADOS DE PARTICIPANTES ──
  const [participantes, setParticipantes] = useState<string[]>([]);
  const [listaVoluntarios, setListaVoluntarios] = useState<VoluntarioItem[]>(voluntariosProp);
  const [buscaVoluntario, setBuscaVoluntario] = useState('');
  const [abaParticipantes, setAbaParticipantes] = useState<'voluntarios' | 'externo'>('voluntarios');
  const [novoConvidadoExterno, setNovoConvidadoExterno] = useState('');
  const [cargoConvidadoExterno, setCargoConvidadoExterno] = useState('');

  const [saving, setSaving] = useState(false);

  // Carregar voluntários do Supabase se não vierem nas props
  useEffect(() => {
    if (voluntariosProp && voluntariosProp.length > 0) {
      setListaVoluntarios(voluntariosProp);
      return;
    }

    async function fetchVoluntarios() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('voluntarios')
          .select('id, nome_completo, email, telefone, avatar_url, area_atuacao')
          .order('nome_completo');

        if (data) {
          setListaVoluntarios(data);
        }
      } catch (err) {
        console.warn('Erro ao carregar lista de voluntários para convocação:', err);
      }
    }

    if (isOpen) {
      fetchVoluntarios();
    }
  }, [isOpen, voluntariosProp]);

  // Inicialização ao abrir ou receber dados
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setTitulo(initialData.titulo || '');
      setProjetoId(initialData.projeto_id || '');
      setTipo(initialData.tipo || 'ordinaria');
      setModalidade(initialData.modalidade || 'presencial');

      const dInicio = initialData.data_hora
        ? new Date(initialData.data_hora)
        : new Date();
      setDataHoraInicio(formatLocalDatetime(dInicio));

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
        Array.isArray(initialData.pautas_topicos) && initialData.pautas_topicos.length > 0
          ? initialData.pautas_topicos
          : initialData.pauta
          ? converterTextoParaTopicos(initialData.pauta)
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

      // Pautas padrão sugeridas que somam 60 min
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

    setModoLotePautas(false);
    setTextoLotePautas('');
    setBuscaVoluntario('');
    setNovoConvidadoExterno('');
    setCargoConvidadoExterno('');
  }, [initialData, isOpen]);

  // Função auxiliar para converter texto de pauta em tópicos estruturados
  function converterTextoParaTopicos(texto: string): TopicoPauta[] {
    const linhas = texto.split('\n').map((l) => l.trim()).filter(Boolean);
    return linhas.map((linha, idx) => {
      // Tentar extrair minutos ex: "(15 min)"
      let minutos = 15;
      const matchMin = linha.match(/\((\d+)\s*min/i);
      if (matchMin) {
        minutos = Number(matchMin[1]);
      }
      // Limpar numeração inicial ex: "1. Título"
      const limpa = linha.replace(/^\d+[\.\-\)]\s*/, '').replace(/\s*\(\d+\s*min.*$/i, '').trim();
      return {
        id: `topico-${Date.now()}-${idx}`,
        titulo: limpa || linha,
        tempo_estimado_min: minutos,
      };
    });
  }

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
    const novoFim = new Date(dInicio.getTime() + duracaoMinutos * 60000);
    setDataHoraFim(formatLocalDatetime(novoFim));
  };

  // Alteração de Data/Hora de Término
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

  // Seleção rápida de duração
  const handleSetDuracao = (minutos: number) => {
    setDuracaoMinutos(minutos);
    const dInicio = parseLocalDatetime(dataHoraInicio);
    if (dInicio) {
      const novoFim = new Date(dInicio.getTime() + minutos * 60000);
      setDataHoraFim(formatLocalDatetime(novoFim));
    }
  };

  const handleSincronizarComPautas = () => {
    if (tempoTotalPautas <= 0) return;
    handleSetDuracao(tempoTotalPautas);
  };

  // ── MÉTODOS DE PAUTA ──
  const handleAddTopico = () => {
    if (!novoTopicoTitulo.trim()) return;
    const tempo = Number(novoTopicoTempo) > 0 ? Number(novoTopicoTempo) : 15;
    const novo: TopicoPauta = {
      id: crypto.randomUUID ? crypto.randomUUID() : `topico-${Date.now()}`,
      titulo: novoTopicoTitulo.trim(),
      tempo_estimado_min: tempo,
      responsavel: novoTopicoResp.trim() || undefined,
    };
    setPautasTopicos((prev) => [...prev, novo]);
    setNovoTopicoTitulo('');
    setNovoTopicoResp('');
    setNovoTopicoTempo(15);
  };

  const handleAddTopicoPredefinido = (tituloPreset: string, tempoPadrao: number) => {
    const novo: TopicoPauta = {
      id: crypto.randomUUID ? crypto.randomUUID() : `topico-${Date.now()}-${Math.random()}`,
      titulo: tituloPreset,
      tempo_estimado_min: tempoPadrao,
    };
    setPautasTopicos((prev) => [...prev, novo]);
  };

  const handleImportarLotePautas = () => {
    if (!textoLotePautas.trim()) return;
    const novos = converterTextoParaTopicos(textoLotePautas);
    if (novos.length > 0) {
      setPautasTopicos((prev) => [...prev, ...novos]);
      setTextoLotePautas('');
      setModoLotePautas(false);
    }
  };

  const handleAjustarTempoTopico = (id: string, deltaMin: number) => {
    setPautasTopicos((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const atual = t.tempo_estimado_min || 15;
          const novo = Math.max(5, atual + deltaMin);
          return { ...t, tempo_estimado_min: novo };
        }
        return t;
      })
    );
  };

  const handleRemoveTopico = (id: string) => {
    setPautasTopicos((prev) => prev.filter((t) => t.id !== id));
  };

  // ── MÉTODOS DE PARTICIPANTES ──
  const toggleParticipanteVoluntario = (nome: string) => {
    if (participantes.includes(nome)) {
      setParticipantes((prev) => prev.filter((p) => p !== nome));
    } else {
      setParticipantes((prev) => [...prev, nome]);
    }
  };

  const handleSelecionarTodosVoluntarios = () => {
    const nomes = listaVoluntarios.map((v) => v.nome_completo);
    const unificados = Array.from(new Set([...participantes, ...nomes]));
    setParticipantes(unificados);
  };

  const handleAddConvidadoExterno = () => {
    if (!novoConvidadoExterno.trim()) return;
    const nomeLimpo = novoConvidadoExterno.trim();
    const sufixo = cargoConvidadoExterno.trim() ? ` (${cargoConvidadoExterno.trim()})` : '';
    const nomeCompleto = `${nomeLimpo}${sufixo}`;

    if (!participantes.includes(nomeCompleto)) {
      setParticipantes((prev) => [...prev, nomeCompleto]);
    }
    setNovoConvidadoExterno('');
    setCargoConvidadoExterno('');
  };

  const handleRemoveParticipante = (nome: string) => {
    setParticipantes((prev) => prev.filter((p) => p !== nome));
  };

  // Voluntários filtrados pela busca
  const voluntariosFiltrados = useMemo(() => {
    if (!buscaVoluntario.trim()) return listaVoluntarios;
    const query = buscaVoluntario.toLowerCase();
    return listaVoluntarios.filter(
      (v) =>
        v.nome_completo.toLowerCase().includes(query) ||
        v.area_atuacao?.toLowerCase().includes(query) ||
        v.email?.toLowerCase().includes(query)
    );
  }, [listaVoluntarios, buscaVoluntario]);

  // Submissão do Formulário
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

      // Fechamento instantâneo do modal para não travar a experiência do usuário
      onClose();

      await onSave(payload);
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
      <div className="relative w-full max-w-3xl bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header Fixo */}
        <div className="shrink-0 px-5 sm:px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-elevated)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center font-bold shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-[var(--text-primary)] leading-tight">
                {isEditing ? 'Editar Reunião Institucional' : 'Nova Reunião Institucional'}
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-tight">
                Defina horários, pautas estruturadas, participantes e deliberações
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo Rolável */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-6">
          {/* SEÇÃO 1: IDENTIFICAÇÃO & TIPO */}
          <div className="space-y-4">
            <Input
              label="Título da Reunião *"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Alinhamento Estratégico - Dia das Crianças / Conselho"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                  <FolderKanban className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  Vínculo a Projeto Social
                </label>
                <select
                  value={projetoId}
                  onChange={(e) => setProjetoId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] transition-colors focus:outline-none focus:border-[var(--color-primary)] cursor-pointer"
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
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Tipo de Reunião
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoReuniao)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] transition-colors focus:outline-none focus:border-[var(--color-primary)] cursor-pointer"
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
          </div>

          {/* SEÇÃO 2: PROGRAMAÇÃO, HORÁRIOS & DURAÇÃO */}
          <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] space-y-4">
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

            {/* Início e Término em 2 colunas */}
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
                    className={`px-2 py-0.5 text-[11px] font-medium rounded-lg border transition-all cursor-pointer ${
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

          {/* ── SEÇÃO 3: ORDEM DO DIA / PAUTAS (SIMPLIFICADA E INTUITIVA) ── */}
          <div className="p-4 rounded-2xl bg-[var(--bg-secondary)]/70 border border-[var(--border-default)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--color-primary)]" />
                  Pautas da Reunião ({pautasTopicos.length})
                </span>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Total planejado:{' '}
                  <strong className="text-[var(--text-primary)]">
                    {formatDurationHuman(tempoTotalPautas)}
                  </strong>
                  {tempoTotalPautas > 0 && tempoTotalPautas !== duracaoMinutos && (
                    <button
                      type="button"
                      onClick={handleSincronizarComPautas}
                      className="ml-2 text-amber-600 dark:text-amber-400 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Ajustar reunião para {formatDurationHuman(tempoTotalPautas)}
                    </button>
                  )}
                </p>
              </div>

              {/* Botão de Alternar Modo Lote */}
              <button
                type="button"
                onClick={() => setModoLotePautas(!modoLotePautas)}
                className="text-xs font-semibold text-[var(--color-primary)] hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
              >
                <ListPlus className="w-3.5 h-3.5" />
                <span>{modoLotePautas ? 'Voltar para Modo Guiado' : 'Colar Lista Rápida (Texto)'}</span>
              </button>
            </div>

            {/* Modelos Comuns (Presets em 1 clique) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-[var(--text-muted)] font-medium mr-1">
                Adicionar rápido:
              </span>
              <button
                type="button"
                onClick={() => handleAddTopicoPredefinido('Informes Gerais e Comunicações', 10)}
                className="px-2 py-1 text-[11px] rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:border-[var(--color-primary)] text-[var(--text-secondary)] transition-colors cursor-pointer"
              >
                + Informes Gerais (10m)
              </button>
              <button
                type="button"
                onClick={() => handleAddTopicoPredefinido('Apresentação da Pauta Central', 30)}
                className="px-2 py-1 text-[11px] rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:border-[var(--color-primary)] text-[var(--text-secondary)] transition-colors cursor-pointer"
              >
                + Pauta Central (30m)
              </button>
              <button
                type="button"
                onClick={() => handleAddTopicoPredefinido('Deliberações e Decisões', 15)}
                className="px-2 py-1 text-[11px] rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:border-[var(--color-primary)] text-[var(--text-secondary)] transition-colors cursor-pointer"
              >
                + Deliberações (15m)
              </button>
              <button
                type="button"
                onClick={() => handleAddTopicoPredefinido('Encaminhamentos e Prazos', 10)}
                className="px-2 py-1 text-[11px] rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:border-[var(--color-primary)] text-[var(--text-secondary)] transition-colors cursor-pointer"
              >
                + Encaminhamentos (10m)
              </button>
            </div>

            {/* Modo Lote: Caixa de Texto Corrido */}
            {modoLotePautas ? (
              <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-2">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Cole ou digite as pautas (uma por linha):
                </label>
                <textarea
                  rows={4}
                  value={textoLotePautas}
                  onChange={(e) => setTextoLotePautas(e.target.value)}
                  placeholder="1. Aprovação do cronograma de eventos (20 min)&#10;2. Prestação de contas do trimestre (30 min)&#10;3. Alinhamento dos voluntários da ação (15 min)"
                  className="w-full p-2.5 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] font-mono"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setModoLotePautas(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={handleImportarLotePautas}
                  >
                    Importar Tópicos
                  </Button>
                </div>
              </div>
            ) : (
              /* Modo Guiado: Input Direto e Simples */
              <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                  <div className="sm:col-span-6 flex flex-col gap-1">
                    <label className="text-[11px] text-[var(--text-muted)] font-medium">
                      Assunto da Pauta *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Aprovação da escala e transporte dos voluntários..."
                      value={novoTopicoTitulo}
                      onChange={(e) => setNovoTopicoTitulo(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTopico();
                        }
                      }}
                      className="w-full px-3 py-2 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>

                  <div className="sm:col-span-3 flex flex-col gap-1">
                    <label className="text-[11px] text-[var(--text-muted)] font-medium">
                      Tempo Estimado
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={5}
                        step={5}
                        value={novoTopicoTempo}
                        onChange={(e) => setNovoTopicoTempo(Math.max(5, Number(e.target.value)))}
                        className="w-full px-2.5 py-2 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                      />
                      <span className="text-xs text-[var(--text-muted)] shrink-0">min</span>
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

                <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                  <div className="flex items-center gap-1">
                    {[10, 15, 20, 30, 45].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setNovoTopicoTempo(mins)}
                        className={`px-2 py-0.5 text-[10px] font-medium rounded border transition-colors cursor-pointer ${
                          novoTopicoTempo === mins
                            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                            : 'bg-[var(--bg-secondary)] border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {mins}m
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
            )}

            {/* Lista dos tópicos cadastrados com ajustes inline */}
            <div className="space-y-1.5">
              {pautasTopicos.map((topico, idx) => (
                <div
                  key={topico.id}
                  className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="w-5 h-5 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center font-bold text-[11px] shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-xs truncate">
                        {topico.titulo}
                      </p>
                      {topico.responsavel && (
                        <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium truncate">
                          Relator: {topico.responsavel}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Controle de Tempo do Tópico (+5m, -5m) e Exclusão */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex items-center bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-default)] px-1 py-0.5">
                      <button
                        type="button"
                        onClick={() => handleAjustarTempoTopico(topico.id, -5)}
                        className="px-1 text-[11px] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                        title="Diminuir 5 minutos"
                      >
                        -
                      </button>
                      <span className="px-1.5 text-[11px] font-semibold text-[var(--text-primary)] min-w-[36px] text-center">
                        {topico.tempo_estimado_min || 15}m
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAjustarTempoTopico(topico.id, 5)}
                        className="px-1 text-[11px] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                        title="Aumentar 5 minutos"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveTopico(topico.id)}
                      className="p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Remover pauta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {pautasTopicos.length === 0 && (
                <div className="p-4 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-default)] rounded-xl">
                  Nenhuma pauta adicionada ainda. Use os botões rápidos acima ou digite o assunto.
                </div>
              )}
            </div>
          </div>

          {/* ── SEÇÃO 4: PARTICIPANTES CONVOCADOS (VOLUNTÁRIOS DO SISTEMA + EXTERNOS) ── */}
          <div className="p-4 rounded-2xl bg-[var(--bg-secondary)]/70 border border-[var(--border-default)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[var(--color-primary)]" />
                  Participantes Convocados ({participantes.length})
                </span>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Selecione voluntários cadastrados ou adicione convidados externos
                </p>
              </div>

              {/* Alternador de Modo de Seleção (Voluntários do Sistema vs. Convidado Externo) */}
              <div className="flex items-center gap-1 bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border-default)] self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setAbaParticipantes('voluntarios')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    abaParticipantes === 'voluntarios'
                      ? 'bg-[var(--color-primary)] text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Voluntários do Sistema</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAbaParticipantes('externo')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    abaParticipantes === 'externo'
                      ? 'bg-[var(--color-primary)] text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Convidado Externo</span>
                </button>
              </div>
            </div>

            {/* Painel 1: Voluntários Cadastrados no Sistema */}
            {abaParticipantes === 'voluntarios' ? (
              <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  {/* Busca rápida */}
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      placeholder="Buscar voluntário por nome ou área..."
                      value={buscaVoluntario}
                      onChange={(e) => setBuscaVoluntario(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={handleSelecionarTodosVoluntarios}
                    className="text-xs shrink-0"
                  >
                    Convidar Toda a Equipe
                  </Button>
                </div>

                {/* Lista de Seleção de Voluntários */}
                <div className="max-h-44 overflow-y-auto custom-scrollbar divide-y divide-[var(--border-default)] border border-[var(--border-default)] rounded-xl bg-[var(--bg-secondary)]/40">
                  {voluntariosFiltrados.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[var(--text-muted)]">
                      Nenhum voluntário encontrado com o termo digitado.
                    </div>
                  ) : (
                    voluntariosFiltrados.map((vol) => {
                      const isSelected = participantes.includes(vol.nome_completo);

                      return (
                        <div
                          key={vol.id}
                          onClick={() => toggleParticipanteVoluntario(vol.nome_completo)}
                          className={`p-2 sm:px-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[var(--color-primary-soft)]/25 hover:bg-[var(--color-primary-soft)]/35'
                              : 'hover:bg-[var(--bg-secondary)]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {vol.avatar_url ? (
                              <img
                                src={vol.avatar_url}
                                alt={vol.nome_completo}
                                className="w-6 h-6 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center font-bold text-[10px] shrink-0">
                                {vol.nome_completo.charAt(0)}
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                                {vol.nome_completo}
                              </p>
                              {vol.area_atuacao && (
                                <p className="text-[10px] text-[var(--text-muted)] truncate">
                                  {vol.area_atuacao}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-[var(--color-primary)] text-white'
                                  : 'bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-muted)]'
                              }`}
                            >
                              {isSelected ? (
                                <>
                                  <Check className="w-3 h-3" /> Convocado
                                </>
                              ) : (
                                '+ Convidar'
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              /* Painel 2: Convidado Externo / Personalizado */
              <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                      Nome do Convidado Externo *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Dr. Carlos Mendes, Maria da Comunidade..."
                      value={novoConvidadoExterno}
                      onChange={(e) => setNovoConvidadoExterno(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddConvidadoExterno();
                        }
                      }}
                      className="w-full px-3 py-2 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                      Instituição / Cargo (Opcional)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ex: Parceiro / Advogado / Líder Comunitário..."
                        value={cargoConvidadoExterno}
                        onChange={(e) => setCargoConvidadoExterno(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddConvidadoExterno();
                          }
                        }}
                        className="w-full px-3 py-2 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        onClick={handleAddConvidadoExterno}
                        className="shrink-0"
                      >
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chips de Participantes Adicionados */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <span>Lista final de convocados ({participantes.length}):</span>
                {participantes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setParticipantes([])}
                    className="text-red-500 hover:underline cursor-pointer"
                  >
                    Remover todos
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] min-h-[48px] items-center">
                {participantes.map((nome) => {
                  const isExterno = !listaVoluntarios.some((v) => v.nome_completo === nome);

                  return (
                    <span
                      key={nome}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shadow-2xs ${
                        isExterno
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300'
                          : 'bg-[var(--bg-secondary)] border-[var(--border-default)] text-[var(--text-primary)]'
                      }`}
                    >
                      <span>{nome}</span>
                      {isExterno && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                          Externo
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveParticipante(nome)}
                        className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 transition-colors cursor-pointer ml-0.5"
                        title="Remover participante"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}

                {participantes.length === 0 && (
                  <span className="text-xs text-[var(--text-muted)] italic">
                    Nenhum participante nominal adicionado. Todos os membros do instituto poderão participar.
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="h-2" />
        </form>

        {/* Footer Fixo com Resumo & Botões de Ação */}
        <div className="shrink-0 px-5 sm:px-6 py-4 border-t border-[var(--border-default)] bg-[var(--bg-secondary)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
              </strong>{' '}
              • Convocados:{' '}
              <strong className="text-[var(--text-primary)]">
                {participantes.length}
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
