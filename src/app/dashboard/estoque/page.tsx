'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DetailPanel } from '@/components/ui/DetailPanel';
import { createClient } from '@/lib/supabase/client';
import { EstoqueTable, type EstoqueItem } from '@/components/dashboard/estoque/EstoqueTable';
import { MovimentacoesTable, type MovimentacaoEstoque } from '@/components/dashboard/estoque/MovimentacoesTable';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Truck,
  ClipboardList,
  Layers,
} from 'lucide-react';

interface RequisicaoMaterial {
  id: string;
  projeto_id: string;
  item_nome: string;
  categoria: string | null;
  quantidade_solicitada: number;
  quantidade_liberada: number;
  valor_unitario: number | null;
  status: string;
  estoque_item_id: string | null;
  observacao_estoque: string | null;
  created_at: string;
  projetos_sociais?: {
    id: string;
    nome: string;
    cor_identificacao: string | null;
  } | null;
}

export default function GestaoEstoquePage() {
  const [activeTab, setActiveTab] = useState<'itens' | 'movimentacoes' | 'requisicoes'>('itens');
  const [loading, setLoading] = useState(true);

  const [itens, setItens] = useState<EstoqueItem[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [requisicoes, setRequisicoes] = useState<RequisicaoMaterial[]>([]);

  const [searchItens, setSearchItens] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('todas');
  const [selectedItem, setSelectedItem] = useState<EstoqueItem | null>(null);

  useEffect(() => {
    fetchDados();
  }, []);

  async function fetchDados() {
    try {
      setLoading(true);
      const supabase = createClient();

      // 1. Buscar Itens de Estoque
      const { data: itensData } = await supabase
        .from('estoque_itens')
        .select('*')
        .order('nome', { ascending: true });

      setItens(itensData || []);

      // 2. Buscar Movimentações
      const { data: movData } = await supabase
        .from('estoque_movimentacoes')
        .select(`
          *,
          estoque_itens (nome, categoria, unidade_medida),
          fornecedores (nome),
          projetos_sociais (nome)
        `)
        .order('data_movimentacao', { ascending: false });

      setMovimentacoes(movData || []);

      // 3. Buscar Requisições de Material
      const { data: reqData } = await supabase
        .from('requisicoes_material')
        .select(`
          *,
          projetos_sociais (id, nome, cor_identificacao)
        `)
        .order('created_at', { ascending: false });

      setRequisicoes(reqData || []);
    } catch (err) {
      console.error('Erro ao buscar dados do estoque:', err);
    } finally {
      setLoading(false);
    }
  }

  const itensFiltrados = itens.filter((i) => {
    const matchesSearch =
      i.nome.toLowerCase().includes(searchItens.toLowerCase()) ||
      (i.categoria && i.categoria.toLowerCase().includes(searchItens.toLowerCase()));

    const matchesCategoria = selectedCategoria === 'todas' || i.categoria === selectedCategoria;

    return matchesSearch && matchesCategoria;
  });

  const totalItensCount = itens.length;
  const totalEstoqueBaixo = itens.filter((i) => i.quantidade <= (i.quantidade_minima || 10)).length;
  const categoriasUnicas = Array.from(new Set(itens.map((i) => i.categoria).filter(Boolean)));

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Topbar
        title="Controle de Estoque & Suprimentos"
        subtitle="Gerencie inventário, entradas/saídas com lote e requisições de materiais para projetos"
        action={
          <div className="flex gap-2">
            <Link href="/dashboard/fornecedores">
              <Button size="sm" variant="secondary" icon={<Truck className="w-4 h-4" />}>
                Fornecedores
              </Button>
            </Link>
            <Link href="/dashboard/estoque/movimentacao">
              <Button size="sm" variant="primary" icon={<Plus className="w-4 h-4" />}>
                Registrar Movimentação
              </Button>
            </Link>
          </div>
        }
      />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 flex items-center gap-4 border-l-4 border-l-[#8B4A2E]">
            <div className="p-3 rounded-xl bg-[#8B4A2E]/10 text-[#8B4A2E]">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Total de Itens</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{totalItensCount}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4 border-l-4 border-l-amber-500">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Alertas de Estoque Baixo</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{totalEstoqueBaixo}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4 border-l-4 border-l-blue-500">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Requisições de Material</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{requisicoes.length}</p>
            </div>
          </Card>
        </div>

        {/* Abas */}
        <div className="flex items-center gap-2 border-b border-[var(--border-default)]">
          <button
            onClick={() => setActiveTab('itens')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'itens'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Package className="w-4 h-4" />
            Saldo de Itens ({itens.length})
          </button>

          <button
            onClick={() => setActiveTab('movimentacoes')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'movimentacoes'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            Movimentações & Lotes ({movimentacoes.length})
          </button>

          <button
            onClick={() => setActiveTab('requisicoes')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'requisicoes'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Requisições de Projetos ({requisicoes.length})
          </button>
        </div>

        {/* Conteúdo Aba Itens */}
        {activeTab === 'itens' && (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <Input
                    placeholder="Buscar item..."
                    value={searchItens}
                    onChange={(e) => setSearchItens(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select
                  value={selectedCategoria}
                  onChange={(e) => setSelectedCategoria(e.target.value)}
                  className="w-full md:w-48"
                >
                  <option value="todas">Todas as Categorias</option>
                  {categoriasUnicas.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </Select>
              </div>
            </Card>

            <EstoqueTable
              itens={itensFiltrados}
              loading={loading}
              onSelectItem={(item) => setSelectedItem(item)}
            />
          </div>
        )}

        {/* Conteúdo Aba Movimentações */}
        {activeTab === 'movimentacoes' && (
          <MovimentacoesTable movimentacoes={movimentacoes} loading={loading} />
        )}

        {/* Conteúdo Aba Requisições */}
        {activeTab === 'requisicoes' && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[var(--text-primary)]">
                <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-default)] text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  <tr>
                    <th className="p-4">Projeto Social</th>
                    <th className="p-4">Item Solicitado</th>
                    <th className="p-4">Qtd. Solicitada / Liberada</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-default)]">
                  {requisicoes.map((req) => (
                    <tr key={req.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                      <td className="p-4 font-semibold text-[var(--text-primary)]">
                        {req.projetos_sociais?.nome || 'Projeto Geral'}
                      </td>
                      <td className="p-4 text-[var(--text-primary)]">{req.item_nome}</td>
                      <td className="p-4 font-bold text-[var(--text-primary)]">
                        {req.quantidade_solicitada} / {req.quantidade_liberada}
                      </td>
                      <td className="p-4">
                        <Badge variant={req.status === 'liberado' ? 'primary' : 'warning'}>
                          {req.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Detalhe do Item Modal */}
        {selectedItem && (
          <DetailPanel
            title="Detalhes do Item de Estoque"
            subtitle={selectedItem.nome}
            onClose={() => setSelectedItem(null)}
          >
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[var(--text-muted)] uppercase font-semibold">Nome do Item</label>
                <p className="font-bold text-[var(--text-primary)] text-base">{selectedItem.nome}</p>
              </div>

              <div>
                <label className="text-xs text-[var(--text-muted)] uppercase font-semibold">Saldo Atual</label>
                <p className="font-bold text-xl text-[var(--color-primary)]">
                  {selectedItem.quantidade} {selectedItem.unidade_medida || 'un'}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Mínimo configurado: {selectedItem.quantidade_minima || 10}
                </p>
              </div>

              <div>
                <label className="text-xs text-[var(--text-muted)] uppercase font-semibold">Localização</label>
                <p className="text-sm text-[var(--text-secondary)]">
                  {selectedItem.localizacao || 'Depósito Principal'}
                </p>
              </div>
            </div>
          </DetailPanel>
        )}
      </main>
    </div>
  );
}
