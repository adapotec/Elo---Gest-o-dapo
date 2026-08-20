'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ShieldCheck, UserCheck } from 'lucide-react';
import { EloLogo } from '@/components/ui/EloLogo';

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

export function VolunteerCarousel({
  voluntarios,
  selectedIndex,
  onSelectVoluntario,
}: VolunteerCarouselProps) {
  const N = voluntarios.length;
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  // Dimensões exatas e coordenadas matemáticas da Ciranda
  const CONTAINER_SIZE = 290;
  const CENTER = CONTAINER_SIZE / 2; // 145px
  const ORBIT_RADIUS = 105; // Raio exato da órbita
  const NODE_SIZE = 36; // Tamanho de cada bolinha na órbita (36x36px)
  const NODE_HALF = NODE_SIZE / 2; // 18px

  // Pré-carregamento imediato em background de todas as fotos
  useEffect(() => {
    voluntarios.forEach((vol) => {
      if (vol.avatar_url) {
        const img = new Image();
        img.src = vol.avatar_url;
        img.onload = () => {
          setLoadedImages((prev) => ({ ...prev, [vol.avatar_url!]: true }));
        };
      }
    });
  }, [voluntarios]);

  const activeVoluntario = voluntarios[selectedIndex] || null;
  const activeColor = CORES_PALETA[selectedIndex % CORES_PALETA.length];

  const handleSelect = useCallback(
    (index: number) => {
      const idx = modIdx(index, N);
      if (voluntarios[idx]) {
        onSelectVoluntario(voluntarios[idx], idx);
      }
    },
    [N, voluntarios, onSelectVoluntario]
  );

  if (N === 0) return null;

  return (
    <div className="relative w-full flex flex-col items-center justify-center select-none pt-1 pb-1">
      {/* ── LOGO DO ELO + BRANDING INSTITUCIONAL (TOPO ELEGANTE E EQUILIBRADO) ── */}
      <div className="flex flex-col items-center justify-center text-center gap-1 mb-3 w-full">
        {/* Logo do Elo */}
        <EloLogo className="w-16 h-16 sm:w-18 sm:h-18 drop-shadow-xs transition-all duration-300" />
        
        <div className="flex flex-col items-center text-center min-w-0 space-y-0.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] text-[10px] font-bold uppercase tracking-widest border border-[var(--color-primary)]/20">
            Instituto Ádapo
          </div>
          <h1 className="font-display font-extrabold text-lg sm:text-xl text-[var(--text-primary)] tracking-tight">
            ELO <span className="font-medium text-[var(--text-muted)]">| Gestão Integrada</span>
          </h1>
          <p className="text-[11px] text-[var(--color-primary)] font-semibold italic">
            "Dando linha pra sonhar"
          </p>
        </div>
      </div>

      {/* ── CONTAINER DA CIRANDA ORBITAL ── */}
      <div
        className="relative flex items-center justify-center shrink-0 my-1"
        style={{ width: CONTAINER_SIZE, height: CONTAINER_SIZE }}
      >
        {/* Linha da Órbita Circular em SVG perfeitamente concêntrica */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${CONTAINER_SIZE} ${CONTAINER_SIZE}`}
        >
          <circle
            cx={CENTER}
            cy={CENTER}
            r={ORBIT_RADIUS}
            fill="none"
            stroke="var(--border-strong)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="opacity-50"
          />
        </svg>

        {/* ── NÓ CENTRAL (PERFIL ATIVO SELECIONADO - DESIGN LIMPO E NÍTIDO) ── */}
        <div className="relative z-20 flex flex-col items-center justify-center">
          <div className="relative w-24 h-24 sm:w-26 sm:h-26 rounded-full bg-[var(--bg-elevated)] border-2 border-[var(--border-strong)] shadow-md flex items-center justify-center p-1 transition-all duration-200">
            <div className="w-full h-full rounded-full overflow-hidden bg-[var(--bg-secondary)] flex items-center justify-center relative">
              {activeVoluntario?.avatar_url && loadedImages[activeVoluntario.avatar_url] ? (
                <img
                  src={activeVoluntario.avatar_url}
                  alt={activeVoluntario.nome_completo}
                  className="w-full h-full object-cover animate-in fade-in duration-150"
                  draggable={false}
                  loading="eager"
                />
              ) : activeVoluntario?.avatar_url ? (
                <div
                  className="w-full h-full flex items-center justify-center text-white font-display font-bold text-2xl"
                  style={{ backgroundColor: activeColor }}
                >
                  {getInitials(activeVoluntario.nome_completo)}
                </div>
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white font-display font-bold text-2xl"
                  style={{ backgroundColor: activeColor }}
                >
                  {getInitials(activeVoluntario?.nome_completo || 'Ádapo')}
                </div>
              )}
            </div>

            {/* Badge de Status Oficial */}
            <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[9px] font-bold shadow-sm flex items-center gap-1 border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-primary)]">
              {activeVoluntario?.hasAccount ? (
                <>
                  <ShieldCheck className="w-2.5 h-2.5 text-[var(--color-success)]" />
                  <span className="text-[var(--color-success)]">Ativo</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-2.5 h-2.5 text-[var(--color-primary)]" />
                  <span className="text-[var(--color-primary)]">1º Acesso</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── VOLUNTÁRIOS DISTRIBUÍDOS EXATAMENTE SOBRE A LINHA DA ÓRBITA ── */}
        {voluntarios.map((vol, idx) => {
          // Ângulo uniforme a partir do topo (-PI/2)
          const angle = (2 * Math.PI * idx) / N - Math.PI / 2;
          const x = CENTER + Math.cos(angle) * ORBIT_RADIUS - NODE_HALF;
          const y = CENTER + Math.sin(angle) * ORBIT_RADIUS - NODE_HALF;
          const isActive = idx === selectedIndex;
          const volColor = CORES_PALETA[idx % CORES_PALETA.length];

          return (
            <button
              key={vol.id || idx}
              type="button"
              onClick={() => handleSelect(idx)}
              title={`${vol.nome_completo} (${vol.funcao || 'Voluntário'})`}
              className={`absolute rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center ${isActive
                ? 'z-30 ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--bg-elevated)] scale-110 shadow-sm'
                : 'z-10 opacity-80 hover:opacity-100 hover:scale-108 hover:z-20 border border-[var(--border-strong)] bg-[var(--bg-secondary)] shadow-xs'
                }`}
              style={{
                left: `${x}px`,
                top: `${y}px`,
                width: `${NODE_SIZE}px`,
                height: `${NODE_SIZE}px`,
              }}
              aria-label={`Selecionar ${vol.nome_completo}`}
            >
              <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                {vol.avatar_url && loadedImages[vol.avatar_url] ? (
                  <img
                    src={vol.avatar_url}
                    alt={vol.nome_completo}
                    className="w-full h-full object-cover"
                    draggable={false}
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-white font-bold text-[11px]"
                    style={{ backgroundColor: volColor }}
                  >
                    {getInitials(vol.nome_completo)}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── DESTAQUE PRINCIPAL: NOME E FUNÇÃO DO PERFIL SELECIONADO (HIERARQUIA FORTE) ── */}
      <div className="text-center space-y-1.5 mt-3 max-w-[340px]">
        <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] leading-none">
          Perfil Selecionado
        </p>

        <h2 className="font-display font-extrabold text-xl sm:text-2xl text-[var(--text-primary)] leading-tight tracking-tight px-2">
          {activeVoluntario?.nome_completo || 'Voluntário'}
        </h2>

        <div className="flex items-center justify-center gap-1.5 flex-wrap pt-0.5">
          <span
            className="px-3 py-0.5 rounded-full text-xs font-bold text-white shadow-xs truncate max-w-[260px]"
            style={{ backgroundColor: activeColor }}
          >
            {activeVoluntario?.funcao || activeVoluntario?.area_atuacao || 'Equipe Ádapo'}
          </span>
        </div>
      </div>
    </div>
  );
}
