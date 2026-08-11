'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DetailPanel } from '@/components/ui/DetailPanel';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { createClient } from '@/lib/supabase/client';
import { Plus, Search, User, Phone, Mail, MapPin, Calendar, Trash2, Edit } from 'lucide-react';

interface Beneficiario {
  id: string;
  nome_completo: string;
  data_nascimento: string;
  cpf: string;
  telefone: string;
  email: string | null;
  cidade: string;
  uf: string;
  status: 'ativo' | 'pendente' | 'suspenso';
  escolaridade: string;
  renda_familiar: number;
  num_dependentes: number;
  created_at: string;
}

export default function BeneficiariosPage() {
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [selectedBeneficiario, setSelectedBeneficiario] = useState<Beneficiario | null>(null);

  const fetchBeneficiarios = async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase.from('beneficiarios').select('*').order('created_at', { ascending: false });

    if (statusFilter !== 'todos') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (!error && data) {
      setBeneficiarios(data as Beneficiario[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBeneficiarios();
  }, [statusFilter]);

  const filteredBeneficiarios = beneficiarios.filter(
    (b) =>
      b.nome_completo.toLowerCase().includes(search.toLowerCase()) ||
      b.cpf.includes(search)
  );

  const columns: Column<Beneficiario>[] = [
    {
      key: 'nome_completo',
      header: 'Nome Completo',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold flex items-center justify-center text-xs">
            {item.nome_completo.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-[var(--text-primary)]">{item.nome_completo}</p>
            <p className="text-[11px] font-mono-data text-[var(--text-muted)]">CPF: {item.cpf}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'telefone',
      header: 'Telefone',
      render: (item) => <span className="font-mono-data text-xs">{item.telefone}</span>,
    },
    {
      key: 'cidade',
      header: 'Localidade',
      render: (item) => `${item.cidade}/${item.uf}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        const variants = {
          ativo: 'success',
          pendente: 'warning',
          suspenso: 'danger',
        } as const;
        return <Badge variant={variants[item.status]}>{item.status.toUpperCase()}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Link href={`/dashboard/beneficiarios/${item.id}`}>
            <Button size="sm" variant="ghost" icon={<Edit className="w-3.5 h-3.5" />}>
              Editar
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este beneficiário?')) {
      const supabase = createClient();
      await supabase.from('beneficiarios').delete().eq('id', id);
      setSelectedBeneficiario(null);
      fetchBeneficiarios();
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Gestão de Beneficiários"
        subtitle="Cadastro e histórico de beneficiários atendidos pelo Instituto Ádapo"
        action={
          <Link href="/dashboard/beneficiarios/novo">
            <Button icon={<Plus className="w-4 h-4" />}>Cadastrar Beneficiário</Button>
          </Link>
        }
      />

      <div className="p-8 space-y-6 flex-1 overflow-y-auto">
        {/* Barra de Filtros */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-[var(--shadow-card)]">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Buscar por nome ou CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs text-[var(--text-secondary)] font-medium shrink-0">Filtrar por Status:</span>
            <Select
              options={[
                { value: 'todos', label: 'Todos os Status' },
                { value: 'ativo', label: 'Ativo' },
                { value: 'pendente', label: 'Pendente' },
                { value: 'suspenso', label: 'Suspenso' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Tabela de Dados */}
        {loading ? (
          <div className="p-12 text-center text-sm text-[var(--text-muted)]">Carregando beneficiários...</div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredBeneficiarios}
            keyExtractor={(b) => b.id}
            onRowClick={(b) => setSelectedBeneficiario(b)}
            selectedRowId={selectedBeneficiario?.id}
            emptyMessage="Nenhum beneficiário encontrado. Clique em 'Cadastrar Beneficiário' para adicionar o primeiro."
          />
        )}
      </div>

      {/* Painel Contextual de Detalhes à Direita */}
      <DetailPanel
        isOpen={!!selectedBeneficiario}
        onClose={() => setSelectedBeneficiario(null)}
        title={selectedBeneficiario?.nome_completo || ''}
        subtitle={`Cadastrado em ${new Date(selectedBeneficiario?.created_at || '').toLocaleDateString('pt-BR')}`}
      >
        {selectedBeneficiario && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Badge variant={selectedBeneficiario.status === 'ativo' ? 'success' : 'warning'}>
                {selectedBeneficiario.status.toUpperCase()}
              </Badge>
              <div className="flex items-center gap-2">
                <Link href={`/dashboard/beneficiarios/${selectedBeneficiario.id}`}>
                  <Button size="sm" variant="secondary" icon={<Edit className="w-3.5 h-3.5" />}>
                    Editar
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="danger"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() => handleDelete(selectedBeneficiario.id)}
                >
                  Excluir
                </Button>
              </div>
            </div>

            {/* Informações Pessoais */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Dados Pessoais
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[var(--bg-secondary)]">
                  <span className="text-[var(--text-muted)] block">CPF</span>
                  <span className="font-mono-data font-semibold text-[var(--text-primary)]">
                    {selectedBeneficiario.cpf}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-secondary)]">
                  <span className="text-[var(--text-muted)] block">Data Nascimento</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {new Date(selectedBeneficiario.data_nascimento).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-secondary)]">
                  <span className="text-[var(--text-muted)] block">Telefone</span>
                  <span className="font-mono-data font-semibold text-[var(--text-primary)]">
                    {selectedBeneficiario.telefone}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-secondary)]">
                  <span className="text-[var(--text-muted)] block">Renda Familiar</span>
                  <span className="font-mono-data font-semibold text-[var(--color-success)]">
                    R$ {Number(selectedBeneficiario.renda_familiar).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Localização
              </h4>
              <div className="p-3 rounded-lg bg-[var(--bg-secondary)] text-xs space-y-1">
                <p className="font-medium text-[var(--text-primary)]">
                  {selectedBeneficiario.cidade} / {selectedBeneficiario.uf}
                </p>
              </div>
            </div>
          </div>
        )}
      </DetailPanel>
    </div>
  );
}
