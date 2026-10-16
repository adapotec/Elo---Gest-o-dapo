'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  Sparkles,
  ExternalLink,
  Clock,
  Megaphone,
  Package,
  HeartHandshake,
  Cake,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  Notificacao,
  getNotificacoesForUser,
  marcarComoLida,
  marcarTodasComoLidas,
  limparNotificacoesDoUsuario,
  onNotificacoesChange,
} from '@/lib/services/notificacoesService';

interface NotificationDropdownProps {
  currentUser?: {
    name?: string;
    email?: string;
  } | null;
}

function getActiveUser(currentUser?: { name?: string; email?: string } | null): { name: string; email: string } {
  if (currentUser?.name || currentUser?.email) {
    return { name: currentUser.name || '', email: currentUser.email || '' };
  }
  if (typeof window !== 'undefined') {
    try {
      const cached = sessionStorage.getItem('elo_user_profile_cache') || localStorage.getItem('elo_user_profile_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        return { name: parsed.name || '', email: parsed.email || '' };
      }
    } catch (e) {}
  }
  return { name: '', email: '' };
}

export function NotificationDropdown({ currentUser }: NotificationDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [filterTab, setFilterTab] = useState<'todas' | 'nao_lidas'>('todas');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const user = getActiveUser(currentUser);
    setNotificacoes(getNotificacoesForUser(user.name, user.email));

    const unsubscribe = onNotificacoesChange(() => {
      const u = getActiveUser(currentUser);
      setNotificacoes(getNotificacoesForUser(u.name, u.email));
    });

    return () => unsubscribe();
  }, [currentUser?.name, currentUser?.email]);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notificacoes.filter((n) => !n.lida).length;

  const filteredNotificacoes = notificacoes.filter((n) => {
    if (filterTab === 'nao_lidas') return !n.lida;
    return true;
  });

  const handleClickNotification = (notif: Notificacao) => {
    marcarComoLida(notif.id);
    setIsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const handleMarkAllRead = () => {
    const u = getActiveUser(currentUser);
    marcarTodasComoLidas(u.name, u.email);
    setNotificacoes(getNotificacoesForUser(u.name, u.email));
  };

  const handleClearHistory = () => {
    const u = getActiveUser(currentUser);
    limparNotificacoesDoUsuario(u.name, u.email);
    setNotificacoes([]);
  };

  const getNotificationIcon = (tipo: Notificacao['tipo']) => {
    switch (tipo) {
      case 'reuniao':
        return { icon: Calendar, bg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' };
      case 'tarefa':
        return { icon: Megaphone, bg: 'bg-[#F2632D]/15 text-[#F2632D]' };
      case 'estoque':
        return { icon: Package, bg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' };
      case 'recesso':
        return { icon: HeartHandshake, bg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' };
      case 'aniversario':
        return { icon: Cake, bg: 'bg-pink-500/15 text-pink-600 dark:text-pink-400' };
      case 'acao':
        return { icon: Sparkles, bg: 'bg-[#93368F]/15 text-[#93368F]' };
      default:
        return { icon: Info, bg: 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]' };
    }
  };

  const getActionLabel = (tipo: Notificacao['tipo']) => {
    switch (tipo) {
      case 'reuniao':
        return 'Ver reunião';
      case 'tarefa':
        return 'Ver tarefa';
      case 'estoque':
        return 'Ver estoque';
      case 'recesso':
        return 'Ver escalas';
      case 'aniversario':
        return 'Ver painel';
      case 'acao':
        return 'Ver cronograma';
      default:
        return 'Acessar';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão do Sino */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`p-2 rounded-xl transition-all relative shrink-0 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation ${
          isOpen
            ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-xs'
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
        }`}
        aria-label="Notificações do sistema"
        title={unreadCount > 0 ? `${unreadCount} notificações não lidas` : 'Notificações'}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--color-primary)] text-white text-[10px] font-bold absolute 0.5 top-0.5 -right-0.5 flex items-center justify-center shadow-xs animate-in zoom-in-50">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Painel Flutuante de Notificações */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-24px)] rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden flex flex-col max-h-[85vh]">
          {/* Header do Dropdown */}
          <div className="p-3.5 border-b border-[var(--border-default)] bg-[var(--bg-secondary)]/50 space-y-2.5 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  Notificações
                </span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                    {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="p-1 rounded-lg text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-secondary)] transition-colors flex items-center gap-1 cursor-pointer min-h-[36px] px-2 touch-manipulation"
                    title="Marcar todas como lidas"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Lidas</span>
                  </button>
                )}

                {notificacoes.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="p-1.5 rounded-lg text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] transition-colors flex items-center justify-center cursor-pointer min-h-[36px] min-w-[36px] touch-manipulation"
                    title="Limpar meu histórico"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Abas de Filtragem Rápida */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)]">
              <button
                type="button"
                onClick={() => setFilterTab('todas')}
                className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  filterTab === 'todas'
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-2xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Todas ({notificacoes.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('nao_lidas')}
                className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  filterTab === 'nao_lidas'
                    ? 'bg-[var(--bg-elevated)] text-[var(--color-primary)] shadow-2xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Não Lidas ({unreadCount})
              </button>
            </div>
          </div>

          {/* Lista de Notificações */}
          <div className="divide-y divide-[var(--border-default)] overflow-y-auto custom-scrollbar flex-1 min-h-[220px]">
            {filteredNotificacoes.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] flex items-center justify-center mx-auto">
                  <Bell className="w-5 h-5 opacity-40" />
                </div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  {filterTab === 'nao_lidas' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação para você'}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Você será alertado(a) aqui sobre reuniões, tarefas, estoque e acontecimentos da equipe.
                </p>
              </div>
            ) : (
              filteredNotificacoes.map((n) => {
                const dateObj = new Date(n.created_at);
                const dataFormatada = dateObj.toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                });
                const horaFormatada = dateObj.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                const { icon: IconComp, bg: iconStyle } = getNotificationIcon(n.tipo);

                return (
                  <div
                    key={n.id}
                    onClick={() => handleClickNotification(n)}
                    className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 relative group min-h-[56px] touch-manipulation ${
                      !n.lida
                        ? 'bg-[var(--color-primary-soft)]/20 hover:bg-[var(--color-primary-soft)]/30'
                        : 'hover:bg-[var(--bg-secondary)]/70'
                    }`}
                  >
                    {/* Ícone Indicador Contextual */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconStyle}`}>
                      <IconComp className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={`text-xs leading-snug truncate ${
                            !n.lida
                              ? 'font-bold text-[var(--text-primary)]'
                              : 'font-medium text-[var(--text-secondary)]'
                          }`}
                        >
                          {n.titulo}
                        </p>
                        {!n.lida && (
                          <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0" />
                        )}
                      </div>

                      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                        {n.mensagem}
                      </p>

                      <div className="flex items-center justify-between pt-0.5 text-[10px] text-[var(--text-muted)]">
                        <span className="flex items-center gap-1 font-mono-data">
                          <Clock className="w-3 h-3" />
                          {dataFormatada} às {horaFormatada}
                        </span>
                        {n.link && (
                          <span className="font-semibold text-[var(--color-primary)] group-hover:underline flex items-center gap-0.5">
                            {getActionLabel(n.tipo)}
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer do Dropdown */}
          <div className="p-2.5 border-t border-[var(--border-default)] bg-[var(--bg-secondary)]/40 text-center shrink-0">
            <span className="text-[10px] text-[var(--text-muted)] font-medium">
              Central Integrada de Notificações • Elo Ádapo
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
