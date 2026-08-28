'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  User,
  Shield,
  KeyRound,
  Palette,
  Check,
  Save,
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
  Mail,
  Sparkles,
  Layers,
  LayoutGrid,
  Camera,
  Upload,
  Trash2,
  Phone,
  Briefcase,
  Link as LinkIcon,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useTheme, ThemePalette } from '@/components/layout/ThemeProvider';
import { PageHeader } from '@/components/ui/PageHeader';

const PALETTE_OPTIONS: { id: ThemePalette; name: string; hex: string; desc: string }[] = [
  { id: 'laranja', name: 'Laranja Institucional', hex: '#F2632D', desc: 'Identidade oficial do Instituto Ádapo' },
  { id: 'roxo', name: 'Roxo Ádapo', hex: '#93368F', desc: 'Vibrante e criativo' },
  { id: 'verde', name: 'Verde Sustentável', hex: '#1C9C82', desc: 'Foco em impacto social e ambiente' },
  { id: 'azul', name: 'Azul Oceano', hex: '#2563EB', desc: 'Clareza, confiança e estrutura' },
  { id: 'vermelho', name: 'Vermelho Vibrante', hex: '#EF4444', desc: 'Energia e engajamento comunitário' },
  { id: 'amarelo', name: 'Amarelo Sol', hex: '#D97706', desc: 'Acolhimento e energia positiva' },
  { id: 'rosa', name: 'Rosa Solidário', hex: '#EC4899', desc: 'Empatia e cuidado humano' },
];

function formatDriveUrl(url: string) {
  if (!url) return '';
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  return url;
}

