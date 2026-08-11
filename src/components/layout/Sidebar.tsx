'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  LayoutDashboard,
  Users,
  HeartHandshake,
  FolderKanban,
  Gift,
  Package,
  ShieldCheck,
  LogOut,
  X,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Landmark,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

const navigationItems = [
  { name: 'Painel Inicial', href: '/dashboard', icon: LayoutDashboard, color: '#F9C859' },
  { name: 'Beneficiários', href: '/dashboard/beneficiarios', icon: Users, color: '#93368F' },
  { name: 'Voluntários', href: '/dashboard/voluntarios', icon: HeartHandshake, color: '#F2632D' },
  { name: 'Projetos Sociais', href: '/dashboard/projetos', icon: FolderKanban, color: '#F7955F' },
  { name: 'Calendário Geral', href: '/dashboard/calendario', icon: Calendar, color: '#E85D04' },
  { name: 'Doações', href: '/dashboard/doacoes', icon: Gift, color: '#1C9C82' },
  { name: 'Controle de Estoque', href: '/dashboard/estoque', icon: Package, color: '#8B4A2E' },
  { name: 'Indicadores Sociais', href: '/dashboard/indicadores', icon: BarChart3, color: '#3B82F6' },
  { name: 'Gestão Institucional', href: '/dashboard/institucional', icon: Landmark, color: '#6D28D9' },
  { name: 'Usuários & Acesso', href: '/dashboard/usuarios', icon: ShieldCheck, color: '#4A1B57' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [showInfoPopover, setShowInfoPopover] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`${isCollapsed ? 'w-20' : 'w-64'
        } bg-[var(--bg-sidebar)] border-r border-[var(--border-default)] flex flex-col justify-between h-screen sticky top-0 z-30 shrink-0 transition-all duration-300 ease-in-out`}
    >
      <div>
        {/* Brand / Header */}
        <div className="p-3 border-b border-[var(--border-default)] relative">
          <div className="flex items-center justify-between min-h-[48px]">
            <Link
              href="/dashboard"
              className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? 'justify-center w-full' : ''}`}
            >
              <Image
                src="/logo/logo-branca-com-fundo-laranja.png"
                alt="Logo Instituto Ádapo"
                width={36}
                height={36}
                className="w-9 h-9 rounded-xl object-contain shadow-md shrink-0"
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
                  <span className="text-[10px] font-semibold text-[var(--color-primary)] truncate leading-tight">
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
                O Sistema Elo conecta adapetes, recursos e projetos, formando o vinculo que viabiliza o impacto social do Instituto Ádapo.
              </p>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="p-2 space-y-1.5">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${isCollapsed ? 'justify-center px-0' : ''
                  } ${isActive
                    ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                  }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                    }`}
                />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-[var(--border-default)] bg-[var(--bg-secondary)]/30">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="p-2 text-[var(--text-muted)] hover:text-[var(--color-danger)] transition-colors rounded-lg"
              title="Sair do sistema"
            >
              <LogOut className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold flex items-center justify-center text-sm shrink-0">
                A
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-[var(--text-primary)] truncate">Equipe Ádapo</p>
                <p className="text-[10px] text-[var(--text-muted)] truncate">admin@adapong.org</p>
              </div>
            </div>
            <Link
              href="/login"
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--color-danger)] transition-colors rounded-lg"
              title="Sair do sistema"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
