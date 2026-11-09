'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FieldInfo } from '@/components/ui/FieldInfo';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Save,
  User,
  Heart,
  ShieldAlert,
  MapPin,
  PhoneCall,
  Upload,
  Trash2,
  Link as LinkIcon,
  CheckCircle2,
  Loader2,
  Search,
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

export default function NovoVoluntarioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
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
    data_inicio: new Date().toISOString().split('T')[0],
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
        showToast('Foto otimizada com sucesso (~35KB)!', 'success');
      } catch {
        showToast('Erro ao processar imagem. Tente outro formato.', 'error');
      } finally {
        setCompressing(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: insertError } = await supabase.from('voluntarios').insert([
      {
        ...formData,
        data_fim: formData.data_fim || null,
        data_nascimento: formData.data_nascimento || null,
      },
    ]);

    if (insertError) {
      const isUniqueError = insertError.message.includes('unique constraint') || insertError.message.includes('cpf');
      const errorMsg = isUniqueError
        ? 'Este CPF já está cadastrado para outro voluntário no Instituto Ádapo.'
        : `Erro ao salvar: ${insertError.message}`;
      setError(errorMsg);
      showToast(errorMsg, 'error');
      setLoading(false);
    } else {
      showToast('Voluntário cadastrado com sucesso!', 'success');
      setTimeout(() => {
        router.push('/dashboard/voluntarios');
      }, 700);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Novo Voluntário"
        subtitle="Cadastro institucional, enquadramento de equipe e controle de acesso no Instituto Ádapo"
        action={
          <Link href="/dashboard/voluntarios">
            <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
              Voltar para Lista
            </Button>
          </Link>
        }
      />

      <div className="p-4 sm:p-6 lg:p-8 w-full max-w-4xl mx-auto space-y-6 flex-1 overflow-y-auto transition-all duration-300">
        {/* Breadcrumb estruturado */}
        <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
          <Link href="/dashboard" className="hover:text-[var(--text-primary)] transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/dashboard/voluntarios" className="hover:text-[var(--text-primary)] transition-colors">
            Voluntários
          </Link>
          <span>/</span>
          <span className="text-[var(--color-primary)] font-semibold">Novo Voluntário</span>
        </div>

        {/* Notificação Toast Flutuante/In-App */}
        {toast && (
          <div
            className={`p-4 rounded-2xl text-sm font-medium border shadow-md flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200 ${
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
          <div className="p-4 rounded-2xl bg-[var(--color-danger-soft)] text-[var(--color-danger)] text-sm font-medium border border-[var(--color-danger)]/20 shadow-xs flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 pb-8">
          {/* TOPO: Foto de Perfil Institucional com Compressão Canvas */}
          <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group shrink-0">
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

            <div className="flex-1 space-y-3 text-center sm:text-left w-full">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                  Foto de Perfil Institucional
                </h3>
                <FieldInfo text="A foto será exibida no perfil do voluntário ao acessar o sistema e em credenciais de eventos presenciais do Instituto Ádapo. O sistema a otimiza automaticamente." />
              </div>

              <p className="text-xs text-[var(--text-muted)]">
                Faça o upload da foto diretamente do seu celular/computador com compressão automática, ou cole um link direto/Drive.
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer shadow-sm active:scale-95">
                  <Upload className="w-4 h-4" />
                  <span>{compressing ? 'Otimizando Imagem...' : 'Escolher Foto'}</span>
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
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold border border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>{showUrlInput ? 'Ocultar Link' : 'Cole um Link / Drive'}</span>
                </button>

                {formData.avatar_url && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, avatar_url: '' })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover Foto</span>
                  </button>
                )}
              </div>

              {showUrlInput && (
                <div className="pt-2 animate-in fade-in duration-150">
                  <Input
                    placeholder="Cole a URL ou link do Google Drive (ex: https://drive.google.com/file/d/...)"
                    value={formData.avatar_url}
                    onChange={handleDriveUrlChange}
                    className="text-base sm:text-sm min-h-[44px]"
                  />
                  <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
                    Links do Google Drive são convertidos automaticamente para exibição direta.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* SEÇÃO 1: Dados Pessoais & Atuação (Incluindo Data de Nascimento) */}
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
                  Identificação do membro, data de nascimento e credenciais de acesso
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
                helperText="Alimenta automaticamente o radar de aniversariantes da ONG"
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
                label="E-mail Institucional / Pessoal *"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="voluntario@gmail.com"
                className="text-base sm:text-sm min-h-[44px]"
                required
              />

              {/* TIPO DE VOLUNTÁRIO COM DESTAQUE BRINCANTE */}
              <div className="md:col-span-2">
                <div className="flex items-center mb-1">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">
                    Tipo de Voluntário *
                  </label>
                  <FieldInfo text="Selecione o enquadramento do voluntário na organização. Voluntários Brincantes passam por período de experiência e possuem permissões restritas a dados de beneficiários e pedagogia." />
                </div>
                <Select
                  name="tipo"
                  options={TIPO_VOLUNTARIO_OPTIONS}
                  value={formData.tipo}
                  onChange={handleChange}
                  className="text-base sm:text-sm min-h-[44px]"
                />

                {formData.tipo === 'brincante' && (
                  <div className="mt-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200 animate-in fade-in duration-200">
                    <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-amber-900 dark:text-amber-100">
                        Perfil Selecionado: Voluntário Brincante (Período de Experiência)
                      </p>
                      <p className="leading-relaxed opacity-90">
                        O voluntário integrará a equipe de organização em período de teste. Ele constará automaticamente na <strong>Ciranda do Login</strong> para criar seu primeiro acesso e navegar nas ferramentas operacionais.
                      </p>
                      <p className="leading-relaxed font-semibold text-amber-900 dark:text-amber-200">
                        Diretriz de Segurança e Governança: Por restrições de proteção aos dados dos alunos (LGPD), este usuário não terá acesso às áreas de Pedagogia e Beneficiários.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center mb-1">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Área de Atuação *</label>
                  <FieldInfo text="Define o departamento e grupo de trabalho do voluntário no Instituto Ádapo." />
                </div>
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
                placeholder="Ex: Diretor de Operações, Monitor de Oficina"
                className="text-base sm:text-sm min-h-[44px]"
              />

              <Input
                label="Data de Início *"
                type="date"
                name="data_inicio"
                value={formData.data_inicio}
                onChange={handleChange}
                className="text-base sm:text-sm min-h-[44px]"
                required
              />

              <Input
                label="Data de Término Previsto (Opcional)"
                type="date"
                name="data_fim"
                value={formData.data_fim}
                onChange={handleChange}
                className="text-base sm:text-sm min-h-[44px]"
              />
            </div>
          </div>

          {/* SEÇÃO 2: Endereço & Contato de Emergência (Com Busca ViaCEP) */}
          <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-5">
            <div className="flex items-center gap-2.5 border-b border-[var(--border-default)] pb-3.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                    2. Endereço Residencial & Contato de Emergência
                  </h3>
                  <FieldInfo text="Estes dados são essenciais para segurança operacional em viagens comunitárias, projetos de campo e localização dos voluntários da ONG." />
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Localização com autopreenchimento por CEP e pessoas de referência
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
                  helperText={buscandoCep ? 'Buscando endereço no ViaCEP...' : 'Digite o CEP para preencher o endereço'}
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
                  placeholder="Ex: Rua das Palmeiras"
                  className="text-base sm:text-sm min-h-[44px]"
                />
              </div>

              <Input
                label="Número"
                name="numero"
                value={formData.numero}
                onChange={handleChange}
                placeholder="100"
                className="text-base sm:text-sm min-h-[44px]"
              />

              <Input
                label="Bairro"
                name="bairro"
                value={formData.bairro}
                onChange={handleChange}
                placeholder="Centro"
                className="text-base sm:text-sm min-h-[44px]"
              />

              <Input
                label="Cidade"
                name="cidade"
                value={formData.cidade}
                onChange={handleChange}
                placeholder="São Paulo"
                className="text-base sm:text-sm min-h-[44px]"
              />

              <Select
                label="UF"
                name="uf"
                options={UF_OPTIONS}
                value={formData.uf}
                onChange={handleChange}
                className="text-base sm:text-sm min-h-[44px]"
              />
            </div>

            <div className="pt-4 border-t border-[var(--border-default)] space-y-3">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-[var(--color-primary)]" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">
                  Contato Familiar de Emergência
                </h4>
                <FieldInfo text="Pessoa a ser notificada imediatamente em caso de qualquer imprevisto durante as atividades presenciais da ONG." />
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

          {/* SEÇÃO 3: Saúde & Cuidados Médicos */}
          <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-5">
            <div className="flex items-center gap-2.5 border-b border-[var(--border-default)] pb-3.5">
              <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center font-bold text-xs shrink-0">
                <Heart className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                    3. Saúde & Cuidados Médicos em Emergências
                  </h3>
                  <FieldInfo text="Informações confidenciais acessadas exclusivamente pela coordenação em situações de pronto atendimento médico durante mutirões, eventos ou projetos sociais externos." />
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Informações clínicas confidenciais para primeiros socorros
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center mb-1">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Tipo Sanguíneo</label>
                  <FieldInfo text="Útil em casos de necessidade de transfusão ou atendimento hospitalar urgente." />
                </div>
                <Select
                  name="tipo_sanguineo"
                  options={TIPO_SANGUINEO_OPTIONS}
                  value={formData.tipo_sanguineo}
                  onChange={handleChange}
                  className="text-base sm:text-sm min-h-[44px]"
                />
              </div>

              <Input
                label="Plano de Saúde / Convênio (Se houver)"
                name="plano_saude"
                value={formData.plano_saude}
                onChange={handleChange}
                placeholder="Ex: Unimed, Bradesco, SUS"
                className="text-base sm:text-sm min-h-[44px]"
              />

              <div className="md:col-span-2">
                <div className="flex items-center mb-1">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">
                    Alergias (Alimentos, Medicamentos, Insetos)
                  </label>
                  <FieldInfo text="Alergias graves a medicamentos (ex: dipirona, penicilina) ou alimentos para garantir refeições seguras em mutirões da ONG." />
                </div>
                <Input
                  name="alergias"
                  value={formData.alergias}
                  onChange={handleChange}
                  placeholder="Ex: Alergia grave a Dipirona e Frutos do Mar"
                  className="text-base sm:text-sm min-h-[44px]"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center mb-1">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">
                    Medicamentos de Uso Contínuo
                  </label>
                  <FieldInfo text="Permite que a coordenação saiba quais medicamentos a pessoa necessita tomar durante atividades de longa duração." />
                </div>
                <Input
                  name="medicamentos_uso_continuo"
                  value={formData.medicamentos_uso_continuo}
                  onChange={handleChange}
                  placeholder="Ex: Insulina, Anti-hipertensivo"
                  className="text-base sm:text-sm min-h-[44px]"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 4: Observações Adicionais */}
          <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
            <h3 className="font-display font-bold text-base text-[var(--text-primary)] border-b border-[var(--border-default)] pb-3">
              4. Observações Adicionais
            </h3>
            <textarea
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              rows={3}
              placeholder="Disponibilidade de horário, preferências de atividades, restrições corporais..."
              className="w-full p-3.5 rounded-xl text-base sm:text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] focus:outline-none focus:border-[var(--color-primary)] font-medium transition-all min-h-[100px]"
            />
          </div>

          {/* BARRA DE AÇÕES INFERIORES */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
            <Link href="/dashboard/voluntarios" className="w-full sm:w-auto">
              <Button type="button" variant="secondary" className="w-full sm:w-auto min-h-[44px]">
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading || compressing}
              icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              className="w-full sm:w-auto min-h-[44px]"
            >
              {loading ? 'Salvando...' : 'Salvar Voluntário'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
