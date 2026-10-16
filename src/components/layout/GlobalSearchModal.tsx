'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Search,
  X,
  LayoutDashboard,
  Users,
  HeartHandshake,
  FolderKanban,
  Calendar,
  Gift,
  Package,
  GraduationCap,
  Megaphone,
  Landmark,
  BarChart3,
  User,
  ArrowRight,
  ShieldCheck,
  FileText,
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'módulos' | 'beneficiários' | 'voluntários' | 'projetos';
  href: string;
  icon: any;
  color?: string;
}

const SYSTEM_MODULES: SearchItem[] = [
  { id: 'mod-1', title: 'Painel Inicial', subtitle: 'Cockpit e visão geral do sistema', category: 'módulos', href: '/dashboard', icon: LayoutDashboard },
  { id: 'mod-2', title: 'Beneficiários', subtitle: 'Prontuários e fichas sociais', category: 'módulos', href: '/dashboard/beneficiarios', icon: Users },
  { id: 'mod-3', title: 'Voluntários & Equipe', subtitle: 'Cadastros, escalas e saúde', category: 'módulos', href: '/dashboard/voluntarios', icon: HeartHandshake },
  { id: 'mod-4', title: 'Projetos Sociais', subtitle: 'Projetos, ações e cronogramas', category: 'módulos', href: '/dashboard/projetos', icon: FolderKanban },
  { id: 'mod-5', title: 'Calendário Geral', subtitle: 'Cronograma unificado de atividades', category: 'módulos', href: '/dashboard/calendario', icon: Calendar },
  { id: 'mod-6', title: 'Captação & Doações', subtitle: 'Registro de doações e apoiadores', category: 'módulos', href: '/dashboard/doacoes', icon: Gift },
  { id: 'mod-7', title: 'Controle de Estoque', subtitle: 'Materiais, doações e requisições', category: 'módulos', href: '/dashboard/estoque', icon: Package },
  { id: 'mod-8', title: 'Quadro de Tarefas', subtitle: 'Comunicação e demandas', category: 'módulos', href: '/dashboard/comunicacao/tarefas', icon: Megaphone },
  { id: 'mod-9', title: 'Gestão Editorial', subtitle: 'Mídias, Drive e publicações', category: 'módulos', href: '/dashboard/comunicacao/gestao', icon: FileText },
  { id: 'mod-10', title: 'Pedagogia & Socioemocional', subtitle: 'Planos de aula e acompanhamento', category: 'módulos', href: '/dashboard/pedagogia', icon: GraduationCap },
  { id: 'mod-11', title: 'Reuniões & Governança', subtitle: 'Atas institucionais e pautas', category: 'módulos', href: '/dashboard/institucional', icon: Landmark },
  { id: 'mod-12', title: 'Indicadores Sociais', subtitle: 'Métricas de impacto e dashboards', category: 'módulos', href: '/dashboard/indicadores', icon: BarChart3 },
  { id: 'mod-13', title: 'Meu Perfil', subtitle: 'Dados pessoais e preferências', category: 'módulos', href: '/dashboard/perfil', icon: User },
  { id: 'mod-14', title: 'Gestão de Usuários', subtitle: 'Controle de acessos de administradores', category: 'módulos', href: '/dashboard/usuarios', icon: ShieldCheck },
];

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const supabase = createClient();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchItem[]>(SYSTEM_MODULES.slice(0, 6));
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Foco no input ao abrir
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setResults(SYSTEM_MODULES.slice(0, 6));
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Tecla Escape para fechar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Busca em tempo real
  useEffect(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      setResults(SYSTEM_MODULES.slice(0, 6));
      setLoading(false);
      return;
    }

    // Filtrar módulos estáticos imediatamente
    const matchedModules = SYSTEM_MODULES.filter(
      (m) => m.title.toLowerCase().includes(trimmed) || (m.subtitle && m.subtitle.toLowerCase().includes(trimmed))
    );

    // Se o termo for curto (< 2 letras), mostrar apenas módulos
    if (trimmed.length < 2) {
      setResults(matchedModules);
      setSelectedIndex(0);
      return;
    }

    // Buscar no banco com debounce
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const [
          { data: benData },
          { data: volData },
          { data: projData },
        ] = await Promise.all([
          supabase
            .from('beneficiarios')
            .select('id, nome_completo, comunidade')
            .ilike('nome_completo', `%${trimmed}%`)
            .limit(4),
          supabase
            .from('voluntarios')
            .select('id, nome_completo, funcao')
            .ilike('nome_completo', `%${trimmed}%`)
            .limit(4),
          supabase
            .from('projetos_sociais')
            .select('id, nome, cor_identificacao')
            .ilike('nome', `%${trimmed}%`)
            .limit(4),
        ]);

        const dbResults: SearchItem[] = [];

        if (benData) {
          benData.forEach((b: any) => {
            dbResults.push({
              id: 'ben-' + b.id,
              title: b.nome_completo,
              subtitle: b.comunidade ? `Beneficiário(a) • ${b.comunidade}` : 'Beneficiário(a)',
              category: 'beneficiários',
              href: `/dashboard/beneficiarios/${b.id}`,
              icon: Users,
              color: 'var(--color-secondary)',
            });
          });
        }

        if (volData) {
          volData.forEach((v: any) => {
            dbResults.push({
              id: 'vol-' + v.id,
              title: v.nome_completo,
              subtitle: v.funcao ? `Voluntário(a) • ${v.funcao}` : 'Voluntário(a)',
              category: 'voluntários',
              href: `/dashboard/voluntarios`,
              icon: HeartHandshake,
              color: 'var(--color-primary)',
            });
          });
        }

        if (projData) {
          projData.forEach((p: any) => {
            dbResults.push({
              id: 'proj-' + p.id,
              title: p.nome,
              subtitle: 'Projeto Social em execução',
              category: 'projetos',
              href: `/dashboard/projetos/${p.id}`,
              icon: FolderKanban,
              color: p.cor_identificacao || 'var(--color-primary)',
            });
          });
        }

        setResults([...matchedModules, ...dbResults]);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Erro na busca global:', err);
        setResults(matchedModules);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = (item: SearchItem) => {
    onClose();
    router.push(item.href);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full sm:max-w-xl bg-[var(--bg-elevated)] border-b sm:border border-[var(--border-default)] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[100dvh] sm:max-h-[80vh] animate-in slide-in-from-top-4 sm:zoom-in-95 duration-150">
        {/* Barra de Busca no Topo */}
        <div className="p-3.5 sm:p-4 border-b border-[var(--border-default)] flex items-center gap-3 bg-[var(--bg-elevated)] shrink-0">
          <Search className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por módulo, beneficiário, voluntário ou projeto..."
            className="w-full bg-transparent text-base sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
          {loading && (
            <span className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin shrink-0" />
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 touch-manipulation cursor-pointer"
            aria-label="Fechar busca"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Resultados */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1 min-h-[260px] max-h-[420px]">
          {results.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Search className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-40" />
              <p className="text-xs text-[var(--text-muted)] font-medium">
                Nenhum resultado encontrado para "{query}".
              </p>
              <p className="text-[11px] text-[var(--text-muted)] opacity-70">
                Tente buscar pelo primeiro nome de um beneficiário, voluntário ou nome do projeto.
              </p>
            </div>
          ) : (
            results.map((item, idx) => {
              const IconComp = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer min-h-[48px] touch-manipulation ${
                    isSelected
                      ? 'bg-[var(--color-primary-soft)] text-[var(--text-primary)] shadow-xs'
                      : 'hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[var(--color-primary)] text-white shadow-xs'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="text-[11px] text-[var(--text-muted)] truncate">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-muted)]">
                      {item.category}
                    </span>
                    <ArrowRight className={`w-4 h-4 ${isSelected ? 'text-[var(--color-primary)]' : 'opacity-0'}`} />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Rodapé com Dicas de Atalho */}
        <div className="p-3 border-t border-[var(--border-default)] bg-[var(--bg-secondary)]/40 flex items-center justify-between text-[11px] text-[var(--text-muted)] shrink-0">
          <div className="hidden sm:flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-default)] font-mono text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-default)] font-mono text-[10px]">↓</kbd> Navegar</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-default)] font-mono text-[10px]">Enter</kbd> Acessar</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-default)] font-mono text-[10px]">Esc</kbd> Fechar</span>
          </div>
          <span className="text-[11px] text-[var(--color-primary)] font-semibold ml-auto">
            Elo • Instituto Ádapo
          </span>
        </div>
      </div>
    </div>
  );
}
