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
import { createClient } from '@/lib/supabase/client';
import { VoluntariosDocumentos } from '@/components/dashboard/voluntarios/VoluntariosDocumentos';
import { VoluntariosRecesso } from '@/components/dashboard/voluntarios/VoluntariosRecesso';
import {
  Users,
  ShieldCheck,
  Calendar,
  FileText,
  Plus,
  RefreshCw,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  Shield,
  Clock,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  ChevronRight,
  Filter,
} from 'lucide-react';

import { Voluntario } from '@/components/dashboard/voluntarios/VoluntariosEquipe';

type TabKey = 'quadro' | 'escalas' | 'documentos' | 'indicadores';

interface TabItem {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}

const TABS: TabItem[] = [
  { key: 'quadro', label: 'Quadro Geral', icon: Users, color: '#F2632D' },
  { key: 'escalas', label: 'Gestão de Folgas e Recessos', icon: Calendar, color: '#93368F' },
  { key: 'documentos', label: 'Documentos & Termos', icon: FileText, color: '#1C9C82' },
  { key: 'indicadores', label: 'Indicadores de RH', icon: TrendingUp, color: '#3B82F6' },
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

  const supabase = createClient();

  const fetchVoluntarios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('voluntarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar voluntários:', error);
      } else if (data) {
        setVoluntarios(data as Voluntario[]);
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoluntarios();
  }, []);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    router.replace(`/dashboard/voluntarios/gestao?tab=${key}`);
  };

  // Alternar Status de Voluntário (Ativar / Inativar)
  const handleToggleStatus = async (id: string, currentStatus: 'ativo' | 'inativo') => {
    const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';
    const confirmMsg =
      newStatus === 'inativo'
        ? 'Deseja marcar este voluntário como Inativo? Ele deixará de aparecer na lista operacional.'
        : 'Deseja reativar este voluntário no sistema?';

    if (!window.confirm(confirmMsg)) return;

    try {
      const { error } = await supabase
        .from('voluntarios')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      fetchVoluntarios();
    } catch (err: any) {
      alert('Erro ao alterar status: ' + err.message);
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

  // Métricas de RH
  const totalVoluntarios = voluntarios.length;
  const totalAtivos = voluntarios.filter((v) => v.status === 'ativo').length;
  const totalInativos = voluntarios.filter((v) => v.status === 'inativo').length;
  const totalOperacionais = voluntarios.filter((v) => v.tipo === 'operacional' && v.status === 'ativo').length;
  const totalExternos = voluntarios.filter((v) => v.tipo === 'externo' && v.status === 'ativo').length;

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* ── 1. CABEÇALHO DA PÁGINA (TOPBAR FIXO NO TOPO) ── */}
      <Topbar
        title="Gestão de Pessoas & Diretoria"
        subtitle="Admissão formal, homologação de escalas e recessos, emissão de termos jurídicos e métricas de RH."
        action={
          <div className="flex items-center gap-2">
            <Link href="/dashboard/voluntarios">
              <Button variant="secondary" size="sm" icon={<Users className="w-4 h-4 text-[#F2632D]" />}>
                Ver Visão da Equipe
              </Button>
            </Link>

            <Link href="/dashboard/voluntarios/novo">
              <Button size="sm" icon={<Plus className="w-4 h-4" />}>
                Novo Voluntário
              </Button>
            </Link>
          </div>
        }
      />

      {/* ── 2. CONTAINER COM ESPAÇAMENTO AREJADO E CENTRALIZADO (MAX-W-7XL) ── */}
      <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 flex-1 overflow-y-auto transition-all duration-300">
        
        {/* Seletor de Abas Superiores */}
        <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl shadow-[var(--shadow-card)] overflow-x-auto custom-scrollbar">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-xs border border-[var(--border-default)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/50'
                }`}
              >
                <div
                  className="w-5 h-5 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: isActive ? `${tab.color}20` : 'transparent',
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
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Ativos no Campo
                    </p>
                    <p className="text-xl font-display font-extrabold text-emerald-600">
                      {totalAtivos}
                    </p>
                  </div>
                </Card>

                <Card className="p-4 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-[#93368F] flex items-center justify-center font-bold shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Operacionais
                    </p>
                    <p className="text-xl font-display font-extrabold text-[#93368F]">
                      {totalOperacionais}
                    </p>
                  </div>
                </Card>

                <Card className="p-4 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-500/10 text-[var(--text-secondary)] flex items-center justify-center font-bold shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Inativos / Desligados
                    </p>
                    <p className="text-xl font-display font-extrabold text-[var(--text-secondary)]">
                      {totalInativos}
                    </p>
                  </div>
                </Card>
              </div>

              {/* Barra de Busca & Filtros */}
              <Card className="p-4 space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Buscar por nome, e-mail, função ou área..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                    <select
                      value={tipoFilter}
                      onChange={(e) => setTipoFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none font-semibold cursor-pointer"
                    >
                      <option value="todos">Todos os Tipos</option>
                      <option value="operacional">Operacional</option>
                      <option value="externo">Externo</option>
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none font-semibold cursor-pointer"
                    >
                      <option value="todos">Todos os Status</option>
                      <option value="ativo">Ativos</option>
                      <option value="inativo">Inativos</option>
                    </select>

                    {areasDisponiveis.length > 0 && (
                      <select
                        value={areaFilter}
                        onChange={(e) => setAreaFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none font-semibold cursor-pointer"
                      >
                        <option value="todos">Todas as Áreas</option>
                        {areasDisponiveis.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </Card>

              {/* Tabela Administrativa de Voluntários */}
              <Card className="overflow-hidden border border-[var(--border-default)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-bold uppercase tracking-wider text-[10px] border-b border-[var(--border-default)]">
                        <th className="py-3 px-4">Voluntário(a)</th>
                        <th className="py-3 px-4">Enquadramento</th>
                        <th className="py-3 px-4">Área &amp; Função</th>
                        <th className="py-3 px-4">Contatos</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Ações da Diretoria</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-default)]">
                      {filteredVoluntarios.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-xs text-[var(--text-muted)] italic">
                            Nenhum voluntário encontrado com os filtros selecionados.
                          </td>
                        </tr>
                      ) : (
                        filteredVoluntarios.map((v) => (
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
                              <Badge variant={v.tipo === 'operacional' ? 'purple' : 'neutral'}>
                                {v.tipo === 'operacional' ? 'Equipe Operacional' : 'Apoio Externo'}
                              </Badge>
                            </td>

                            <td className="py-3.5 px-4">
                              <p className="font-bold text-[var(--text-primary)]">
                                {v.area_atuacao || 'Geral'}
                              </p>
                              <p className="text-[11px] text-[var(--text-muted)]">
                                {v.funcao || 'Voluntário'}
                              </p>
                            </td>

                            <td className="py-3.5 px-4 font-mono-data text-[11px]">
                              <p className="text-[var(--text-primary)]">{v.telefone || '—'}</p>
                              <p className="text-[var(--text-muted)]">{v.email || '—'}</p>
                            </td>

                            <td className="py-3.5 px-4">
                              <Badge variant={v.status === 'ativo' ? 'success' : 'danger'}>
                                {v.status === 'ativo' ? 'ATIVO' : 'INATIVO'}
                              </Badge>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                <Link href={`/dashboard/voluntarios/${v.id}`}>
                                  <Button variant="secondary" size="sm" className="text-xs" icon={<Edit className="w-3.5 h-3.5" />}>
                                    Editar
                                  </Button>
                                </Link>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`text-xs ${v.status === 'ativo' ? 'text-amber-600 hover:bg-amber-500/10' : 'text-emerald-600 hover:bg-emerald-500/10'}`}
                                  onClick={() => handleToggleStatus(v.id, v.status)}
                                >
                                  {v.status === 'ativo' ? 'Desativar' : 'Reativar'}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
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
                  <p className="text-2xl font-display font-extrabold text-[#93368F]">
                    {totalOperacionais}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">Membros atuando diretamente nas turmas</p>
                </Card>

                <Card className="p-5 space-y-1">
                  <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Áreas de Atuação</p>
                  <p className="text-2xl font-display font-extrabold text-[#1C9C82]">
                    {areasDisponiveis.length}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">Frentes ativas no Instituto Ádapo</p>
                </Card>

                <Card className="p-5 space-y-1">
                  <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Horas Acumuladas</p>
                  <p className="text-2xl font-display font-extrabold text-[#3B82F6]">
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
