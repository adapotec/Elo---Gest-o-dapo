'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Save, User, Users, MapPin, HeartHandshake } from 'lucide-react';
import Link from 'next/link';

const UF_OPTIONS = [
  { value: 'MA', label: 'Maranhão' },
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
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
  { value: 'educacao_infantil', label: 'Creche / Educação Infantil' },
  { value: 'alfabetizacao', label: 'Fase de Alfabetização' },
  { value: 'fundamental_1', label: 'Ensino Fundamental I (1º ao 5º ano)' },
  { value: 'fundamental_2', label: 'Ensino Fundamental II (6º ao 9º ano)' },
  { value: 'ensino_medio', label: 'Ensino Médio' },
  { value: 'nao_frequenta', label: 'Não frequenta a escola' },
  { value: 'outro', label: 'Outro nível escolar' },
];

const GENERO_OPTIONS = [
  { value: 'Masculino', label: 'Masculino' },
  { value: 'Feminino', label: 'Feminino' },
  { value: 'Outro', label: 'Outro / Não declarado' },
];

const PARENTESCO_OPTIONS = [
  { value: 'Mãe', label: 'Mãe' },
  { value: 'Pai', label: 'Pai' },
  { value: 'Avó/Avô', label: 'Avó / Avô' },
  { value: 'Tia/Tio', label: 'Tia / Tio' },
  { value: 'Irmão/Irmã', label: 'Irmão / Irmã (Maior de idade)' },
  { value: 'Tutor Legal', label: 'Tutor(a) Legal / Cuidador(a)' },
  { value: 'Outro', label: 'Outro' },
];

