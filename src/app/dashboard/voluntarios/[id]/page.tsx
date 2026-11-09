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
import { FieldInfo } from '@/components/ui/FieldInfo';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Save,
  Trash2,
  CheckCircle2,
  User,
  Heart,
  PhoneCall,
  Upload,
  Link as LinkIcon,
  ShieldAlert,
  MapPin,
  Loader2,
  Calendar,
} from 'lucide-react';

const TIPO_VOLUNTARIO_OPTIONS = [
  { value: 'operacional', label: 'Voluntário Operacional (Equipe Interna)' },
  { value: 'brincante', label: 'Voluntário Brincante (Período de Experiência)' },
  { value: 'externo', label: 'Monitor Externo (Projeto Específico)' },
];

const AREA_ATUACAO_OPTIONS = [
  { value: 'Diretoria', label: 'Diretoria' },
  { value: 'Pedagogia', label: 'Pedagogia' },
  { value: 'Comunicação', label: 'Comunicação' },
  { value: 'Tecnologia', label: 'Tecnologia' },
  { value: 'Projetos', label: 'Projetos' },
  { value: 'Financeiro', label: 'Financeiro' },
  { value: 'Captação de Recursos', label: 'Captação de Recursos' },
  { value: 'Administração', label: 'Administração' },
];

const TIPO_SANGUINEO_OPTIONS = [
  { value: '', label: 'Não informado' },
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
];

const UF_OPTIONS = [
  { value: 'SP', label: 'São Paulo' },
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
  { value: 'TO', label: 'Tocantins' },
];

function formatDriveUrl(url: string): string {
  if (!url) return '';
  const match = url.match(/\/file\/d\/([^\/]+)/) || url.match(/id=([^&]+)/);
  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  return url;
}

function compressImage(file: File, maxDim = 400, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.onerror = () => reject(new Error('Erro ao decodificar imagem'));
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
  });
}

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

