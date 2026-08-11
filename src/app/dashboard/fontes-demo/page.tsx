'use client';

import React, { useState } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Sparkles, Sliders } from 'lucide-react';

export default function FontesDemoPage() {
  const [selectedWeight, setSelectedWeight] = useState<'300' | '400' | '500' | '600' | '700' | '800'>('700');
  const [sampleText, setSampleText] = useState('Sistema Elo — Gestão Institucional do Instituto Ádapo');
  const [fontSize, setFontSize] = useState(24);

  const weights = [
    { weight: '300', name: 'Light (300)', className: 'font-light' },
    { weight: '400', name: 'Regular (400)', className: 'font-normal' },
    { weight: '500', name: 'Medium (500)', className: 'font-medium' },
    { weight: '600', name: 'SemiBold (600)', className: 'font-semibold' },
    { weight: '700', name: 'Bold (700)', className: 'font-bold' },
    { weight: '800', name: 'ExtraBold (800)', className: 'font-extrabold' },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Testador de Peso de Fontes"
        subtitle="Experimente em tempo real diferentes níveis de negrito e espessura da fonte dos títulos (Plus Jakarta Sans)"
      />

      <div className="p-8 max-w-5xl space-y-8 flex-1 overflow-y-auto">
        {/* Controles de Personalização */}
        <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-6">
          <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-4">
            <Sliders className="w-5 h-5 text-[var(--color-primary)]" />
            <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
              Controles Interativos
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-2">
                Texto de Exemplo:
              </label>
              <input
                type="text"
                value={sampleText}
                onChange={(e) => setSampleText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Tamanho da Fonte:
                </label>
                <span className="text-xs font-mono-data font-bold text-[var(--color-primary)]">{fontSize}px</span>
              </div>
              <input
                type="range"
                min="16"
                max="48"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-[var(--color-primary)] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Comparador de Todos os Pesos Lado a Lado */}
        <div className="space-y-4">
          <h3 className="font-display font-bold text-lg text-[var(--text-primary)] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--raw-amarelo)]" />
            Comparativo de Todos os Níveis de Negrito (300 a 800)
          </h3>

          <div className="space-y-3">
            {weights.map((w) => (
              <div
                key={w.weight}
                onClick={() => setSelectedWeight(w.weight as any)}
                className={`p-5 rounded-xl border transition-all cursor-pointer ${
                  selectedWeight === w.weight
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]/30 shadow-md'
                    : 'border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono-data font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    {w.name}
                  </span>
                  {selectedWeight === w.weight && (
                    <Badge variant="purple">SELECIONADO</Badge>
                  )}
                </div>

                <p
                  className={`font-display text-[var(--text-primary)] transition-all`}
                  style={{
                    fontSize: `${fontSize}px`,
                    fontWeight: Number(w.weight),
                  }}
                >
                  {sampleText}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Exemplo Prático em Componentes Reais */}
        <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
          <h3 className="font-display font-bold text-base text-[var(--text-primary)] border-b border-[var(--border-default)] pb-3">
            Preview do Peso Selecionado (Peso: {selectedWeight}) em Componentes Reais
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] space-y-2">
              <span className="text-xs text-[var(--text-muted)]">Título de Card / Indicador</span>
              <h4 className="font-display text-xl text-[var(--text-primary)]" style={{ fontWeight: Number(selectedWeight) }}>
                142 Beneficiários Ativos
              </h4>
              <p className="text-xs text-[var(--text-secondary)]">Atendidos pelo Instituto Ádapo neste mês</p>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] space-y-2">
              <span className="text-xs text-[var(--text-muted)]">Título do Sistema (Sidebar)</span>
              <h4 className="font-display text-2xl text-[var(--color-primary)]" style={{ fontWeight: Number(selectedWeight) }}>
                Elo — Instituto Ádapo
              </h4>
              <p className="text-xs text-[var(--text-secondary)]">Gestão Interna Institucional</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
