'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { createClient } from '@/lib/supabase/client';
import { VoluntariosDocumentos } from '@/components/dashboard/voluntarios/VoluntariosDocumentos';
import { VoluntariosRecesso } from '@/components/dashboard/voluntarios/VoluntariosRecesso';
import {
  Users,
  Calendar,
  FileText,
  Plus,
  RefreshCw,
  Search,
  Edit,
  Phone,
  Mail,
  Shield,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';

import { Voluntario } from '@/components/dashboard/voluntarios/VoluntariosEquipe';
import { getVoluntarios, getCachedVoluntariosSync, invalidateVoluntariosCache } from '@/lib/services/voluntariosService';

type TabKey = 'quadro' | 'escalas' | 'documentos' | 'indicadores';

interface TabItem {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}

const TABS: TabItem[] = [
  { key: 'quadro', label: 'Quadro Geral', icon: Users, color: 'var(--color-primary)' },
  { key: 'escalas', label: 'Gestão de Folgas e Recessos', icon: Calendar, color: 'var(--color-warning)' },
  { key: 'documentos', label: 'Documentos & Termos', icon: FileText, color: 'var(--color-success)' },
  { key: 'indicadores', label: 'Indicadores de RH', icon: TrendingUp, color: 'var(--color-info)' },
];

function GestaoPessoasContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab') as TabKey | null;
  const [activeTab, setActiveTab] = useState<TabKey>(
    tabParam && ['quadro', 'escalas', 'documentos', 'indicadores'].includes(tabParam)
      ? tabParam
      : 'quadro'
  );

  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [areaFilter, setAreaFilter] = useState('todos');

  // Modal de Confirmação In-App (substituindo window.confirm)
  const [confirmModal, setConfirmModal] = useState<{ id: string; name: string; currentStatus: 'ativo' | 'inativo' } | null>(null);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const supabase = createClient();

  function showNotification(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  const fetchVoluntarios = async (force = false) => {
    try {
      if (force) {
        setLoading(true);
      }
      const data = await getVoluntarios({ status: 'todos', forceRefresh: force });
      setVoluntarios(data);
    } catch (err) {
      console.error('Erro ao carregar dados administrativos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cached = getCachedVoluntariosSync('todos');
    if (cached.length > 0) {
      setVoluntarios(cached);
      setLoading(false);
    }
    fetchVoluntarios();
  }, []);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    router.replace(`/dashboard/voluntarios/gestao?tab=${key}`);
  };

  // Executar Alternância de Status de Voluntário no Supabase
  const executeToggleStatus = async (id: string, currentStatus: 'ativo' | 'inativo') => {
    const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';

    try {
      setIsUpdatingId(id);
      const { error } = await supabase
        .from('voluntarios')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      invalidateVoluntariosCache();
      await fetchVoluntarios(true);
      showNotification(
        newStatus === 'ativo'
          ? 'Voluntário reativado com sucesso na equipe ativa!'
          : 'Voluntário desativado. Ele foi movido para o histórico.',
        'success'
      );
    } catch (err: any) {
      showNotification('Erro ao alterar status: ' + (err.message || 'Erro inesperado'), 'error');
    } finally {
      setIsUpdatingId(null);
      setConfirmModal(null);
    }
  };

  // Lista Filtrada para o Quadro Geral
  const filteredVoluntarios = useMemo(() => {
    return voluntarios.filter((v) => {
      const matchSearch =
        v.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.funcao && v.funcao.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (v.area_atuacao && v.area_atuacao.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchTipo = tipoFilter === 'todos' || v.tipo === tipoFilter;
      const matchStatus = statusFilter === 'todos' || v.status === statusFilter;
      const matchArea = areaFilter === 'todos' || v.area_atuacao === areaFilter;

      return matchSearch && matchTipo && matchStatus && matchArea;
    });
  }, [voluntarios, searchTerm, tipoFilter, statusFilter, areaFilter]);

  // Lista única de áreas para filtro
  const areasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    voluntarios.forEach((v) => {
      if (v.area_atuacao) set.add(v.area_atuacao);
    });
    return Array.from(set).sort();
  }, [voluntarios]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setTipoFilter('todos');
    setStatusFilter('todos');
    setAreaFilter('todos');
  };

  const isFiltered = searchTerm !== '' || tipoFilter !== 'todos' || statusFilter !== 'todos' || areaFilter !== 'todos';

  // Métricas de RH
  const totalVoluntarios = voluntarios.length;
  const totalAtivos = voluntarios.filter((v) => v.status === 'ativo').length;
  const totalInativos = voluntarios.filter((v) => v.status === 'inativo').length;
  const totalOperacionais = voluntarios.filter((v) => v.tipo === 'operacional' && v.status === 'ativo').length;

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* ── 1. CABEÇALHO DA PÁGINA (TOPBAR ADMINISTRATIVA) ── */}
      <Topbar
        title="Gestão de Pessoas & Diretoria"
        subtitle="Admissão formal, homologação de escalas e recessos, emissão de termos jurídicos e métricas de RH."
        action={
          <div className="flex items-center gap-2">
            <Link href="/dashboard/voluntarios">
              <Button
                variant="secondary"
                size="sm"
                icon={<Users className="w-4 h-4 text-[var(--color-primary)]" />}
                className="min-h-[44px]"
              >
                Ver Visão da Equipe
              </Button>
            </Link>

            <Link href="/dashboard/voluntarios/novo">
              <Button size="sm" icon={<Plus className="w-4 h-4" />} className="min-h-[44px] shadow-xs">
                Novo Voluntário
              </Button>
            </Link>
          </div>
        }
      />

      {/* ── 2. CONTAINER COM BREADCRUMB E ABAS (MAX-W-7XL) ── */}
      <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 flex-1 overflow-y-auto transition-all duration-300">
        {/* Breadcrumb Estrutural */}
        <nav aria-label="Navegação estrutural" className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-medium">
          <Link href="/dashboard" className="hover:text-[var(--color-primary)] transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-[var(--text-primary)] font-semibold">Gestão de Pessoas &amp; Diretoria</span>
        </nav>

        {/* Toast Notification Acessível */}
        {toast && (
          <div
            role="status"
            aria-live="polite"
            className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between shadow-sm transition-all ${
              toast.type === 'success'
                ? 'bg-[var(--color-success-soft)] text-[var(--color-success)] border border-[var(--color-success)]/30'
                : 'bg-[var(--color-danger-soft)] text-[var(--color-danger)] border border-[var(--color-danger)]/30'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
          </div>
        )}

        {/* Seletor de Abas Superiores Táteis */}
        <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl shadow-[var(--shadow-card)] overflow-x-auto custom-scrollbar">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer min-h-[44px] touch-manipulation ${
                  isActive
                    ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-xs border border-[var(--border-default)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/50'
                }`}
              >
                <div
                  className="w-5 h-5 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: isActive ? 'var(--color-primary-soft)' : 'transparent',
                    color: isActive ? tab.color : 'currentColor',
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── 3. CONTEÚDO RENDERIZADO DA ABA ATIVA ── */}
        <div className="animate-in fade-in duration-200">
          
          {/* ========================================================================= */}
          {/* ABA 1: QUADRO GERAL & ADMISSÃO */}
          {/* ========================================================================= */}
          {activeTab === 'quadro' && (
            <div className="space-y-6">
              {/* SKELETON SHIMMER QUANDO CARREGANDO */}
              {loading && voluntarios.length === 0 ? (
                <div className="space-y-5 animate-pulse select-none">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--border-default)]/60" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-3 w-20 bg-[var(--border-default)]/40 rounded" />
                          <div className="h-6 w-12 bg-[var(--border-default)]/60 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] h-14" />
                  <div className="p-6 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-16 w-full bg-[var(--border-default)]/30 rounded-xl" />
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* Micro-KPIs de Admissão */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <Card className="p-4 flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center font-bold shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                          Total Cadastrado
                        </p>
                        <p className="text-xl font-display font-extrabold text-[var(--text-primary)]">
                          {totalVoluntarios}
                        </p>
                      </div>
                    </Card>

                    <Card className="p-4 flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[var(--color-success-soft)] text-[var(--color-success)] flex items-center justify-center font-bold shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                          Ativos no Campo
                        </p>
                        <p className="text-xl font-display font-extrabold text-[var(--color-success)]">
                          {totalAtivos}
                        </p>
                      </div>
                    </Card>

                    <Card className="p-4 flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center font-bold shrink-0">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                          Operacionais
                        </p>
                        <p className="text-xl font-display font-extrabold text-[var(--color-primary)]">
                          {totalOperacionais}
                        </p>
                      </div>
                    </Card>

                    <Card className="p-4 flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-secondary)] flex items-center justify-center font-bold shrink-0 border border-[var(--border-default)]">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                          Inativos / Histórico
                        </p>
                        <p className="text-xl font-display font-extrabold text-[var(--text-secondary)]">
                          {totalInativos}
                        </p>
                      </div>
                    </Card>
                  </div>

                  {/* Barra de Busca & Filtros com Componentes Oficiais */}
                  <Card className="p-4 space-y-3">
                    <div className="flex flex-col md:flex-row items-center gap-3">
                      <div className="flex-1 w-full">
                        <Input
                          icon={<Search className="w-4 h-4" />}
                          type="text"
                          placeholder="Buscar por nome, e-mail, função ou área..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="bg-[var(--bg-secondary)]"
                        />
                      </div>

                      <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap sm:flex-nowrap">
                        <div className="w-full sm:w-44 shrink-0">
                          <Select
                            options={[
                              { value: 'todos', label: 'Todos os Tipos' },
                              { value: 'operacional', label: 'Operacional' },
                              { value: 'brincante', label: 'Voluntário Brincante' },
                              { value: 'externo', label: 'Externo' },
                            ]}
                            value={tipoFilter}
                            onChange={(e) => setTipoFilter(e.target.value)}
                          />
                        </div>

                        <div className="w-full sm:w-40 shrink-0">
                          <Select
                            options={[
                              { value: 'todos', label: 'Todos os Status' },
                              { value: 'ativo', label: 'Ativos' },
                              { value: 'inativo', label: 'Inativos' },
                            ]}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                          />
                        </div>

                        {areasDisponiveis.length > 0 && (
                          <div className="w-full sm:w-44 shrink-0">
                            <Select
                              options={[
                                { value: 'todos', label: 'Todas as Áreas' },
                                ...areasDisponiveis.map((a) => ({ value: a, label: a })),
                              ]}
                              value={areaFilter}
                              onChange={(e) => setAreaFilter(e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* LISTAGEM: MOBILE CARDS (SM:HIDDEN) + TABELA DESKTOP (HIDDEN SM:BLOCK) */}
                  {filteredVoluntarios.length === 0 ? (
                    <div className="p-8 sm:p-12 text-center rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center mx-auto">
                        <Users className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
                          Nenhum voluntário encontrado
                        </h4>
                        <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                          Não localizamos registros com os critérios de busca aplicados.
                        </p>
                      </div>
                      {isFiltered && (
                        <div className="pt-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={handleClearFilters}
                            className="min-h-[44px]"
                          >
                            Limpar Filtros e Busca
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* ── 1. CARTÕES ADMINISTRATIVOS MÓVEIS (SM:HIDDEN) ── */}
                      <div className="sm:hidden space-y-3">
                        {filteredVoluntarios.map((v) => (
                          <div
                            key={v.id}
                            className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-xs space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-11 h-11 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold flex items-center justify-center text-sm overflow-hidden shrink-0 border border-[var(--border-default)] shadow-xs">
                                  {v.avatar_url ? (
                                    <img src={v.avatar_url} alt={v.nome_completo} className="w-full h-full object-cover" />
                                  ) : (
                                    v.nome_completo.substring(0, 2).toUpperCase()
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-sm text-[var(--text-primary)] truncate">
                                    {v.nome_completo}
                                  </p>
                                  <p className="text-[11px] text-[var(--text-muted)] font-mono-data">
                                    CPF: {v.cpf || 'Não informado'}
                                  </p>
                                </div>
                              </div>

                              <Badge variant={v.status === 'ativo' ? 'success' : 'danger'}>
                                {v.status === 'ativo' ? 'ATIVO' : 'INATIVO'}
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between text-xs pt-2 border-t border-[var(--border-default)] text-[var(--text-secondary)]">
                              <div>
                                <span className="font-semibold text-[var(--text-primary)] block">
                                  {v.area_atuacao || 'Geral'}
                                </span>
                                <span className="text-[11px] text-[var(--color-primary)] font-medium">
                                  {v.funcao || 'Voluntário'}
                                </span>
                              </div>
                              <div className="text-right font-mono-data text-[11px]">
                                <span className="text-[var(--text-primary)] block truncate max-w-[140px]">{v.telefone || 'Sem telefone'}</span>
                                <span className="text-[var(--text-muted)] block truncate max-w-[140px]">{v.email}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <Badge
                                variant={
                                  v.tipo === 'brincante'
                                    ? 'warning'
                                    : v.tipo === 'operacional'
                                    ? 'primary'
                                    : 'neutral'
                                }
                                size="sm"
                              >
                                {v.tipo === 'brincante'
                                  ? 'Voluntário Brincante'
                                  : v.tipo === 'operacional'
                                  ? 'Equipe Operacional'
                                  : 'Apoio Externo'}
                              </Badge>

                              {v.auth_user_id && (
                                <span className="text-[10px] font-bold text-[var(--color-primary)] font-mono-data">
                                  USUÁRIO ELO
                                </span>
                              )}
                            </div>

                            {/* Barra de Ações da Diretoria no Celular (Touch 44px) */}
                            <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-default)]">
                              <Link href={`/dashboard/voluntarios/${v.id}`} className="flex-1">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  icon={<Edit className="w-3.5 h-3.5" />}
                                  className="w-full min-h-[44px] text-xs"
                                >
                                  Editar Cadastro
                                </Button>
                              </Link>

                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isUpdatingId === v.id}
                                className={`flex-1 min-h-[44px] text-xs font-bold ${
                                  v.status === 'ativo'
                                    ? 'text-amber-600 hover:bg-amber-500/10'
                                    : 'text-emerald-600 hover:bg-emerald-500/10'
                                }`}
                                onClick={() => setConfirmModal({ id: v.id, name: v.nome_completo, currentStatus: v.status })}
                              >
                                {v.status === 'ativo' ? 'Desativar' : 'Reativar'}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* ── 2. TABELA ADMINISTRATIVA PARA DESKTOP (HIDDEN SM:BLOCK) ── */}
                      <Card className="hidden sm:block overflow-hidden border border-[var(--border-default)] shadow-[var(--shadow-card)]">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-bold uppercase tracking-wider text-[10px] border-b border-[var(--border-default)]">
                                <th className="py-3.5 px-4">Voluntário(a)</th>
                                <th className="py-3.5 px-4">Enquadramento</th>
                                <th className="py-3.5 px-4">Área &amp; Função</th>
                                <th className="py-3.5 px-4">Contatos</th>
                                <th className="py-3.5 px-4">Status</th>
                                <th className="py-3.5 px-4 text-right">Ações da Diretoria</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-default)]">
                              {filteredVoluntarios.map((v) => (
                                <tr
                                  key={v.id}
                                  className="hover:bg-[var(--bg-secondary)]/40 transition-colors"
                                >
                                  <td className="py-3.5 px-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-xl overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-default)] flex items-center justify-center font-bold text-xs shrink-0">
                                        {v.avatar_url ? (
                                          <img src={v.avatar_url} alt={v.nome_completo} className="w-full h-full object-cover" />
                                        ) : (
                                          <span className="text-[var(--color-primary)]">
                                            {v.nome_completo.substring(0, 2).toUpperCase()}
                                          </span>
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-bold text-sm text-[var(--text-primary)] truncate">
                                          {v.nome_completo}
                                        </p>
                                        <p className="text-[11px] text-[var(--text-muted)] font-mono-data">
                                          CPF: {v.cpf || 'Não informado'}
                                        </p>
                                      </div>
                                    </div>
                                  </td>

                                  <td className="py-3.5 px-4">
                                    <Badge
                                      variant={
                                        v.tipo === 'brincante'
                                          ? 'warning'
                                          : v.tipo === 'operacional'
                                          ? 'primary'
                                          : 'neutral'
                                      }
                                    >
                                      {v.tipo === 'brincante'
                                        ? 'Voluntário Brincante'
                                        : v.tipo === 'operacional'
                                        ? 'Equipe Operacional'
                                        : 'Apoio Externo'}
                                    </Badge>
                                  </td>

                                  <td className="py-3.5 px-4">
                                    <p className="font-bold text-[var(--text-primary)]">
                                      {v.area_atuacao || 'Geral'}
                                    </p>
                                    <p className="text-[11px] text-[var(--color-primary)] font-medium">
                                      {v.funcao || 'Voluntário'}
                                    </p>
                                  </td>

                                  <td className="py-3.5 px-4 font-mono-data text-[11px]">
                                    <p className="text-[var(--text-primary)] font-semibold">{v.telefone || '—'}</p>
                                    <p className="text-[var(--text-muted)] truncate max-w-[200px]">{v.email || '—'}</p>
                                  </td>

                                  <td className="py-3.5 px-4">
                                    <Badge variant={v.status === 'ativo' ? 'success' : 'danger'}>
                                      {v.status === 'ativo' ? 'ATIVO' : 'INATIVO'}
                                    </Badge>
                                  </td>

                                  <td className="py-3.5 px-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                      <Link href={`/dashboard/voluntarios/${v.id}`}>
                                        <Button variant="secondary" size="sm" className="text-xs min-h-[36px]" icon={<Edit className="w-3.5 h-3.5" />}>
                                          Editar
                                        </Button>
                                      </Link>

                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={isUpdatingId === v.id}
                                        className={`text-xs font-semibold min-h-[36px] ${v.status === 'ativo' ? 'text-amber-600 hover:bg-amber-500/10' : 'text-emerald-600 hover:bg-emerald-500/10'}`}
                                        onClick={() => setConfirmModal({ id: v.id, name: v.nome_completo, currentStatus: v.status })}
                                      >
                                        {v.status === 'ativo' ? 'Desativar' : 'Reativar'}
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 2: GESTÃO DE FOLGAS E RECESSOS (DIRETORIA) */}
          {/* ========================================================================= */}
          {activeTab === 'escalas' && (
            <VoluntariosRecesso showAprovacoes={true} showSolicitar={false} defaultSubTab="aprovacoes" />
          )}

          {/* ========================================================================= */}
          {/* ABA 3: DOCUMENTOS OFICIAIS & TERMOS */}
          {/* ========================================================================= */}
          {activeTab === 'documentos' && (
            <VoluntariosDocumentos voluntarios={voluntarios} />
          )}

          {/* ========================================================================= */}
          {/* ABA 4: INDICADORES EXECUTIVOS DE RH */}
          {/* ========================================================================= */}
          {activeTab === 'indicadores' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5 space-y-1">
                  <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Taxa de Atividade</p>
                  <p className="text-2xl font-display font-extrabold text-[var(--color-primary)]">
                    {totalVoluntarios > 0 ? Math.round((totalAtivos / totalVoluntarios) * 100) : 0}%
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">{totalAtivos} de {totalVoluntarios} voluntários ativos</p>
                </Card>

                <Card className="p-5 space-y-1">
                  <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Cobertura Operacional</p>
                  <p className="text-2xl font-display font-extrabold text-[var(--color-primary)]">
                    {totalOperacionais}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">Membros atuando diretamente nas turmas</p>
                </Card>

                <Card className="p-5 space-y-1">
                  <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Áreas de Atuação</p>
                  <p className="text-2xl font-display font-extrabold text-[var(--color-success)]">
                    {areasDisponiveis.length}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">Frentes ativas no Instituto Ádapo</p>
                </Card>

                <Card className="p-5 space-y-1">
                  <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Horas Acumuladas</p>
                  <p className="text-2xl font-display font-extrabold text-[var(--color-primary)]">
                    {voluntarios.reduce((acc, v) => acc + (v.horas_acumuladas || 0), 0)}h
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">Impacto voluntário total registrado</p>
                </Card>
              </div>

              {/* Distribuição por Áreas */}
              <Card className="p-6 space-y-4">
                <h3 className="font-display font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[var(--color-primary)]" />
                  Distribuição da Equipe por Área de Atuação
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {areasDisponiveis.map((area) => {
                    const count = voluntarios.filter((v) => v.area_atuacao === area && v.status === 'ativo').length;
                    return (
                      <div
                        key={area}
                        className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] flex items-center justify-between"
                      >
                        <span className="font-bold text-xs text-[var(--text-primary)]">{area}</span>
                        <Badge variant="primary">{count} voluntário{count !== 1 ? 's' : ''}</Badge>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* ── 4. MODAL DE CONFIRMAÇÃO IN-APP (SUBSTITUINDO WINDOW.CONFIRM) ── */}
      {confirmModal && (
        <Modal
          isOpen={!!confirmModal}
          onClose={() => setConfirmModal(null)}
          title={confirmModal.currentStatus === 'ativo' ? 'Desativar Voluntário' : 'Reativar Voluntário'}
          icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
        >
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {confirmModal.currentStatus === 'ativo' ? (
                <>
                  Tem certeza que deseja marcar <strong className="text-[var(--text-primary)]">{confirmModal.name}</strong> como <span className="text-rose-500 font-bold">Inativo</span>? Ele deixará de constar na lista operacional de escalas e atividades.
                </>
              ) : (
                <>
                  Deseja reativar <strong className="text-[var(--text-primary)]">{confirmModal.name}</strong> na equipe ativa do Instituto Ádapo?
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border-default)]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmModal(null)}
                className="min-h-[44px]"
              >
                Cancelar
              </Button>

              <Button
                variant={confirmModal.currentStatus === 'ativo' ? 'danger' : 'primary'}
                size="sm"
                disabled={isUpdatingId === confirmModal.id}
                onClick={() => executeToggleStatus(confirmModal.id, confirmModal.currentStatus)}
                className="min-h-[44px]"
              >
                {isUpdatingId === confirmModal.id
                  ? 'Processando...'
                  : confirmModal.currentStatus === 'ativo'
                  ? 'Confirmar Desativação'
                  : 'Confirmar Reativação'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function GestaoPessoasPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
        </div>
      }
    >
      <GestaoPessoasContent />
    </Suspense>
  );
}
