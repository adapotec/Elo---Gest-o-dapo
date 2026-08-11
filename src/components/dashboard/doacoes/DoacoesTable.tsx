'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Eye, DollarSign, Calendar } from 'lucide-react';

export interface Doacao {
  id: string;
  tipo: 'financeira' | 'item';
  nome_doador: string;
  cpf_cnpj_doador: string | null;
  telefone_doador: string | null;
  email_doador: string | null;
  valor: number;
  categoria: string;
  forma_pagamento: string;
  data_doacao: string;
  descricao: string | null;
  comprovante_url: string | null;
  observacoes: string | null;
  item_quantidade?: number;
  item_unidade?: string;
  created_at: string;
  programa_captacao_id?: string | null;
  programas_captacao?: {
    nome: string;
  } | null;
}

interface DoacoesTableProps {
  doacoes: Doacao[];
  loading: boolean;
  onSelectDoacao: (doacao: Doacao) => void;
}

export function DoacoesTable({ doacoes, loading, onSelectDoacao }: DoacoesTableProps) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-[var(--text-primary)]">
          <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-default)] text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            <tr>
              <th className="p-4">Doador / Origem</th>
              <th className="p-4">Tipo & Categoria</th>
              <th className="p-4">Valor / Item</th>
              <th className="p-4">Data & Pagamento</th>
              <th className="p-4 text-right">Detalhes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-default)]">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[var(--text-muted)]">
                  Carregando registros de doações...
                </td>
              </tr>
            ) : doacoes.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[var(--text-muted)]">
                  Nenhuma doação encontrada para os filtros selecionados.
                </td>
              </tr>
            ) : (
              doacoes.map((item) => (
                <tr key={item.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                  <td className="p-4">
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">
                        {item.nome_doador || 'Doador Anônimo'}
                      </p>
                      {item.programas_captacao?.nome && (
                        <span className="text-[11px] text-[var(--color-primary)] font-medium">
                          Programa: {item.programas_captacao.nome}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-4 space-y-1">
                    <Badge variant={item.tipo === 'financeira' ? 'primary' : 'warning'}>
                      {item.tipo === 'financeira' ? 'Financeira' : 'Em Itens'}
                    </Badge>
                    <p className="text-xs text-[var(--text-muted)]">{item.categoria || 'Geral'}</p>
                  </td>

                  <td className="p-4">
                    {item.tipo === 'financeira' ? (
                      <span className="font-bold text-[var(--text-primary)] flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                        {item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    ) : (
                      <span className="font-medium text-[var(--text-primary)]">
                        {item.item_quantidade || 1} {item.item_unidade || 'un'} — {item.descricao || 'Itens diversos'}
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-xs text-[var(--text-secondary)]">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <span>{new Date(item.data_doacao).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)]">{item.forma_pagamento || 'Pix'}</p>
                  </td>

                  <td className="p-4 text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onSelectDoacao(item)}
                      icon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Ver
                    </Button>
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