export default function EditarVoluntarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const [formData, setFormData] = useState({
    nome_completo: '',
    cpf: '',
    data_nascimento: '',
    email: '',
    telefone: '',
    tipo: 'operacional',
    area_atuacao: 'Diretoria',
    funcao: '',
    data_inicio: '',
    data_fim: '',
    status: 'ativo',
    avatar_url: '',
    cep: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: 'SP',
    contato_emergencia_nome: '',
    contato_emergencia_parentesco: '',
    contato_emergencia_telefone: '',
    tipo_sanguineo: '',
    alergias: '',
    medicamentos_uso_continuo: '',
    plano_saude: '',
    observacoes: '',
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    async function loadVoluntario() {
      const supabase = createClient();
      const { data, error } = await supabase.from('voluntarios').select('*').eq('id', id).single();

      if (error || !data) {
        setError('Voluntário não encontrado ou removido.');
      } else {
        setFormData({
          nome_completo: data.nome_completo || '',
          cpf: data.cpf || '',
          data_nascimento: data.data_nascimento || '',
          email: data.email || '',
          telefone: data.telefone || '',
          tipo: data.tipo || 'operacional',
          area_atuacao: data.area_atuacao || 'Diretoria',
          funcao: data.funcao || '',
          data_inicio: data.data_inicio || '',
          data_fim: data.data_fim || '',
          status: data.status || 'ativo',
          avatar_url: data.avatar_url || '',
          cep: data.cep || '',
          rua: data.rua || '',
          numero: data.numero || '',
          bairro: data.bairro || '',
          cidade: data.cidade || '',
          uf: data.uf || 'SP',
          contato_emergencia_nome: data.contato_emergencia_nome || '',
          contato_emergencia_parentesco: data.contato_emergencia_parentesco || '',
          contato_emergencia_telefone: data.contato_emergencia_telefone || '',
          tipo_sanguineo: data.tipo_sanguineo || '',
          alergias: data.alergias || '',
          medicamentos_uso_continuo: data.medicamentos_uso_continuo || '',
          plano_saude: data.plano_saude || '',
          observacoes: data.observacoes || '',
        });
      }
      setLoading(false);
    }

    loadVoluntario();
  }, [id]);

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

  const handleDriveUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDriveUrl(e.target.value);
    setFormData((prev) => ({ ...prev, avatar_url: formatted }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        showToast('A imagem é muito grande. Escolha uma foto de até 8MB.', 'error');
        return;
      }
      try {
        setCompressing(true);
        const compressedBase64 = await compressImage(file, 400, 0.85);
        setFormData((prev) => ({ ...prev, avatar_url: compressedBase64 }));
        showToast('Foto otimizada com sucesso (~35KB)! Clique em Atualizar para gravar.', 'success');
      } catch {
        showToast('Erro ao processar imagem. Tente outro formato.', 'error');
      } finally {
        setCompressing(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('voluntarios')
      .update({
        ...formData,
        data_fim: formData.data_fim || null,
        data_nascimento: formData.data_nascimento || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      const isUniqueError = updateError.message.includes('unique constraint') || updateError.message.includes('cpf');
      const errorMsg = isUniqueError
        ? 'Este CPF já está cadastrado para outro voluntário.'
        : `Erro ao atualizar: ${updateError.message}`;
      setError(errorMsg);
      showToast(errorMsg, 'error');
      setSaving(false);
    } else {
      showToast('Dados do voluntário atualizados com sucesso!', 'success');
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error: delError } = await supabase.from('voluntarios').delete().eq('id', id);
      if (delError) {
        showToast(`Erro ao excluir: ${delError.message}`, 'error');
        setDeleting(false);
        setShowDeleteModal(false);
      } else {
        showToast('Voluntário removido com sucesso.', 'success');
        router.push('/dashboard/voluntarios');
      }
    } catch {
      showToast('Falha ao conectar com o servidor.', 'error');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Carregando..." subtitle="Buscando dados cadastrais do voluntário" />
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
        title={`Editar: ${formData.nome_completo || 'Voluntário'}`}
        subtitle="Atualize a atuação, função, endereço e ficha de saúde do voluntário"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full flex-1 overflow-y-auto">
        {/* Breadcrumb estruturado */}
        <nav aria-label="Navegação estrutural" className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-medium">
          <Link href="/dashboard" className="hover:text-[var(--color-primary)] transition-colors">
            Início
          </Link>
          <span>/</span>
          <Link href="/dashboard/voluntarios" className="hover:text-[var(--color-primary)] transition-colors">
            Voluntários
          </Link>
          <span>/</span>
          <span className="text-[var(--text-primary)] font-semibold truncate max-w-[200px] sm:max-w-none">
            {formData.nome_completo || 'Detalhes do Voluntário'}
          </span>
        </nav>

        {/* Cabeçalho Principal Oficial */}
        <PageHeader
          title={formData.nome_completo || 'Voluntário'}
          description={`E-mail cadastral: ${formData.email || 'Não informado'} • Função: ${formData.funcao || formData.area_atuacao}`}
          icon={<User className="w-6 h-6" />}
          badge={
            <div className="flex items-center gap-2">
              <Badge variant={formData.status === 'ativo' ? 'success' : 'neutral'}>
                {formData.status === 'ativo' ? 'Ativo' : 'Inativo'}
              </Badge>
              <Badge variant="primary">{formData.area_atuacao}</Badge>
            </div>
          }
          action={
            <Link href="/dashboard/voluntarios">
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
              <ShieldAlert className="w-5 h-5 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-[var(--color-danger-soft)] text-[var(--color-danger)] text-xs sm:text-sm font-medium border border-[var(--color-danger)]/20 flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 pb-12">
          {/* GRID MASTER-DETAIL (3 COLUNAS) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* ── COLUNA LATERAL (1/3): FOTO, STATUS, ENQUADRAMENTO & SOS ── */}
            <div className="lg:col-span-1 space-y-6">
              {/* Card 1: Identidade Visual & Foto */}
              <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-5">
                <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[var(--color-primary)]" />
                    <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                      Identidade & Foto
                    </h3>
                  </div>
                  <Badge variant={formData.status === 'ativo' ? 'success' : 'neutral'}>
                    {formData.status === 'ativo' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="relative group">
                    <div className="w-28 h-28 rounded-2xl bg-[var(--color-primary-soft)] border-2 border-[var(--color-primary)] flex items-center justify-center text-[var(--color-primary)] overflow-hidden shadow-md">
                      {compressing ? (
                        <div className="flex flex-col items-center justify-center gap-1 text-[var(--color-primary)]">
                          <Loader2 className="w-7 h-7 animate-spin" />
                          <span className="text-[10px] font-semibold">Otimizando</span>
                        </div>
                      ) : formData.avatar_url ? (
                        <img src={formData.avatar_url} alt="Foto de perfil" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-14 h-14" />
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    A foto é exibida no perfil e credenciais de campo do Instituto Ádapo.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-2 w-full pt-1">
                    <label className="inline-flex items-center justify-center gap-2 px-3 py-2 min-h-[44px] rounded-xl text-xs font-semibold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer shadow-xs active:scale-95 flex-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{compressing ? 'Processando...' : 'Alterar Foto'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={compressing}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl text-xs font-semibold border border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>{showUrlInput ? 'Ocultar' : 'Link / Drive'}</span>
                    </button>

                    {formData.avatar_url && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, avatar_url: '' })}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl text-xs font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] transition-colors w-full"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remover Foto</span>
                      </button>
                    )}
                  </div>

                  {showUrlInput && (
                    <div className="pt-2 w-full animate-in fade-in duration-150 text-left">
                      <Input
                        placeholder="Cole a URL ou link do Google Drive"
                        value={formData.avatar_url}
                        onChange={handleDriveUrlChange}
                        className="text-base sm:text-xs min-h-[44px]"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-[var(--border-default)] space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">
                      Status Operacional
                    </label>
                    <Select
                      name="status"
                      options={[
                        { value: 'ativo', label: 'Ativo' },
                        { value: 'inativo', label: 'Inativo' },
                      ]}
                      value={formData.status}
                      onChange={handleChange}
                      className="text-base sm:text-sm min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">
                      Tipo de Voluntário
                    </label>
                    <Select
                      name="tipo"
                      options={TIPO_VOLUNTARIO_OPTIONS}
                      value={formData.tipo}
                      onChange={handleChange}
                      className="text-base sm:text-sm min-h-[44px]"
                    />
                  </div>

                  {formData.tipo === 'brincante' && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 animate-in fade-in duration-150 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-100">
                        <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>Período de Experiência</span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        Voluntários Brincantes têm acesso à Ciranda de Login. Os módulos de <strong>Pedagogia</strong> e <strong>Beneficiários</strong> permanecem restritos por governança de dados.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Resumo SOS Rápido */}
              <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                      Resumo SOS & Saúde
                    </h3>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-red-600 bg-red-500/10 px-2 py-0.5 rounded-md">
                    Emergência
                  </span>
                </div>

                <div className="space-y-3">
                  <Select
                    label="Tipo Sanguíneo"
                    name="tipo_sanguineo"
                    options={TIPO_SANGUINEO_OPTIONS}
                    value={formData.tipo_sanguineo}
                    onChange={handleChange}
                    className="text-base sm:text-sm min-h-[44px]"
                  />

                  <Input
                    label="Plano de Saúde / Convênio"
                    name="plano_saude"
                    value={formData.plano_saude}
                    onChange={handleChange}
                    placeholder="Ex: Unimed, SUS, Bradesco"
                    className="text-base sm:text-sm min-h-[44px]"
                  />
                </div>
              </div>
            </div>

            {/* ── COLUNA PRINCIPAL (2/3): DADOS PESSOAIS, ENDEREÇO & FICHA MÉDICA ── */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bloco 1: Informações Pessoais & Atuação */}
              <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-5">
                <div className="flex items-center gap-2.5 border-b border-[var(--border-default)] pb-3.5">
                  <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center font-bold text-xs shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                      1. Informações Pessoais & Atuação
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      Identificação do voluntário, data de nascimento e cargo institucional
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label="Nome Completo *"
                      name="nome_completo"
                      value={formData.nome_completo}
                      onChange={handleChange}
                      placeholder="Ex: Carlos Eduardo Lima"
                      className="text-base sm:text-sm min-h-[44px]"
                      required
                    />
                  </div>

                  <Input
                    label="CPF *"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleCpfChange}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="text-base sm:text-sm min-h-[44px]"
                    required
                  />

                  <Input
                    label="Data de Nascimento"
                    type="date"
                    name="data_nascimento"
                    value={formData.data_nascimento}
                    onChange={handleChange}
                    helperText="Alimenta o radar de aniversariantes da ONG"
                    className="text-base sm:text-sm min-h-[44px]"
                  />

                  <Input
                    label="Telefone / WhatsApp *"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleTelefoneChange}
                    placeholder="(11) 99999-8888"
                    maxLength={15}
                    className="text-base sm:text-sm min-h-[44px]"
                    required
                  />

                  <Input
                    label="E-mail *"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="voluntario@instituto.org"
                    className="text-base sm:text-sm min-h-[44px]"
                    required
                  />

                  <div>
                    <label className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1 block">
                      Área de Atuação
                    </label>
                    <Select
                      name="area_atuacao"
                      options={AREA_ATUACAO_OPTIONS}
                      value={formData.area_atuacao}
                      onChange={handleChange}
                      className="text-base sm:text-sm min-h-[44px]"
                    />
                  </div>

                  <Input
                    label="Função / Cargo Específico"
                    name="funcao"
                    value={formData.funcao}
                    onChange={handleChange}
                    className="text-base sm:text-sm min-h-[44px]"
                  />

                  <Input
                    label="Data de Início"
                    type="date"
                    name="data_inicio"
                    value={formData.data_inicio}
                    onChange={handleChange}
                    className="text-base sm:text-sm min-h-[44px]"
                    required
                  />

                  <Input
                    label="Data de Término Previsto"
                    type="date"
                    name="data_fim"
                    value={formData.data_fim}
                    onChange={handleChange}
                    className="text-base sm:text-sm min-h-[44px]"
                  />
                </div>
              </div>

              {/* Bloco 2: Endereço & Contato Familiar */}
              <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-5">
                <div className="flex items-center gap-2.5 border-b border-[var(--border-default)] pb-3.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                      2. Endereço Residencial & Contato SOS
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      Localização do voluntário com busca de CEP e pessoa de referência
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Input
                      label="CEP"
                      name="cep"
                      value={formData.cep}
                      onChange={handleCepChange}
                      placeholder="00000-000"
                      maxLength={9}
                      className="text-base sm:text-sm min-h-[44px]"
                      helperText={buscandoCep ? 'Buscando CEP...' : 'Preenchimento automático'}
                    />
                    {buscandoCep && (
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)] absolute right-3 top-9" />
                    )}
                  </div>

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
                    label="Número"
                    name="numero"
                    value={formData.numero}
                    onChange={handleChange}
                    className="text-base sm:text-sm min-h-[44px]"
                  />

                  <Input
                    label="Bairro"
                    name="bairro"
                    value={formData.bairro}
                    onChange={handleChange}
                    className="text-base sm:text-sm min-h-[44px]"
                  />

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

                <div className="pt-4 border-t border-[var(--border-default)] space-y-3">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-[var(--color-primary)]" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">
                      Contato Familiar em Casos de Emergência
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Nome do Contato"
                      name="contato_emergencia_nome"
                      value={formData.contato_emergencia_nome}
                      onChange={handleChange}
                      placeholder="Ex: Maria Lima (Mãe)"
                      className="text-base sm:text-sm min-h-[44px]"
                    />

                    <Input
                      label="Grau de Parentesco"
                      name="contato_emergencia_parentesco"
                      value={formData.contato_emergencia_parentesco}
                      onChange={handleChange}
                      placeholder="Ex: Mãe, Cônjuge, Irmão"
                      className="text-base sm:text-sm min-h-[44px]"
                    />

                    <Input
                      label="Telefone do Contato"
                      name="contato_emergencia_telefone"
                      value={formData.contato_emergencia_telefone}
                      onChange={handleTelefoneChange}
                      placeholder="(11) 98888-0000"
                      maxLength={15}
                      className="text-base sm:text-sm min-h-[44px]"
                    />
                  </div>
                </div>
              </div>

              {/* Bloco 3: Cuidados Médicos & Observações */}
              <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-5">
                <div className="flex items-center gap-2.5 border-b border-[var(--border-default)] pb-3.5">
                  <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center font-bold text-xs shrink-0">
                    <Heart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                      3. Ficha Médica SOS & Observações
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      Cuidados clínicos durante viagens sociais e mutirões externos
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label="Alergias (Alimentos, Medicamentos, Insetos)"
                      name="alergias"
                      value={formData.alergias}
                      onChange={handleChange}
                      placeholder="Ex: Alergia grave a Penicilina e Dipirona"
                      className="text-base sm:text-sm min-h-[44px]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Input
                      label="Medicamentos de Uso Contínuo"
                      name="medicamentos_uso_continuo"
                      value={formData.medicamentos_uso_continuo}
                      onChange={handleChange}
                      placeholder="Ex: Insulina, Anti-hipertensivo"
                      className="text-base sm:text-sm min-h-[44px]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1 block">
                      Observações Adicionais / Restrições Operacionais
                    </label>
                    <textarea
                      name="observacoes"
                      value={formData.observacoes}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Disponibilidade de horários, preferências de projetos, restrições corporais..."
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
                  Excluir Voluntário
                </Button>

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3">
                  <Link href="/dashboard/voluntarios" className="w-full sm:w-auto">
                    <Button type="button" variant="secondary" className="w-full sm:w-auto min-h-[44px]">
                      Cancelar
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={saving || compressing}
                    icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    className="w-full sm:w-auto min-h-[44px]"
                  >
                    {saving ? 'Atualizando...' : 'Atualizar Voluntário'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* MODAL IN-APP DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-danger-soft)] text-[var(--color-danger)] flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                Excluir Voluntário Permanentemente?
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Tem certeza de que deseja remover <strong>{formData.nome_completo || 'este voluntário'}</strong>? Esta ação removerá seus vínculos com escalas e histórico no sistema.
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
