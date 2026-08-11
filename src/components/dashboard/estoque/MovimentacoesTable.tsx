'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ArrowDownRight, ArrowUpRight, Calendar, Building2, FolderKanban } from 'lucide-react';

export interface MovimentacaoEstoque {
  id: string;
  item_id: string;
  fornecedor_id: string | null;
  projeto_id: string | null;
  lote: number;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  data_movimentacao: string;
  observacao: string | null;
  validade: string | null;
  estoque_itens?: {
    nome: string;
    categoria: string;
    unidade_medida: string;
  } | null;
  fornecedores?: {
    nome: string;
  } | null;
  projetos_sociais?: {
    nome: string;
  } | null;
}

interface MovimentacoesTableProps {
  movimentacoes: MovimentacaoEstoque[];
  loading: boolean;
}

export function MovimentacoesTable({ movimentacoes, loading }: MovimentacoesTableProps) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-[var(--text-primary)]">
          <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-default)] text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            <tr>
              <th className="p-4">Lote / Data</th>
              <th className="p-4">Tipo</th>
              <th className="p-4">Item</th>
              <th className="p-4">Quantidade</th>
              <th className="p-4">Origem / Destino</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-default)]">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[var(--text-muted)]">
                  Carregando movimentações...
                </td>
              </tr>
            ) : movimentacoes.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[var(--text-muted)]">
                  Nenhuma movimentação registrada.
                </td>
              </tr>
            ) : (
              movimentacoes.map((mov) => (
                <tr key={mov.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                  <td className="p-4">
                    <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                      Lote #{mov.lote}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(mov.data_movimentacao).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </td>

                  <td className="p-4">
                    <Badge variant={mov.tipo === 'entrada' ? 'primary' : 'danger'}>
                      <span className="flex items-center gap-1">
                        {mov.tipo === 'entrada' ? (
                          <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5 text-red-500" />
                        )}
                        {mov.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                    </Badge>
                  </td>

                  <td className="p-4">
                    <p className="font-semibold text-[var(--text-primary)]">
                      {mov.estoque_itens?.nome || 'Item não especificado'}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {mov.estoque_itens?.categoria || 'Geral'}
                    </p>
                  </td>

                  <td className="p-4 font-bold text-[var(--text-primary)]">
                    {mov.quantidade} {mov.estoque_itens?.unidade_medida || 'un'}
                  </td>

                  <td className="p-4 text-xs text-[var(--text-secondary)] space-y-0.5">
                    {mov.fornecedores?.nome && (
                      <div className="flex items-center gap-1 text-xs">
                        <Building2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span>Fornecedor: {mov.fornecedores.nome}</span>
                      </div>
                    )}
                    {mov.projetos_sociais?.nome && (
                      <div className="flex items-center gap-1 text-xs">
                        <FolderKanban className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                        <span>Projeto: {mov.projetos_sociais.nome}</span>
                      </div>
                    )}
                    {!mov.fornecedores?.nome && !mov.projetos_sociais?.nome && (
                      <span className="text-[var(--text-muted)]">Movimentação avulsa</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
