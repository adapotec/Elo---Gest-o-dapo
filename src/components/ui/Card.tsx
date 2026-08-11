'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  title?: string;
  subtitle?: string;
  value?: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({
  title,
  subtitle,
  value,
  icon,
  trend,
  children,
  className,
  style,
}: CardProps) {
  return (
    <div
      style={style}
      className={twMerge(
        clsx(
          'p-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] transition-all hover:border-[var(--border-strong)]',
          className
        )
      )}
    >
      {(title || icon) && (
        <div className="flex items-center justify-between mb-2">
          {title && <span className="text-sm font-medium text-[var(--text-secondary)]">{title}</span>}
          {icon && <div className="p-2 rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)]">{icon}</div>}
        </div>
      )}

      {value !== undefined && (
        <div className="flex items-baseline gap-2 mt-1">
          <span className="font-display text-2xl font-bold text-[var(--text-primary)]">{value}</span>
          {trend && (
            <span
              className={clsx(
                'text-xs font-semibold px-1.5 py-0.5 rounded',
                trend.isPositive
                  ? 'bg-[var(--color-success-soft)] text-[var(--color-success)]'
                  : 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]'
              )}
            >
              {trend.isPositive ? '+' : ''}{trend.value}
            </span>
          )}
        </div>
      )}

      {subtitle && <p className="text-xs text-[var(--text-muted)] mt-1">{subtitle}</p>}

      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
