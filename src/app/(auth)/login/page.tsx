'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message === 'Invalid login credentials' 
        ? 'E-mail ou senha incorretos.' 
        : authError.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--bg-primary)] p-6 relative">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md bg-[var(--bg-elevated)] p-8 rounded-2xl border border-[var(--border-default)] shadow-[var(--shadow-card)] space-y-6">
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)] text-white font-bold font-display text-2xl mx-auto flex items-center justify-center shadow-lg">
              É
            </div>
            <h1 className="font-display font-bold text-2xl text-[var(--text-primary)]">Sistema ELO</h1>
            <p className="text-xs text-[var(--text-secondary)]">Gestão Interna — Instituto Ádapo</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-[var(--color-danger-soft)] text-[var(--color-danger)] text-xs text-center font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="E-mail"
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

          {/* Footer note */}
          <div className="pt-4 border-t border-[var(--border-default)] flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
            <ShieldCheck className="w-4 h-4 text-[var(--color-success)]" />
            <span>Acesso restrito à equipe interna</span>
          </div>
        </div>
      </div>

      <footer className="text-center text-xs text-[var(--text-muted)]">
        &copy; {new Date().getFullYear()} Instituto Ádapo — Todos os direitos reservados.
      </footer>
    </div>
  );
}
