'use client';

import React, { useEffect, useState } from 'react';
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

export default function PerfilPage() {
  const supabase = createClient();
  const { theme, palette, bgStyle, toggleTheme, setPalette, setBgStyle } = useTheme();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Profile data
  const [profileId, setProfileId] = useState<string>('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('voluntario_operacional');
  const [areaAtuacao, setAreaAtuacao] = useState('');

  // Password change data
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    async function loadUserProfile() {
      try {
        setLoading(true);
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) return;

        setProfileId(user.id);
        setEmail(user.email || '');

        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (prof) {
          setNomeCompleto(prof.nome_completo || '');
          setRole(prof.role || 'voluntario_operacional');
          setAreaAtuacao(prof.area_atuacao || '');
        }
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

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profileId) return;

    try {
      setSavingProfile(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          nome_completo: nomeCompleto,
          area_atuacao: areaAtuacao,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId);

      if (error) throw error;
      showNotification('Dados do perfil atualizados com sucesso!');
    } catch (err: any) {
      showNotification(err.message || 'Erro ao atualizar dados.', 'error');
    } finally {
      setSavingProfile(false);
    }
  }

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

      showNotification('Senha alterada com sucesso!');
      setCurrentPassword('');
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
      {/* Padronização UI-UX: Cabeçalho Principal da Página */}
      <PageHeader
        title={nomeCompleto || 'Meu Perfil'}
        description={`E-mail de acesso cadastrado: ${email}`}
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
        {/* Coluna 1 & 2: Dados Pessoais & Senha */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dados Pessoais Form */}
          <Card className="p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-3">
              <User className="w-4 h-4 text-[var(--color-primary)]" />
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Informações Pessoais</h2>
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
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">E-mail de Acesso</label>
                  <input
                    type="text"
                    value={email}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-default)] opacity-90 cursor-not-allowed font-mono-data"
                  />
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Gerenciado pela coordenação do Instituto Ádapo.
                  </span>
                </div>

                <Input
                  label="Área de Atuação"
                  value={areaAtuacao}
                  onChange={(e) => setAreaAtuacao(e.target.value)}
                  placeholder="Ex: Gestão, Psicologia, Tecnologia..."
                />
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
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Alterar Senha</h2>
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
                <h2 className="text-sm font-bold text-[var(--text-primary)]">Tema & Aparência</h2>
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
