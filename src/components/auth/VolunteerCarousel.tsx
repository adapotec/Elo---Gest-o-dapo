'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { User, Sparkles, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';

export interface VoluntarioItem {
  id: string;
  nome_completo: string;
  email: string;
  funcao?: string | null;
  area_atuacao?: string | null;
  avatar_url?: string | null;
  status?: string;
  hasAccount?: boolean;
}

interface VolunteerCarouselProps {
  voluntarios: VoluntarioItem[];
  selectedIndex: number;
  onSelectVoluntario: (voluntario: VoluntarioItem, index: number) => void;
  buttonCount?: number;
  buttonSize?: number;
  buttonRadius?: number;
  curve?: number;
  gap?: number;
}

const CORES_PALETA = [
  '#F2632D', // Laranja Ádapo Principal
  '#93368F', // Roxo Ádapo
  '#1C9C82', // Verde Ádapo
  '#F9C859', // Amarelo Ádapo
  '#3B82F6', // Azul
  '#EF4444', // Vermelho
  '#6D28D9', // Violeta
  '#E85D04', // Âmbar
];

function getInitials(name: string): string {
  if (!name) return 'A';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function modIdx(i: number, n: number) {
  if (n <= 0) return 0;
  return ((i % n) + n) % n;
}

function easeCubicInOut(p: number) {
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

export function VolunteerCarousel({
  voluntarios,
  selectedIndex,
  onSelectVoluntario,
  buttonCount = 7,
  buttonSize = 44,
  buttonRadius = 22,
  curve = 5,
  gap = 22,
}: VolunteerCarouselProps) {
  const M = voluntarios.length;

  const posRef = useRef(selectedIndex);
  const [posDisplay, setPosDisplay] = useState(selectedIndex);
  const rafRef = useRef<number | null>(null);
  const animRef = useRef({ startPos: 0, targetPos: 0, startTime: 0 });
  const [dir, setDir] = useState(1);

  // Sincroniza com a seleção externa caso mude
  useEffect(() => {
    if (Math.round(posRef.current) !== selectedIndex && M > 0) {
      select(selectedIndex, false);
    }
  }, [selectedIndex, M]);

  const active = modIdx(Math.round(posDisplay), M);

  const half = Math.floor(Math.min(Math.max(1, buttonCount), Math.max(1, M)) / 2);
  const buffer = half + 1;

  const t = Math.max(0.0001, Math.min(10, curve) / 10);
  const step = buttonSize + gap;
  const dPsi = M > 0 ? ((Math.PI * 2) / M) * t : 0.4;
  const R = step / (2 * Math.sin(Math.max(0.01, dPsi) / 2));
  const baseTop = buttonSize * 0.9;
  const fadeInner = Math.max(0, half - 0.4);
  const fadeEnd = half + 0.6;
  const maxPsi = Math.min(Math.PI, fadeEnd * dPsi);
  const stripHeight = baseTop + R * (1 - Math.cos(maxPsi)) + buttonSize / 2 + 16;

  const select = useCallback(
    (itemIdx: number, notify = true) => {
      if (M <= 0) return;
      const currentActive = modIdx(Math.round(posRef.current), M);
      if (itemIdx === currentActive && !notify) return;

      let delta = itemIdx - Math.round(posRef.current);
      delta = ((delta % M) + M) % M;
      if (delta > M / 2) delta -= M;
      setDir(Math.sign(delta) || 1);

      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      const targetPos = posRef.current + delta;
      animRef.current = {
        startPos: posRef.current,
        targetPos,
        startTime: performance.now(),
      };

      const DURATION = 320;
      function tick(now: number) {
        const { startPos, targetPos, startTime } = animRef.current;
        const progress = Math.min(1, (now - startTime) / DURATION);
        posRef.current = startPos + (targetPos - startPos) * easeCubicInOut(progress);
        setPosDisplay(posRef.current);

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          posRef.current = targetPos;
          setPosDisplay(targetPos);
          rafRef.current = null;
        }
      }

      rafRef.current = requestAnimationFrame(tick);

      if (notify && voluntarios[itemIdx]) {
        onSelectVoluntario(voluntarios[itemIdx], itemIdx);
      }
    },
    [M, voluntarios, onSelectVoluntario]
  );

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const center = Math.round(posDisplay);
  const renderItems: number[] = [];
  const seen = new Set<number>();
  for (let s = -buffer; s <= buffer; s++) {
    const idx = modIdx(center + s, M);
    if (!seen.has(idx) && idx < M) {
      seen.add(idx);
      renderItems.push(idx);
    }
  }

  function getVisualSlot(itemIdx: number): number {
    let slot = itemIdx - posDisplay;
    slot = slot % M;
    if (slot > M / 2) slot -= M;
    if (slot < -M / 2) slot += M;
    return slot;
  }

  function slotStyle(slot: number) {
    const angle = slot * dPsi;
    const x = R * Math.sin(angle);
    const y = R * (1 - Math.cos(angle));
    const deg = (angle * 180) / Math.PI;
    const absSlot = Math.abs(slot);
    const depth = Math.max(0, 1 - (0.55 * absSlot) / Math.max(1, half));
    const scale = 0.6 + 0.4 * depth;
    const opacity =
      absSlot <= fadeInner
        ? 1
        : absSlot >= fadeEnd
        ? 0
        : 1 - (absSlot - fadeInner) / (fadeEnd - fadeInner);
    const zIndex = Math.round(depth * 100) + (absSlot < 0.5 ? 100 : 0);
    return { x, y, deg, scale, opacity, zIndex };
  }

  const activeVoluntario = voluntarios[active];
  const activeColor = CORES_PALETA[active % CORES_PALETA.length];

  if (M === 0) {
    return null;
  }

  return (
    <div className="relative w-full flex flex-col items-center justify-center gap-4 select-none py-2">
      {/* ── CARD PRINCIPAL DO PERFIL ATIVO ── */}
      <div className="relative flex flex-col items-center text-center space-y-3">
        {/* Foto / Avatar em Destaque */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-1 shadow-2xl transition-all duration-300 transform hover:scale-105">
          <div
            className="absolute inset-0 rounded-3xl blur-md opacity-50 transition-colors duration-300"
            style={{ backgroundColor: activeColor }}
          />

          <div className="relative w-full h-full rounded-[22px] overflow-hidden bg-[var(--bg-elevated)] border-2 border-[var(--border-strong)] flex items-center justify-center shadow-inner">
            {activeVoluntario?.avatar_url ? (
              <img
                src={activeVoluntario.avatar_url}
                alt={activeVoluntario.nome_completo}
                className="w-full h-full object-cover transition-transform duration-300"
                draggable={false}
              />
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center text-white font-display font-black text-3xl shadow-sm transition-colors duration-300"
                style={{ backgroundColor: activeColor }}
              >
                <span>{getInitials(activeVoluntario?.nome_completo || 'Ádapo')}</span>
              </div>
            )}
          </div>

          {/* Badge Indicador de Status (Primeiro Acesso vs Conta Ativa) */}
          <div className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1 border border-white/20 bg-[var(--bg-elevated)] text-[var(--text-primary)]">
            {activeVoluntario?.hasAccount ? (
              <>
                <ShieldCheck className="w-3 h-3 text-[var(--color-success)]" />
                <span className="text-[var(--color-success)]">Ativo</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 text-[var(--color-primary)]" />
                <span className="text-[var(--color-primary)]">1º Acesso</span>
              </>
            )}
          </div>
        </div>

        {/* Informações Textuais do Perfil Ativo */}
        <div className="space-y-1 max-w-[280px]">
          <h2 className="font-display font-bold text-lg sm:text-xl text-[var(--text-primary)] leading-tight truncate">
            {activeVoluntario?.nome_completo || 'Voluntário'}
          </h2>
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white shadow-xs truncate max-w-[220px]"
              style={{ backgroundColor: activeColor }}
            >
              {activeVoluntario?.funcao || activeVoluntario?.area_atuacao || 'Equipe Ádapo'}
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] font-mono-data truncate">
            {activeVoluntario?.email}
          </p>
        </div>

        {/* Controles de Navegação Anterior / Próximo Rápidos */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => select(modIdx(active - 1, M))}
            className="p-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all cursor-pointer shadow-xs"
            title="Voluntário Anterior"
            aria-label="Voluntário Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono-data text-[var(--text-muted)]">
            {active + 1} de {M}
          </span>
          <button
            type="button"
            onClick={() => select(modIdx(active + 1, M))}
            className="p-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all cursor-pointer shadow-xs"
            title="Próximo Voluntário"
            aria-label="Próximo Voluntário"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── ESTEIRA EM ARCO CURVADO ORIGIN KIT (BUTTON CAROUSEL) ── */}
      <div
        className="relative w-full overflow-hidden flex-0 shrink-0"
        style={{ height: stripHeight }}
      >
        {renderItems.map((itemIdx) => {
          const slot = getVisualSlot(itemIdx);
          const { x, y, deg, scale, opacity, zIndex } = slotStyle(slot);
          const isActive = itemIdx === active;
          const item = voluntarios[itemIdx];
          const itemColor = CORES_PALETA[itemIdx % CORES_PALETA.length];

          if (!item) return null;

          return (
            <div
              key={item.id || itemIdx}
              style={{
                position: 'absolute',
                left: '50%',
                top: baseTop,
                marginLeft: -buttonSize / 2,
                marginTop: -buttonSize / 2,
                width: buttonSize,
                height: buttonSize,
                transform: `translate(${x}px, ${y}px) rotate(${deg}deg) scale(${scale})`,
                transformOrigin: 'center',
                opacity,
                zIndex,
                willChange: 'transform, opacity',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: buttonRadius,
                  overflow: 'hidden',
                  position: 'relative',
                  transform: `rotate(${-deg}deg)`,
                  transformOrigin: 'center',
                  cursor: 'pointer',
                  border: isActive ? `3px solid var(--color-primary)` : `2px solid var(--border-strong)`,
                  boxShadow: isActive ? `0 0 16px ${itemColor}80` : '0 2px 6px rgba(0,0,0,0.15)',
                  transition: 'border 0.2s, box-shadow 0.2s',
                }}
                onClick={() => select(itemIdx)}
                title={item.nome_completo}
              >
                {item.avatar_url ? (
                  <img
                    src={item.avatar_url}
                    alt={item.nome_completo}
                    draggable={false}
                    className="w-full h-full object-cover block"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-white font-bold text-xs"
                    style={{ backgroundColor: itemColor }}
                  >
                    {getInitials(item.nome_completo)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
