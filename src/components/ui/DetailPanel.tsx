'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DetailPanelProps {
  isOpen?: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function DetailPanel({
  isOpen = true,
  onClose,
  title,
  subtitle,
  children,
}: DetailPanelProps) {
  // Fechar no ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Trava scroll do body em telas móveis quando aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop escuro clicável */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Painel lateral deslizante */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[var(--bg-elevated)] border-l border-[var(--border-default)] shadow-2xl flex flex-col transition-transform animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border-default)] bg-[var(--bg-secondary)]/40 shrink-0">
          <div className="min-w-0 pr-2">
            <h3 className="font-display text-base sm:text-lg font-bold text-[var(--text-primary)] truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Fechar painel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
