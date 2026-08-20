'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from './ThemeToggle';
import {
  Search,
  Bell,
  Settings,
  User,
  ShieldCheck,
  Sliders,
  Landmark,
  LogOut,
  ChevronDown,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface TopbarProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
}

export function Topbar({ title, subtitle, action }: TopbarProps) {
  const router = useRouter();
  const supabase = createClient();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  // Carrega os dados do perfil autenticado
  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('nome_completo, email, role, avatar_url')
            .eq('id', user.id)
            .maybeSingle();

          if (profile) {
            setUserProfile({
              name: profile.nome_completo || 'Voluntário Ádapo',
              email: profile.email || user.email || '',
              role: profile.role || 'voluntario_operacional',
              avatarUrl: profile.avatar_url || null,
            });
          } else {
            setUserProfile({
              name: user.email?.split('@')[0] || 'Voluntário',
              email: user.email || '',
              role: 'voluntario_operacional',
              avatarUrl: null,
            });
          }
        }
      } catch (err) {
        console.error('Erro ao carregar perfil na Topbar:', err);
      }
    }
    loadProfile();
  }, []);

  // Fechar menus ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (err) {
      console.error('Erro ao deslogar:', err);
    }
  };

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    coordenador: 'Coordenador',
    voluntario_operacional: 'Voluntário Operacional',
    voluntario_externo: 'Voluntário Externo',
  };

  return (
    <header className="min-h-[64px] py-3 px-4 sm:px-6 border-b border-[var(--border-default)] bg-[var(--bg-elevated)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-30 shadow-xs backdrop-blur-md">
      {/* ── LADO ESQUERDO: TÍTULO & SUBTÍTULO DA PÁGINA ── */}
      <div className="min-w-0">
        {title && (
          <h2 className="font-display font-bold text-lg md:text-xl text-[var(--text-primary)] leading-snug">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* ── LADO DIREITO: BUSCA + AÇÕES + CONFIGURAÇÕES + PERFIL FIXOS ── */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap sm:flex-nowrap ml-auto">
        {/* Campo de Busca Global */}
        <div className="relative w-36 lg:w-48 hidden md:block">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Buscar no sistema..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          />
        </div>

        {/* Ação Customizada da Página (se enviada) */}
        {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}

        {/* Notificações */}
        <button
          className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors relative shrink-0 cursor-pointer"
          aria-label="Notificações do sistema"
          title="Notificações"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] absolute top-1.5 right-1.5" />
        </button>

        {/* ── MENU 1: CONFIGURAÇÕES DO SISTEMA (DROPDOWN) ── */}
        <div className="relative" ref={settingsMenuRef}>
          <button
            type="button"
            onClick={() => {
              setShowSettingsMenu((prev) => !prev);
              setShowProfileMenu(false);
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
              showSettingsMenu
                ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="Configurações e Personalização"
            aria-label="Configurações do Sistema"
          >
            <Settings className="w-4 h-4" />
          </button>

          {showSettingsMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-[var(--border-default)] mb-1">
                <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  Configurações do Elo
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">Preferências, acessos e identidade</p>
              </div>

              <div className="space-y-1">
                <Link
                  href="/dashboard/perfil"
                  onClick={() => setShowSettingsMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <Sliders className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                  <div>
                    <p className="font-semibold leading-tight">Personalização & Tema</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Cores, paletas e preferências</p>
                  </div>
                </Link>

                <Link
                  href="/dashboard/usuarios"
                  onClick={() => setShowSettingsMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-[#4A1B57] dark:text-[#93368F] shrink-0" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold leading-tight">Usuários & Acessos</p>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#4A1B57]/10 text-[#4A1B57] dark:text-purple-300">
                        Admin
                      </span>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)]">Permissões e equipe interna</p>
                  </div>
                </Link>

                <Link
                  href="/dashboard/institucional"
                  onClick={() => setShowSettingsMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <Landmark className="w-4 h-4 text-[#6D28D9] shrink-0" />
                  <div>
                    <p className="font-semibold leading-tight">Gestão Institucional</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Dados oficiais do Instituto Ádapo</p>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── MENU 2: PERFIL DO USUÁRIO & CONTA (DROPDOWN) ── */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => {
              setShowProfileMenu((prev) => !prev);
              setShowSettingsMenu(false);
            }}
            className="flex items-center gap-2 p-1 pl-1.5 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer border border-[var(--border-default)]/60"
            title={userProfile?.name ? `Perfil: ${userProfile.name}` : 'Meu Perfil'}
          >
            {userProfile?.avatarUrl ? (
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.name}
                className="w-7 h-7 rounded-lg object-cover shrink-0 border border-[var(--border-default)] shadow-xs"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                {userProfile?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
            )}

            <div className="hidden lg:flex flex-col text-left min-w-0 pr-1">
              <span className="text-xs font-semibold text-[var(--text-primary)] truncate max-w-[120px] leading-tight">
                {userProfile?.name?.split(' ')[0] || 'Voluntário'}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[120px] leading-tight">
                {roleLabels[userProfile?.role || ''] || 'Equipe'}
              </span>
            </div>

            <ChevronDown className="w-3 h-3 text-[var(--text-muted)] shrink-0 hidden sm:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
              {/* Header do Perfil */}
              <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-default)]">
                {userProfile?.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.name}
                    className="w-10 h-10 rounded-xl object-cover shrink-0 border border-[var(--border-default)] shadow-xs"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-xs">
                    {userProfile?.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-display font-bold text-xs text-[var(--text-primary)] truncate">
                    {userProfile?.name || 'Voluntário Ádapo'}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] truncate font-mono-data">
                    {userProfile?.email || 'voluntario@adapong.org'}
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                    {roleLabels[userProfile?.role || ''] || 'Voluntário'}
                  </span>
                </div>
              </div>

              {/* Ações do Perfil */}
              <div className="space-y-1">
                <Link
                  href="/dashboard/perfil"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors font-medium"
                >
                  <User className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                  <span>Acessar Meu Perfil</span>
                </Link>

                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs text-[var(--text-secondary)]">
                  <span>Modo de Exibição</span>
                  <ThemeToggle />
                </div>
              </div>

              {/* Botão Sair */}
              <div className="pt-2 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Sair do Sistema</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
