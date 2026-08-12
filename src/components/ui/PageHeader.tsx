'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon,
  badge,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={twMerge(
        clsx(
          'flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-default)]',
          className
        )
      )}
    >
      <div className="flex items-start gap-3.5 min-w-0">
        {icon && (
          <div className="p-2.5 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] shrink-0 shadow-2xs">
            {icon}
          </div>
        )}

        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold font-display text-[var(--text-primary)] leading-tight tracking-tight">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-3xl">
              {description}
            </p>
          )}
        </div>
      </div>

      {action && <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">{action}</div>}
    </div>
  );
}
