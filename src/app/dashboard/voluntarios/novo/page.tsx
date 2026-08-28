'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FieldInfo } from '@/components/ui/FieldInfo';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Save, Camera, User, Heart, ShieldAlert, MapPin, PhoneCall, Upload, Trash2, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';

const TIPO_VOLUNTARIO_OPTIONS = [
  { value: 'operacional', label: 'Voluntário Operacional (Equipe Interna)' },
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

// Utilitário para converter links do Google Drive em links diretos de imagem
function formatDriveUrl(url: string): string {
  if (!url) return '';
  const match = url.match(/\/file\/d\/([^\/]+)/) || url.match(/id=([^&]+)/);
  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  return url;
}

export default function NovoVoluntarioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const [formData, setFormData] = useState({
    nome_completo: '',
    cpf: '',
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDriveUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDriveUrl(e.target.value);
    setFormData({ ...formData, avatar_url: formatted });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem é muito grande. Escolha uma imagem de até 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, avatar_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
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
      },
    ]);

    if (insertError) {
      setError(
        insertError.message.includes('unique constraint')
          ? 'Este CPF já está cadastrado para outro voluntário.'
          : insertError.message
      );
      setLoading(false);
    } else {
      router.push('/dashboard/voluntarios');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Novo Voluntário"
        subtitle="Cadastre voluntários operacionais da equipe ou monitores externos do Instituto Ádapo"
        action={
          <Link href="/dashboard/voluntarios">
            <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
              Voltar para Lista
            </Button>
          </Link>
        }
      />

      <div className="p-4 sm:p-6 lg:p-8 w-full max-w-4xl mx-auto space-y-6 flex-1 overflow-y-auto transition-all duration-300">
        {error && (
          <div className="p-4 rounded-xl bg-[var(--color-danger-soft)] text-[var(--color-danger)] text-sm font-medium border border-[var(--color-danger)]/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* TOPO: Imagem Institucional do Voluntário (Upload + Preview) */}
          <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group shrink-0">
              <div className="w-28 h-28 rounded-2xl bg-[var(--color-primary-soft)] border-2 border-[var(--color-primary)] flex items-center justify-center text-[var(--color-primary)] overflow-hidden shadow-md">
                {formData.avatar_url ? (
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
                <FieldInfo text="A foto será exibida no perfil do voluntário ao acessar o sistema e em credenciais de eventos presenciais do Instituto Ádapo." />
              </div>

              <p className="text-xs text-[var(--text-muted)]">
                Faça o upload da foto diretamente do seu computador ou cole um link (incluindo Google Drive).
              </p>

              {/* Botões de Ação de Foto */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer shadow-sm">
                  <Upload className="w-4 h-4" />
                  <span>Escolher Foto do Computador</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>{showUrlInput ? 'Ocultar Link' : 'Cole um Link / Drive'}</span>
                </button>

                {formData.avatar_url && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, avatar_url: '' })}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover Foto</span>
                  </button>
                )}
              </div>

              {/* Campo para colar URL / Google Drive (Convertido automaticamente) */}
              {showUrlInput && (
                <div className="pt-2">
                  <Input
                    placeholder="Cole a URL ou link do Google Drive (ex: https://drive.google.com/file/d/...)"
                    value={formData.avatar_url}
                    onChange={handleDriveUrlChange}
                  />
                  <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
                    Links do Google Drive são convertidos automaticamente para exibição direta.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* SEÇÃO 1: Dados Pessoais & Atuação */}
          <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-3">
              <User className="w-5 h-5 text-[var(--color-primary)]" />
              <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                1. Informações Pessoais & Atuação
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Nome Completo"
                  name="nome_completo"
                  value={formData.nome_completo}
                  onChange={handleChange}
                  placeholder="Ex: Carlos Eduardo Lima"
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
                label="Telefone / WhatsApp"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                placeholder="(11) 99999-8888"
                required
              />

              <div className="md:col-span-2">
                <Input
                  label="E-mail Institucional / Pessoal"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="voluntario@gmail.com"
                  required
                />
              </div>

              <div>
                <div className="flex items-center mb-1">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Tipo de Voluntário *</label>
                  <FieldInfo text="Operacional: atuação fixa contínua nas áreas administrativas. Monitor Externo: atuação temporária alocada a um projeto específico." />
                </div>
                <Select
                  name="tipo"
                  options={TIPO_VOLUNTARIO_OPTIONS}
                  value={formData.tipo}
                  onChange={handleChange}
                />
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
                />
              </div>

              <Input
                label="Função / Cargo Específico"
                name="funcao"
                value={formData.funcao}
                onChange={handleChange}
                placeholder="Ex: Diretor de Operações, Monitor de Oficina"
              />

              <Input
                label="Data de Início"
                type="date"
                name="data_inicio"
                value={formData.data_inicio}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* SEÇÃO 2: Endereço & Contato de Emergência */}
          <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-3">
              <PhoneCall className="w-5 h-5 text-[var(--color-primary)]" />
              <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                2. Endereço Residencial & Contato de Emergência
              </h3>
              <FieldInfo text="Estes dados são essenciais para segurança operacional em viagens comunitárias, projetos de campo e localização dos voluntários da ONG." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="CEP"
                name="cep"
                value={formData.cep}
                onChange={handleChange}
                placeholder="00000-000"
              />

              <div className="md:col-span-2">
                <Input
                  label="Rua / Logradouro"
                  name="rua"
                  value={formData.rua}
                  onChange={handleChange}
                  placeholder="Rua das Palmeiras"
                />
              </div>

              <Input
                label="Número"
                name="numero"
                value={formData.numero}
                onChange={handleChange}
                placeholder="100"
              />

              <Input
                label="Bairro"
                name="bairro"
                value={formData.bairro}
                onChange={handleChange}
                placeholder="Centro"
              />

              <Input
                label="Cidade"
                name="cidade"
                value={formData.cidade}
                onChange={handleChange}
                placeholder="São Paulo"
              />

              <Select
                label="UF"
                name="uf"
                options={UF_OPTIONS}
                value={formData.uf}
                onChange={handleChange}
              />
            </div>

            <div className="pt-4 border-t border-[var(--border-default)] space-y-3">
              <div className="flex items-center gap-2">
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
                />

                <Input
                  label="Grau de Parentesco"
                  name="contato_emergencia_parentesco"
                  value={formData.contato_emergencia_parentesco}
                  onChange={handleChange}
                  placeholder="Ex: Mãe, Cônjuge, Irmão"
                />

                <Input
                  label="Telefone do Contato"
                  name="contato_emergencia_telefone"
                  value={formData.contato_emergencia_telefone}
                  onChange={handleChange}
                  placeholder="(11) 98888-0000"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: Saúde & Cuidados Médicos (Emergência) */}
          <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-3">
              <Heart className="w-5 h-5 text-[var(--color-danger)]" />
              <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                3. Saúde & Cuidados Médicos em Emergências
              </h3>
              <FieldInfo text="Informações confidenciais acessadas exclusivamente pela coordenação em situações de pronto atendimento médico durante mutirões, eventos ou projetos sociais externos." />
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
                />
              </div>

              <Input
                label="Plano de Saúde / Convênio (Se houver)"
                name="plano_saude"
                value={formData.plano_saude}
                onChange={handleChange}
                placeholder="Ex: Unimed, Bradesco, SUS"
              />

              <div className="md:col-span-2">
                <div className="flex items-center mb-1">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Alergias (Alimentos, Medicamentos, Insetos)</label>
                  <FieldInfo text="Alergias graves a medicamentos (ex: dipirona, penicilina) ou alimentos para garantir refeições seguras em mutirões da ONG." />
                </div>
                <Input
                  name="alergias"
                  value={formData.alergias}
                  onChange={handleChange}
                  placeholder="Ex: Alergia grave a Dipirona e Frutos do Mar"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center mb-1">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Medicamentos de Uso Contínuo</label>
                  <FieldInfo text="Permite que a coordenação saiba quais medicamentos a pessoa necessita tomar durante atividades de longa duração." />
                </div>
                <Input
                  name="medicamentos_uso_continuo"
                  value={formData.medicamentos_uso_continuo}
                  onChange={handleChange}
                  placeholder="Ex: Insulina, Anti-hipertensivo"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 4: Observações Adicionais */}
          <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
            <h3 className="font-display font-bold text-base text-[var(--text-primary)] border-b border-[var(--border-default)] pb-3">
              4. Observações Adicionais
            </h3>
            <textarea
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              rows={3}
              placeholder="Disponibilidade de horário, preferências de atividades, restrições corporais..."
              className="w-full p-3.5 rounded-lg text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/dashboard/voluntarios">
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={loading} icon={<Save className="w-4 h-4" />}>
              {loading ? 'Salvando...' : 'Salvar Voluntário'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