function getInitials(name: string): string {
  if (!name) return 'A';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function PerfilPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, palette, bgStyle, toggleTheme, setPalette, setBgStyle } = useTheme();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Profile & Voluntário data
  const [profileId, setProfileId] = useState<string>('');
  const [voluntarioId, setVoluntarioId] = useState<string | null>(null);
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('voluntario_operacional');
  const [areaAtuacao, setAreaAtuacao] = useState('');
  const [telefone, setTelefone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [funcao, setFuncao] = useState('');

  // Password change data
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    async function loadUserProfile() {
      try {
        setLoading(true);
        const {
          data: { user },
          error: authErr,
        } = await supabase.auth.getUser();
        if (authErr || !user) return;

        setProfileId(user.id);
        const userEmail = user.email || '';
        setEmail(userEmail);

        // 1. Carregar perfil da tabela profiles
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        let nomeInicial = '';
        let areaInicial = '';
        let avatarInicial = '';

        if (prof) {
          nomeInicial = prof.nome_completo || '';
          setRole(prof.role || 'voluntario_operacional');
          areaInicial = prof.area_atuacao || '';
          avatarInicial = prof.avatar_url || '';
        }

        // 2. Carregar dados complementares da tabela voluntarios vinculada pelo e-mail
        if (userEmail) {
          const { data: vol } = await supabase
            .from('voluntarios')
            .select('id, nome_completo, telefone, area_atuacao, funcao, avatar_url')
            .eq('email', userEmail)
            .maybeSingle();

          if (vol) {
            setVoluntarioId(vol.id);
            if (!nomeInicial && vol.nome_completo) nomeInicial = vol.nome_completo;
            if (!areaInicial && vol.area_atuacao) areaInicial = vol.area_atuacao;
            if (!avatarInicial && vol.avatar_url) avatarInicial = vol.avatar_url;
            setTelefone(vol.telefone || '');
            setFuncao(vol.funcao || '');
          }
        }

        setNomeCompleto(nomeInicial);
        setAreaAtuacao(areaInicial);
        setAvatarUrl(avatarInicial);
      } catch (err) {
        console.error('Erro ao carregar perfil:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, [supabase]);

  function showNotification(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  // Upload de foto local (arquivo)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showNotification('A imagem é muito grande. Escolha uma imagem de até 5MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
        showNotification('Foto carregada. Clique em "Salvar Alterações" para confirmar.', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  // Alteração de link direto / Google Drive
  const handleDriveUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDriveUrl(e.target.value);
    setAvatarUrl(formatted);
  };

  // Salvar perfil com sincronização automática em profiles e voluntarios
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profileId) return;

    try {
      setSavingProfile(true);

      // 1. Atualizar tabela profiles (sessão/auth)
      const { error: profError } = await supabase
        .from('profiles')
        .update({
          nome_completo: nomeCompleto,
          area_atuacao: areaAtuacao,
          avatar_url: avatarUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId);

      if (profError) throw profError;

      // 2. Sincronizar com a tabela voluntarios (se houver cadastro vinculado)
      if (email) {
        await supabase
          .from('voluntarios')
          .update({
            nome_completo: nomeCompleto,
            telefone: telefone,
            area_atuacao: areaAtuacao,
            avatar_url: avatarUrl || null,
          })
          .eq('email', email);
      }

      showNotification('Perfil e foto atualizados com sucesso! Sincronizado com a equipe.', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Erro ao atualizar dados.', 'error');
    } finally {
      setSavingProfile(false);
    }
  }

  // Alteração de senha
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showNotification('A nova senha e a confirmação não coincidem.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showNotification('A nova senha deve conter pelo menos 6 caracteres.', 'error');
      return;
    }

    try {
      setSavingPassword(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      showNotification('Senha alterada com sucesso!', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showNotification(err.message || 'Erro ao alterar a senha.', 'error');
    } finally {
      setSavingPassword(false);
    }
  }

  const roleLabelMap: Record<string, string> = {
    admin: 'Administrador (Acesso Total)',
    coordenador: 'Coordenador de Projetos',
    voluntario_operacional: 'Voluntário Operacional',
    voluntario_externo: 'Voluntário Externo',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto select-none">
      {/* Cabeçalho Principal da Página */}
      <PageHeader
        title={nomeCompleto || 'Meu Perfil'}
        description={`E-mail de acesso institucional: ${email}`}
        icon={<User className="w-6 h-6" />}
        badge={<Badge variant="purple">{roleLabelMap[role] || role}</Badge>}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between shadow-sm transition-all ${
            toast.type === 'success'
              ? 'bg-[var(--color-success-soft)] text-[var(--color-success)] border border-[var(--color-success)]/30'
              : 'bg-[var(--color-danger-soft)] text-[var(--color-danger)] border border-[var(--color-danger)]/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Grid Principal: Forms na esquerda + Tema na direita */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Coluna 1 & 2: Foto, Dados Pessoais & Senha */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card de Foto de Perfil & Identidade */}
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[var(--color-primary)]" />
                <h2 className="text-sm font-bold text-[var(--text-primary)]">Foto de Perfil &amp; Identidade</h2>
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">
                Visível na ciranda de login e no painel institucional
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Preview do Avatar */}
              <div className="relative group shrink-0">
                <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-[var(--border-default)] bg-[var(--bg-secondary)] flex items-center justify-center shadow-md">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={nomeCompleto} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white font-bold text-2xl shadow-inner">
                      {getInitials(nomeCompleto)}
                    </div>
                  )}
                </div>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="absolute -top-2 -right-2 p-1.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-md transition-transform hover:scale-110 cursor-pointer"
                    title="Remover foto"
                    aria-label="Remover foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Controles de Upload e Link */}
              <div className="flex-1 space-y-3.5 w-full">
                <div>
                  <label className="text-xs font-bold text-[var(--text-primary)] block mb-1">
                    Enviar Foto do Computador ou Celular
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    id="profile-upload"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon={<Upload className="w-4 h-4" />}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Escolher Imagem
                    </Button>
                    {avatarUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="w-4 h-4 text-rose-500" />}
                        onClick={() => setAvatarUrl('')}
                      >
                        Remover Foto
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">
                    Formatos suportados: JPG, PNG ou WEBP (até 5MB).
                  </p>
                </div>

                <div className="pt-2 border-t border-[var(--border-default)]">
                  <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
                    Ou Cole um Link Direto / Google Drive
                  </label>
                  <div className="relative">
                    <LinkIcon className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
                    <input
                      type="url"
                      placeholder="https://drive.google.com/file/d/... ou link de imagem"
                      value={avatarUrl}
                      onChange={handleDriveUrlChange}
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] placeholder:text-[var(--text-muted)] font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Dados Pessoais Form */}
          <Card className="p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-3">
              <User className="w-4 h-4 text-[var(--color-primary)]" />
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Informações Pessoais &amp; Atuação</h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <Input
                label="Nome Completo"
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
                placeholder="Seu nome completo"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">E-mail Institucional</label>
                  <input
                    type="text"
                    value={email}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-default)] opacity-90 cursor-not-allowed font-mono-data"
                  />
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Identificador de login gerenciado pela coordenação.
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Telefone / WhatsApp</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
                    <input
                      type="text"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="(98) 98888-8888"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-lg text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] focus:outline-none focus:border-[var(--color-primary)] font-mono-data"
                    />
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Contato institucional da equipe.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                <Input
                  label="Área de Atuação"
                  value={areaAtuacao}
                  onChange={(e) => setAreaAtuacao(e.target.value)}
                  placeholder="Ex: Gestão, Pedagogia, Psicologia, TI..."
                />

                {funcao && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">Função / Cargo</label>
                    <input
                      type="text"
                      value={funcao}
                      disabled
                      className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-default)] opacity-90 cursor-not-allowed font-medium"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={savingProfile} icon={<Save className="w-4 h-4" />}>
                  {savingProfile ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Alteração de Senha Form */}
          <Card className="p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-3">
              <KeyRound className="w-4 h-4 text-[var(--color-primary)]" />
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Alterar Senha de Acesso</h2>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nova Senha"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                />

                <Input
                  label="Confirmar Nova Senha"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="secondary" disabled={savingPassword} icon={<KeyRound className="w-4 h-4" />}>
                  {savingPassword ? 'Atualizando...' : 'Atualizar Senha'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Coluna 3: Personalização de Temas Dinâmicos */}
        <div className="space-y-6">
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-[var(--color-primary)]" />
                <h2 className="text-sm font-bold text-[var(--text-primary)]">Tema &amp; Aparência</h2>
              </div>
              <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
            </div>

            {/* Alternador de Modo Claro/Escuro */}
            <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {theme === 'light' ? (
                  <Sun className="w-4 h-4 text-[var(--color-warning)] shrink-0" />
                ) : (
                  <Moon className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                )}
                <div>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">
                    Modo {theme === 'light' ? 'Claro' : 'Escuro'}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">Ajustar brilho da interface</p>
                </div>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={toggleTheme}>
                Alternar
              </Button>
            </div>

            {/* Alternador de Estilo do Fundo Principal (Sutil vs Imersivo Trello) */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                Estilo do Fundo Principal
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBgStyle('sutil')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    bgStyle === 'sutil'
                      ? 'bg-[var(--bg-elevated)] border-[var(--color-primary)] ring-1 ring-[var(--color-primary)] shadow-sm'
                      : 'bg-[var(--bg-secondary)] border-[var(--border-default)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-xs font-bold text-[var(--text-primary)]">
                    <Layers className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    Fundo Suave
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] leading-tight">
                    Matiz sutil e discreto da cor do tema.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setBgStyle('imersivo')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    bgStyle === 'imersivo'
                      ? 'bg-[var(--bg-elevated)] border-[var(--color-primary)] ring-1 ring-[var(--color-primary)] shadow-sm'
                      : 'bg-[var(--bg-secondary)] border-[var(--border-default)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-xs font-bold text-[var(--text-primary)]">
                    <LayoutGrid className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    Estilo Trello
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] leading-tight">
                    Fundo com cor viva em destaque.
                  </p>
                </button>
              </div>
            </div>

            {/* Seleção de Paleta Dinâmica */}
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                Paleta de Cores do Sistema
              </label>

              <div className="space-y-1.5">
                {PALETTE_OPTIONS.map((pal) => {
                  const isSelected = palette === pal.id;

                  return (
                    <button
                      key={pal.id}
                      type="button"
                      onClick={() => setPalette(pal.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all group ${
                        isSelected
                          ? 'bg-[var(--bg-elevated)] border-[var(--color-primary)] shadow-sm ring-1 ring-[var(--color-primary)]'
                          : 'bg-[var(--bg-elevated)] border-[var(--border-default)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-4 h-4 rounded-full shadow-inner shrink-0 flex items-center justify-center text-white"
                          style={{ backgroundColor: pal.hex }}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <div className="truncate min-w-0">
                          <p className="text-xs font-bold text-[var(--text-primary)] truncate">{pal.name}</p>
                          <p className="text-[10px] text-[var(--text-muted)] truncate">{pal.desc}</p>
                        </div>
                      </div>

                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0 opacity-70 group-hover:opacity-100 transition-opacity ml-2"
                        style={{ backgroundColor: pal.hex }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
