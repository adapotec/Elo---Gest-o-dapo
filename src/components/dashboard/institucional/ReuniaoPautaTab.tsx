'use client';

import React from 'react';
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
} from 'lucide-react';

interface ReuniaoPautaTabProps {
  reuniao: Reuniao;
  onOpenConvocacaoPrint: () => void;
}

export function ReuniaoPautaTab({ reuniao, onOpenConvocacaoPrint }: ReuniaoPautaTabProps) {
  const pautas = Array.isArray(reuniao.pautas_topicos) && reuniao.pautas_topicos.length > 0
    ? reuniao.pautas_topicos
    : null;

  return (
    <div className="space-y-6">
      {/* Banner de Resumo da Convocação */}
      <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
              {reuniao.tipo.replace('_', ' ').toUpperCase()}
            </span>
            <span className="text-xs text-[var(--text-muted)]">•</span>
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Modalidade: <strong className="capitalize text-[var(--text-primary)]">{reuniao.modalidade}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] flex-wrap pt-1">
            <span className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
              <Calendar className="w-4 h-4 text-[var(--color-primary)]" />
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
              Abrir Sala Virtual
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <Button
            size="sm"
            variant="secondary"
            icon={<Printer className="w-3.5 h-3.5 text-[var(--color-primary)]" />}
            onClick={onOpenConvocacaoPrint}
          >
            Convocação (PDF)
          </Button>
        </div>
      </div>

      {/* Local e Informações Complementares */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-start gap-3">
          <MapPin className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[var(--text-primary)]">Local do Encontro</p>
            <p className="text-[var(--text-secondary)] mt-0.5">{reuniao.local_reuniao || 'Não informado'}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-start gap-3">
          <FolderKanban className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[var(--text-primary)]">Vínculo Institucional</p>
            <p className="text-[var(--text-secondary)] mt-0.5">
              {reuniao.projeto ? `Projeto: ${reuniao.projeto.nome}` : 'Gestão Geral do Instituto Ádapo (Diretoria)'}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Tópicos da Pauta */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-[var(--color-primary)]" />
            Tópicos da Ordem do Dia
          </h4>
          <span className="text-xs text-[var(--text-muted)]">
            {pautas ? `${pautas.length} pauta(s) cadastrada(s)` : 'Pauta livre'}
          </span>
        </div>

        {pautas ? (
          <div className="space-y-2">
            {pautas.map((p, idx) => (
              <div
                key={p.id || idx}
                className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-sm text-[var(--text-primary)]">{p.titulo}</p>
                    {p.descricao && (
                      <p className="text-xs text-[var(--text-secondary)] mt-1 whitespace-pre-line">{p.descricao}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-xs">
                  {p.tempo_estimado_min && (
                    <span className="px-2 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-muted)] flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3" />
                      {p.tempo_estimado_min} min
                    </span>
                  )}
                  {p.responsavel && (
                    <span className="px-2 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium border border-purple-500/20">
                      {p.responsavel}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] whitespace-pre-line min-h-[60px]">
            {reuniao.pauta || 'Nenhuma pauta específica informada para esta reunião.'}
          </div>
        )}
      </div>

      {/* Participantes Convocados */}
      <div className="space-y-2 pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
          <Users className="w-4 h-4 text-[var(--color-primary)]" />
          Membros & Voluntários Convocados ({reuniao.participantes?.length || 0})
        </h4>

        <div className="flex flex-wrap gap-2">
          {reuniao.participantes && reuniao.participantes.length > 0 ? (
            reuniao.participantes.map((nome) => (
              <span
                key={nome}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)]"
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
