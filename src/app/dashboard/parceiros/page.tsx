'use client';

import React from 'react';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { Building2, ArrowLeft, HeartHandshake, FileText, Award } from 'lucide-react';

export default function ParceirosPage() {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Controle de Parceiros & Convênios"
        subtitle="Patrocinadores, Parceiros Institucionais e Alianças Comunitárias"
        action={
          <Link href="/dashboard/projetos">
            <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
              Voltar aos Projetos
            </Button>
          </Link>
        }
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl space-y-6 flex-1 overflow-y-auto">
        <div className="p-6 sm:p-8 rounded-3xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#1C9C82]/10 text-[#1C9C82] flex items-center justify-center mx-auto shadow-inner">
            <Building2 className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
              ## Em Construção ##
            </span>
            <h2 className="font-display font-bold text-2xl text-[var(--text-primary)]">
              Módulo de Controle de Parceiros do Instituto Ádapo
            </h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Esta área dedicada centralizará o cadastro, contratos e contrapartidas de **Empresas Apoiadoras**, **Órgãos Públicos**, **Fundações** e **Parceiros Técnicos** associados aos projetos do Instituto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-left max-w-3xl mx-auto">
            <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                <HeartHandshake className="w-4 h-4 text-[#1C9C82]" />
                Alianças & Apoio
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Registro de parceiros finaceiros, doadores de insumos e parceiros estratégicos.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                <FileText className="w-4 h-4 text-[#8B5CF6]" />
                Termos de Convênio
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Vigência de contratos, acordos de cooperação e repasses de verbas estaduais/federais.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                <Award className="w-4 h-4 text-[#F9C859]" />
                Contrapartidas
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Relatórios de impacto de marcas parceiras e prestação de contas institucional.
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
