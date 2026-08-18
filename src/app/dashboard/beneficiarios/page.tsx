'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DetailPanel } from '@/components/ui/DetailPanel';
import { Select } from '@/components/ui/Select';
import { createClient } from '@/lib/supabase/client';
import { Plus, Search, User, Phone, MapPin, Calendar, Trash2, Edit, HeartHandshake } from 'lucide-react';

interface Beneficiario {
  id: string;
  nome_completo: string;
  data_nascimento: string;
  genero?: string;
  cpf?: string;
  telefone?: string;
  nome_responsavel?: string;
  parentesco_responsavel?: string;
  telefone_responsavel?: string;
  comunidade?: string;
  bairro?: string;
  cidade: string;
  uf: string;
  status: 'ativo' | 'pendente' | 'suspenso';
  escolaridade?: string;
  renda_familiar?: number;
  num_dependentes?: number;
  observacoes?: string;
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
    let query = supabase.from('beneficiarios').select('*').order('nome_completo', { ascending: true });

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

  const calcularIdade = (dataNasc?: string) => {
    if (!dataNasc) return null;
    const nasc = new Date(dataNasc);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      idade--;
    }
    return idade;
  };

  const filteredBeneficiarios = beneficiarios.filter((b) => {
    const q = search.toLowerCase();
    const matchNome = b.nome_completo?.toLowerCase().includes(q);
    const matchComunidade = b.comunidade?.toLowerCase().includes(q) || b.bairro?.toLowerCase().includes(q);
    const matchResp = b.nome_responsavel?.toLowerCase().includes(q);
    const matchCpf = b.cpf ? b.cpf.includes(q) : false;
    return matchNome || matchComunidade || matchResp || matchCpf;
  });

  const columns: Column<Beneficiario>[] = [
    {
      key: 'nome_completo',
      header: 'Criança / Beneficiário',
      render: (item) => {
        const idade = calcularIdade(item.data_nascimento);
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)]/15 text-[var(--color-primary)] font-bold flex items-center justify-center text-xs shrink-0">
              {item.nome_completo.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-xs text-[var(--text-primary)] truncate">{item.nome_completo}</p>
              <p className="text-[11px] text-[var(--text-muted)]">
                {idade !== null ? `${idade} anos` : 'Idade não inf.'} {item.genero ? `• ${item.genero}` : ''}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'comunidade',
      header: 'Comunidade / Território',
      render: (item) => (
        <span className="text-xs font-medium text-[var(--text-secondary)]">
          {item.comunidade || item.bairro || 'São Luís/MA'}
        </span>
      ),
    },
    {
      key: 'nome_responsavel',
      header: 'Responsável & Contato',
      render: (item) => (
        <div className="text-xs min-w-0">
          <p className="font-medium text-[var(--text-primary)] truncate">
            {item.nome_responsavel || '—'}
          </p>
          <p className="text-[11px] font-mono-data text-[var(--text-muted)]">
            {item.telefone_responsavel || item.telefone || 'Sem contato'}
          </p>
        </div>
      ),
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
        return <Badge variant={variants[item.status] || 'neutral'}>{item.status.toUpperCase()}</Badge>;
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
    if (confirm('Tem certeza que deseja remover esta criança?')) {
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
        subtitle={`Banco de dados de crianças e adolescentes do Instituto Ádapo (${beneficiarios.length} cadastrados)`}
        action={
          <Link href="/dashboard/beneficiarios/novo">
            <Button icon={<Plus className="w-4 h-4" />}>Cadastrar Criança</Button>
          </Link>
        }
      />

      <div className="p-4 sm:p-8 space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
        {/* Barra de Filtros */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-[var(--shadow-card)]">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Buscar por criança, responsável ou território..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg text-xs bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs text-[var(--text-secondary)] font-medium shrink-0">Status:</span>
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
          <div className="p-12 text-center text-xs text-[var(--text-muted)]">Carregando banco de dados...</div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredBeneficiarios}
            keyExtractor={(b) => b.id}
            onRowClick={(b) => setSelectedBeneficiario(b)}
            selectedRowId={selectedBeneficiario?.id}
            emptyMessage="Nenhuma criança encontrada."
          />
        )}
      </div>

      {/* Painel Contextual de Detalhes à Direita */}
      <DetailPanel
        isOpen={!!selectedBeneficiario}
        onClose={() => setSelectedBeneficiario(null)}
        title={selectedBeneficiario?.nome_completo || ''}
        subtitle={
          selectedBeneficiario?.data_nascimento
            ? `Nasc: ${new Date(selectedBeneficiario.data_nascimento).toLocaleDateString('pt-BR')} (${calcularIdade(selectedBeneficiario.data_nascimento)} anos)`
            : 'Beneficiário Ádapo'
        }
      >
        {selectedBeneficiario && (
          <div className="space-y-5 text-xs">
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

            {/* Informações da Criança */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                Dados da Criança
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)]">
                  <span className="text-[10px] text-[var(--text-muted)] block">Gênero</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {selectedBeneficiario.genero || 'Não informado'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)]">
                  <span className="text-[10px] text-[var(--text-muted)] block">Escolaridade</span>
                  <span className="font-semibold text-[var(--text-primary)] truncate block">
                    {selectedBeneficiario.escolaridade || 'Não informada'}
                  </span>
                </div>
              </div>
            </div>

            {/* Informações do Responsável */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                Responsável Legal
              </h4>
              <div className="p-3 rounded-lg bg-[var(--bg-secondary)] space-y-1">
                <p className="font-semibold text-[var(--text-primary)]">
                  {selectedBeneficiario.nome_responsavel || 'Nome não informado'}
                  {selectedBeneficiario.parentesco_responsavel ? ` (${selectedBeneficiario.parentesco_responsavel})` : ''}
                </p>
                <p className="text-[11px] font-mono-data text-[var(--text-muted)] flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[var(--color-primary)]" />
                  {selectedBeneficiario.telefone_responsavel || selectedBeneficiario.telefone || 'Sem telefone'}
                </p>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                Território & Endereço
              </h4>
              <div className="p-3 rounded-lg bg-[var(--bg-secondary)] space-y-1">
                <p className="font-semibold text-[var(--text-primary)]">
                  {selectedBeneficiario.comunidade || selectedBeneficiario.bairro || 'Sem comunidade informada'}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {selectedBeneficiario.cidade} / {selectedBeneficiario.uf}
                </p>
              </div>
            </div>

            {selectedBeneficiario.observacoes && (
              <div className="space-y-1 p-2.5 rounded-lg bg-[var(--bg-secondary)]/50 border border-[var(--border-default)]">
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Observações</span>
                <p className="text-[11px] text-[var(--text-secondary)]">{selectedBeneficiario.observacoes}</p>
              </div>
            )}
          </div>
        )}
      </DetailPanel>
    </div>
  );
}
