'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Truck, Plus, Search, Building2, User, Phone, Mail, MapPin } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';

export interface Fornecedor {
  id: string;
  nome: string;
  tipo_pessoa: 'PF' | 'PJ';
  tax_id: string | null;
  telefone: string | null;
  email: string | null;
  cep: string | null;
  rua: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
}

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');

  useEffect(() => {
    fetchFornecedores();
  }, []);

  async function fetchFornecedores() {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setFornecedores(data || []);
    } catch (err) {
      console.error('Erro ao buscar fornecedores:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredFornecedores = fornecedores.filter((f) => {
    const matchesSearch =
      f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.tax_id && f.tax_id.includes(searchTerm)) ||
      (f.cidade && f.cidade.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.email && f.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTipo = filterTipo === 'todos' || f.tipo_pessoa === filterTipo;

    return matchesSearch && matchesTipo;
  });

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Topbar
        title="Gestão de Fornecedores e Doadores Corporativos"
        subtitle="Gerencie o cadastro de parceiros, fornecedores de estoque e doadores de insumos"
        action={
          <Link href="/dashboard/fornecedores/novo">
            <Button size="sm" variant="primary" icon={<Plus className="w-4 h-4" />}>
              Novo Fornecedor
            </Button>
          </Link>
        }
      />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 flex items-center gap-4 border-l-4 border-l-[#F2632D]">
            <div className="p-3 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Total de Fornecedores</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{fornecedores.length}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4 border-l-4 border-l-blue-500">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Pessoas Jurídicas (PJ)</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {fornecedores.filter((f) => f.tipo_pessoa === 'PJ').length}
              </p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4 border-l-4 border-l-purple-500">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Pessoas Físicas (PF)</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {fornecedores.filter((f) => f.tipo_pessoa === 'PF').length}
              </p>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input
                placeholder="Buscar por nome, documento ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="w-full md:w-48"
              >
                <option value="todos">Todos os Tipos</option>
                <option value="PJ">Pessoa Jurídica (PJ)</option>
                <option value="PF">Pessoa Física (PF)</option>
              </Select>
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[var(--text-primary)]">
              <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-default)] text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <tr>
                  <th className="p-4">Razão Social / Nome</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4">CPF / CNPJ</th>
                  <th className="p-4">Contato</th>
                  <th className="p-4">Localização</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[var(--text-muted)]">
                      Carregando fornecedores...
                    </td>
                  </tr>
                ) : filteredFornecedores.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[var(--text-muted)]">
                      <div className="py-6 space-y-3">
                        <Truck className="w-10 h-10 mx-auto text-[var(--text-muted)] opacity-50" />
                        <p>Nenhum fornecedor cadastrado ou encontrado com os filtros.</p>
                        <Link href="/dashboard/fornecedores/novo">
                          <Button size="sm" variant="primary">
                            Cadastrar Primeiro Fornecedor
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredFornecedores.map((item) => (
                    <tr key={item.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold flex items-center justify-center text-sm shrink-0">
                            {item.tipo_pessoa === 'PJ' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-semibold text-[var(--text-primary)]">{item.nome}</p>
                            {item.is_anonymous && (
                              <span className="text-[10px] text-amber-500 font-semibold">Doador Anônimo</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <Badge variant={item.tipo_pessoa === 'PJ' ? 'purple' : 'neutral'}>
                          {item.tipo_pessoa === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                        </Badge>
                      </td>

                      <td className="p-4 text-[var(--text-secondary)] font-mono text-xs">
                        {item.tax_id || 'Não informado'}
                      </td>

                      <td className="p-4 space-y-0.5">
                        {item.telefone && (
                          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                            <Phone className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            <span>{item.telefone}</span>
                          </div>
                        )}
                        {item.email && (
                          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                            <Mail className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            <span>{item.email}</span>
                          </div>
                        )}
                        {!item.telefone && !item.email && (
                          <span className="text-xs text-[var(--text-muted)]">Sem contatos</span>
                        )}
                      </td>

                      <td className="p-4 text-xs text-[var(--text-secondary)]">
                        {item.cidade || item.uf ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            <span>
                              {item.cidade || ''}
                              {item.cidade && item.uf ? '/' : ''}
                              {item.uf || ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[var(--text-muted)]">Não informada</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
