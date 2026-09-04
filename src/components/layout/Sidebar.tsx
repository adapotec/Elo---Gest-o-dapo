'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { EloLogo } from '@/components/ui/EloLogo';
import { useMobileNav } from '@/components/layout/MobileNavContext';
import {
  BarChart3,
  LayoutDashboard,
  Users,
  HeartHandshake,
  Heart,
  FolderKanban,
  Gift,
  Package,
  ChevronDown,
  ChevronUp,
  Calendar,
  Landmark,
  GraduationCap,
  Megaphone,
  Building2,
  Layers,
  Pin,
  PinOff,
  HelpCircle,
  X,
  ShieldCheck,
} from 'lucide-react';

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
      { name: 'Lista de Voluntários', href: '/dashboard/voluntarios', icon: Users, color: '#F2632D' },
      { name: 'Saúde & Emergência', href: '/dashboard/voluntarios/saude', icon: Heart, color: '#EF4444' },
      { name: 'Escalas & Recessos', href: '/dashboard/voluntarios/escalas', icon: Calendar, color: '#93368F' },
      { name: 'Gestão de Pessoas', href: '/dashboard/voluntarios/gestao', icon: ShieldCheck, color: '#1C9C82' },
    ],
  },
  { name: 'Projetos Sociais', href: '/dashboard/projetos', icon: FolderKanban, color: '#F7955F' },
  { name: 'Pedagogia', href: '/dashboard/pedagogia', icon: GraduationCap, color: '#93368F' },
  { name: 'Comunicação', href: '/dashboard/comunicacao', icon: Megaphone, color: '#EF4444' },
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
];