export default function NovoBeneficiarioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome_completo: '',
    data_nascimento: '',
    genero: 'Masculino',
    escolaridade: 'fundamental_1',
    cpf: '',
    rg: '',
    
    // Responsável
    nome_responsavel: '',
    parentesco_responsavel: 'Mãe',
    telefone_responsavel: '',
    telefone: '',
    email: '',
    profissao: '',
    
    // Endereço e Território
    comunidade: '',
    bairro: 'Novo Angelim',
    rua: '',
    numero: '',
    complemento: '',
    cep: '',
    cidade: 'São Luís',
    uf: 'MA',
    
    // Socioeconômico
    cor_raca: 'parda',
    renda_familiar: '0',
    num_membros_familia: '4',
    num_dependentes: '1',
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
    
    // Fallback: telefone principal usa o do responsável se não preenchido
    const telPrincipal = formData.telefone_responsavel || formData.telefone || null;

    const payload: any = {
      nome_completo: formData.nome_completo.trim(),
      data_nascimento: formData.data_nascimento || null,
      genero: formData.genero || null,
      escolaridade: formData.escolaridade || null,
      cpf: formData.cpf.trim() || null,
      rg: formData.rg.trim() || null,
      
      nome_responsavel: formData.nome_responsavel.trim() || null,
      parentesco_responsavel: formData.parentesco_responsavel || null,
      telefone_responsavel: formData.telefone_responsavel.trim() || null,
      telefone: telPrincipal,
      email: formData.email.trim() || null,
      profissao: formData.profissao.trim() || null,
      
      comunidade: formData.comunidade.trim() || null,
      bairro: formData.bairro.trim() || 'Novo Angelim',
      rua: formData.rua.trim() || null,
      numero: formData.numero.trim() || null,
      complemento: formData.complemento.trim() || null,
      cep: formData.cep.trim() || null,
      cidade: formData.cidade.trim() || 'São Luís',
      uf: formData.uf || 'MA',
      
      cor_raca: formData.cor_raca || 'parda',
      renda_familiar: parseFloat(formData.renda_familiar) || 0,
      num_dependentes: parseInt(formData.num_dependentes, 10) || 0,
      num_membros_familia: parseInt(formData.num_membros_familia, 10) || 1,
      status: formData.status || 'ativo',
      observacoes: formData.observacoes.trim() || null,
    };

    const { error: insertError } = await supabase.from('beneficiarios').insert([payload]);

    if (insertError) {
      setError(insertError.message.includes('unique constraint') 
        ? 'Este CPF já está cadastrado no sistema.' 
        : `Erro ao cadastrar: ${insertError.message}`);
      setLoading(false);
    } else {
      router.push('/dashboard/beneficiarios');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Novo Beneficiário"
        subtitle="Cadastro de criança / adolescente atendido pelo Instituto Ádapo"
        action={
          <Link href="/dashboard/beneficiarios">
            <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
              Voltar para Lista
            </Button>
          </Link>
        }
      />

      <div className="p-4 sm:p-8 max-w-4xl space-y-6 flex-1 overflow-y-auto">
        {error && (
          <div className="p-4 rounded-xl bg-[var(--color-danger-soft)] text-[var(--color-danger)] text-sm font-medium border border-[var(--color-danger)]/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção 1: Dados da Criança / Beneficiário */}
          <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-3">
              <User className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
              <h3 className="font-display font-bold text-sm sm:text-base text-[var(--text-primary)]">
                1. Dados da Criança / Adolescente
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="sm:col-span-2 md:col-span-3">
                <Input
                  label="Nome Completo da Criança"
                  name="nome_completo"
                  value={formData.nome_completo}
                  onChange={handleChange}
                  placeholder="Ex: Gabriel Sousa Santos"
                  required
                />
              </div>

              <Input
                label="Data de Nascimento"
                type="date"
                name="data_nascimento"
                value={formData.data_nascimento}
                onChange={handleChange}
                required
              />

              <Select
                label="Gênero"
                name="genero"
                options={GENERO_OPTIONS}
                value={formData.genero}
                onChange={handleChange}
              />

              <Select
                label="Escolaridade / Série"
                name="escolaridade"
                options={ESCOLARIDADE_OPTIONS}
                value={formData.escolaridade}
                onChange={handleChange}
              />

              <Input
                label="CPF da Criança (Opcional)"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                placeholder="000.000.000-00 (se possuir)"
              />

              <Input
                label="RG da Criança (Opcional)"
                name="rg"
                value={formData.rg}
                onChange={handleChange}
                placeholder="Número do RG"
              />
            </div>
          </div>

          {/* Seção 2: Dados do Responsável Legal */}
          <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-3">
              <HeartHandshake className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
              <h3 className="font-display font-bold text-sm sm:text-base text-[var(--text-primary)]">
                2. Responsável Legal & Contatos
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Nome do(a) Responsável"
                  name="nome_responsavel"
                  value={formData.nome_responsavel}
                  onChange={handleChange}
                  placeholder="Ex: Maria Alcioneide de Souza"
                  required
                />
              </div>

              <Select
                label="Grau de Parentesco"
                name="parentesco_responsavel"
                options={PARENTESCO_OPTIONS}
                value={formData.parentesco_responsavel}
                onChange={handleChange}
              />

              <Input
                label="WhatsApp / Telefone do Responsável"
                name="telefone_responsavel"
                value={formData.telefone_responsavel}
                onChange={handleChange}
                placeholder="(98) 98888-8888"
                required
              />

              <Input
                label="Profissão / Ocupação do Responsável"
                name="profissao"
                value={formData.profissao}
                onChange={handleChange}
                placeholder="Ex: Autônoma, Diarista, Comerciante"
              />

              <Input
                label="E-mail (Opcional)"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="exemplo@email.com"
              />
            </div>
          </div>

          {/* Seção 3: Endereço e Território */}
          <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-3">
              <MapPin className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
              <h3 className="font-display font-bold text-sm sm:text-base text-[var(--text-primary)]">
                3. Endereço & Comunidade / Território
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Comunidade / Território"
                name="comunidade"
                value={formData.comunidade}
                onChange={handleChange}
                placeholder="Ex: Novo Angelim, Vila Sapo"
                required
              />

              <Input
                label="Bairro"
                name="bairro"
                value={formData.bairro}
                onChange={handleChange}
                placeholder="Angelim"
                required
              />

              <Input
                label="CEP (Opcional)"
                name="cep"
                value={formData.cep}
                onChange={handleChange}
                placeholder="65000-000"
              />

              <div className="sm:col-span-2">
                <Input
                  label="Rua / Logradouro"
                  name="rua"
                  value={formData.rua}
                  onChange={handleChange}
                  placeholder="Ex: Rua São Luís, Rua 10 de Julho"
                />
              </div>

              <Input
                label="Número / Casa"
                name="numero"
                value={formData.numero}
                onChange={handleChange}
                placeholder="Ex: 13, Casa 42, Qd 02"
              />

              <div className="sm:col-span-2">
                <Input
                  label="Complemento"
                  name="complemento"
                  value={formData.complemento}
                  onChange={handleChange}
                  placeholder="Ex: Próximo à praça, Bloco B"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Cidade"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleChange}
                  placeholder="São Luís"
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
          </div>

          {/* Seção 4: Informações Familiares & Observações */}
          <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-3">
              <Users className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
              <h3 className="font-display font-bold text-sm sm:text-base text-[var(--text-primary)]">
                4. Dados Familiares & Observações
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Renda Familiar (R$)"
                type="number"
                step="0.01"
                name="renda_familiar"
                value={formData.renda_familiar}
                onChange={handleChange}
              />

              <Input
                label="Nº de Pessoas na Residência"
                type="number"
                name="num_membros_familia"
                value={formData.num_membros_familia}
                onChange={handleChange}
              />

              <Input
                label="Nº de Filhos / Dependentes"
                type="number"
                name="num_dependentes"
                value={formData.num_dependentes}
                onChange={handleChange}
              />

              <div className="sm:col-span-3 space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)] block">
                  Observações Gerais / Histórico
                </label>
                <textarea
                  name="observacoes"
                  rows={3}
                  value={formData.observacoes}
                  onChange={handleChange}
                  placeholder="Anotações adicionais sobre a criança, necessidades especiais, alergias, autorizações..."
                  className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-3 pt-2">
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
