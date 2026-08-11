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
import { Plus, Search, HeartHandshake, Phone, Mail, Calendar, Edit, Trash2, Shield, User, Heart, PhoneCall } from 'lucide-react';

interface Voluntario {
  id: string;
  nome_completo: string;
  cpf: string;
  email: string;
  telefone: string;
  tipo: 'operacional' | 'externo';
  area_atuacao: string | null;
  funcao: string | null;
  data_inicio: string;
  data_fim: string | null;
  status: 'ativo' | 'inativo';
  avatar_url: string | null;
  cep: string | null;
  rua: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  contato_emergencia_nome: string | null;
  contato_emergencia_parentesco: string | null;
  contato_emergencia_telefone: string | null;
  tipo_sanguineo: string | null;
  alergias: string | null;
  medicamentos_uso_continuo: string | null;
  plano_saude: string | null;
  observacoes: string | null;
  created_at: string;
}

export default function VoluntariosPage() {
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [selectedVoluntario, setSelectedVoluntario] = useState<Voluntario | null>(null);

  const fetchVoluntarios = async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase.from('voluntarios').select('*').order('created_at', { ascending: false });

    if (tipoFilter !== 'todos') {
      query = query.eq('tipo', tipoFilter);
    }
    if (statusFilter !== 'todos') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (!error && data) {
      setVoluntarios(data as Voluntario[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVoluntarios();
  }, [tipoFilter, statusFilter]);

  const filteredVoluntarios = voluntarios.filter(
    (v) =>
      v.nome_completo.toLowerCase().includes(search.toLowerCase()) ||
      v.cpf.includes(search) ||
      (v.area_atuacao && v.area_atuacao.toLowerCase().includes(search.toLowerCase()))
  );

  const columns: Column<Voluntario>[] = [
    {
      key: 'nome_completo',
      header: 'Voluntário',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold flex items-center justify-center text-xs overflow-hidden shrink-0">
            {item.avatar_url ? (
              <img src={item.avatar_url} alt={item.nome_completo} className="w-full h-full object-cover" />
            ) : (
              item.nome_completo.charAt(0)
            )}
          </div>
          <div>
            <p className="font-semibold text-[var(--text-primary)]">{item.nome_completo}</p>
            <p className="text-[11px] font-mono-data text-[var(--text-muted)]">CPF: {item.cpf}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo de Voluntário',
      render: (item) => (
        <Badge variant={item.tipo === 'operacional' ? 'purple' : 'neutral'}>
          {item.tipo === 'operacional' ? 'Equipe Operacional' : 'Monitor Externo'}
        </Badge>
      ),
    },
    {
      key: 'area_atuacao',
      header: 'Área / Função',
      render: (item) => (
        <div>
          <p className="font-medium text-xs text-[var(--text-primary)]">{item.area_atuacao || 'Não especificada'}</p>
          <p className="text-[11px] text-[var(--text-muted)]">{item.funcao || 'Voluntário'}</p>
        </div>
      ),
    },
    {
      key: 'telefone',
      header: 'Contato',
      render: (item) => (
        <div className="text-xs">
          <p className="font-mono-data text-[var(--text-primary)]">{item.telefone}</p>
          <p className="text-[11px] text-[var(--text-muted)] truncate max-w-[140px]">{item.email}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge variant={item.status === 'ativo' ? 'success' : 'danger'}>
          {item.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Link href={`/dashboard/voluntarios/${item.id}`}>
            <Button size="sm" variant="ghost" icon={<Edit className="w-3.5 h-3.5" />}>
              Editar
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este voluntário?')) {
      const supabase = createClient();
      await supabase.from('voluntarios').delete().eq('id', id);
      setSelectedVoluntario(null);
      fetchVoluntarios();
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Gestão de Voluntários"
        subtitle="Cadastro da equipe operacional e monitores externos por projeto"
        action={
          <Link href="/dashboard/voluntarios/novo">
            <Button icon={<Plus className="w-4 h-4" />}>Cadastrar Voluntário</Button>
          </Link>
        }
      />

      <div className="p-8 space-y-6 flex-1 overflow-y-auto">
        {/* Barra de Filtros */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-[var(--shadow-card)]">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Buscar por nome, CPF ou área..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Select
              options={[
                { value: 'todos', label: 'Todos os Tipos' },
                { value: 'operacional', label: 'Equipe Operacional' },
                { value: 'externo', label: 'Monitor Externo' },
              ]}
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
            />

            <Select
              options={[
                { value: 'todos', label: 'Todos os Status' },
                { value: 'ativo', label: 'Ativo' },
                { value: 'inativo', label: 'Inativo' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Tabela de Dados */}
        {loading ? (
          <div className="p-12 text-center text-sm text-[var(--text-muted)]">Carregando voluntários...</div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredVoluntarios}
            keyExtractor={(v) => v.id}
            onRowClick={(v) => setSelectedVoluntario(v)}
            selectedRowId={selectedVoluntario?.id}
            emptyMessage="Nenhum voluntário encontrado. Clique em 'Cadastrar Voluntário' para adicionar o primeiro."
          />
        )}
      </div>

      {/* Painel Contextual Lateral */}
      <DetailPanel
        isOpen={!!selectedVoluntario}
        onClose={() => setSelectedVoluntario(null)}
        title={selectedVoluntario?.nome_completo || ''}
        subtitle={
          selectedVoluntario?.tipo === 'operacional'
            ? 'Voluntário da Equipe Operacional Interna'
            : 'Monitor Externo de Projetos Específicos'
        }
      >
        {selectedVoluntario && (
          <div className="space-y-6">
            {/* Foto e Header */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)]">
              <div className="w-16 h-16 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold flex items-center justify-center text-lg overflow-hidden shrink-0 border border-[var(--color-primary)]/30">
                {selectedVoluntario.avatar_url ? (
                  <img src={selectedVoluntario.avatar_url} alt={selectedVoluntario.nome_completo} className="w-full h-full object-cover" />
                ) : (
                  selectedVoluntario.nome_completo.charAt(0)
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <Badge variant={selectedVoluntario.status === 'ativo' ? 'success' : 'danger'}>
                  {selectedVoluntario.status.toUpperCase()}
                </Badge>
                <p className="text-xs text-[var(--text-secondary)] font-medium truncate">
                  {selectedVoluntario.area_atuacao} {selectedVoluntario.funcao ? `• ${selectedVoluntario.funcao}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Link href={`/dashboard/voluntarios/${selectedVoluntario.id}`}>
                <Button size="sm" variant="secondary" icon={<Edit className="w-3.5 h-3.5" />}>
                  Editar Voluntário
                </Button>
              </Link>
              <Button
                size="sm"
                variant="danger"
                icon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={() => handleDelete(selectedVoluntario.id)}
              >
                Excluir
              </Button>
            </div>

            {/* Informações Cadastrais */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Dados Pessoais
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[var(--bg-secondary)]">
                  <span className="text-[var(--text-muted)] block">CPF</span>
                  <span className="font-mono-data font-semibold text-[var(--text-primary)]">
                    {selectedVoluntario.cpf}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-secondary)]">
                  <span className="text-[var(--text-muted)] block">Área de Atuação</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {selectedVoluntario.area_atuacao || 'Geral'}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-secondary)]">
                  <span className="text-[var(--text-muted)] block">Telefone</span>
                  <span className="font-mono-data font-semibold text-[var(--text-primary)]">
                    {selectedVoluntario.telefone}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-secondary)]">
                  <span className="text-[var(--text-muted)] block">Início da Atuação</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {new Date(selectedVoluntario.data_inicio).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Ficha de Saúde de Emergência */}
            {(selectedVoluntario.tipo_sanguineo || selectedVoluntario.alergias || selectedVoluntario.contato_emergencia_nome) && (
              <div className="space-y-3 p-4 rounded-xl bg-[var(--color-danger-soft)]/30 border border-[var(--color-danger)]/20">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-[var(--color-danger)]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-danger)]">
                    Ficha Médica de Emergência
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {selectedVoluntario.tipo_sanguineo && (
                    <div className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)]">
                      <span className="text-[var(--text-muted)] block text-[10px]">Tipo Sanguíneo</span>
                      <span className="font-bold text-[var(--color-danger)]">{selectedVoluntario.tipo_sanguineo}</span>
                    </div>
                  )}
                  {selectedVoluntario.plano_saude && (
                    <div className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)]">
                      <span className="text-[var(--text-muted)] block text-[10px]">Plano de Saúde</span>
                      <span className="font-medium text-[var(--text-primary)]">{selectedVoluntario.plano_saude}</span>
                    </div>
                  )}
                </div>

                {selectedVoluntario.alergias && (
                  <div className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs">
                    <span className="text-[var(--text-muted)] block text-[10px]">Alergias Conhecidas</span>
                    <span className="font-semibold text-[var(--color-danger)]">{selectedVoluntario.alergias}</span>
                  </div>
                )}

                {selectedVoluntario.contato_emergencia_nome && (
                  <div className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs space-y-0.5">
                    <span className="text-[var(--text-muted)] block text-[10px]">Contato de Emergência</span>
                    <p className="font-bold text-[var(--text-primary)]">{selectedVoluntario.contato_emergencia_nome} ({selectedVoluntario.contato_emergencia_parentesco})</p>
                    <p className="font-mono-data text-[var(--color-primary)] font-semibold">{selectedVoluntario.contato_emergencia_telefone}</p>
                  </div>
                )}
              </div>
            )}

            {selectedVoluntario.observacoes && (
              <div className="space-y-1">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Observações
                </h4>
                <p className="text-xs p-3 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                  {selectedVoluntario.observacoes}
                </p>
              </div>
            )}
          </div>
        )}
      </DetailPanel>
    </div>
  );
}