export function Sidebar() {
  const pathname = usePathname();
  const { isMobileOpen, closeMobileNav } = useMobileNav();
  const [showInfoPopover, setShowInfoPopover] = useState(false);
  
  // Estado de Hover Desktop estilo Instagram Web
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  
  // A barra desktop está expandida se estiver em hover ou se o usuário a fixou
  const isExpanded = isPinned || isHovered;

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

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

  const toggleGroup = (groupName: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  // Renderizador unificado da lista de navegação
  const renderNavLinks = (expandedMode: boolean, isMobile: boolean) => (
    <nav className="space-y-1">
      {navigationItems.map((item) => {
        const Icon = item.icon;

        // Se for item agrupador com filhos
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
                title={!expandedMode ? item.name : undefined}
                className={`w-full flex items-center rounded-xl text-[13px] font-medium transition-all group relative cursor-pointer ${
                  !expandedMode
                    ? 'justify-center h-11 w-11 mx-auto'
                    : 'justify-between px-3 py-2.5'
                } ${
                  isGroupActive
                    ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {isGroupActive && expandedMode && (
                  <span
                    className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full"
                    style={{ backgroundColor: item.color }}
                  />
                )}

                <div className={`flex items-center ${!expandedMode ? 'justify-center' : 'gap-3 min-w-0'}`}>
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isGroupActive
                        ? 'text-[var(--color-primary)]'
                        : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                    }`}
                    style={{ color: isGroupActive ? item.color : undefined }}
                  />
                  {expandedMode && <span className="truncate">{item.name}</span>}
                </div>

                {expandedMode && (
                  <span className="shrink-0 text-[var(--text-muted)]">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                )}
              </button>

              {/* Subitens do Grupo */}
              {expandedMode && isOpen && (
                <div className="pl-6 pr-1 space-y-0.5 animate-in slide-in-from-top-1 duration-150 border-l border-[var(--border-default)] ml-5 my-1">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    const isChildActive = pathname === child.href;

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => isMobile && closeMobileNav()}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                          isChildActive
                            ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-semibold shadow-2xs'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <ChildIcon
                          className="w-4 h-4 shrink-0"
                          style={{ color: isChildActive ? child.color : undefined }}
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

        // Link Individual Normal
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href!}
            onClick={() => isMobile && closeMobileNav()}
            title={!expandedMode ? item.name : undefined}
            className={`flex items-center rounded-xl text-[13px] font-medium transition-all group relative cursor-pointer ${
              !expandedMode
                ? 'justify-center h-11 w-11 mx-auto'
                : 'gap-3 px-3 py-2.5'
            } ${
              isActive
                ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-semibold shadow-2xs'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {isActive && expandedMode && (
              <span
                className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full"
                style={{ backgroundColor: item.color }}
              />
            )}
            <Icon
              className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                isActive
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
              }`}
              style={{ color: isActive ? item.color : undefined }}
            />
            {expandedMode && <span className="truncate">{item.name}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. SIDEBAR DESKTOP (VISÍVEL APENAS EM >= 768px - ESTILO INSTAGRAM WEB) */}
      {/* ========================================================================= */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setShowInfoPopover(false);
        }}
        className={`hidden md:flex bg-[var(--bg-sidebar)] border-r border-[var(--border-default)] flex-col h-screen sticky top-0 z-40 shrink-0 select-none transition-all duration-300 ease-in-out ${
          isExpanded
            ? 'w-64 shadow-2xl'
            : 'w-[72px] shadow-xs'
        }`}
        aria-label="Menu de Navegação Principal"
      >
        {/* ── Topo: Brand / Logo Oficial ── */}
        <div className="p-3 border-b border-[var(--border-default)] relative shrink-0 bg-[var(--bg-sidebar)] z-20">
          <div className="flex items-center min-h-[48px]">
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 w-full transition-all ${
                !isExpanded ? 'justify-center px-0' : 'px-1 min-w-0'
              }`}
              title="Ir para o Painel Inicial"
            >
              <div className="relative shrink-0 flex items-center justify-center">
                <EloLogo className="w-9 h-9 shrink-0 drop-shadow-xs transition-transform duration-200 hover:scale-105" />
              </div>

              {isExpanded && (
                <div className="flex flex-col min-w-0 flex-1 overflow-hidden animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h1 className="font-display font-bold text-sm leading-tight text-[var(--text-primary)] truncate whitespace-nowrap">
                      Instituto Ádapo
                    </h1>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowInfoPopover((prev) => !prev);
                      }}
                      className="w-4 h-4 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] flex items-center justify-center text-[10px] font-bold transition-colors shrink-0 cursor-pointer"
                      title="Sobre o Sistema Elo"
                      aria-label="Sobre o Sistema Elo"
                    >
                      ?
                    </button>
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--color-primary)] truncate leading-tight whitespace-nowrap">
                    ELO - Gestão Institucional
                  </span>
                </div>
              )}
            </Link>
          </div>

          {/* Balão Explicativo Popover */}
          {showInfoPopover && isExpanded && (
            <div className="absolute top-16 left-3 right-3 z-50 p-4 rounded-xl bg-[#2B2118] text-[#F3EDE4] shadow-2xl border border-[var(--border-strong)] text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-bold text-[var(--raw-amarelo)] text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Sobre o Sistema Elo
                </span>
                <button
                  type="button"
                  onClick={() => setShowInfoPopover(false)}
                  className="text-gray-400 hover:text-white transition-colors p-0.5 rounded hover:bg-white/10 cursor-pointer"
                  aria-label="Fechar explicação"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] leading-relaxed opacity-95">
                O Sistema Elo conecta voluntários, recursos e projetos, formando o vínculo que viabiliza o impacto social do Instituto Ádapo.
              </p>
            </div>
          )}
        </div>

        {/* ── Menu de Navegação Rolável ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 custom-scrollbar">
          {renderNavLinks(isExpanded, false)}
        </div>

        {/* ── Rodapé: Controle de Fixação da Barra ── */}
        <div className="p-2.5 border-t border-[var(--border-default)] bg-[var(--bg-sidebar)] shrink-0 z-20">
          {!isExpanded ? (
            <div className="flex flex-col items-center justify-center py-0.5">
              <button
                type="button"
                onClick={() => setIsPinned((prev) => !prev)}
                className={`p-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center ${
                  isPinned
                    ? 'text-[var(--color-primary)] bg-[var(--color-primary-soft)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                }`}
                title={isPinned ? 'Desafixar menu (retrair ao sair)' : 'Fixar menu aberto'}
                aria-label={isPinned ? 'Desafixar menu' : 'Fixar menu'}
              >
                {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-2 py-1 animate-in fade-in duration-150">
              <span className="text-[11px] font-medium text-[var(--text-muted)]">Navegação</span>
              <button
                type="button"
                onClick={() => setIsPinned((prev) => !prev)}
                className={`px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 font-semibold ${
                  isPinned
                    ? 'text-[var(--color-primary)] bg-[var(--color-primary-soft)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                }`}
                title={isPinned ? 'Desafixar menu (retrair ao sair)' : 'Fixar menu aberto'}
                aria-label={isPinned ? 'Desafixar menu' : 'Fixar menu'}
              >
                {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{isPinned ? 'Menu Fixado' : 'Fixar Menu'}</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. SIDEBAR MOBILE DRAWER (GAVETA DESLIZANTE PARA TELAS < 768px) */}
      {/* ========================================================================= */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
          {/* Backdrop escuro com desfoque */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={closeMobileNav}
            aria-hidden="true"
          />

          {/* Gaveta lateral deslizante */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-[var(--bg-sidebar)] border-r border-[var(--border-default)] shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
            {/* Topo da gaveta com botão de fechar */}
            <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-sidebar)]">
              <Link
                href="/dashboard"
                onClick={closeMobileNav}
                className="flex items-center gap-2.5 min-w-0"
              >
                <EloLogo className="w-8 h-8 shrink-0 drop-shadow-xs" />
                <div className="min-w-0">
                  <h2 className="font-display font-bold text-sm text-[var(--text-primary)] truncate">
                    Instituto Ádapo
                  </h2>
                  <p className="text-[10px] font-semibold text-[var(--color-primary)] truncate">
                    ELO - Gestão Social
                  </p>
                </div>
              </Link>

              <button
                type="button"
                onClick={closeMobileNav}
                className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                aria-label="Fechar menu de navegação"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Links da gaveta roláveis */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
              {renderNavLinks(true, true)}
            </div>

            {/* Rodapé da gaveta móvel */}
            <div className="p-3 border-t border-[var(--border-default)] text-center text-[11px] text-[var(--text-muted)] font-medium">
              &copy; {new Date().getFullYear()} Instituto Ádapo
            </div>
          </div>
        </div>
      )}
    </>
  );
}
