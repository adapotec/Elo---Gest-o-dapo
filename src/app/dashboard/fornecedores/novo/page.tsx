'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FieldInfo } from '@/components/ui/FieldInfo';
import { createClient } from '@/lib/supabase/client';
import { Truck, ArrowLeft, Save, Building2, User } from 'lucide-react';

export default function NovoFornecedorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    tipo_pessoa: 'PJ' as 'PJ' | 'PF',
    nome: '',
    tax_id: '',
    telefone: '',
    email: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: 'Recife',
    uf: 'PE',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nome) {
      alert('Informe a Razão Social ou Nome do Fornecedor.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.from('fornecedores').insert({
        tipo_pessoa: form.tipo_pessoa,
        nome: form.nome,
        tax_id: form.tax_id || null,
        telefone: form.telefone || null,
        email: form.email || null,
        cep: form.cep || null,
        rua: form.rua || null,
        numero: form.numero || null,
        complemento: form.complemento || null,
        bairro: form.bairro || null,
        cidade: form.cidade || null,
        uf: form.uf || null,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      alert('Fornecedor cadastrado com sucesso!');
      router.push('/dashboard/estoque');
    } catch (err: any) {
      console.error('Erro ao cadastrar fornecedor:', err);
      alert('Erro ao salvar fornecedor: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Topbar
        title="Cadastrar Novo Fornecedor ou Parceiro"
        subtitle="Cadastre empresas ou doadores corporativos que fornecem materiais para o Instituto"
        action={
          <Link href="/dashboard/estoque">
            <Button size="sm" variant="ghost" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Voltar
            </Button>
          </Link>
        }
      />

      <main className="p-6 max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Alternador PJ vs PF */}
          <Card className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center font-bold">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">Tipo de Fornecedor</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Pessoa Jurídica (Empresa) ou Pessoa Física</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[var(--bg-secondary)] p-1.5 rounded-xl border border-[var(--border-default)]">
              <Button
                type="button"
                size="sm"
                variant={form.tipo_pessoa === 'PJ' ? 'primary' : 'ghost'}
                icon={<Building2 className="w-3.5 h-3.5" />}
                onClick={() => setForm({ ...form, tipo_pessoa: 'PJ' })}
              >
                Pessoa Jurídica (CNPJ)
              </Button>
              <Button
                type="button"
                size="sm"
                variant={form.tipo_pessoa === 'PF' ? 'primary' : 'ghost'}
                icon={<User className="w-3.5 h-3.5" />}
                onClick={() => setForm({ ...form, tipo_pessoa: 'PF' })}
              >
                Pessoa Física (CPF)
              </Button>
            </div>
          </Card>

          {/* Form Principal */}
          <Card className="p-6 space-y-5">
            <h3 className="font-display font-bold text-base text-[var(--text-primary)] border-b border-[var(--border-default)] pb-3">
              Identificação & Contatos
            </h3>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-5">
                <div className="md:col-span-2">
                  <div className="h-6 flex items-center gap-1 mb-1.5">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">
                      {form.tipo_pessoa === 'PJ' ? 'Razão Social / Nome Fantasia *' : 'Nome Completo *'}
                    </label>
                    <FieldInfo text="Nome oficial da empresa ou nome da pessoa doadora/fornecedora." />
                  </div>
                  <Input
                    placeholder={form.tipo_pessoa === 'PJ' ? 'Ex: Distribuidora de Alimentos PE Ltda' : 'Ex: João Carlos da Silva'}
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <div className="h-6 flex items-center mb-1.5">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">
                      {form.tipo_pessoa === 'PJ' ? 'CNPJ' : 'CPF'}
                    </label>
                  </div>
                  <Input
                    placeholder={form.tipo_pessoa === 'PJ' ? '00.000.000/0001-00' : '000.000.000-00'}
                    value={form.tax_id}
                    onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
                <div>
                  <div className="h-6 flex items-center mb-1.5">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">
                      Telefone / WhatsApp Comercial
                    </label>
                  </div>
                  <Input
                    placeholder="(81) 3000-0000"
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  />
                </div>

                <div>
                  <div className="h-6 flex items-center mb-1.5">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">
                      E-mail Comercial
                    </label>
                  </div>
                  <Input
                    type="email"
                    placeholder="contato@fornecedor.com.br"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-5 pt-3 border-t border-[var(--border-default)]">
                <div>
                  <div className="h-6 flex items-center mb-1.5">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">CEP</label>
                  </div>
                  <Input
                    placeholder="50000-000"
                    value={form.cep}
                    onChange={(e) => setForm({ ...form, cep: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="h-6 flex items-center mb-1.5">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">Logradouro / Rua</label>
                  </div>
                  <Input
                    placeholder="Ex: Av. Governador Agamenon Magalhães"
                    value={form.rua}
                    onChange={(e) => setForm({ ...form, rua: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-x-5 gap-y-5">
                <div>
                  <div className="h-6 flex items-center mb-1.5">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">Número</label>
                  </div>
                  <Input
                    placeholder="123"
                    value={form.numero}
                    onChange={(e) => setForm({ ...form, numero: e.target.value })}
                  />
                </div>

                <div>
                  <div className="h-6 flex items-center mb-1.5">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">Bairro</label>
                  </div>
                  <Input
                    placeholder="Santo Amaro"
                    value={form.bairro}
                    onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                  />
                </div>

                <div>
                  <div className="h-6 flex items-center mb-1.5">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">Cidade</label>
                  </div>
                  <Input
                    value={form.cidade}
                    onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                  />
                </div>

                <div>
                  <div className="h-6 flex items-center mb-1.5">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">UF</label>
                  </div>
                  <Input
                    value={form.uf}
                    onChange={(e) => setForm({ ...form, uf: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-3 pt-2">
            <Link href="/dashboard/estoque">
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" variant="primary" disabled={loading} icon={<Save className="w-4 h-4" />}>
              {loading ? 'Salvando...' : 'Cadastrar Fornecedor'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
