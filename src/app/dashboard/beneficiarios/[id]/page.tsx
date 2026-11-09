'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { createClient } from '@/lib/supabase/client';
import { useUserRole } from '@/lib/hooks/useUserRole';
import { AcessoRestritoBrincante } from '@/components/auth/AcessoRestritoBrincante';
import {
  ArrowLeft,
  Save,
  Trash2,
  CheckCircle2,
  FolderKanban,
  Plus,
  X,
  UserMinus,
  User,
  HeartHandshake,
  MapPin,
  Users,
  AlertCircle,
  Loader2,
  MessageCircle,
} from 'lucide-react';

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

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatTelefone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCEP(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function calcularIdade(dataNasc?: string): number | null {
  if (!dataNasc) return null;
  const nasc = new Date(dataNasc);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
    idade--;
  }
  return idade >= 0 ? idade : null;
}

export default function EditarBeneficiarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { isBrincante } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Vínculos com Projetos
  const [inscricoes, setInscricoes] = useState<InscricaoProjeto[]>([]);
  const [projetosDisponiveis, setProjetosDisponiveis] = useState<any[]>([]);
  const [showVinculoModal, setShowVinculoModal] = useState(false);
  const [selectedProjetoId, setSelectedProjetoId] = useState('');
  const [vinculando, setVinculando] = useState(false);

  // Modais de Exclusão e Desvinculação In-App
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [desvincularInscricao, setDesvincularInscricao] = useState<InscricaoProjeto | null>(null);
  const [desvinculando, setDesvinculando] = useState(false);

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

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadBeneficiarioData = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.from('beneficiarios').select('*').eq('id', id).single();

    if (error || !data) {
      setError('Beneficiário não encontrado ou removido.');
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

  if (isBrincante) {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title="Prontuário do Beneficiário"
          subtitle="Dados cadastrais e histórico do atendido"
        />
        <div className="p-4 sm:p-6 lg:p-8 flex-1 flex items-center justify-center">
          <AcessoRestritoBrincante modulo="Beneficiários" />
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, cpf: formatCPF(e.target.value) }));
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: formatTelefone(value) }));
  };

  const buscarEnderecoPorCep = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    try {
      setBuscandoCep(true);
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          rua: data.logradouro || prev.rua,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          uf: data.uf && UF_OPTIONS.some((o) => o.value === data.uf) ? data.uf : prev.uf,
          comunidade: prev.comunidade || data.bairro || '',
        }));
        showToast('Endereço autocompletado pelo CEP com sucesso!', 'success');
      } else {
        showToast('CEP não encontrado. Preencha o endereço manualmente.', 'info');
      }
    } catch {
      showToast('Não foi possível consultar o CEP no momento.', 'error');
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setFormData((prev) => ({ ...prev, cep: formatted }));
    if (formatted.replace(/\D/g, '').length === 8) {
      buscarEnderecoPorCep(formatted);
    }
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
      const errorMsg = `Erro ao salvar: ${updateError.message}`;
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } else {
      showToast('Prontuário atualizado com sucesso!', 'success');
    }
    setSaving(false);
  };

  const handleVincularProjeto = async () => {
    if (!selectedProjetoId) return;
    setVinculando(true);
    const supabase = createClient();

    const { error: vincError } = await supabase.from('inscricoes').insert([
      {
        projeto_id: selectedProjetoId,
        beneficiario_id: id,
        status: 'ativo',
      },
    ]);

    if (vincError) {
      showToast(`Erro ao vincular projeto: ${vincError.message}`, 'error');
    } else {
      showToast('Criança vinculada ao projeto com sucesso!', 'success');
      setShowVinculoModal(false);
      setSelectedProjetoId('');
      loadBeneficiarioData();
    }
    setVinculando(false);
  };

  const handleConfirmDesvincular = async () => {
    if (!desvincularInscricao) return;
    setDesvinculando(true);
    const supabase = createClient();
    const { error: delError } = await supabase.from('inscricoes').delete().eq('id', desvincularInscricao.id);

    if (delError) {
      showToast(`Erro ao desvincular: ${delError.message}`, 'error');
    } else {
      showToast('Vínculo com o projeto removido.', 'success');
      setDesvincularInscricao(null);
      loadBeneficiarioData();
    }
    setDesvinculando(false);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error: delError } = await supabase.from('beneficiarios').delete().eq('id', id);
      if (delError) {
        showToast(`Erro ao excluir: ${delError.message}`, 'error');
        setDeleting(false);
        setShowDeleteModal(false);
      } else {
        showToast('Beneficiário removido do sistema com sucesso.', 'success');
        router.push('/dashboard/beneficiarios');
      }
    } catch {
      showToast('Falha ao conectar com o banco de dados.', 'error');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleOpenWhatsApp = () => {
    const tel = formData.telefone_responsavel || formData.telefone;
    if (!tel) return;
    let clean = tel.replace(/\D/g, '');
    if (clean.length >= 10 && clean.length <= 11) {
      clean = `55${clean}`;
    }
    const nomeResp = formData.nome_responsavel || 'Responsável';
    const msg = `Olá *${nomeResp}*, aqui é da equipe do Instituto Ádapo, tudo bem?\n\nEntramos em contato para falar sobre ${formData.nome_completo}.`;
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  };

  const idadeCalculada = calcularIdade(formData.data_nascimento);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Carregando..." subtitle="Buscando prontuário da criança" />
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full flex-1">
          <div className="h-20 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-96 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] animate-pulse" />
            <div className="lg:col-span-2 h-96 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title={`Dossiê: ${formData.nome_completo || 'Beneficiário'}`}
        subtitle="Visualização e atualização do prontuário sociofamiliar no Instituto Ádapo"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full flex-1 overflow-y-auto">
        {/* Breadcrumb estruturado */}
        <nav aria-label="Navegação estrutural" className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-medium">
          <Link href="/dashboard" className="hover:text-[var(--color-primary)] transition-colors">
            Início
          </Link>
          <span>/</span>
          <Link href="/dashboard/beneficiarios" className="hover:text-[var(--color-primary)] transition-colors">
            Beneficiários
          </Link>
          <span>/</span>
          <span className="text-[var(--text-primary)] font-semibold truncate max-w-[200px] sm:max-w-none">
            {formData.nome_completo || 'Dossiê da Criança'}
          </span>
        </nav>

        {/* Cabeçalho Principal Oficial */}
        <PageHeader
          title={formData.nome_completo || 'Beneficiário'}
          description={`Responsável: ${formData.nome_responsavel || 'Não informado'} (${formData.parentesco_responsavel}) • Território: ${formData.comunidade || formData.bairro}`}
          icon={<User className="w-6 h-6" />}
          badge={
            <div className="flex items-center gap-2">
              <Badge variant={formData.status === 'ativo' ? 'success' : formData.status === 'pendente' ? 'warning' : 'danger'}>
                {formData.status.toUpperCase()}
              </Badge>
              {idadeCalculada !== null && (
                <Badge variant="neutral">{idadeCalculada} anos</Badge>
              )}
            </div>
          }
          action={
            <Link href="/dashboard/beneficiarios">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />} className="min-h-[44px]">
                Voltar
              </Button>
            </Link>
          }
        />

        {/* Notificação Toast In-App */}
        {toast && (
          <div
            className={`p-4 rounded-xl text-xs sm:text-sm font-medium border shadow-xs flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200 ${
              toast.type === 'success'
                ? 'bg-[var(--color-success-soft)] text-[var(--color-success)] border-[var(--color-success)]/20'
                : toast.type === 'error'
                ? 'bg-[var(--color-danger-soft)] text-[var(--color-danger)] border-[var(--color-danger)]/20'
                : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-default)]'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-[var(--color-danger-soft)] text-[var(--color-danger)] text-xs sm:text-sm font-medium border border-[var(--color-danger)]/20 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 pb-12">
          {/* GRID MASTER-DETAIL (3 COLUNAS) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* ── COLUNA LATERAL (1/3): PRONTUÁRIO, PROJETOS & FAMÍLIA ── */}
            <div className="lg:col-span-1 space-y-6">
              {/* Card 1: Identidade da Criança */}
              <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-5">
                <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[var(--color-primary)]" />
                    <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                      Dossiê da Criança
                    </h3>
                  </div>
                  <Badge variant={formData.status === 'ativo' ? 'success' : 'warning'}>
                    {formData.status === 'ativo' ? 'Ativo' : 'Pendente'}
                  </Badge>
                </div>

                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-24 h-24 rounded-2xl bg-[var(--color-primary-soft)] border-2 border-[var(--color-primary)] flex items-center justify-center text-[var(--color-primary)] font-bold text-3xl shadow-md">
                    {formData.nome_completo ? formData.nome_completo.charAt(0).toUpperCase() : <User className="w-10 h-10" />}
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-display font-bold text-base text-[var(--text-primary)] truncate max-w-[220px]">
                      {formData.nome_completo || 'Nome da Criança'}
                    </h4>
                    <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-muted)] font-medium">
                      <span>{idadeCalculada !== null ? `${idadeCalculada} anos` : 'Idade não informada'}</span>
                      <span>•</span>
                      <span>{formData.genero}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--border-default)] space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                      Status no Instituto
                    </label>
                    <Select
                      name="status"
                      options={[
                        { value: 'ativo', label: 'Ativo' },
                        { value: 'pendente', label: 'Pendente' },
                        { value: 'suspenso', label: 'Suspenso / Inativo' },
                      ]}
                      value={formData.status}
                      onChange={handleChange}
                      className="text-base sm:text-sm min-h-[44px]"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-secondary)] space-y-1">
                    <span className="text-[11px] text-[var(--text-muted)] block">Território de Atendimento:</span>
                    <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
                      {formData.comunidade || formData.bairro || 'São Luís/MA'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Projetos Sociais Vinculados */}
              <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-[var(--color-primary)]" />
                    <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                      Projetos ({inscricoes.length})
                    </h3>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => setShowVinculoModal(true)}
                    className="min-h-[36px] text-xs px-2.5"
                  >
                    Vincular
                  </Button>
                </div>

                {inscricoes.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] italic py-2 text-center">
                    Nenhum projeto social vinculado a esta criança no momento.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {inscricoes.map((insc) => (
                      <div
                        key={insc.id}
                        className="p-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full shrink-0 shadow-xs"
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
                          onClick={() => setDesvincularInscricao(insc)}
                          className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                          title="Desvincular deste projeto"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card 3: Responsável Legal & Ação WhatsApp */}
              <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-[var(--color-primary)]" />
                    <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                      Responsável Legal
                    </h3>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-primary)] bg-[var(--color-primary-soft)] px-2 py-0.5 rounded-md">
                    Família
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[11px] text-[var(--text-muted)] block">Nome:</span>
                    <span className="font-semibold text-[var(--text-primary)] block truncate">
                      {formData.nome_responsavel || 'Não informado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--text-muted)]">Parentesco:</span>
                    <span className="font-medium text-[var(--text-primary)]">{formData.parentesco_responsavel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--text-muted)]">Telefone / WhatsApp:</span>
                    <span className="font-mono-data font-semibold text-[var(--color-primary)]">
                      {formData.telefone_responsavel || formData.telefone || 'Sem contato'}
                    </span>
                  </div>

                  {(formData.telefone_responsavel || formData.telefone) && (
                    <Button
                      type="button"
                      variant="primary"
                      className="w-full justify-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white border-none shadow-xs font-semibold cursor-pointer min-h-[44px] mt-2"
                      icon={<MessageCircle className="w-4 h-4" />}
                      onClick={handleOpenWhatsApp}
                    >
                      Conversar no WhatsApp
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* ── COLUNA PRINCIPAL (2/3): DADOS CADASTRAIS COMPLETOS ── */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bloco 1: Dados da Criança / Adolescente */}
              <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-5">
                <div className="flex items-center gap-2.5 border-b border-[var(--border-default)] pb-3.5">
                  <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center font-bold text-xs shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                      1. Dados da Criança / Adolescente
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      Informações de identificação, nascimento e escolaridade
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label="Nome Completo da Criança *"
                      name="nome_completo"
                      value={formData.nome_completo}
                      onChange={handleChange}
                      className="text-base sm:text-sm min-h-[44px]"
                      required
                    />
                  </div>

                  <Input
                    label="Data de Nascimento *"
                    type="date"
                    name="data_nascimento"
                    value={formData.data_nascimento}
                    onChange={handleChange}
                    helperText={idadeCalculada !== null ? `Idade atual: ${idadeCalculada} anos` : 'Informe a data'}
                    className="text-base sm:text-sm min-h-[44px]"
                    required
                  />

                  <Select
                    label="Gênero *"
                    name="genero"
                    options={GENERO_OPTIONS}
                    value={formData.genero}
                    onChange={handleChange}
                    className="text-base sm:text-sm min-h-[44px]"
                  />

                  <Select
                    label="Escolaridade / Série"
                    name="escolaridade"
                    options={ESCOLARIDADE_OPTIONS}
                    value={formData.escolaridade}
                    onChange={handleChange}
                    className="text-base sm:text-sm min-h-[44px]"
                  />

                  <Input
                    label="CPF da Criança (Opcional)"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleCpfChange}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="text-base sm:text-sm min-h-[44px]"
                  />

                  <Input
                    label="RG da Criança (Opcional)"
                    name="rg"
                    value={formData.rg}
                    onChange={handleChange}
                    placeholder="Número do documento"
                    className="text-base sm:text-sm min-h-[44px]"
                  />

                  <Select
                    label="Cor / Raça Declarada"
                    name="cor_raca"
                    options={[
                      { value: 'parda', label: 'Parda' },
                      { value: 'preta', label: 'Preta' },
                      { value: 'branca', label: 'Branca' },
                      { value: 'indigena', label: 'Indígena' },
                      { value: 'amarela', label: 'Amarela' },
                      { value: 'nao_declarada', label: 'Não declarada' },
                    ]}
                    value={formData.cor_raca}
                    onChange={handleChange}
                    className="text-base sm:text-sm min-h-[44px]"
                  />
                </div>
              </div>

              {/* Bloco 2: Responsável Legal & Contatos */}
              <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-5">
                <div className="flex items-center gap-2.5 border-b border-[var(--border-default)] pb-3.5">
                  <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center font-bold text-xs shrink-0">
                    <HeartHandshake className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                      2. Responsável Legal & Contatos
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      Pessoa de referência para contato institucional e acolhimento familiar
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label="Nome Completo do(a) Responsável"
                      name="nome_responsavel"
                      value={formData.nome_responsavel}
                      onChange={handleChange}
                      placeholder="Ex: Maria Alcioneide de Souza"
                      className="text-base sm:text-sm min-h-[44px]"
                    />
                  </div>

                  <Select
                    label="Grau de Parentesco"
                    name="parentesco_responsavel"
                    options={PARENTESCO_OPTIONS}
                    value={formData.parentesco_responsavel}
                    onChange={handleChange}
                    className="text-base sm:text-sm min-h-[44px]"
                  />

                  <Input
                    label="WhatsApp / Telefone do Responsável"
                    name="telefone_responsavel"
                    value={formData.telefone_responsavel}
                    onChange={handleTelefoneChange}
                    placeholder="(98) 98888-8888"
                    maxLength={15}
                    className="text-base sm:text-sm min-h-[44px]"
                  />

                  <Input
                    label="Profissão / Ocupação"
                    name="profissao"
                    value={formData.profissao}
                    onChange={handleChange}
                    placeholder="Ex: Autônoma, Diarista, Comerciante"
                    className="text-base sm:text-sm min-h-[44px]"
                  />

                  <Input
                    label="E-mail (Opcional)"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="contato@email.com"
                    className="text-base sm:text-sm min-h-[44px]"
                  />
                </div>
              </div>

              {/* Bloco 3: Endereço & Território */}
              <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-5">
                <div className="flex items-center gap-2.5 border-b border-[var(--border-default)] pb-3.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                      3. Endereço Residencial & Território
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      Localização geográfica com busca automática via CEP
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Input
                      label="CEP (Opcional)"
                      name="cep"
                      value={formData.cep}
                      onChange={handleCepChange}
                      placeholder="65000-000"
                      maxLength={9}
                      className="text-base sm:text-sm min-h-[44px]"
                      helperText={buscandoCep ? 'Buscando endereço no ViaCEP...' : 'Digite para autocompletar'}
                    />
                    {buscandoCep && (
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)] absolute right-3 top-9" />
                    )}
                  </div>

                  <Input
                    label="Comunidade / Território"
                    name="comunidade"
                    value={formData.comunidade}
                    onChange={handleChange}
                    placeholder="Ex: Novo Angelim, Vila Sapo"
                    className="text-base sm:text-sm min-h-[44px]"
                  />

                  <Input
                    label="Bairro"
                    name="bairro"
                    value={formData.bairro}
                    onChange={handleChange}
                    placeholder="Angelim"
                    className="text-base sm:text-sm min-h-[44px]"
                  />

                  <div className="md:col-span-2">
                    <Input
                      label="Rua / Logradouro"
                      name="rua"
                      value={formData.rua}
                      onChange={handleChange}
                      className="text-base sm:text-sm min-h-[44px]"
                    />
                  </div>

                  <Input
                    label="Número / Casa"
                    name="numero"
                    value={formData.numero}
                    onChange={handleChange}
                    className="text-base sm:text-sm min-h-[44px]"
                  />

                  <div className="md:col-span-2">
                    <Input
                      label="Complemento / Ponto de Referência"
                      name="complemento"
                      value={formData.complemento}
                      onChange={handleChange}
                      placeholder="Ex: Próximo à praça, Bloco B"
                      className="text-base sm:text-sm min-h-[44px]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <Input
                        label="Cidade"
                        name="cidade"
                        value={formData.cidade}
                        onChange={handleChange}
                        className="text-base sm:text-sm min-h-[44px]"
                      />
                    </div>
                    <div>
                      <Select
                        label="UF"
                        name="uf"
                        options={UF_OPTIONS}
                        value={formData.uf}
                        onChange={handleChange}
                        className="text-base sm:text-sm min-h-[44px]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloco 4: Dados Socioeconômicos & Observações */}
              <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-5">
                <div className="flex items-center gap-2.5 border-b border-[var(--border-default)] pb-3.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                      4. Dados Socioeconômicos & Observações
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      Informações de vulnerabilidade e histórico para acompanhamento da equipe
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Renda Familiar Mensal (R$)"
                    type="number"
                    step="0.01"
                    name="renda_familiar"
                    value={formData.renda_familiar}
                    onChange={handleChange}
                    className="text-base sm:text-sm min-h-[44px]"
                  />

                  <Input
                    label="Nº de Pessoas na Residência"
                    type="number"
                    name="num_membros_familia"
                    value={formData.num_membros_familia}
                    onChange={handleChange}
                    className="text-base sm:text-sm min-h-[44px]"
                  />

                  <Input
                    label="Nº de Dependentes"
                    type="number"
                    name="num_dependentes"
                    value={formData.num_dependentes}
                    onChange={handleChange}
                    className="text-base sm:text-sm min-h-[44px]"
                  />

                  <div className="md:col-span-3">
                    <label className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1 block">
                      Observações Gerais / Histórico
                    </label>
                    <textarea
                      name="observacoes"
                      rows={3}
                      value={formData.observacoes}
                      onChange={handleChange}
                      placeholder="Anotações adicionais sobre a criança, necessidades especiais, alergias, autorizações..."
                      className="w-full p-3.5 rounded-xl text-base sm:text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] focus:outline-none focus:border-[var(--color-primary)] font-medium transition-all min-h-[100px]"
                    />
                  </div>
                </div>
              </div>

              {/* BARRA DE AÇÕES INFERIORES */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-[var(--border-default)]">
                <Button
                  type="button"
                  variant="danger"
                  icon={<Trash2 className="w-4 h-4" />}
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full sm:w-auto min-h-[44px]"
                >
                  Excluir Beneficiário
                </Button>

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3">
                  <Link href="/dashboard/beneficiarios" className="w-full sm:w-auto">
                    <Button type="button" variant="secondary" className="w-full sm:w-auto min-h-[44px]">
                      Cancelar
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={saving}
                    icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    className="w-full sm:w-auto min-h-[44px]"
                  >
                    {saving ? 'Atualizando...' : 'Atualizar Prontuário'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* ── MODAL IN-APP: VINCULAR A PROJETO SOCIAL ── */}
      {showVinculoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-[var(--color-primary)]" />
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                  Vincular a Projeto Social
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVinculoModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-secondary)] block">
                Selecione o Projeto Social Ativo
              </label>
              <select
                value={selectedProjetoId}
                onChange={(e) => setSelectedProjetoId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-base sm:text-sm bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium focus:outline-none focus:border-[var(--color-primary)] min-h-[44px]"
              >
                <option value="">Selecione um projeto...</option>
                {projetosDisponiveis.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-default)]">
              <Button type="button" variant="secondary" onClick={() => setShowVinculoModal(false)} className="min-h-[44px]">
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleVincularProjeto}
                disabled={!selectedProjetoId || vinculando}
                className="min-h-[44px]"
              >
                {vinculando ? 'Vinculando...' : 'Confirmar Vínculo'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL IN-APP: CONFIRMAR DESVINCULAÇÃO DE PROJETO ── */}
      {desvincularInscricao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
              <UserMinus className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                Desvincular do Projeto?
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Deseja realmente desvincular <strong>{formData.nome_completo}</strong> do projeto{' '}
                <strong>{desvincularInscricao.projetos_sociais?.nome}</strong>?
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1 min-h-[44px]"
                onClick={() => setDesvincularInscricao(null)}
                disabled={desvinculando}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                className="flex-1 min-h-[44px]"
                onClick={handleConfirmDesvincular}
                disabled={desvinculando}
              >
                {desvinculando ? 'Desvinculando...' : 'Sim, Desvincular'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL IN-APP: CONFIRMAÇÃO DE EXCLUSÃO DE BENEFICIÁRIO ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-danger-soft)] text-[var(--color-danger)] flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                Excluir Beneficiário Permanentemente?
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Tem certeza de que deseja remover <strong>{formData.nome_completo || 'este beneficiário'}</strong>? Esta ação excluirá os vínculos de projetos e histórico da criança no sistema.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1 min-h-[44px]"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                className="flex-1 min-h-[44px]"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Excluindo...' : 'Sim, Excluir'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
