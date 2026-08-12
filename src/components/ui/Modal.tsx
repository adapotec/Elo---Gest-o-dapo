'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidth = 'md',
  className,
}: ModalProps) {
  // Fechar modal ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Travar scroll do body quando o modal estiver aberto
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

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop semi-transparente com blur suave */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Janela Principal do Modal */}
      <div
        className={twMerge(
          clsx(
            'relative w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 card-contrast flex flex-col max-h-[90vh]',
            maxWidthClasses[maxWidth],
            className
          )
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 border-b border-[var(--border-default)] bg-[var(--bg-elevated)] shrink-0">
          <div className="flex items-start gap-3 min-w-0 pr-4">
            {icon && (
              <div className="p-2.5 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold font-display text-[var(--text-primary)] leading-tight truncate">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors shrink-0"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Rolável) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1 text-[var(--text-primary)]">
          {children}
        </div>

        {/* Modal Footer (Opcional) */}
        {footer && (
          <div className="p-4 sm:p-5 border-t border-[var(--border-default)] bg-[var(--bg-elevated)] flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
