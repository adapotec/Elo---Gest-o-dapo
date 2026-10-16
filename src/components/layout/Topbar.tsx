'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from './ThemeToggle';
import { useMobileNav } from './MobileNavContext';
import { NotificationDropdown } from './NotificationDropdown';
import { GlobalSearchModal } from './GlobalSearchModal';
import {
  Search,
  User,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Menu,
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
  const { toggleMobileNav } = useMobileNav();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Atalho global Ctrl+K / Cmd+K para abrir busca rápida
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cache em memória para transições instantâneas entre páginas (0ms)
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('elo_user_profile_cache') || localStorage.getItem('elo_user_profile_cache');
      if (cached) {
        setUserProfile(JSON.parse(cached));
      }
    } catch (e) {}

    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const [respProfile, respVol] = await Promise.all([
            supabase
              .from('profiles')
              .select('nome_completo, email, role, avatar_url')
              .eq('id', user.id)
              .maybeSingle(),
            user.email
              ? supabase
                  .from('voluntarios')
                  .select('avatar_url, funcao, area_atuacao, tipo')
                  .eq('email', user.email)
                  .maybeSingle()
              : Promise.resolve({ data: null }),
          ]);

          const profile = respProfile.data;
          const vol = respVol.data;

          const isBrinc =
            vol?.tipo === 'brincante' ||
            profile?.role === 'brincante' ||
            profile?.role === 'voluntario_brincante';

          let userAvatar = profile?.avatar_url || vol?.avatar_url || null;
          let userFuncao = isBrinc
            ? 'Voluntário Brincante'
            : profile?.role || vol?.funcao || vol?.area_atuacao || 'voluntario_operacional';

          const resolvedProfile: UserProfile = {
            name: profile?.nome_completo || user.email?.split('@')[0] || 'Voluntário Ádapo',
            email: profile?.email || user.email || '',
            role: userFuncao,
            avatarUrl: userAvatar,
          };

          setUserProfile(resolvedProfile);
          try {
            const cachePayload = { ...resolvedProfile, tipo: vol?.tipo, isBrincante: isBrinc };
            sessionStorage.setItem('elo_user_profile_cache', JSON.stringify(cachePayload));
            localStorage.setItem('elo_user_profile_cache', JSON.stringify(cachePayload));
          } catch (e) {}
        }
      } catch (err) {
        console.error('Erro ao carregar perfil na Topbar:', err);
      }
    }
    loadProfile();

    const handleProfileUpdated = (e: any) => {
      if (e.detail) {
        setUserProfile((prev) => ({
          ...prev,
          name: e.detail.name || prev?.name || 'Voluntário Ádapo',
          email: e.detail.email || prev?.email || '',
          role: e.detail.role || prev?.role || 'voluntario_operacional',
          avatarUrl: e.detail.avatarUrl !== undefined ? e.detail.avatarUrl : prev?.avatarUrl || null,
        }));
      }
    };

    window.addEventListener('elo-profile-updated', handleProfileUpdated);
    return () => window.removeEventListener('elo-profile-updated', handleProfileUpdated);
  }, []);

  // Fechar menu de perfil ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
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
    <header className="min-h-[60px] sm:min-h-[64px] py-2.5 px-3 sm:px-6 border-b border-[var(--border-default)] bg-[var(--bg-elevated)] flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30 shadow-xs backdrop-blur-md">
      {/* ── LADO ESQUERDO: HAMBÚRGUER (MOBILE) + LOGO DO ÁDAPO + TÍTULO DA PÁGINA ── */}
      <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1 sm:flex-initial">
        {/* Botão Hambúrguer Mobile (Touch Target >= 44px) */}
        <button
          type="button"
          onClick={toggleMobileNav}
          className="md:hidden p-2 -ml-1 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
          aria-label="Abrir menu de navegação lateral"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link href="/dashboard" className="shrink-0 flex items-center" title="Instituto Ádapo">
          <img
            src="/logo/logo-adapo-completa-preta.svg"
            alt="Instituto Ádapo"
            className="h-7 sm:h-9 md:h-10 w-auto object-contain shrink-0 dark:brightness-0 dark:invert transition-all hover:opacity-90"
          />
        </Link>

        {title && (
          <div className="min-w-0 flex flex-col justify-center">
            <h2 className="font-display font-bold text-xs sm:text-base md:text-xl text-[var(--text-primary)] leading-tight truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-[var(--text-muted)] leading-tight truncate mt-0.5 hidden md:block">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── LADO DIREITO: BUSCA GLOBAL + AÇÕES + NOTIFICAÇÕES + PERFIL CONSOLIDADO ── */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto">
        {/* Botão de Busca Desktop com Atalho Ctrl+K */}
        <button
          type="button"
          onClick={() => setShowSearchModal(true)}
          className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-default)] transition-colors cursor-pointer group"
          title="Pesquisar no sistema (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--color-primary)] transition-colors" />
          <span className="text-xs">Buscar no sistema...</span>
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-muted)] shadow-2xs">
            Ctrl K
          </kbd>
        </button>

        {/* Botão de Busca Mobile (Ícone de Lupa com Touch Target >= 44px) */}
        <button
          type="button"
          onClick={() => setShowSearchModal(true)}
          className="md:hidden p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
          aria-label="Abrir busca global no sistema"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Ação Customizada da Página (se enviada) */}
        {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}

        {/* Notificações Interativas */}
        <NotificationDropdown currentUser={userProfile} />

        {/* ── MENU DE PERFIL & CONFIGURAÇÕES CONSOLIDADO ── */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setShowProfileMenu((prev) => !prev)}
            className="flex items-center gap-2 p-1 pl-1.5 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer border border-[var(--border-default)]/60 min-h-[44px] touch-manipulation"
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
            <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-32px)] rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
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
                    {roleLabels[userProfile?.role || ''] || userProfile?.role || 'Voluntário'}
                  </span>
                </div>
              </div>

              {/* Opções Consolidadas: Perfil, Acessos e Configurações */}
              <div className="space-y-1">
                <Link
                  href="/dashboard/perfil"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors font-medium min-h-[40px] touch-manipulation"
                >
                  <User className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                  <div>
                    <p className="font-semibold leading-tight">Meu Perfil & Preferências</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Foto, dados e informações pessoais</p>
                  </div>
                </Link>

                {/* Exibir Gestão de Usuários caso seja Administrador ou Coordenador */}
                {(userProfile?.role === 'admin' || userProfile?.role === 'coordenador') && (
                  <Link
                    href="/dashboard/usuarios"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors font-medium min-h-[40px] touch-manipulation"
                  >
                    <ShieldCheck className="w-4 h-4 text-[var(--color-secondary)] shrink-0" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold leading-tight">Usuários & Acessos</p>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[var(--color-secondary-soft)] text-[var(--color-secondary)]">
                          Admin
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)]">Permissões e equipe interna</p>
                    </div>
                  </Link>
                )}

                <div className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[var(--text-secondary)] min-h-[40px]">
                  <span>Modo de Exibição</span>
                  <ThemeToggle />
                </div>
              </div>

              {/* Botão Sair */}
              <div className="pt-2 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] transition-colors cursor-pointer min-h-[40px] touch-manipulation"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Sair do Sistema</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Busca Global */}
      <GlobalSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
    </header>
  );
}

