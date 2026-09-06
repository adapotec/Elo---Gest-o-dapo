'use client';

import React, { useState } from 'react';
import { Reuniao } from '@/types/reuniao';
import { Button } from '@/components/ui/Button';
import {
  Users,
  UserCheck,
  UserX,
  Play,
  CheckCircle2,
  Plus,
  Save,
  Clock,
  Sparkles,
  ClipboardPen,
} from 'lucide-react';

interface ReuniaoPresencaTabProps {
  reuniao: Reuniao;
  onUpdateReuniao: (updates: Partial<Reuniao>) => Promise<void>;
  onNavigateToAta: () => void;
}

export function ReuniaoPresencaTab({
  reuniao,
  onUpdateReuniao,
  onNavigateToAta,
}: ReuniaoPresencaTabProps) {
  const [presentes, setPresentes] = useState<string[]>(
    Array.isArray(reuniao.presentes) ? reuniao.presentes : []
  );
  const [ausentes, setAusentes] = useState<string[]>(
    Array.isArray(reuniao.ausentes) ? reuniao.ausentes : []
  );
  const [notasAoVivo, setNotasAoVivo] = useState(reuniao.deliberacoes || '');
  const [novoParticipante, setNovoParticipante] = useState('');
  const [saving, setSaving] = useState(false);

  // Lista unificada de todos os participantes conhecidos
  const todosParticipantes = Array.from(
    new Set([...(reuniao.participantes || []), ...presentes, ...ausentes])
  );

  const togglePresenca = async (nome: string) => {
    let novosPresentes: string[];
    let novosAusentes: string[];

    if (presentes.includes(nome)) {
      // Passa para ausente
      novosPresentes = presentes.filter((p) => p !== nome);
      novosAusentes = Array.from(new Set([...ausentes, nome]));
    } else {
      // Passa para presente
      novosPresentes = Array.from(new Set([...presentes, nome]));
      novosAusentes = ausentes.filter((a) => a !== nome);
    }

    setPresentes(novosPresentes);
    setAusentes(novosAusentes);

    try {
      await onUpdateReuniao({
        presentes: novosPresentes,
        ausentes: novosAusentes,
      });
    } catch (e) {
      console.error('Erro ao atualizar presença:', e);
    }
  };

  const handleMarcarTodosPresentes = async () => {
    const novosPresentes = [...todosParticipantes];
    setPresentes(novosPresentes);
    setAusentes([]);
    try {
      await onUpdateReuniao({
        presentes: novosPresentes,
        ausentes: [],
      });
    } catch (e) {
      console.error('Erro ao marcar todos presentes:', e);
    }
  };

  const handleAddParticipanteAvulso = async () => {
    if (!novoParticipante.trim()) return;
    const nome = novoParticipante.trim();
    const novosParticipantes = Array.from(new Set([...(reuniao.participantes || []), nome]));
    const novosPresentes = Array.from(new Set([...presentes, nome]));

    setPresentes(novosPresentes);
    setNovoParticipante('');

    try {
      await onUpdateReuniao({
        participantes: novosParticipantes,
        presentes: novosPresentes,
      });
    } catch (e) {
      console.error('Erro ao adicionar participante avulso:', e);
    }
  };

  const handleIniciarReuniao = async () => {
    try {
      setSaving(true);
      await onUpdateReuniao({ status: 'em_andamento' });
    } finally {
      setSaving(false);
    }
  };

  const handleSalvarNotas = async () => {
    try {
      setSaving(true);
      await onUpdateReuniao({ deliberacoes: notasAoVivo });
      alert('Anotações salvas com sucesso!');
    } finally {
      setSaving(false);
    }
  };

  const taxaPresenca = todosParticipantes.length > 0
    ? Math.round((presentes.length / todosParticipantes.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Barra de Status e Ações de Execução */}
      <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-[var(--text-primary)]">Condução da Reunião</h4>
              {reuniao.status === 'em_andamento' && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  AO VIVO
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              {reuniao.status === 'concluida'
                ? 'Esta reunião já foi finalizada e sua ata lavrada.'
                : reuniao.status === 'em_andamento'
                ? 'Reunião em andamento. Faça a chamada e registre as anotações.'
                : 'Reunião ainda não iniciada. Inicie quando o quórum estiver pronto.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {reuniao.status === 'agendada' && (
            <Button
              size="sm"
              variant="primary"
              onClick={handleIniciarReuniao}
              disabled={saving}
              icon={<Play className="w-3.5 h-3.5" />}
            >
              Iniciar Reunião
            </Button>
          )}

          {reuniao.status === 'em_andamento' && (
            <Button
              size="sm"
              variant="primary"
              onClick={onNavigateToAta}
              icon={<ClipboardPen className="w-3.5 h-3.5" />}
            >
              Encerrar & Lavrar Ata
            </Button>
          )}
        </div>
      </div>

      {/* Seção de Chamada / Quórum */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--color-primary)]" />
              Lista de Presença & Quórum ({presentes.length}/{todosParticipantes.length} presentes - {taxaPresenca}%)
            </h4>
            <p className="text-[11px] text-[var(--text-muted)]">
              Clique sobre cada membro para alternar entre Presente e Ausente
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleMarcarTodosPresentes}
              icon={<UserCheck className="w-3.5 h-3.5 text-emerald-500" />}
            >
              Todos Presentes
            </Button>
          </div>
        </div>

        {/* Grade de Participantes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {todosParticipantes.map((nome) => {
            const isPresente = presentes.includes(nome);
            return (
              <button
                key={nome}
                type="button"
                onClick={() => togglePresenca(nome)}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  isPresente
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-[var(--bg-secondary)] border-[var(--border-default)] text-[var(--text-muted)] opacity-75 hover:opacity-100'
                }`}
              >
                <span className="font-semibold text-xs truncate mr-2">{nome}</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isPresente
                      ? 'bg-emerald-500 text-white'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-default)]'
                  }`}
                >
                  {isPresente ? (
                    <>
                      <UserCheck className="w-3 h-3" />
                      PRESENTE
                    </>
                  ) : (
                    <>
                      <UserX className="w-3 h-3" />
                      AUSENTE
                    </>
                  )}
                </span>
              </button>
            );
          })}

          {todosParticipantes.length === 0 && (
            <div className="col-span-full p-6 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-default)] rounded-xl">
              Nenhum participante adicionado. Adicione os nomes abaixo para registrar a presença.
            </div>
          )}
        </div>

        {/* Adicionar participante avulso */}
        <div className="flex gap-2 pt-1 max-w-md">
          <input
            type="text"
            placeholder="Adicionar outro participante presente..."
            value={novoParticipante}
            onChange={(e) => setNovoParticipante(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddParticipanteAvulso();
              }
            }}
            className="flex-1 px-3 py-1.5 text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleAddParticipanteAvulso}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Adicionar
          </Button>
        </div>
      </div>

      {/* Anotações e Deliberações ao Vivo */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Anotações Rápidas e Pontos Levantados (Ao Vivo)
          </h4>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleSalvarNotas}
            disabled={saving}
            icon={<Save className="w-3.5 h-3.5 text-[var(--color-primary)]" />}
          >
            Salvar Anotações
          </Button>
        </div>

        <textarea
          rows={6}
          value={notasAoVivo}
          onChange={(e) => setNotasAoVivo(e.target.value)}
          placeholder="Registre aqui as falas principais, votações e decisões tomadas durante a reunião para facilitar a lavratura da ata final..."
          className="w-full p-4 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
        />
      </div>
    </div>
  );
}
