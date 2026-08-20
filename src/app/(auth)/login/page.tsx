'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { VolunteerCarousel, VoluntarioItem } from '@/components/auth/VolunteerCarousel';
import {
  ShieldCheck,
  ArrowRight,
  UserCheck,
  KeyRound,
  AlertCircle,
  Sparkles,
  Lock,
  Mail,
  User,
  Users,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

const FALLBACK_VOLUNTARIOS: VoluntarioItem[] = [
  {
    id: '1',
    nome_completo: 'Coordenador Geral',
    email: 'admin@adapong.org',
    funcao: 'Coordenação Geral',
    area_atuacao: 'Diretoria',
    hasAccount: true,
  },
  {
    id: '2',
    nome_completo: 'Educador Social',
    email: 'pedagogia@adapong.org',
    funcao: 'Pedagogia & Oficinas',
    area_atuacao: 'Projetos Sociais',
    hasAccount: false,
  },
  {
    id: '3',
    nome_completo: 'Comunicação & Mídia',
    email: 'comunicacao@adapong.org',
    funcao: 'Comunicação & Redes',
    area_atuacao: 'Marketing',
    hasAccount: false,
  },
  {
    id: '4',
    nome_completo: 'Gestor de Recursos',
    email: 'recursos@adapong.org',
    funcao: 'Parcerias & Doações',
    area_atuacao: 'Captação',
    hasAccount: false,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  // Estados de voluntários e carrossel
  const [voluntarios, setVoluntarios] = useState<VoluntarioItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [loadingVoluntarios, setLoadingVoluntarios] = useState<boolean>(true);

  // Modo manual vs carrossel
  const [useManualEmail, setUseManualEmail] = useState<boolean>(false);

  // Estados do formulário
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Status de primeiro acesso detectado
  const selectedVoluntario = voluntarios[selectedIndex] || null;
  const isFirstAccess = selectedVoluntario ? !selectedVoluntario.hasAccount : false;

  // Carrega voluntários do banco de dados e cruza com os profiles existentes
  useEffect(() => {
    async function fetchVoluntarios() {
      try {
        setLoadingVoluntarios(true);

        // 1. Busca voluntários ativos
        const { data: volData, error: volErr } = await supabase
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

  // Quando o usuário seleciona um voluntário no carrossel
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
          // Se já está registrado, tenta autenticar diretamente
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

      // Tenta login automático imediatamente após criar a senha
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
    <div className="min-h-screen flex flex-col justify-between bg-[var(--bg-primary)] p-4 sm:p-6 lg:p-8 relative select-none overflow-x-hidden">
      {/* Glows de Fundo Institucionais */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--color-primary-soft)] rounded-full blur-3xl opacity-30 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[var(--color-accent-purple)]/10 rounded-full blur-3xl opacity-30 pointer-events-none" />

      {/* Botão de Tema no Topo */}
      <div className="flex items-center justify-between max-w-6xl mx-auto w-full z-10">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo/elo-social-gestao-adapo.svg"
            alt="Logo Instituto Ádapo"
            className="w-8 h-8 rounded-xl object-contain shadow-xs"
          />
          <div className="flex flex-col">
            <span className="font-display font-bold text-xs sm:text-sm text-[var(--text-primary)] leading-tight">
              Instituto Ádapo
            </span>
            <span className="text-[10px] font-semibold text-[var(--color-primary)] leading-tight">
              Sistema ELO
            </span>
          </div>
        </div>

        <ThemeToggle />
      </div>

      {/* ── CONTEÚDO CENTRAL: CARROSSEL DE PERFIS + CARD DE ACESSO ── */}
      <div className="flex-1 flex items-center justify-center my-6 z-10 w-full max-w-5xl mx-auto">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[var(--bg-elevated)] p-6 sm:p-8 rounded-3xl border border-[var(--border-default)] shadow-[var(--shadow-card)]">
          
          {/* COLUNA ESQUERDA (CARROSSEL INTERATIVO ORIGIN KIT) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-[var(--border-default)] pb-6 lg:pb-0 lg:pr-8">
            <div className="w-full text-center space-y-1 mb-2">
              <span className="text-[11px] font-bold text-[var(--color-primary)] uppercase tracking-wider flex items-center justify-center gap-1">
                <Users className="w-3.5 h-3.5" />
                Selecione seu Perfil
              </span>
              <p className="text-xs text-[var(--text-muted)]">
                Gire a esteira para localizar seu cadastro na equipe
              </p>
            </div>

            {loadingVoluntarios ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-xs text-[var(--text-muted)]">
                <RefreshCw className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
                <span>Carregando equipe do Instituto Ádapo...</span>
              </div>
            ) : (
              <VolunteerCarousel
                voluntarios={voluntarios}
                selectedIndex={selectedIndex}
                onSelectVoluntario={handleSelectVoluntario}
                buttonCount={7}
                buttonSize={44}
                curve={5}
                gap={22}
              />
            )}

            {/* Alternar para digitação de outro e-mail */}
            <div className="mt-4 pt-3 border-t border-[var(--border-default)]/60 w-full text-center">
              <button
                type="button"
                onClick={() => setUseManualEmail(!useManualEmail)}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--color-primary)] font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                {useManualEmail ? 'Voltar para seleção pelo carrossel' : 'Entrar com outro e-mail não listado'}
              </button>
            </div>
          </div>

          {/* COLUNA DIREITA (FORMULÁRIO INTELIGENTE: LOGIN VS 1º ACESSO) */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-5 lg:pl-2">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                {isFirstAccess && !useManualEmail ? 'Primeiro Acesso Detectado' : 'Acesso Seguro'}
              </div>

              <h2 className="font-display font-bold text-xl sm:text-2xl text-[var(--text-primary)]">
                {useManualEmail
                  ? 'Acesso Institucional'
                  : isFirstAccess
                  ? `Criar Senha de Acesso`
                  : `Olá, ${selectedVoluntario?.nome_completo?.split(' ')[0] || 'Voluntário'}! 👋`}
              </h2>

              <p className="text-xs text-[var(--text-secondary)] mt-1">
                {useManualEmail
                  ? 'Informe seu e-mail e senha cadastrados para acessar o sistema.'
                  : isFirstAccess
                  ? 'Seu cadastro foi localizado na equipe! Crie sua senha individual para ativar sua conta.'
                  : 'Insira sua senha de voluntário para entrar no painel operacional.'}
              </p>
            </div>

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
                  label="Criar Nova Senha"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <Input
                  label="Confirmar Senha"
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
                    label="E-mail de Acesso"
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
                      <span className="text-[10px] text-[var(--color-success)] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Conta Ativa
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

                <Input
                  label="Sua Senha"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <Button
                  type="submit"
                  className="w-full mt-2"
                  disabled={loading}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  {loading ? 'Entrando no Sistema...' : 'Entrar no Sistema'}
                </Button>
              </form>
            )}

            {/* Aviso de Segurança e Acesso Restrito */}
            <div className="pt-3 border-t border-[var(--border-default)] flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
              <ShieldCheck className="w-4 h-4 text-[var(--color-success)]" />
              <span>Acesso restrito à equipe e voluntários do Instituto Ádapo</span>
            </div>
          </div>

        </div>
      </div>

      {/* Rodapé Oficial */}
      <footer className="text-center text-xs text-[var(--text-muted)] z-10">
        &copy; {new Date().getFullYear()} Instituto Ádapo — ELO Sistema de Gestão Institucional. Todos os direitos reservados.
      </footer>
    </div>
  );
}
