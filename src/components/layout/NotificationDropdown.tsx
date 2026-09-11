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
  CheckCircle2,
} from 'lucide-react';
import {
  Notificacao,
  getNotificacoes,
  marcarComoLida,
  marcarTodasComoLidas,
  limparTodasNotificacoes,
  onNotificacoesChange,
} from '@/lib/services/notificacoesService';

export function NotificationDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Carregar iniciais
    setNotificacoes(getNotificacoes());

    // Escutar atualizações
    const unsubscribe = onNotificacoesChange((lista) => {
      setNotificacoes(lista);
    });

    return () => unsubscribe();
  }, []);

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

  const handleClickNotification = (notif: Notificacao) => {
    marcarComoLida(notif.id);
    setIsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão do Sino */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`p-2 rounded-xl transition-all relative shrink-0 cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center ${
          isOpen
            ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-xs'
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
        }`}
        aria-label="Notificações do sistema"
        title={unreadCount > 0 ? `${unreadCount} notificações não lidas` : 'Notificações'}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#F2632D] text-white text-[10px] font-bold absolute -top-1 -right-1 flex items-center justify-center shadow-xs animate-in zoom-in-50">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Painel Flutuante de Notificações */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-32px)] rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden flex flex-col max-h-[80vh]">
          {/* Header do Dropdown */}
          <div className="p-3.5 border-b border-[var(--border-default)] bg-[var(--bg-secondary)]/50 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Notificações
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F2632D]/15 text-[#F2632D]">
                  {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => marcarTodasComoLidas()}
                  className="p-1 rounded-lg text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-secondary)] transition-colors flex items-center gap-1"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lidas</span>
                </button>
              )}

              {notificacoes.length > 0 && (
                <button
                  type="button"
                  onClick={() => limparTodasNotificacoes()}
                  className="p-1 rounded-lg text-[11px] font-medium text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-1"
                  title="Limpar histórico"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Lista de Notificações */}
          <div className="divide-y divide-[var(--border-default)] overflow-y-auto custom-scrollbar flex-1">
            {notificacoes.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] flex items-center justify-center mx-auto">
                  <Bell className="w-5 h-5 opacity-40" />
                </div>
                <p className="text-xs font-medium text-[var(--text-primary)]">
                  Nenhuma notificação por enquanto
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Convocações para reuniões institucionais e avisos do sistema aparecerão aqui.
                </p>
              </div>
            ) : (
              notificacoes.map((n) => {
                const dateObj = new Date(n.created_at);
                const dataFormatada = dateObj.toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                });
                const horaFormatada = dateObj.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={n.id}
                    onClick={() => handleClickNotification(n)}
                    className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 relative group ${
                      !n.lida
                        ? 'bg-[var(--color-primary-soft)]/20 hover:bg-[var(--color-primary-soft)]/30'
                        : 'hover:bg-[var(--bg-secondary)]/70'
                    }`}
                  >
                    {/* Ícone Indicador */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white ${
                        n.tipo === 'reuniao'
                          ? 'bg-[#2563EB]'
                          : 'bg-[var(--color-primary)]'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
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
                          <span className="w-2 h-2 rounded-full bg-[#F2632D] shrink-0" />
                        )}
                      </div>

                      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                        {n.mensagem}
                      </p>

                      <div className="flex items-center justify-between pt-0.5 text-[10px] text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {dataFormatada} às {horaFormatada}
                        </span>
                        {n.link && (
                          <span className="font-semibold text-[var(--color-primary)] group-hover:underline flex items-center gap-0.5">
                            Ver reunião
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
          <div className="p-2 border-t border-[var(--border-default)] bg-[var(--bg-secondary)]/40 text-center shrink-0">
            <Link
              href="/dashboard/institucional"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-semibold text-[var(--color-primary)] hover:underline inline-flex items-center gap-1"
            >
              <span>Abrir Reuniões & Governança</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
