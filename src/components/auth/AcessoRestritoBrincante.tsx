'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ShieldAlert, ArrowLeft, FolderKanban, LayoutDashboard, Sparkles } from 'lucide-react';

interface AcessoRestritoBrincanteProps {
  modulo?: string;
}

export function AcessoRestritoBrincante({ modulo = 'este módulo' }: AcessoRestritoBrincanteProps) {
  return (
    <div className="w-full max-w-2xl mx-auto py-10 px-4 animate-in fade-in duration-200">
      <Card className="p-8 sm:p-10 text-center space-y-6 border-[var(--border-default)] shadow-[var(--shadow-card)] bg-[var(--bg-elevated)] card-contrast">
        {/* Ícone de Destaque com visual acolhedor e seguro */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Badge Identificadora */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Perfil: Voluntário Brincante (Período de Experiência)</span>
        </div>

        {/* Título e Explicação */}
        <div className="space-y-3">
          <h2 className="font-display font-extrabold text-xl sm:text-2xl text-[var(--text-primary)]">
            Acesso Restrito a {modulo}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-xl mx-auto">
            Você está cadastrado como <strong>Voluntário Brincante</strong>, integrando a equipe de organização em período inicial de experiência e integração no Instituto Ádapo.
          </p>
          <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-left text-xs text-[var(--text-secondary)] space-y-2 mt-4">
            <p className="font-bold text-[var(--text-primary)]">
              Por que esta seção não está disponível no momento?
            </p>
            <p className="leading-relaxed">
              Por diretrizes de governança institucional e conformidade com a <strong>LGPD (Lei Geral de Proteção de Dados)</strong>, os prontuários familiares, fichas socioemocionais e registros pedagógicos de crianças e jovens atendidos ficam restritos até a conclusão do seu ciclo de experiência.
            </p>
            <p className="text-[11px] text-[var(--text-muted)] italic pt-1 border-t border-[var(--border-default)]">
              Assim que o seu período for concluído, a coordenação de Gestão de Pessoas efetivará seu cadastro para acesso completo.
            </p>
          </div>
        </div>

        {/* Ações de Navegação Recomendadas */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              className="w-full sm:w-auto justify-center text-xs font-bold"
              icon={<LayoutDashboard className="w-4 h-4" />}
            >
              Voltar ao Painel Inicial
            </Button>
          </Link>
          <Link href="/dashboard/projetos" className="w-full sm:w-auto">
            <Button
              className="w-full sm:w-auto justify-center text-xs font-bold bg-[var(--color-primary)] text-white hover:opacity-90"
              icon={<FolderKanban className="w-4 h-4" />}
            >
              Explorar Projetos Sociais
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
