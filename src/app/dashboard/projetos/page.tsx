'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DetailPanel } from '@/components/ui/DetailPanel';
import { Select } from '@/components/ui/Select';
import { FieldInfo } from '@/components/ui/FieldInfo';
import { createClient } from '@/lib/supabase/client';
import {
  Plus,
  Search,
  FolderKanban,
  Users,
  HeartHandshake,
  Calendar,
  Edit,
  Trash2,
  BookOpen,
  GraduationCap,
  Heart,
  Sparkles,
  Palette,
  Target,
  Trophy,
  Sun,
  Music,
  Globe,
  Award,
  Shield,
  Smile,
  Briefcase,
  Compass,
  Feather,
  Camera,
  Cpu,
  Pin,
} from 'lucide-react';

const ICONES_MAP: { [key: string]: any } = {
  FolderKanban,
  BookOpen,
  GraduationCap,
  Heart,
  Sparkles,
  Palette,
  Users,
  Target,
  Trophy,
  Sun,
  Music,
  Globe,
  Award,
  Shield,
  Smile,
  Briefcase,
  Compass,
  Feather,
  Camera,
  Cpu,
};

interface Projeto {
  id: string;
  nome: string;
  descricao: string | null;
  tipo: string;
  data_inicio: string;
  data_fim: string | null;
  status: 'planejado' | 'em_planejamento' | 'ativo' | 'concluido' | 'cancelado';
  cor_identificacao: string;
  icone: string;
  created_at: string;
  updated_at?: string;
  is_pinned?: boolean;
  num_beneficiarios?: number;
  num_voluntarios?: number;
}

