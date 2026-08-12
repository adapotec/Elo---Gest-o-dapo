'use client';

import React from 'react';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { GraduationCap, ArrowLeft, BookOpen, Heart, Sparkles } from 'lucide-react';

export default function PedagogiaPage() {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Gestão Pedagógica & Metodologia"
        subtitle="Planos de Aula, Matriz Pedagógica e Acompanhamento Socioemocional"
        action={
          <Link href="/dashboard/projetos">
            <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
              Voltar aos Projetos
            </Button>
          </Link>
        }
      />

      <div className="p-8 max-w-5xl space-y-6 flex-1 overflow-y-auto">
        <div className="p-8 rounded-3xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#93368F]/10 text-[#93368F] flex items-center justify-center mx-auto shadow-inner">
            <GraduationCap className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
              ## Em Construção ##
            </span>
            <h2 className="font-display font-bold text-2xl text-[var(--text-primary)]">
              Módulo de Pedagogia do Instituto Ádapo
            </h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Esta área dedicada centralizará a criação e edição de **Planos de Aula**, **Programações de Ação** (*Roteiro/Ritmo/Rotina*) e o **Acompanhamento Socioemocional** (dimensões Psíquica e Social). Quando vinculados a um projeto social, os dados serão sincronizados automaticamente no painel do projeto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-left max-w-3xl mx-auto">
            <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                <BookOpen className="w-4 h-4 text-[#93368F]" />
                Planos de Aula
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Objetivos pedagógicos, metodologia de ensino, recursos necessários e diário de bordo.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                <Sparkles className="w-4 h-4 text-[#F2632D]" />
                Programações de Ação
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Estrutura de acolhimento, roteiros de oficina e ritmo de atividades comunitárias.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                <Heart className="w-4 h-4 text-[#EF4444]" />
                Socioemocional
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Monitoramento psíquico/social e registro de rodas de conversa psicossociais.
              </p>
            </div>
          </div>

          <div className="pt-4">
            <Link href="/dashboard/projetos">
              <Button variant="primary" icon={<ArrowLeft className="w-4 h-4" />}>
                Retornar ao Gerenciador de Projetos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
