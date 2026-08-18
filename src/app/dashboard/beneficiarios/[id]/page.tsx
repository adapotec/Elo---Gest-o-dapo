'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Save,
  Trash2,
  CheckCircle,
  FolderKanban,
  Plus,
  X,
  UserMinus,
  User,
  HeartHandshake,
  MapPin,
  Users,
} from 'lucide-react';
import Link from 'next/link';

interface InscricaoProjeto {
  id: string;
  projeto_id: string;
  status: string;
  projetos_sociais: {
    id: string;
    nome: string;
    cor_identificacao: string;
    status: string;
  };
}

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
  { value: 'Irmão/Irmã', label: 'Irmão / Irmã' },
  { value: 'Tutor Legal', label: 'Tutor(a) Legal / Cuidador(a)' },
  { value: 'Outro', label: 'Outro' },
];

export default function EditarBeneficiarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  const [inscricoes, setInscricoes] = useState<InscricaoProjeto[]>([]);
  const [projetosDisponiveis, setProjetosDisponiveis] = useState<any[]>([]);
  const [showVinculoModal, setShowVinculoModal] = useState(false);
  const [selectedProjetoId, setSelectedProjetoId] = useState('');

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
    
    // Endereço
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
    num_dependentes: '0',
    num_membros_familia: '1',
    status: 'ativo',
    observacoes: '',
  });

  const loadBeneficiarioData = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.from('beneficiarios').select('*').eq('id', id).single();

    if (error || !data) {
      setError('Beneficiário não encontrado.');
    } else {
      setFormData({
        nome_completo: data.nome_completo || '',
        data_nascimento: data.data_nascimento || '',
        genero: data.genero || 'Masculino',
        escolaridade: data.escolaridade || 'fundamental_1',
        cpf: data.cpf || '',
        rg: data.rg || '',
        
        nome_responsavel: data.nome_responsavel || '',
        parentesco_responsavel: data.parentesco_responsavel || 'Mãe',
        telefone_responsavel: data.telefone_responsavel || '',
        telefone: data.telefone || '',
        email: data.email || '',
        profissao: data.profissao || '',
        
        comunidade: data.comunidade || '',
        bairro: data.bairro || 'Novo Angelim',
        rua: data.rua || '',
        numero: data.numero || '',
        complemento: data.complemento || '',
        cep: data.cep || '',
        cidade: data.cidade || 'São Luís',
        uf: data.uf || 'MA',
        
        cor_raca: data.cor_raca || 'parda',
        status: data.status || 'ativo',
        renda_familiar: String(data.renda_familiar || 0),
        num_dependentes: String(data.num_dependentes || 0),
        num_membros_familia: String(data.num_membros_familia || 1),
        observacoes: data.observacoes || '',
      });

      // Carregar projetos vinculados
      const { data: inscData } = await supabase
        .from('inscricoes')
        .select('id, projeto_id, status, projetos_sociais(id, nome, cor_identificacao, status)')
        .eq('beneficiario_id', id);

      setInscricoes((inscData as any) || []);

      const { data: projData } = await supabase
        .from('projetos_sociais')
        .select('id, nome, cor_identificacao')
        .eq('aceita_vinculo_beneficiarios', true)
        .eq('status', 'ativo');

      setProjetosDisponiveis(projData || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBeneficiarioData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const supabase = createClient();
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
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('beneficiarios')
      .update(payload)
      .eq('id', id);

    if (updateError) {
      setError(`Erro ao salvar: ${updateError.message}`);
    } else {
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    }
    setSaving(false);
  };

  const handleVincularProjeto = async () => {
    if (!selectedProjetoId) return;
    const supabase = createClient();

    const { error: vincError } = await supabase.from('inscricoes').insert([
      {
        projeto_id: selectedProjetoId,
        beneficiario_id: id,
        status: 'ativo',
      },
    ]);

    if (!vincError) {
      setShowVinculoModal(false);
      setSelectedProjetoId('');
      loadBeneficiarioData();
    }
  };

  const handleDesvincularProjeto = async (inscricaoId: string) => {
    if (!confirm('Deseja realmente desvincular a criança deste projeto?')) return;
    const supabase = createClient();
    await supabase.from('inscricoes').delete().eq('id', inscricaoId);
    loadBeneficiarioData();
  };

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja excluir esta criança permanentemente?')) {
      const supabase = createClient();
      await supabase.from('beneficiarios').delete().eq('id', id);
      router.push('/dashboard/beneficiarios');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center text-[var(--text-muted)] text-sm">
        Carregando dados da criança...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title={formData.nome_completo || 'Editar Beneficiário'}
        subtitle="Visualização e edição do dossiê cadastral da criança / adolescente"
        action={
          <div className="flex items-center gap-2">
            <Link href="/dashboard/beneficiarios">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                Voltar
              </Button>
            </Link>
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={handleDelete}
            >
              Excluir
            </Button>
          </div>
        }
      />

      <div className="p-4 sm:p-8 max-w-4xl space-y-6 flex-1 overflow-y-auto">
        {error && (
          <div className="p-4 rounded-xl bg-[var(--color-danger-soft)] text-[var(--color-danger)] text-sm font-medium border border-[var(--color-danger)]/20">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm font-semibold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            Dados cadastrais atualizados com sucesso!
          </div>
        )}

        {/* ── CARD DE PROJETOS VINCULADOS ── */}
        <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-default)] pb-3">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
              <div>
                <h3 className="font-display font-bold text-sm sm:text-base text-[var(--text-primary)]">
                  Projetos Vinculados ({inscricoes.length})
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Projetos sociais em que esta criança participa ativamente
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowVinculoModal(true)}
            >
              Vincular a Projeto
            </Button>
          </div>

          {inscricoes.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] italic py-2 text-center">
              Esta criança ainda não está inscrita em nenhum projeto. Clique em "Vincular a Projeto" para associá-la.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {inscricoes.map((insc) => (
                <div
                  key={insc.id}
                  className="p-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: insc.projetos_sociais?.cor_identificacao || 'var(--color-primary)' }}
                    />
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-[var(--text-primary)] block truncate">
                        {insc.projetos_sociais?.nome || 'Projeto Social'}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">Inscrição Ativa</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDesvincularProjeto(insc.id)}
                    className="p-1 text-[var(--text-muted)] hover:text-rose-500 rounded transition-colors"
                    title="Desvincular deste projeto"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── FORMULÁRIO DE EDIÇÃO CADASRAL ── */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção 1: Criança */}
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
                placeholder="000.000.000-00"
              />

              <Input
                label="RG da Criança (Opcional)"
                name="rg"
                value={formData.rg}
                onChange={handleChange}
                placeholder="Número do RG"
              />

              <Select
                label="Status no Instituto"
                name="status"
                options={[
                  { value: 'ativo', label: 'Ativo' },
                  { value: 'pendente', label: 'Pendente' },
                  { value: 'suspenso', label: 'Suspenso / Inativo' },
                ]}
                value={formData.status}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Seção 2: Responsável */}
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
                  placeholder="Nome do pai/mãe/cuidador"
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
              />

              <Input
                label="Profissão / Ocupação do Responsável"
                name="profissao"
                value={formData.profissao}
                onChange={handleChange}
                placeholder="Ex: Costureira, Autônomo"
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

          {/* Seção 3: Endereço */}
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
              />

              <Input
                label="Bairro"
                name="bairro"
                value={formData.bairro}
                onChange={handleChange}
              />

              <Input
                label="CEP"
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
                />
              </div>

              <Input
                label="Número / Casa"
                name="numero"
                value={formData.numero}
                onChange={handleChange}
              />

              <div className="sm:col-span-2">
                <Input
                  label="Complemento"
                  name="complemento"
                  value={formData.complemento}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Cidade"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleChange}
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

          {/* Seção 4: Socioeconômico & Observações */}
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
                label="Nº de Dependentes"
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
            <Button type="submit" disabled={saving} icon={<Save className="w-4 h-4" />}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </div>

      {/* MODAL DE VÍNCULO A PROJETO */}
      {showVinculoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                Vincular a Projeto Social
              </h3>
              <button
                type="button"
                onClick={() => setShowVinculoModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-secondary)] block">
                Selecione o Projeto Social
              </label>
              <select
                value={selectedProjetoId}
                onChange={(e) => setSelectedProjetoId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)]"
              >
                <option value="">Selecione um projeto...</option>
                {projetosDisponiveis.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
              <Button size="sm" variant="secondary" onClick={() => setShowVinculoModal(false)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleVincularProjeto}
                disabled={!selectedProjetoId}
              >
                Confirmar Vínculo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
