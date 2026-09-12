'use client';

import React, { useState } from 'react';
import { Reuniao } from '@/types/reuniao';
import { Button } from '@/components/ui/Button';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  ExternalLink,
  Users,
  Printer,
  FileCheck2,
  FolderKanban,
  ChevronDown,
  ChevronUp,
  User,
  Sparkles,
} from 'lucide-react';

interface ReuniaoPautaTabProps {
  reuniao: Reuniao;
  onOpenConvocacaoPrint: () => void;
}

export function ReuniaoPautaTab({ reuniao, onOpenConvocacaoPrint }: ReuniaoPautaTabProps) {
  const pautas = Array.isArray(reuniao.pautas_topicos) && reuniao.pautas_topicos.length > 0
    ? reuniao.pautas_topicos
    : null;

  // Estado para controlar quais tópicos estão expandidos individualmente
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState(false);
  const [showAllParticipants, setShowAllParticipants] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleToggleAll = () => {
    if (!pautas) return;
    const nextState = !allExpanded;
    setAllExpanded(nextState);
    const newMap: Record<string, boolean> = {};
    pautas.forEach((p, idx) => {
      const id = p.id || String(idx);
      newMap[id] = nextState;
    });
    setExpandedIds(newMap);
  };

  const tempoTotalPautas = pautas
    ? pautas.reduce((acc, p) => acc + (p.tempo_estimado_min || 0), 0)
    : 0;

  const totalParticipantes = reuniao.participantes?.length || 0;
  const participantesExibidos = showAllParticipants
    ? reuniao.participantes || []
    : (reuniao.participantes || []).slice(0, 10);

  return (
    <div className="space-y-5">
      {/* Banner de Resumo da Convocação */}
      <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F2632D]">
              {reuniao.tipo.replace('_', ' ').toUpperCase()}
            </span>
            <span className="text-xs text-[var(--text-muted)]">•</span>
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Modalidade: <strong className="capitalize text-[var(--text-primary)]">{reuniao.modalidade}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] flex-wrap pt-1">
            <span className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
              <Calendar className="w-4 h-4 text-[#F2632D]" />
              {new Date(reuniao.data_hora).toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1 text-[var(--text-primary)]">
              <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              {new Date(reuniao.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              {reuniao.horario_fim && (
                <> às {new Date(reuniao.horario_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</>
              )}
              {reuniao.duracao_estimada_min && (
                <span className="text-[var(--text-muted)]"> ({reuniao.duracao_estimada_min} min)</span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {reuniao.link_virtual && (
            <a
              href={reuniao.link_virtual.startsWith('http') ? reuniao.link_virtual : `https://${reuniao.link_virtual}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
            >
              <Video className="w-3.5 h-3.5" />
              Sala Virtual
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <Button
            size="sm"
            variant="secondary"
            icon={<Printer className="w-3.5 h-3.5 text-[#F2632D]" />}
            onClick={onOpenConvocacaoPrint}
          >
            Convocação (PDF)
          </Button>
        </div>
      </div>

      {/* Local e Informações Complementares */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-start gap-3 shadow-xs">
          <MapPin className="w-4 h-4 text-[#F2632D] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-[var(--text-primary)]">Local do Encontro</p>
            <p className="text-[var(--text-secondary)] mt-0.5">{reuniao.local_reuniao || 'Não informado'}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-start gap-3 shadow-xs">
          <FolderKanban className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-[var(--text-primary)]">Vínculo Institucional</p>
            <p className="text-[var(--text-secondary)] mt-0.5">
              {reuniao.projeto ? `Projeto: ${reuniao.projeto.nome}` : 'Gestão Geral do Instituto Ádapo (Diretoria)'}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Tópicos da Pauta com Redução de Carga Cognitiva */}
      <div className="space-y-3 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#F2632D]" />
              Tópicos da Ordem do Dia
            </h4>
            {pautas && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                {pautas.length} pauta(s)
              </span>
            )}
            {tempoTotalPautas > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-orange-500/10 text-[#F2632D] border border-orange-500/20 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {tempoTotalPautas} min totais
              </span>
            )}
          </div>

          {pautas && pautas.some((p) => Boolean(p.descricao)) && (
            <button
              type="button"
              onClick={handleToggleAll}
              className="text-xs font-semibold text-[#F2632D] hover:underline inline-flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              {allExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  Recolher detalhes
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  Expandir detalhes
                </>
              )}
            </button>
          )}
        </div>

        {pautas ? (
          <div className="space-y-2">
            {pautas.map((p, idx) => {
              const topicoId = p.id || String(idx);
              const isExpanded = Boolean(expandedIds[topicoId]);
              const hasDesc = Boolean(p.descricao?.trim());

              return (
                <div
                  key={topicoId}
                  className="p-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:border-[#F2632D]/30 transition-all shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <span className="w-6 h-6 rounded-full bg-orange-500/10 text-[#F2632D] font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-orange-500/20">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-sm text-[var(--text-primary)] leading-snug">
                            {p.titulo}
                          </p>
                        </div>

                        {/* Metadados: Duração e Relator */}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs">
                          {p.tempo_estimado_min && (
                            <span className="px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-muted)] flex items-center gap-1 font-medium text-[11px]">
                              <Clock className="w-3 h-3 text-[#F2632D]" />
                              {p.tempo_estimado_min} min
                            </span>
                          )}
                          {p.responsavel && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 font-semibold border border-purple-500/20 text-[11px] flex items-center gap-1">
                              <User className="w-3 h-3" />
                              Relator: {p.responsavel}
                            </span>
                          )}

                          {hasDesc && (
                            <button
                              type="button"
                              onClick={() => toggleExpand(topicoId)}
                              className="text-[11px] font-semibold text-[#F2632D] hover:underline inline-flex items-center gap-0.5 ml-1 cursor-pointer"
                            >
                              {isExpanded ? (
                                <>
                                  Recolher <ChevronUp className="w-3 h-3" />
                                </>
                              ) : (
                                <>
                                  Ver descrição <ChevronDown className="w-3 h-3" />
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Descrição em Bloco Indentado Elegante (Colapsável) */}
                        {hasDesc && isExpanded && (
                          <div className="mt-2.5 pl-3.5 border-l-2 border-[#F2632D]/40 bg-[var(--bg-secondary)]/50 py-2.5 pr-3 rounded-r-xl text-xs text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">
                            {p.descricao}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] whitespace-pre-line min-h-[60px] shadow-xs">
            {reuniao.pauta || 'Nenhuma pauta específica informada para esta reunião.'}
          </div>
        )}
      </div>

      {/* Participantes Convocados */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#F2632D]" />
            Membros & Voluntários Convocados ({totalParticipantes})
          </h4>
          {totalParticipantes > 10 && (
            <button
              type="button"
              onClick={() => setShowAllParticipants(!showAllParticipants)}
              className="text-xs font-semibold text-[#F2632D] hover:underline cursor-pointer"
            >
              {showAllParticipants ? 'Ver menos' : `Ver todos (${totalParticipantes})`}
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {participantesExibidos.length > 0 ? (
            participantesExibidos.map((nome) => (
              <span
                key={nome}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)]"
              >
                {nome}
              </span>
            ))
          ) : (
            <p className="text-xs text-[var(--text-muted)] italic">
              Convocação geral sem lista nominal de participantes.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

