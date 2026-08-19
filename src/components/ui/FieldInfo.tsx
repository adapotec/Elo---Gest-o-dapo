'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface FieldInfoProps {
  text: string;
  title?: string;
  position?: 'bottom' | 'top';
  className?: string;
}

export function FieldInfo({
  text,
  title = 'Por que solicitamos este dado?',
  position = 'bottom',
  className = '',
}: FieldInfoProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 200);
  };

  // Fechar com tecla Escape ou clique fora
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [open]);

  return (
    <span
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative inline-flex items-center ml-1.5 align-middle select-none ${className}`}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="w-4 h-4 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-strong)] text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] inline-flex items-center justify-center transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
        title={title}
        aria-label={title}
        aria-expanded={open}
      >
        <HelpCircle className="w-3 h-3 shrink-0 pointer-events-none" />
      </button>

      {open && (
        <div
          role="tooltip"
          className={`absolute right-0 sm:left-0 z-[100] w-72 max-w-[calc(100vw-2.5rem)] p-3.5 rounded-xl bg-[#2B2118] text-[#F3EDE4] shadow-2xl border border-[#4A4235] text-xs transition-opacity duration-200 animate-in fade-in-0 zoom-in-95 ${
            position === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'
          }`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex items-start justify-between gap-2 mb-1.5 border-b border-[#4A4235]/60 pb-1.5">
            <span className="font-bold text-[var(--raw-amarelo)] text-[10.5px] uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-3 h-3 shrink-0" />
              {title}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
              className="text-gray-400 hover:text-white transition-colors p-0.5 rounded cursor-pointer"
              aria-label="Fechar dica"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11.5px] leading-relaxed text-[#E0D7CC] font-normal">{text}</p>
        </div>
      )}
    </span>
  );
}
