'use client';

import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  selectedRowId?: string | null;
  emptyMessage?: string;
  loading?: boolean;
  rowClassName?: (item: T) => string;
  rowStyle?: (item: T) => React.CSSProperties;
  rowAccentColor?: (item: T) => string | undefined;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  selectedRowId,
  emptyMessage = 'Nenhum registro encontrado.',
  loading = false,
  rowClassName,
  rowStyle,
  rowAccentColor,
}: DataTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] custom-scrollbar">
      <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-full">
        <thead>
          <tr className="border-b border-[var(--border-default)] bg-[var(--bg-secondary)]/50">
            {columns.map((col) => (
              <th
                key={col.key}
                style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                className={`py-3.5 px-3 sm:px-4 font-bold text-[11px] text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap ${
                  col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                } ${col.headerClassName || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-default)]">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-[var(--text-muted)]">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-medium">Carregando dados...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-xs text-[var(--text-muted)] font-medium">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => {
              const id = keyExtractor(item);
              const isSelected = selectedRowId === id;
              const accentColor = rowAccentColor ? rowAccentColor(item) : undefined;
              const customStyle = rowStyle ? rowStyle(item) : undefined;
              const customClass = rowClassName ? rowClassName(item) : '';

              const combinedRowStyle: React.CSSProperties = {
                ...(accentColor
                  ? {
                      background: `linear-gradient(90deg, ${accentColor}18 0%, ${accentColor}06 180px, transparent 380px)`,
                    }
                  : {}),
                ...customStyle,
              };

              return (
                <tr
                  key={id}
                  onClick={() => onRowClick && onRowClick(item)}
                  style={combinedRowStyle}
                  className={`transition-all duration-150 min-h-[44px] ${
                    onRowClick ? 'cursor-pointer active:bg-[var(--bg-secondary)]' : ''
                  } ${
                    accentColor
                      ? 'hover:brightness-95 dark:hover:brightness-110'
                      : onRowClick
                      ? 'hover:bg-[var(--bg-secondary)]/60'
                      : 'hover:bg-[var(--bg-secondary)]/30'
                  } ${isSelected ? 'bg-[var(--color-primary)]/10 font-medium' : ''} ${customClass}`}
                >
                  {columns.map((col, colIdx) => {
                    const isFirstCol = colIdx === 0;
                    const tdStyle: React.CSSProperties = {
                      ...(col.width ? { width: col.width, minWidth: col.width } : {}),
                      ...(isFirstCol && accentColor ? { borderLeft: `5px solid ${accentColor}` } : {}),
                    };

                    return (
                      <td
                        key={col.key}
                        style={tdStyle}
                        className={`py-3 px-3 sm:px-4 text-[var(--text-primary)] ${
                          col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                        } ${col.className || ''}`}
                      >
                        {col.render ? col.render(item) : (item as any)[col.key]}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
