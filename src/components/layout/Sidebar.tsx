'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  LayoutDashboard,
  Users,
  HeartHandshake,
  Heart,
  FolderKanban,
  Gift,
  Package,
  ShieldCheck,
  LogOut,
  X,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Calendar,
  Landmark,
  GraduationCap,
  Megaphone,
  Building2,
  Layers,
  Settings,
  Sliders,
  User,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { createClient } from '@/lib/supabase/client';

interface MenuItemChild {
  name: string;
  href: string;
  icon: any;
  color: string;
}

interface MenuItem {
  name: string;
  href?: string;
  icon: any;
  color: string;
  children?: MenuItemChild[];
}

const navigationItems: MenuItem[] = [
  { name: 'Painel Inicial', href: '/dashboard', icon: LayoutDashboard, color: '#F9C859' },
  { name: 'Beneficiários', href: '/dashboard/beneficiarios', icon: Users, color: '#93368F' },
  {
    name: 'Voluntários',
    icon: HeartHandshake,
    color: '#F2632D',
    children: [
      { name: 'Cadastro & Equipe', href: '/dashboard/voluntarios', icon: Users, color: '#F2632D' },
      { name: 'Saúde & Recesso', href: '/dashboard/voluntarios/recesso', icon: Heart, color: '#1C9C82' },
    ],
  },
  { name: 'Projetos Sociais', href: '/dashboard/projetos', icon: FolderKanban, color: '#F7955F' },
  { name: 'Pedagogia', href: '/dashboard/pedagogia', icon: GraduationCap, color: '#93368F' },
  { name: 'Comunicação & Mídia', href: '/dashboard/comunicacao', icon: Megaphone, color: '#EF4444' },
  {
    name: 'Recursos',
    icon: Layers,
    color: '#1C9C82',
    children: [
      { name: 'Controle de Parceiros', href: '/dashboard/parceiros', icon: Building2, color: '#1C9C82' },
      { name: 'Doações', href: '/dashboard/doacoes', icon: Gift, color: '#1C9C82' },
      { name: 'Controle de Estoque', href: '/dashboard/estoque', icon: Package, color: '#8B4A2E' },
    ],
  },
  { name: 'Calendário Geral', href: '/dashboard/calendario', icon: Calendar, color: '#E85D04' },
  { name: 'Indicadores Sociais', href: '/dashboard/indicadores', icon: BarChart3, color: '#3B82F6' },
  { name: 'Gestão Institucional', href: '/dashboard/institucional', icon: Landmark, color: '#6D28D9' },
  {
    name: 'Configurações',
    icon: Settings,
    color: '#4A1B57',
    children: [
      { name: 'Usuários & Acesso', href: '/dashboard/usuarios', icon: ShieldCheck, color: '#4A1B57' },
      { name: 'Perfil & Personalização', href: '/dashboard/perfil', icon: Sliders, color: '#F2632D' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showInfoPopover, setShowInfoPopover] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [userProfile, setUserProfile] = useState<{
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null>(null);

  // Inicializa e mantém os grupos abertos caso navegue em uma de suas sub-rotas
  useEffect(() => {
    navigationItems.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some(
          (child) => pathname === child.href || pathname.startsWith(child.href)
        );
        if (isChildActive) {
          setOpenGroups((prev) => ({ ...prev, [item.name]: true }));
        }
      }
    });
  }, [pathname]);

  // Carrega informações completas do perfil logado (incluindo foto/avatar)
  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('nome_completo, email, avatar_url')
            .eq('id', user.id)
            .maybeSingle();

          if (profile) {
            setUserProfile({
              name: profile.nome_completo || 'Voluntário Ádapo',
              email: profile.email || user.email || 'voluntario@adapong.org',
              avatarUrl: profile.avatar_url || null,
            });
          } else {
            setUserProfile({
              name: user.email?.split('@')[0] || 'Voluntário',
              email: user.email || 'voluntario@adapong.org',
              avatarUrl: null,
            });
          }
        }
      } catch (err) {
        console.error('Erro ao carregar perfil no Sidebar:', err);
      }
    }
    loadProfile();
  }, []);

  const toggleGroup = (groupName: string) => {
    if (isCollapsed) setIsCollapsed(false);
    setOpenGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
    } catch (err) {
      console.error('Erro ao encerrar sessão:', err);
      router.push('/login');
    }
  };

  return (
    <aside
      className={`${isCollapsed ? 'w-20' : 'w-64'
        } bg-[var(--bg-sidebar)] border-r border-[var(--border-default)] flex flex-col h-screen sticky top-0 z-30 shrink-0 transition-all duration-300 ease-in-out select-none`}
    >
      {/* Brand / Header (Fixo na parte superior) */}
      <div className="p-3 border-b border-[var(--border-default)] relative shrink-0 bg-[var(--bg-sidebar)] z-20">
        <div className="flex items-center justify-between min-h-[48px]">
          <Link
            href="/dashboard"
            className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? 'justify-center w-full' : ''}`}
          >
            {/* Logo Oficial do Sistema ELO Social em SVG */}
            <Image
              src="/logo/ELO Social - Gestão Ádapo.svg"
              alt="Logo ELO Social - Instituto Ádapo"
              width={38}
              height={38}
              className="w-9 h-9 rounded-xl object-contain shrink-0"
              priority
            />
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-display font-bold text-base leading-tight text-[var(--text-primary)]">
                    Instituto Ádapo
                  </h1>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowInfoPopover((prev) => !prev);
                    }}
                    className="w-4 h-4 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] flex items-center justify-center text-[10px] font-bold transition-colors shrink-0"
                    title="Sobre o Sistema Elo"
                    aria-label="Sobre o Sistema Elo"
                  >
                    ?
                  </button>
                </div>
                <span className="text-[11px] font-semibold text-[var(--color-primary)] truncate leading-tight">
                  ELO - Gestão Institucional
                </span>
              </div>
            )}
          </Link>

          {!isCollapsed && <ThemeToggle />}
        </div>

        {/* Botão Minimizar / Expandir */}
        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] flex items-center justify-center shadow-md transition-colors z-40"
          title={isCollapsed ? 'Expandir menu' : 'Minimizar menu'}
          aria-label={isCollapsed ? 'Expandir menu' : 'Minimizar menu'}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* Balão Explicativo Popover */}
        {showInfoPopover && !isCollapsed && (
          <div className="absolute top-16 left-3 right-3 z-50 p-4 rounded-xl bg-[#2B2118] text-[#F3EDE4] shadow-2xl border border-[var(--border-strong)] text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="font-bold text-[var(--raw-amarelo)] text-[11px] uppercase tracking-wider flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                Sobre o Sistema Elo
              </span>
              <button
                type="button"
                onClick={() => setShowInfoPopover(false)}
                className="text-gray-400 hover:text-white transition-colors p-0.5 rounded hover:bg-white/10"
                aria-label="Fechar explicação"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] leading-relaxed opacity-95">
              O Sistema Elo conecta voluntários, recursos e projetos, formando o vínculo que viabiliza o impacto social do Instituto Ádapo, firmando o vinculo dos adapetes.
            </p>
          </div>
        )}
      </div>

      {/* Navigation Menu (Área Rolável com Custom Scrollbar) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 custom-scrollbar">
        <nav className="space-y-0.5">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            // Se for item agrupador (Recursos ou Configurações)
            if (item.children) {
              const isGroupActive = item.children.some(
                (child) => pathname === child.href || pathname.startsWith(child.href)
              );
              const isOpen = !!openGroups[item.name];

              return (
                <div key={item.name} className="space-y-0.5">
                  {/* Botão Pai do Grupo */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(item.name)}
                    title={isCollapsed ? item.name : undefined}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all group relative ${isCollapsed ? 'justify-center px-0' : ''
                      } ${isGroupActive
                        ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-semibold'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                  >
                    {isGroupActive && (
                      <span
                        className="absolute left-0 top-1 bottom-1 w-1 rounded-r-full"
                        style={{ backgroundColor: item.color }}
                      />
                    )}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${isGroupActive
                          ? 'text-[var(--color-primary)]'
                          : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                          }`}
                      />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </div>

                    {!isCollapsed && (
                      <span className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] shrink-0 ml-1">
                        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </span>
                    )}
                  </button>

                  {/* Sub-itens Expansíveis */}
                  {isOpen && !isCollapsed && (
                    <div className="pl-3 ml-3 space-y-0.5 border-l border-[var(--border-default)] my-1">
                      {item.children.map((child) => {
                        const isChildActive = pathname === child.href || pathname.startsWith(child.href);
                        const ChildIcon = child.icon;

                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all group ${isChildActive
                              ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold'
                              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                              }`}
                          >
                            <ChildIcon
                              className={`w-3.5 h-3.5 shrink-0 ${isChildActive
                                ? 'text-[var(--color-primary)]'
                                : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                                }`}
                            />
                            <span className="truncate">{child.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Item Normal de Menu
            const isActive =
              item.href &&
              (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)));

            return (
              <Link
                key={item.href}
                href={item.href!}
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all group relative ${isCollapsed ? 'justify-center px-0' : ''
                  } ${isActive
                    ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                  }`}
              >
                {isActive && (
                  <span
                    className="absolute left-0 top-1 bottom-1 w-1 rounded-r-full"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${isActive
                    ? 'text-[var(--color-primary)]'
                    : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                    }`}
                />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Perfil do Usuário Logado & Botão Deslogar */}
      <div className="p-3 border-t border-[var(--border-default)] bg-[var(--bg-sidebar)] shrink-0 z-20">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-3">
            <ThemeToggle />
            <Link
              href="/dashboard/perfil"
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors rounded-lg"
              title="Meu Perfil"
            >
              {userProfile?.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.name}
                  className="w-7 h-7 rounded-full object-cover shrink-0 border border-[var(--border-default)]"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                  {userProfile?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
              )}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] transition-colors rounded-lg cursor-pointer"
              title="Sair / Encerrar Sessão"
              aria-label="Sair do sistema"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/dashboard/perfil"
              className="flex items-center gap-2.5 overflow-hidden hover:opacity-85 transition-opacity min-w-0"
              title="Acessar Perfil & Personalização"
            >
              {userProfile?.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.name}
                  className="w-8 h-8 rounded-full object-cover shrink-0 border border-[var(--border-default)] shadow-xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                  {userProfile?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
              )}
              <div className="truncate min-w-0">
                <p className="text-xs font-semibold text-[var(--text-primary)] truncate leading-tight">
                  {userProfile?.name || 'Voluntário Ádapo'}
                </p>
                <p className="text-[10px] text-[var(--text-muted)] truncate leading-tight font-mono-data">
                  {userProfile?.email || 'voluntario@adapong.org'}
                </p>
              </div>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] transition-colors rounded-lg shrink-0 cursor-pointer"
              title="Sair / Encerrar Sessão"
              aria-label="Sair do sistema"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
