'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { ShieldCheck, ArrowRight, UserCheck, KeyRound, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'first_access'>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // First access validation state
  const [verifiedVoluntario, setVerifiedVoluntario] = useState<{
    allowed: boolean;
    nome_completo?: string;
    tipo?: string;
  } | null>(null);

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(
        authError.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos.'
          : authError.message
      );
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  const handleCheckEmail = async () => {
    if (!email || !email.includes('@')) {
      setError('Por favor, informe um e-mail válido.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Chama a RPC segura do Supabase para verificar se o e-mail está na lista de voluntários
      const { data, error: rpcErr } = await supabase.rpc('check_voluntario_email', {
        check_email: email.trim(),
      });

      if (rpcErr) throw rpcErr;

      if (data && data.allowed) {
        setVerifiedVoluntario(data);
      } else {
        setVerifiedVoluntario(null);
        if (data?.reason === 'inactive') {
          setError('Seu cadastro de voluntário está inativo. Entre em contato com a coordenação.');
        } else {
          setError(
            'E-mail não pré-cadastrado no Instituto Ádapo. Solicite seu cadastro ao Administrador antes de criar uma senha.'
          );
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao verificar e-mail.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedVoluntario || !verifiedVoluntario.allowed) return;

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

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: verifiedVoluntario.nome_completo,
            nome_completo: verifiedVoluntario.nome_completo,
          },
        },
      });

      if (signUpError) {
        // Se a conta já existe, tenta fazer o login direto com a nova senha ou notifica
        if (signUpError.message.includes('already registered')) {
          setError('Sua conta já foi ativada previamente! Utilize a aba "Já possuo conta" para entrar.');
        } else {
          throw signUpError;
        }
        setLoading(false);
        return;
      }

      // Tenta fazer o login automático imediatamente após criar a senha
      const { error: autoLoginErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (!autoLoginErr) {
        setSuccessMsg('Conta criada e ativada com sucesso! Entrando no sistema...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        setSuccessMsg('Senha cadastrada com sucesso! Faça login na aba "Já possuo conta".');
        setMode('login');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar senha.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--bg-primary)] p-6 relative select-none">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md bg-[var(--bg-elevated)] p-8 rounded-2xl border border-[var(--border-default)] shadow-[var(--shadow-card)] space-y-6">
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <img
              src="/logo/ELO Social - Gestão Ádapo.svg"
              alt="Logo ELO Social - Instituto Ádapo"
              className="w-16 h-16 mx-auto object-contain drop-shadow-md"
            />
            <h1 className="font-display font-bold text-2xl text-[var(--text-primary)]">Sistema ELO</h1>
            <p className="text-xs text-[var(--text-secondary)]">Gestão Institucional — Instituto Ádapo</p>
          </div>

          {/* Selector Tabs: Entrar vs Ativar Minha Conta */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-xs font-semibold text-center">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-[var(--bg-elevated)] text-[var(--color-primary)] shadow-sm font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Já possuo conta
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('first_access');
                setError(null);
                setSuccessMsg(null);
                setVerifiedVoluntario(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'first_access'
                  ? 'bg-[var(--bg-elevated)] text-[var(--color-primary)] shadow-sm font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Primeiro Acesso
            </button>
          </div>

          {/* Mensagens de Alerta / Sucesso */}
          {error && (
            <div className="p-3.5 rounded-xl bg-[var(--color-danger-soft)] text-[var(--color-danger)] text-xs text-center font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-[var(--color-success-soft)] text-[var(--color-success)] text-xs text-center font-medium">
              {successMsg}
            </div>
          )}

          {/* MODO 1: LOGIN TRADICIONAL */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="E-mail de Acesso"
                type="email"
                placeholder="seu.email@adapong.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Senha"
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
                {loading ? 'Entrando...' : 'Entrar no Sistema'}
              </Button>
            </form>
          )}

          {/* MODO 2: PRIMEIRO ACESSO DE VOLUNTÁRIO */}
          {mode === 'first_access' && (
            <div className="space-y-4">
              {!verifiedVoluntario ? (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    <p className="font-semibold text-[var(--text-primary)] mb-1 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                      Verificação de Cadastro
                    </p>
                    Digite o e-mail fornecido à coordenação do Instituto Ádapo. Se seu e-mail estiver liberado, você poderá criar sua senha individual.
                  </div>

                  <Input
                    label="Digite seu E-mail Registrado"
                    type="email"
                    placeholder="exemplo@adapong.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  <Button
                    type="button"
                    className="w-full"
                    disabled={loading}
                    onClick={handleCheckEmail}
                    icon={<Sparkles className="w-4 h-4" />}
                  >
                    {loading ? 'Verificando Cadastro...' : 'Verificar Meu Cadastro'}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleCreatePassword} className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-3.5 rounded-xl bg-[var(--color-success-soft)] text-[var(--color-success)] text-xs border border-[var(--color-success)]/30">
                    <p className="font-bold">Cadastro Encontrado! 👋</p>
                    <p className="mt-0.5 opacity-90">
                      Olá, <strong>{verifiedVoluntario.nome_completo}</strong>! Crie sua senha de acesso individual.
                    </p>
                  </div>

                  <Input
                    label="Nova Senha"
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
                    {loading ? 'Ativando Conta...' : 'Cadastrar Senha e Entrar'}
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* Footer note */}
          <div className="pt-4 border-t border-[var(--border-default)] flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
            <ShieldCheck className="w-4 h-4 text-[var(--color-success)]" />
            <span>Acesso individual e restrito à equipe</span>
          </div>
        </div>
      </div>

      <footer className="text-center text-xs text-[var(--text-muted)]">
        &copy; {new Date().getFullYear()} Instituto Ádapo — Todos os direitos reservados.
      </footer>
    </div>
  );
}
