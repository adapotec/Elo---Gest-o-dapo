'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { VolunteerCarousel, VoluntarioItem } from '@/components/auth/VolunteerCarousel';
import { EloLogo } from '@/components/ui/EloLogo';
import {
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  KeyRound,
  AlertCircle,
  Mail,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

const FALLBACK_VOLUNTARIOS: VoluntarioItem[] = [
  {
    id: '1',
    nome_completo: 'Coordenação Geral',
    email: 'admin@adapong.org',
    funcao: 'Coordenação Geral',
    area_atuacao: 'Diretoria',
    hasAccount: true,
  },
  {
    id: '2',
    nome_completo: 'Pedagogia & Oficinas',
    email: 'pedagogia@adapong.org',
    funcao: 'Pedagogia',
    area_atuacao: 'Projetos Sociais',
    hasAccount: false,
  },
  {
    id: '3',
    nome_completo: 'Comunicação & Mídia',
    email: 'comunicacao@adapong.org',
    funcao: 'Comunicação',
    area_atuacao: 'Marketing',
    hasAccount: false,
  },
  {
    id: '4',
    nome_completo: 'Gestão de Recursos',
    email: 'recursos@adapong.org',
    funcao: 'Parcerias',
    area_atuacao: 'Captação',
    hasAccount: false,
  },
];

function getInitials(name: string): string {
  if (!name) return 'A';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  // Etapa do fluxo: 'ciranda' (Etapa 1) vs 'login' (Etapa 2)
  const [step, setStep] = useState<'ciranda' | 'login'>('ciranda');

  // Estados de voluntários e ciranda
  const [voluntarios, setVoluntarios] = useState<VoluntarioItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [loadingVoluntarios, setLoadingVoluntarios] = useState<boolean>(true);

  // Modo manual vs ciranda
  const [useManualEmail, setUseManualEmail] = useState<boolean>(false);

  // Estados do formulário
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotLoading, setForgotLoading] = useState<boolean>(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Status de primeiro acesso detectado
  const selectedVoluntario = voluntarios[selectedIndex] || null;
  const isFirstAccess = selectedVoluntario ? !selectedVoluntario.hasAccount : false;

  // Atualiza email de recuperação quando o voluntário muda
  useEffect(() => {
    if (email) setForgotEmail(email);
  }, [email]);

  // Recuperação de senha via Supabase Auth
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) {
      setForgotError('Por favor, informe um e-mail válido.');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);

    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/perfil`,
      });

      if (resetErr) {
        throw resetErr;
      }

      setForgotSuccess(
        `Link de redefinição enviado com sucesso para ${forgotEmail}! Verifique sua caixa de entrada e siga as instruções.`
      );
    } catch (err: any) {
      setForgotError(err.message || 'Não foi possível enviar o e-mail de recuperação.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Carrega voluntários do banco de dados e cruza com os profiles existentes
  useEffect(() => {
    async function fetchVoluntarios() {
      try {
        setLoadingVoluntarios(true);

        // 1. Busca voluntários ativos
        const { data: volData } = await supabase
          .from('voluntarios')
          .select('id, nome_completo, email, funcao, area_atuacao, avatar_url, status')
          .eq('status', 'ativo')
          .order('nome_completo', { ascending: true });

        // 2. Busca profiles para saber quem já tem conta ativa
        const { data: profData } = await supabase
          .from('profiles')
          .select('email, id, avatar_url');

        const profMap = new Set((profData || []).map((p: any) => p.email?.toLowerCase().trim()));

        if (volData && volData.length > 0) {
          const list: VoluntarioItem[] = volData.map((v: any) => {
            const hasAcc = profMap.has(v.email?.toLowerCase().trim());
            return {
              id: v.id,
              nome_completo: v.nome_completo,
              email: v.email,
              funcao: v.funcao,
              area_atuacao: v.area_atuacao,
              avatar_url: v.avatar_url,
              status: v.status,
              hasAccount: hasAcc,
            };
          });

          setVoluntarios(list);
          if (list[0]) {
            setEmail(list[0].email);
          }
        } else {
          setVoluntarios(FALLBACK_VOLUNTARIOS);
          if (FALLBACK_VOLUNTARIOS[0]) {
            setEmail(FALLBACK_VOLUNTARIOS[0].email);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar voluntários no login:', err);
        setVoluntarios(FALLBACK_VOLUNTARIOS);
        if (FALLBACK_VOLUNTARIOS[0]) {
          setEmail(FALLBACK_VOLUNTARIOS[0].email);
        }
      } finally {
        setLoadingVoluntarios(false);
      }
    }

    fetchVoluntarios();
  }, []);

  // Quando o usuário seleciona um voluntário na ciranda
  const handleSelectVoluntario = (vol: VoluntarioItem, index: number) => {
    setSelectedIndex(index);
    setEmail(vol.email);
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccessMsg(null);
    setUseManualEmail(false);
  };

  // Login tradicional
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('E-mail ou senha incorretos. Verifique suas credenciais.');
        } else {
          setError(authError.message);
        }
        setLoading(false);
      } else {
        setSuccessMsg('Autenticado com sucesso! Entrando no ELO...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 600);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login.');
      setLoading(false);
    }
  };

  // Criação de senha para primeiro acesso
  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (password !== confirmPassword) {
      setError('A senha e a confirmação não coincidem.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve conter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const nomeCompleto = selectedVoluntario?.nome_completo || 'Voluntário Ádapo';

      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: nomeCompleto,
            nome_completo: nomeCompleto,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

          if (!signInErr) {
            setSuccessMsg('Conta reconhecida e autenticada! Redirecionando...');
            setTimeout(() => router.push('/dashboard'), 600);
            return;
          } else {
            setError('Esta conta já possui senha cadastrada. Insira sua senha para entrar.');
            setLoading(false);
            return;
          }
        }
        throw signUpError;
      }

      const { error: autoLoginErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (!autoLoginErr) {
        setSuccessMsg('Senha cadastrada com sucesso! Entrando no sistema...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 700);
      } else {
        setSuccessMsg('Senha cadastrada com sucesso! Digite sua senha para entrar.');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar senha.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-[#F2632D] via-[#EA580C] to-[#C2410C] dark:from-[#7C2D12] dark:via-[#431407] dark:to-[#1C0A03] p-4 sm:p-6 lg:p-8 select-none relative overflow-hidden">
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-black/20 rounded-full blur-3xl pointer-events-none" />

      <div />

      {/* ── CONTEÚDO CENTRAL: FLUXO EM ETAPAS (CIRANDA -> LOGIN) ── */}
      <div className="flex-1 flex items-center justify-center my-auto w-full max-w-lg mx-auto py-4 z-10">
        
        {/* ========================================================================= */}
        {/* ETAPA 1: VISUALIZAÇÃO E SELEÇÃO NA CIRANDA ADAPETE */}
        {/* ========================================================================= */}
        {step === 'ciranda' && (
          <div className="w-full flex flex-col items-center bg-[var(--bg-elevated)] p-6 sm:p-8 rounded-3xl border border-white/20 dark:border-[var(--border-default)] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] animate-in fade-in zoom-in-95 duration-200">
            {loadingVoluntarios ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3 text-xs text-[var(--text-muted)]">
                <RefreshCw className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
                <span>Carregando equipe do Instituto Ádapo...</span>
              </div>
            ) : (
              <>
                {/* Ciranda Orbital */}
                <VolunteerCarousel
                  voluntarios={voluntarios}
                  selectedIndex={selectedIndex}
                  onSelectVoluntario={handleSelectVoluntario}
                />

                {/* Botão de Prosseguir para Autenticação / Primeiro Acesso */}
                <div className="mt-5 w-full max-w-[340px] space-y-3.5 flex flex-col items-center">
                  <Button
                    type="button"
                    size="lg"
                    className="w-full shadow-lg hover:shadow-xl font-bold text-sm sm:text-base py-3 flex items-center justify-center gap-2 rounded-xl transition-all"
                    onClick={() => {
                      setStep('login');
                      setPassword('');
                      setConfirmPassword('');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    {isFirstAccess ? 'Continuar (1º Acesso)' : 'Acessar com este Perfil'}
                  </Button>

                  {/* Fallback para login manual com outro e-mail */}
                  <button
                    type="button"
                    onClick={() => {
                      setUseManualEmail(true);
                      setStep('login');
                      setEmail('');
                      setPassword('');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--color-primary)] font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 pt-0.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Não está na ciranda? Entrar com outro e-mail</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ETAPA 2: MODAL DE AUTENTICAÇÃO / PRIMEIRO ACESSO */}
        {/* ========================================================================= */}
        {step === 'login' && (
          <div className="w-full flex flex-col bg-[var(--bg-elevated)] p-6 sm:p-8 rounded-3xl border border-white/20 dark:border-[var(--border-default)] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] animate-in fade-in zoom-in-95 duration-200 space-y-5">
            
            {/* Botão Voltar para a Ciranda */}
            <button
              type="button"
              onClick={() => {
                setStep('ciranda');
                setError(null);
                setSuccessMsg(null);
              }}
              className="self-start inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] font-semibold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para a Ciranda</span>
            </button>

            {/* Header da Autenticação com Perfil Selecionado */}
            {!useManualEmail && selectedVoluntario ? (
              <div className="p-3.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-[var(--color-primary)] text-white font-bold flex items-center justify-center shrink-0 border border-[var(--border-default)] text-sm shadow-xs">
                    {selectedVoluntario.avatar_url ? (
                      <img
                        src={selectedVoluntario.avatar_url}
                        alt={selectedVoluntario.nome_completo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(selectedVoluntario.nome_completo)
                    )}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <h3 className="font-display font-bold text-sm text-[var(--text-primary)] truncate">
                      {selectedVoluntario.nome_completo}
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">
                      {selectedVoluntario.funcao || selectedVoluntario.area_atuacao || 'Equipe Ádapo'}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {isFirstAccess ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-primary-soft)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                      1º Acesso
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Conta Ativa
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] text-xs font-bold mb-2">
                  <Mail className="w-3.5 h-3.5" />
                  Acesso Institucional
                </div>
                <h2 className="font-display font-bold text-xl text-[var(--text-primary)]">
                  Entrar no ELO
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Informe seu e-mail institucional e senha de acesso.
                </p>
              </div>
            )}

            {/* Mensagens de Alerta / Erro / Sucesso */}
            {error && (
              <div className="p-3.5 rounded-xl bg-[var(--color-danger-soft)] text-[var(--color-danger)] text-xs font-medium flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-[var(--color-success-soft)] text-[var(--color-success)] text-xs font-medium flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* FORMULÁRIO 1: PRIMEIRO ACESSO (CRIAÇÃO DE SENHA) */}
            {isFirstAccess && !useManualEmail ? (
              <form onSubmit={handleCreatePassword} className="space-y-4">
                <div className="space-y-1">
                  <h4 className="font-display font-bold text-sm text-[var(--text-primary)]">
                    Criar Senha de Acesso
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Seu cadastro foi localizado na equipe! Crie sua senha individual para ativar sua conta.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    E-mail Vinculado
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-muted)] cursor-not-allowed font-mono-data"
                  />
                </div>

                <Input
                  label="Criar Nova Senha *"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <Input
                  label="Confirmar Senha *"
                  type="password"
                  placeholder="Repita a senha criada"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                <Button
                  type="submit"
                  className="w-full mt-2"
                  disabled={loading}
                  icon={<KeyRound className="w-4 h-4" />}
                >
                  {loading ? 'Ativando Conta...' : 'Ativar Minha Conta & Entrar'}
                </Button>
              </form>
            ) : (
              /* FORMULÁRIO 2: LOGIN DE CONTA EXISTENTE */
              <form onSubmit={handleLogin} className="space-y-4">
                {useManualEmail ? (
                  <Input
                    label="E-mail de Acesso *"
                    type="email"
                    placeholder="seu.email@adapong.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                        E-mail de Acesso
                      </span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-mono-data font-medium cursor-not-allowed"
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-[var(--text-secondary)]">
                      Sua Senha <span className="text-[var(--color-primary)]">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotModal(true);
                        setForgotError(null);
                        setForgotSuccess(null);
                      }}
                      className="text-xs text-[var(--color-primary)] hover:underline font-semibold cursor-pointer"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full mt-2"
                  disabled={loading}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  {loading ? 'Entrando...' : 'Entrar no Sistema'}
                </Button>
              </form>
            )}

            {/* Aviso de Segurança Institucional */}
            <div className="pt-3 border-t border-[var(--border-default)] flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
              <ShieldCheck className="w-4 h-4 text-[var(--color-success)]" />
              <span>Acesso restrito à equipe e voluntários do Instituto Ádapo</span>
            </div>
          </div>
        )}

      </div>

      {/* ── MODAL DE RECUPERAÇÃO DE SENHA (ESQUECI MINHA SENHA) ── */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] text-xs font-bold">
                  <KeyRound className="w-3.5 h-3.5" />
                  Recuperação de Acesso
                </div>
                <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                  Redefinir Senha
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Enviaremos um link de acesso seguro para o seu e-mail cadastrado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                aria-label="Fechar modal"
              >
                ✕
              </button>
            </div>

            {forgotError && (
              <div className="p-3 rounded-xl bg-[var(--color-danger-soft)] text-[var(--color-danger)] text-xs font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="p-3.5 rounded-xl bg-[var(--color-success-soft)] text-[var(--color-success)] text-xs font-medium flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{forgotSuccess}</span>
              </div>
            )}

            {!forgotSuccess && (
              <form onSubmit={handleForgotPassword} className="space-y-4 pt-1">
                <Input
                  label="Seu E-mail Cadastrado *"
                  type="email"
                  placeholder="exemplo@adapong.org"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowForgotModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={forgotLoading}
                    icon={<Mail className="w-4 h-4" />}
                  >
                    {forgotLoading ? 'Enviando...' : 'Enviar Link de Redefinição'}
                  </Button>
                </div>
              </form>
            )}

            {forgotSuccess && (
              <div className="pt-2 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setShowForgotModal(false)}
                >
                  Concluir & Voltar ao Login
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rodapé Oficial */}
      <footer className="text-center text-xs text-white/90 dark:text-white/70 py-2 font-medium drop-shadow-xs z-10">
        &copy; {new Date().getFullYear()} Instituto Ádapo — Todos os direitos reservados.
      </footer>
    </div>
  );
}
