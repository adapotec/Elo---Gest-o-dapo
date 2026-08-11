'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Eye, Package } from 'lucide-react';

export interface EstoqueItem {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: string;
  quantidade: number;
  quantidade_minima: number;
  unidade_medida: string;
  localizacao: string | null;
  updated_at: string | null;
}

interface EstoqueTableProps {
  itens: EstoqueItem[];
  loading: boolean;
  onSelectItem: (item: EstoqueItem) => void;
}

export function EstoqueTable({ itens, loading, onSelectItem }: EstoqueTableProps) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-[var(--text-primary)]">
          <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-default)] text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            <tr>
              <th className="p-4">Item & Descrição</th>
              <th className="p-4">Categoria</th>
              <th className="p-4">Saldo em Estoque</th>
              <th className="p-4">Localização</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-default)]">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[var(--text-muted)]">
                  Carregando itens de estoque...
                </td>
              </tr>
            ) : itens.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[var(--text-muted)]">
                  Nenhum item encontrado no estoque.
                </td>
              </tr>
            ) : (
              itens.map((item) => {
                const isBaixo = item.quantidade <= (item.quantidade_minima || 10);

                return (
                  <tr key={item.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold flex items-center justify-center text-sm shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">{item.nome}</p>
                          {item.descricao && (
                            <p className="text-xs text-[var(--text-muted)] line-clamp-1">{item.descricao}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-xs text-[var(--text-secondary)]">
                      <Badge variant="neutral">{item.categoria || 'Geral'}</Badge>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-[var(--text-primary)]">
                          {item.quantidade} {item.unidade_medida || 'un'}
                        </span>
                        {isBaixo && (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900"
                            title={`Abaixo do mínimo de ${item.quantidade_minima || 10}`}
                          >
                            <AlertTriangle className="w-3 h-3" />
                            Estoque Baixo
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-xs text-[var(--text-secondary)]">
                      {item.localizacao || 'Depósito Principal'}
                    </td>

                    <td className="p-4 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onSelectItem(item)}
                        icon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Detalhes
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
