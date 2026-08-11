'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'purple' | 'neutral' | 'primary';
  size?: 'sm' | 'md';
  className?: string;
  style?: React.CSSProperties;
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className,
  style,
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full border';

  const variants = {
    primary: 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] border-[var(--color-primary)]/20',
    success: 'bg-[var(--color-success-soft)] text-[var(--color-success)] border-[var(--color-success)]/20',
    warning: 'bg-[var(--color-warning-soft)] text-[var(--text-primary)] border-[var(--color-warning)]/40',
    danger: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)] border-[var(--color-danger)]/20',
    purple: 'bg-[var(--color-primary-soft)] text-[var(--color-accent-purple)] border-[var(--color-accent-purple)]/20',
    neutral: 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-default)]',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))} style={style}>
      {children}
    </span>
  );
}
