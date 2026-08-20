'use client';

import React from 'react';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { Megaphone, ArrowLeft, Camera, Share2, ShieldCheck } from 'lucide-react';

export default function ComunicacaoPage() {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Comunicação & Mídia Institucional"
        subtitle="Peças Gráficas, Redes Sociais e Autorizações de Imagem"
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
          <div className="w-16 h-16 rounded-2xl bg-[#F2632D]/10 text-[#F2632D] flex items-center justify-center mx-auto shadow-inner">
            <Megaphone className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
              ## Em Construção ##
            </span>
            <h2 className="font-display font-bold text-2xl text-[var(--text-primary)]">
              Módulo de Comunicação & Mídia do Instituto Ádapo
            </h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Esta área dedicada centralizará o registro de **Peças Gráficas e Conteúdos Mídia** (banners, vídeos, artes de redes sociais) e a gestão de **Termos de Autorização de Imagem e Uso de Voz** dos participantes vinculados a cada projeto social.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-left max-w-3xl mx-auto">
            <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                <Camera className="w-4 h-4 text-[#F2632D]" />
                Peças & Mídias
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Artes para redes sociais, folhetos impressos e fotografias registradas nos projetos.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                <Share2 className="w-4 h-4 text-[#3B82F6]" />
                Canais de Divulgação
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Mapeamento de engajamento no Instagram, YouTube, site oficial e imprensa local.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                Direito de Imagem
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Termos assinados e controle LGPD de imagem de crianças e voluntários.
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
