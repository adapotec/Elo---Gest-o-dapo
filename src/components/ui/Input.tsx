'use client';

import React, { forwardRef, useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showPasswordToggle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, type, showPasswordToggle = true, ...props }, ref) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const isPassword = type === 'password';
    const effectiveType = isPassword && isPasswordVisible ? 'text' : type;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-[var(--text-secondary)]">
            {label} {props.required && <span className="text-[var(--color-primary)]">*</span>}
          </label>
        )}
        <div className="relative w-full flex items-center">
          <input
            ref={ref}
            type={effectiveType}
            className={twMerge(
              clsx(
                'w-full px-3.5 py-2.5 rounded-xl text-sm bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-default)] transition-colors placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)] disabled:opacity-50 disabled:bg-[var(--bg-secondary)]',
                isPassword && showPasswordToggle && 'pr-11',
                error && 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger-soft)]',
                className
              )
            )}
            {...props}
          />
          {isPassword && showPasswordToggle && (
            <button
              type="button"
              onClick={() => setIsPasswordVisible((prev) => !prev)}
              className="absolute right-3 p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title={isPasswordVisible ? 'Ocultar senha' : 'Exibir senha'}
              aria-label={isPasswordVisible ? 'Ocultar senha' : 'Exibir senha'}
              tabIndex={-1}
            >
              {isPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        {error && <span className="text-xs text-[var(--color-danger)]">{error}</span>}
        {helperText && !error && <span className="text-xs text-[var(--text-muted)]">{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
