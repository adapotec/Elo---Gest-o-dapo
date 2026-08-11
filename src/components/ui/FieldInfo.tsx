'use client';

import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface FieldInfoProps {
  text: string;
  position?: 'bottom' | 'top';
}

export function FieldInfo({ text, position = 'bottom' }: FieldInfoProps) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-block ml-1.5 align-middle">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="w-4 h-4 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] inline-flex items-center justify-center text-[10px] font-bold transition-colors cursor-pointer"
        title="Por que solicitamos este dado?"
        aria-label="Por que solicitamos este dado?"
      >
        ?
      </button>

      {open && (
        <div
          className={`absolute right-0 sm:left-0 z-[100] w-64 max-w-[calc(100vw-2rem)] p-3 rounded-xl bg-[#2B2118] text-[#F3EDE4] shadow-2xl border border-[var(--border-strong)] text-xs animate-in fade-in duration-150 ${
            position === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className="font-bold text-[var(--raw-amarelo)] text-[10px] uppercase tracking-wider flex items-center gap-1">
              <HelpCircle className="w-3 h-3" />
              Por que este dado é necessário?
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-white transition-colors p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] leading-relaxed opacity-95">{text}</p>
        </div>
      )}
    </span>
  );
}
