'use client';

import React from 'react';
import { Search, Bell, User } from 'lucide-react';

interface TopbarProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function Topbar({ title, subtitle, action }: TopbarProps) {
  return (
    <header className="min-h-[64px] py-3 px-6 border-b border-[var(--border-default)] bg-[var(--bg-elevated)] flex flex-col lg:flex-row lg:items-center justify-between gap-3 sticky top-0 z-20 shadow-xs">
      <div className="min-w-0">
        {title && (
          <h2 className="font-display font-bold text-lg md:text-xl text-[var(--text-primary)] leading-snug">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
        {/* Global Search Input */}
        <div className="relative w-36 lg:w-48 hidden sm:block">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
          />
        </div>

        {/* Action Button if passed */}
        {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}

        {/* Notifications Icon */}
        <button
          className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors relative shrink-0 cursor-pointer"
          aria-label="Notificações"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] absolute top-1.5 right-1.5" />
        </button>
      </div>
    </header>
  );
}
