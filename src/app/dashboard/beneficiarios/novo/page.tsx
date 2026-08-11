'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Save, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const UF_OPTIONS = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'PR', label: 'Paraná' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'TO', label: 'Tocantins' },
];

const ESCOLARIDADE_OPTIONS = [
  { value: 'no_formal_education', label: 'Sem instrução formal' },
  { value: 'basic_literacy', label: 'Alfabetizado' },
  { value: 'elementary_incomplete', label: 'Ensino Fundamental incompleto' },
  { value: 'elementary_complete', label: 'Ensino Fundamental completo' },
  { value: 'high_school_incomplete', label: 'Ensino Médio incompleto' },
  { value: 'high_school_complete', label: 'Ensino Médio completo' },
  { value: 'technical', label: 'Ensino Técnico' },
  { value: 'undergraduate_incomplete', label: 'Ensino Superior incompleto' },
  { value: 'undergraduate_complete', label: 'Ensino Superior completo' },
];

export default function NovoBeneficiarioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome_completo: '',
    data_nascimento: '',
    cpf: '',
    rg: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    comunidade: '',
    cidade: '',
    uf: 'SP',
    telefone: '',
    email: '',
    escolaridade: 'high_school_complete',
    profissao: '',
    cor_raca: 'parda',
    estado_civil: 'single',
    renda_familiar: '0',
    num_dependentes: '0',
    num_membros_familia: '1',
    status: 'ativo',
    observacoes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: insertError } = await supabase.from('beneficiarios').insert([
      {
        ...formData,
        renda_familiar: parseFloat(formData.renda_familiar) || 0,
        num_dependentes: parseInt(formData.num_dependentes, 10) || 0,
        num_membros_familia: parseInt(formData.num_membros_familia, 10) || 1,
      },
    ]);

    if (insertError) {
      setError(insertError.message.includes('unique constraint') 
        ? 'Este CPF já está cadastrado no sistema.' 
        : insertError.message);
      setLoading(false);
    } else {
      router.push('/dashboard/beneficiarios');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Novo Beneficiário"
        subtitle="Preencha as informações cadastrais do beneficiário do Instituto Ádapo"
        action={
          <Link href="/dashboard/beneficiarios">
            <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
              Voltar para Lista
            </Button>
          </Link>
        }
      />

      <div className="p-8 max-w-4xl space-y-6 flex-1 overflow-y-auto">
        {error && (
          <div className="p-4 rounded-xl bg-[var(--color-danger-soft)] text-[var(--color-danger)] text-sm font-medium border border-[var(--color-danger)]/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Seção 1: Dados Pessoais */}
          <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
            <h3 className="font-display font-bold text-base text-[var(--text-primary)] border-b border-[var(--border-default)] pb-3">
              1. Dados Pessoais
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Nome Completo"
                  name="nome_completo"
                  value={formData.nome_completo}
                  onChange={handleChange}
                  placeholder="Ex: Maria Silva Santos"
                  required
                />
              </div>

              <Input
                label="CPF"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                placeholder="000.000.000-00"
                required
              />

              <Input
                label="Data de Nascimento"
                type="date"
                name="data_nascimento"
                value={formData.data_nascimento}
                onChange={handleChange}
                required
              />

              <Input
                label="Telefone / Whatsapp"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                placeholder="(11) 99999-9999"
                required
              />

              <Input
                label="E-mail"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="exemplo@email.com"
              />

              <Select
                label="Escolaridade"
                name="escolaridade"
                options={ESCOLARIDADE_OPTIONS}
                value={formData.escolaridade}
                onChange={handleChange}
              />

              <Input
                label="Profissão"
                name="profissao"
                value={formData.profissao}
                onChange={handleChange}
                placeholder="Ex: Costureira, Autônomo"
              />
            </div>
          </div>

          {/* Seção 2: Endereço e Comunidade */}
          <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
            <h3 className="font-display font-bold text-base text-[var(--text-primary)] border-b border-[var(--border-default)] pb-3">
              2. Endereço e Comunidade
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="CEP"
                name="cep"
                value={formData.cep}
                onChange={handleChange}
                placeholder="00000-000"
                required
              />

              <div className="md:col-span-2">
                <Input
                  label="Rua / Logradouro"
                  name="rua"
                  value={formData.rua}
                  onChange={handleChange}
                  placeholder="Rua das Flores"
                  required
                />
              </div>

              <Input
                label="Número"
                name="numero"
                value={formData.numero}
                onChange={handleChange}
                placeholder="123"
                required
              />

              <Input
                label="Complemento"
                name="complemento"
                value={formData.complemento}
                onChange={handleChange}
                placeholder="Apto 4B, Bloco C"
              />

              <Input
                label="Bairro"
                name="bairro"
                value={formData.bairro}
                onChange={handleChange}
                placeholder="Bairro Central"
                required
              />

              <Input
                label="Nome da Comunidade"
                name="comunidade"
                value={formData.comunidade}
                onChange={handleChange}
                placeholder="Comunidade Esperança"
              />

              <Input
                label="Cidade"
                name="cidade"
                value={formData.cidade}
                onChange={handleChange}
                placeholder="São Paulo"
                required
              />

              <Select
                label="UF"
                name="uf"
                options={UF_OPTIONS}
                value={formData.uf}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Seção 3: Informações Socioeconômicas */}
          <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
            <h3 className="font-display font-bold text-base text-[var(--text-primary)] border-b border-[var(--border-default)] pb-3">
              3. Dados Socioeconômicos
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Renda Familiar (R$)"
                type="number"
                step="0.01"
                name="renda_familiar"
                value={formData.renda_familiar}
                onChange={handleChange}
              />

              <Input
                label="Nº de Dependentes"
                type="number"
                name="num_dependentes"
                value={formData.num_dependentes}
                onChange={handleChange}
              />

              <Input
                label="Nº de Pessoas na Família"
                type="number"
                name="num_membros_familia"
                value={formData.num_membros_familia}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link href="/dashboard/beneficiarios">
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={loading} icon={<Save className="w-4 h-4" />}>
              {loading ? 'Salvando...' : 'Salvar Beneficiário'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