export default function ProjetosPage() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [sortBy, setSortBy] = useState('recente');
  const [selectedProjeto, setSelectedProjeto] = useState<Projeto | null>(null);

  const fetchProjetos = async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase.from('projetos_sociais').select('*');

    if (statusFilter !== 'todos') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (!error && data) {
      const proyectosComContagem = await Promise.all(
        data.map(async (p: any) => {
          const [{ count: numBen }, { count: numVol }] = await Promise.all([
            supabase.from('inscricoes').select('*', { count: 'exact', head: true }).eq('projeto_id', p.id),
            supabase.from('alocacoes_voluntarios').select('*', { count: 'exact', head: true }).eq('projeto_id', p.id),
          ]);
          return {
            ...p,
            is_pinned: Boolean(p.is_pinned),
            num_beneficiarios: numBen || 0,
            num_voluntarios: numVol || 0,
          };
        })
      );
      setProjetos(proyectosComContagem as Projeto[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjetos();
  }, [statusFilter]);

  const handleTogglePin = async (projetoId: string, newPinned: boolean) => {
    setProjetos((prev) =>
      prev.map((p) => (p.id === projetoId ? { ...p, is_pinned: newPinned } : p))
    );
    if (selectedProjeto?.id === projetoId) {
      setSelectedProjeto((prev) => (prev ? { ...prev, is_pinned: newPinned } : null));
    }

    try {
      const supabase = createClient();
      await supabase
        .from('projetos_sociais')
        .update({ is_pinned: newPinned, updated_at: new Date().toISOString() })
        .eq('id', projetoId);
    } catch (err) {
      console.error('Erro ao alternar fixação do projeto:', err);
    }
  };

  const filteredAndSortedProjetos = [...projetos]
    .filter(
      (p) =>
        p.nome.toLowerCase().includes(search.toLowerCase()) ||
        (p.descricao && p.descricao.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      const aPinned = Boolean(a.is_pinned);
      const bPinned = Boolean(b.is_pinned);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      if (sortBy === 'recente') {
        const timeA = new Date(a.updated_at || a.created_at).getTime();
        const timeB = new Date(b.updated_at || b.created_at).getTime();
        return timeB - timeA;
      }
      if (sortBy === 'criacao') {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return timeB - timeA;
      }
      if (sortBy === 'nome_asc') {
        return a.nome.localeCompare(b.nome, 'pt-BR');
      }
      if (sortBy === 'nome_desc') {
        return b.nome.localeCompare(a.nome, 'pt-BR');
      }
      if (sortBy === 'data_inicio') {
        const timeA = new Date(a.data_inicio).getTime();
        const timeB = new Date(b.data_inicio).getTime();
        return timeB - timeA;
      }
      return 0;
    });

  const columns: Column<Projeto>[] = [
    {
      key: 'nome',
      header: 'Projeto Social',
      render: (item) => {
        const IconComp = ICONES_MAP[item.icone] || FolderKanban;
        return (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleTogglePin(item.id, !item.is_pinned);
              }}
              title={item.is_pinned ? 'Desafixar do topo' : 'Fixar no topo'}
              className={`p-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
                item.is_pinned
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] opacity-40 hover:opacity-100'
              }`}
            >
              <Pin className={`w-3.5 h-3.5 ${item.is_pinned ? 'fill-current rotate-45' : ''}`} />
            </button>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm transition-transform hover:scale-105"
              style={{ backgroundColor: item.cor_identificacao || '#F2632D' }}
            >
              <IconComp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-[var(--text-primary)]">{item.nome}</p>
                {item.is_pinned && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Fixado
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] line-clamp-1 max-w-[280px]">
                {item.descricao || 'Sem descrição'}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'participantes',
      header: 'Participantes / Equipe',
      render: (item) => (
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-[var(--text-primary)] font-medium">
            <Users className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            {item.num_beneficiarios} Inscritos
          </span>
          <span className="flex items-center gap-1 text-[var(--text-secondary)]">
            <HeartHandshake className="w-3.5 h-3.5 text-[var(--color-accent-purple)]" />
            {item.num_voluntarios} Voluntários
          </span>
        </div>
      ),
    },
    {
      key: 'datas',
      header: 'Período',
      render: (item) => (
        <div className="text-xs">
          <p className="font-medium text-[var(--text-primary)]">
            {new Date(item.data_inicio).toLocaleDateString('pt-BR')}
          </p>
          {item.data_fim && (
            <p className="text-[11px] text-[var(--text-muted)]">
              até {new Date(item.data_fim).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        const variants = {
          ativo: 'success',
          em_planejamento: 'primary',
          planejado: 'warning',
          concluido: 'neutral',
          cancelado: 'danger',
        } as const;

        const labels = {
          ativo: 'ATIVO',
          em_planejamento: 'EM PLANEJAMENTO',
          planejado: 'PLANEJADO',
          concluido: 'CONCLUÍDO',
          cancelado: 'CANCELADO',
        } as const;

        return <Badge variant={variants[item.status] || 'neutral'}>{labels[item.status] || item.status.toUpperCase()}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Link href={`/dashboard/projetos/${item.id}`}>
            <Button size="sm" variant="ghost" icon={<Edit className="w-3.5 h-3.5" />}>
              Gerenciar Projeto
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este projeto social?')) {
      const supabase = createClient();
      await supabase.from('projetos_sociais').delete().eq('id', id);
      setSelectedProjeto(null);
      fetchProjetos();
    }
  };

  const totalProjetos = projetos.length;
  const projetosAtivos = projetos.filter((p) => p.status === 'ativo').length;
  const totalBeneficiarios = projetos.reduce((acc, p) => acc + (p.num_beneficiarios || 0), 0);
  const totalVoluntarios = projetos.reduce((acc, p) => acc + (p.num_voluntarios || 0), 0);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Projetos Sociais"
        subtitle="Gestão do Plano de Trabalho e Ciclo de Vida em 4 Etapas do Instituto Ádapo"
        action={
          <Link href="/dashboard/projetos/novo">
            <Button icon={<Plus className="w-4 h-4" />}>Novo Projeto</Button>
          </Link>
        }
      />

      <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 flex-1 overflow-y-auto transition-all duration-300">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                Total de Projetos
                <FieldInfo text="Quantidade total de projetos sociais registrados no Instituto Ádapo." />
              </span>
              <p className="font-display text-2xl font-bold text-[var(--text-primary)]">{totalProjetos}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                Projetos Ativos
                <FieldInfo text="Projetos em execução neste momento." />
              </span>
              <p className="font-display text-2xl font-bold text-[var(--color-success)]">{projetosAtivos}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[var(--color-success-soft)] text-[var(--color-success)] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                Total de Beneficiários
                <FieldInfo text="Crianças e jovens matriculados nos projetos sociais." />
              </span>
              <p className="font-display text-2xl font-bold text-[var(--color-primary)]">{totalBeneficiarios}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                Equipe Alocada
                <FieldInfo text="Voluntários participando ativamente dos projetos." />
              </span>
              <p className="font-display text-2xl font-bold text-[var(--color-accent-purple)]">{totalVoluntarios}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[var(--color-accent-purple)]/10 text-[var(--color-accent-purple)] flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-[var(--shadow-card)]">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Buscar por nome ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="w-full sm:w-auto">
              <Select
                options={[
                  { value: 'recente', label: 'Última Movimentação' },
                  { value: 'criacao', label: 'Data de Criação' },
                  { value: 'nome_asc', label: 'Nome (A-Z)' },
                  { value: 'nome_desc', label: 'Nome (Z-A)' },
                  { value: 'data_inicio', label: 'Data de Início' },
                ]}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              />
            </div>

            <div className="w-full sm:w-auto">
              <Select
                options={[
                  { value: 'todos', label: 'Todos os Status' },
                  { value: 'ativo', label: 'Ativo' },
                  { value: 'em_planejamento', label: 'Em Planejamento' },
                  { value: 'planejado', label: 'Planejado' },
                  { value: 'concluido', label: 'Concluído' },
                  { value: 'cancelado', label: 'Cancelado' },
                ]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Tabela de Dados com Destaque de Fixados */}
        {loading ? (
          <div className="p-12 text-center text-sm text-[var(--text-muted)]">Carregando projetos...</div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredAndSortedProjetos}
            keyExtractor={(p) => p.id}
            onRowClick={(p) => setSelectedProjeto(p)}
            selectedRowId={selectedProjeto?.id}
            emptyMessage="Nenhum projeto social cadastrado. Clique em 'Novo Projeto' para criar o primeiro."
          />
        )}
      </div>

      {/* Painel Contextual Lateral de Detalhes */}
      <DetailPanel
        isOpen={!!selectedProjeto}
        onClose={() => setSelectedProjeto(null)}
        title={selectedProjeto?.nome || ''}
        subtitle={`Iniciado em ${new Date(selectedProjeto?.data_inicio || '').toLocaleDateString('pt-BR')}`}
      >
        {selectedProjeto && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Badge
                variant={
                  selectedProjeto.status === 'ativo'
                    ? 'success'
                    : selectedProjeto.status === 'em_planejamento'
                    ? 'primary'
                    : selectedProjeto.status === 'concluido'
                    ? 'neutral'
                    : selectedProjeto.status === 'cancelado'
                    ? 'danger'
                    : 'warning'
                }
              >
                {selectedProjeto.status === 'em_planejamento'
                  ? 'EM PLANEJAMENTO'
                  : selectedProjeto.status === 'concluido'
                  ? 'CONCLUÍDO'
                  : selectedProjeto.status.toUpperCase()}
              </Badge>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={selectedProjeto.is_pinned ? 'primary' : 'secondary'}
                  icon={<Pin className={`w-3.5 h-3.5 ${selectedProjeto.is_pinned ? 'fill-current rotate-45' : ''}`} />}
                  onClick={() => handleTogglePin(selectedProjeto.id, !selectedProjeto.is_pinned)}
                >
                  {selectedProjeto.is_pinned ? 'Fixado no Topo' : 'Fixar no Topo'}
                </Button>
                <Link href={`/dashboard/projetos/${selectedProjeto.id}`}>
                  <Button size="sm" variant="secondary" icon={<Edit className="w-3.5 h-3.5" />}>
                    Gerenciar
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="danger"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() => handleDelete(selectedProjeto.id)}
                >
                  Excluir
                </Button>
              </div>
            </div>

            {selectedProjeto.descricao && (
              <div className="space-y-1">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Descrição do Projeto
                </h4>
                <p className="text-xs p-3 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] leading-relaxed">
                  {selectedProjeto.descricao}
                </p>
              </div>
            )}

            {/* Métricas do Projeto */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] space-y-1 border border-[var(--border-default)]">
                <div className="flex items-center gap-2 text-[var(--color-primary)] font-bold">
                  <Users className="w-4 h-4" />
                  <span>{selectedProjeto.num_beneficiarios} Beneficiários</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">Inscritos no projeto</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] space-y-1 border border-[var(--border-default)]">
                <div className="flex items-center gap-2 text-[var(--color-accent-purple)] font-bold">
                  <HeartHandshake className="w-4 h-4" />
                  <span>{selectedProjeto.num_voluntarios} Voluntários</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">Equipe alocada</p>
              </div>
            </div>
          </div>
        )}
      </DetailPanel>
    </div>
  );
}
