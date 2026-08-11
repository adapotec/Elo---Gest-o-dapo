'use client';

import React from 'react';
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[var(--bg-elevated)] border-l border-[var(--border-default)] shadow-2xl flex flex-col transition-transform animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-[var(--border-default)] bg-[var(--bg-secondary)]/30">
        <div>
          <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">{title}</h3>
          {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Fechar painel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {children}
      </div>
    </div>
  );
}
