'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DetailPanel } from '@/components/ui/DetailPanel';
import { Select } from '@/components/ui/Select';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  Edit,
  Trash2,
  Shield,
  HeartHandshake,
  MessageCircle,
  MapPin,
  FileText,
  Award,
  Sparkles,
  UserCheck,
  UserX,
  Heart,
  CheckCircle2,
  ExternalLink,
  Clock,
  TrendingUp,
  BarChart2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface Voluntario {
  id: string;
  nome_completo: string;
  cpf: string;
  email: string;
  telefone: string;
  tipo: 'operacional' | 'externo';
  area_atuacao: string | null;
  funcao: string | null;
  data_inicio: string;
  data_fim: string | null;
  status: 'ativo' | 'inativo';
  avatar_url: string | null;
  cep: string | null;
  rua: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  contato_emergencia_nome: string | null;
  contato_emergencia_parentesco: string | null;
  contato_emergencia_telefone: string | null;
  tipo_sanguineo: string | null;
  alergias: string | null;
  medicamentos_uso_continuo: string | null;
  plano_saude: string | null;
  cartao_sus?: string | null;
  observacoes: string | null;
  habilidades?: string[] | null;
  horas_acumuladas?: number | null;
  created_at: string;
}

interface VoluntariosEquipeProps {
  voluntarios: Voluntario[];
  loading: boolean;
  onRefresh: () => void;
  onSelectParaDocumento?: (voluntario: Voluntario, tipoDoc: 'termo' | 'certificado') => void;
}

export function VoluntariosEquipe({
  voluntarios,
  loading,
  onRefresh,
  onSelectParaDocumento,
}: VoluntariosEquipeProps) {
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [habilidadeFilter, setHabilidadeFilter] = useState('todas');
  const [selectedVoluntario, setSelectedVoluntario] = useState<Voluntario | null>(null);
  const [showGraficosHoras, setShowGraficosHoras] = useState(true);

  // Estatísticas e KPIs para o topo
  const stats = useMemo(() => {
    const total = voluntarios.length;
    const ativos = voluntarios.filter((v) => v.status === 'ativo').length;
    const inativos = total - ativos;
    const operacionais = voluntarios.filter((v) => v.tipo === 'operacional').length;
    const externos = voluntarios.filter((v) => v.tipo === 'externo').length;

    // Cálculo de Horas Trabalhadas
    const totalHoras = voluntarios.reduce((acc, v) => acc + (v.horas_acumuladas || 0), 0);
    const mediaHoras = ativos > 0 ? Math.round(totalHoras / ativos) : 0;

    return { total, ativos, inativos, operacionais, externos, totalHoras, mediaHoras };
  }, [voluntarios]);

  // Ranking Top 4 de Horas Trabalhadas
  const topVoluntariosHoras = useMemo(() => {
    return [...voluntarios]
      .filter((v) => v.status === 'ativo')
      .sort((a, b) => (b.horas_acumuladas || 0) - (a.horas_acumuladas || 0))
      .slice(0, 4);
  }, [voluntarios]);

  // Distribuição de Horas por Área de Atuação
  const horasPorArea = useMemo(() => {
    const map: Record<string, number> = {};
    voluntarios.forEach((v) => {
      const area = v.area_atuacao || 'Geral';
      map[area] = (map[area] || 0) + (v.horas_acumuladas || 0);
    });

    const maxHoras = Math.max(...Object.values(map), 1);
    return Object.entries(map).map(([area, horas]) => ({
      area,
      horas,
      percentual: Math.round((horas / (stats.totalHoras || 1)) * 100),
      barWidth: Math.round((horas / maxHoras) * 100),
    }));
  }, [voluntarios, stats.totalHoras]);

  // Lista única de habilidades
  const todasHabilidades = useMemo(() => {
    const set = new Set<string>();
    voluntarios.forEach((v) => {
      if (Array.isArray(v.habilidades)) {
        v.habilidades.forEach((h) => h && set.add(h.trim()));
      }
    });
    return Array.from(set).sort();
  }, [voluntarios]);

  // Filtro
  const filteredVoluntarios = useMemo(() => {
    return voluntarios.filter((v) => {
      const matchSearch =
        (v.nome_completo || '').toLowerCase().includes(search.toLowerCase()) ||
        (v.cpf || '').includes(search) ||
        (v.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (v.area_atuacao && v.area_atuacao.toLowerCase().includes(search.toLowerCase())) ||
        (v.funcao && v.funcao.toLowerCase().includes(search.toLowerCase()));

      const matchTipo = tipoFilter === 'todos' || v.tipo === tipoFilter;
      const matchStatus = statusFilter === 'todos' || v.status === statusFilter;
      const matchHabilidade =
        habilidadeFilter === 'todas' ||
        (Array.isArray(v.habilidades) && v.habilidades.includes(habilidadeFilter));

      return matchSearch && matchTipo && matchStatus && matchHabilidade;
    });
  }, [voluntarios, search, tipoFilter, statusFilter, habilidadeFilter]);

  // Formatação de telefone para link de WhatsApp
  const getWhatsAppUrl = (tel?: string | null, nome?: string) => {
    if (!tel) return null;
    const cleanTel = tel.replace(/\D/g, '');
    if (cleanTel.length < 10) return null;
    const fullNumber = cleanTel.startsWith('55') ? cleanTel : `55${cleanTel}`;
    const msg = encodeURIComponent(
      `Olá ${nome ? nome.split(' ')[0] : 'Voluntário(a)'}! Mensagem da coordenação do Instituto Ádapo.`
    );
    return `https://wa.me/${fullNumber}?text=${msg}`;
  };

  const columns: Column<Voluntario>[] = [
    {
      key: 'nome_completo',
      header: 'Voluntário(a)',
      width: '280px',
      render: (item) => (
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold flex items-center justify-center text-xs overflow-hidden shrink-0 border border-[var(--border-default)] shadow-xs">
            {item.avatar_url ? (
              <img src={item.avatar_url} alt={item.nome_completo} className="w-full h-full object-cover" />
            ) : (
              item.nome_completo.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-xs sm:text-sm text-[var(--text-primary)] truncate">
              {item.nome_completo}
            </p>
            <p className="text-[11px] font-mono-data text-[var(--text-muted)] truncate">
              CPF: {item.cpf}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Enquadramento',
      width: '160px',
      render: (item) => (
        <Badge variant={item.tipo === 'operacional' ? 'purple' : 'neutral'}>
          {item.tipo === 'operacional' ? 'Equipe Operacional' : 'Monitor Externo'}
        </Badge>
      ),
    },
    {
      key: 'area_atuacao',
      header: 'Área & Função',
      width: '180px',
      render: (item) => (
        <div className="text-xs min-w-0 space-y-0.5">
          <p className="font-semibold text-[var(--text-primary)] truncate">
            {item.area_atuacao || 'Geral'}
          </p>
          <p className="text-[11px] text-[var(--color-primary)] font-medium truncate">
            {item.funcao || 'Voluntário'}
          </p>
        </div>
      ),
    },
    {
      key: 'horas_acumuladas',
      header: 'Horas Dedicadas',
      width: '150px',
      render: (item) => (
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0 font-bold text-xs">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="font-display font-extrabold text-xs text-[var(--text-primary)]">
              {item.horas_acumuladas || 0}h
            </span>
            <span className="text-[10px] text-[var(--text-muted)] block">acumuladas</span>
          </div>
        </div>
      ),
    },
    {
      key: 'telefone',
      header: 'Contato & WhatsApp',
      width: '240px',
      render: (item) => {
        const waUrl = getWhatsAppUrl(item.telefone, item.nome_completo);
        return (
          <div className="text-xs min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono-data font-semibold text-[var(--text-primary)]">
                {item.telefone || 'Sem telefone'}
              </span>
              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 font-bold text-[10px] flex items-center gap-1 transition-colors shrink-0"
                  title="Abrir WhatsApp"
                >
                  <MessageCircle className="w-3 h-3" />
                  WhatsApp
                </a>
              )}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] truncate max-w-[200px]">
              {item.email}
            </p>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      align: 'center',
      headerClassName: 'text-center',
      render: (item) => (
        <div className="flex justify-center">
          <Badge variant={item.status === 'ativo' ? 'success' : 'danger'}>
            {item.status === 'ativo' ? 'ATIVO' : 'INATIVO'}
          </Badge>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* ── 1. CARDS DE KPIS EXECUTIVOS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
              Total Voluntários
            </p>
            <p className="text-lg sm:text-xl font-display font-extrabold text-[var(--text-primary)]">
              {stats.total}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
              Ativos / Campo
            </p>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-lg sm:text-xl font-display font-extrabold text-[var(--text-primary)]">
                {stats.ativos}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">({stats.inativos} inat.)</span>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
              Horas Acumuladas
            </p>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-lg sm:text-xl font-display font-extrabold text-[#3B82F6]">
                {stats.totalHoras}h
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">(méd. {stats.mediaHoras}h)</span>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
              Habilidades
            </p>
            <p className="text-lg sm:text-xl font-display font-extrabold text-[var(--text-primary)]">
              {todasHabilidades.length > 0 ? `${todasHabilidades.length} Tags` : '100% Equipe'}
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. SEÇÃO EXPANSÍVEL: GRÁFICOS & INDICADORES DE HORAS TRABALHADAS ── */}
      <Card className="p-5 space-y-4 border border-[var(--border-default)] shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center font-bold">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm sm:text-base text-[var(--text-primary)]">
                Indicadores &amp; Gráficos de Horas Trabalhadas
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Acompanhamento visual de dedicação voluntária e impacto social da equipe.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowGraficosHoras(!showGraficosHoras)}
            className="p-1.5 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer text-xs flex items-center gap-1 font-semibold"
          >
            {showGraficosHoras ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>{showGraficosHoras ? 'Recolher' : 'Expandir'}</span>
          </button>
        </div>

        {showGraficosHoras && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-1 animate-in fade-in duration-200">
            {/* Gráfico 1: Top Voluntários com mais Horas */}
            <div className="p-4 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-default)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  Voluntários com Mais Horas Dedicadas
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono-data">Top 4 Ativos</span>
              </div>

              <div className="space-y-2.5">
                {topVoluntariosHoras.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] py-4 text-center">Nenhum voluntário com horas registradas.</p>
                ) : (
                  topVoluntariosHoras.map((vol, idx) => {
                    const maxH = topVoluntariosHoras[0]?.horas_acumuladas || 1;
                    const pct = Math.round(((vol.horas_acumuladas || 0) / maxH) * 100);

                    return (
                      <div key={vol.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[var(--text-primary)] truncate max-w-[200px]">
                            {idx + 1}º {vol.nome_completo}
                          </span>
                          <span className="font-mono-data font-bold text-[var(--color-primary)]">
                            {vol.horas_acumuladas || 0}h
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden border border-[var(--border-default)]/50">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[#93368F] transition-all duration-500"
                            style={{ width: `${Math.max(pct, 8)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Gráfico 2: Distribuição de Horas por Frente / Área */}
            <div className="p-4 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-default)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#1C9C82]" />
                  Distribuição de Horas por Área
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono-data">{stats.totalHoras}h no total</span>
              </div>

              <div className="space-y-2.5">
                {horasPorArea.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] py-4 text-center">Nenhuma área registrada.</p>
                ) : (
                  horasPorArea.map((item) => (
                    <div key={item.area} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--text-primary)] truncate">
                          {item.area}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-data font-bold text-[var(--text-secondary)]">
                            {item.horas}h
                          </span>
                          <span className="text-[10px] font-bold text-[var(--text-muted)]">
                            ({item.percentual}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden border border-[var(--border-default)]/50">
                        <div
                          className="h-full rounded-full bg-[#1C9C82] transition-all duration-500"
                          style={{ width: `${Math.max(item.barWidth, 6)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* ── 3. PAINEL DE BUSCA & FILTROS ── */}
      <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-[var(--shadow-card)] space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Buscar por nome, CPF, e-mail, função ou habilidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="w-full sm:w-48 shrink-0">
              <Select
                options={[
                  { value: 'todos', label: 'Todos os Tipos' },
                  { value: 'operacional', label: 'Operacional' },
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
                  { value: 'ativo', label: 'Ativo' },
                  { value: 'inativo', label: 'Inativo' },
                ]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Pílulas de Competências / Habilidades (se houver) */}
        {todasHabilidades.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[var(--border-default)]">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mr-1">
              Habilidades:
            </span>
            <button
              type="button"
              onClick={() => setHabilidadeFilter('todas')}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                habilidadeFilter === 'todas'
                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/80'
              }`}
            >
              Todas
            </button>
            {todasHabilidades.map((hab) => (
              <button
                key={hab}
                type="button"
                onClick={() => setHabilidadeFilter(hab)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  habilidadeFilter === hab
                    ? 'bg-[var(--color-primary)] text-white shadow-xs'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/80'
                }`}
              >
                {hab}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── 4. TABELA DE VOLUNTÁRIOS ── */}
      {loading ? (
        <div className="p-12 text-center text-sm text-[var(--text-muted)]">
          Carregando equipe de voluntários...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredVoluntarios}
          keyExtractor={(v) => v.id}
          onRowClick={(v) => setSelectedVoluntario(v)}
          selectedRowId={selectedVoluntario?.id}
          emptyMessage="Nenhum voluntário encontrado para os filtros selecionados."
        />
      )}

      {/* ── 5. PAINEL LATERAL DE DETALHES DO VOLUNTÁRIO (DETAILPANEL) ── */}
      {selectedVoluntario && (
        <DetailPanel
          isOpen={!!selectedVoluntario}
          onClose={() => setSelectedVoluntario(null)}
          title={selectedVoluntario.nome_completo}
          subtitle={`CPF: ${selectedVoluntario.cpf} • ${
            selectedVoluntario.tipo === 'operacional' ? 'Equipe Operacional' : 'Monitor Externo'
          }`}
        >
          <div className="space-y-6">
            {/* Foto e Header do Voluntário */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-default)]">
              <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-display font-extrabold text-xl flex items-center justify-center overflow-hidden shrink-0 border border-[var(--border-default)] shadow-xs">
                {selectedVoluntario.avatar_url ? (
                  <img
                    src={selectedVoluntario.avatar_url}
                    alt={selectedVoluntario.nome_completo}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  selectedVoluntario.nome_completo.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-base text-[var(--text-primary)] truncate">
                  {selectedVoluntario.nome_completo}
                </h4>
                <p className="text-xs text-[var(--color-primary)] font-semibold">
                  {selectedVoluntario.funcao || 'Voluntário'} • {selectedVoluntario.area_atuacao || 'Geral'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={selectedVoluntario.status === 'ativo' ? 'success' : 'danger'}>
                    {selectedVoluntario.status === 'ativo' ? 'ATIVO' : 'INATIVO'}
                  </Badge>
                  <span className="text-[11px] font-mono-data font-bold text-[var(--text-muted)]">
                    {selectedVoluntario.horas_acumuladas || 0}h dedicadas
                  </span>
                </div>
              </div>
            </div>

            {/* Contato Rápido & WhatsApp */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Canais de Contato
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <Phone className="w-4 h-4 text-[var(--text-muted)]" />
                    <span className="font-mono-data text-[var(--text-primary)]">
                      {selectedVoluntario.telefone || '—'}
                    </span>
                  </div>
                  {getWhatsAppUrl(selectedVoluntario.telefone, selectedVoluntario.nome_completo) && (
                    <a
                      href={getWhatsAppUrl(selectedVoluntario.telefone, selectedVoluntario.nome_completo)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-xs font-bold flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Conversar
                    </a>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] flex items-center gap-2 text-xs">
                  <Mail className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="truncate text-[var(--text-primary)]">{selectedVoluntario.email}</span>
                </div>
              </div>
            </div>

            {/* Habilidades & Competências */}
            {selectedVoluntario.habilidades && selectedVoluntario.habilidades.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Competências &amp; Habilidades
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {selectedVoluntario.habilidades.map((h, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)] text-xs font-semibold border border-[var(--color-primary)]/20"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Endereço */}
            {(selectedVoluntario.rua || selectedVoluntario.bairro || selectedVoluntario.cidade) && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-500" />
                  Endereço Residencial
                </h5>
                <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)] space-y-1">
                  <p className="font-medium text-[var(--text-primary)]">
                    {selectedVoluntario.rua ? `${selectedVoluntario.rua}, ${selectedVoluntario.numero || 'S/N'}` : 'Endereço não informado'}
                  </p>
                  <p>
                    {selectedVoluntario.bairro && `${selectedVoluntario.bairro}, `}
                    {selectedVoluntario.cidade || ''} {selectedVoluntario.uf ? `- ${selectedVoluntario.uf}` : ''}
                  </p>
                  {selectedVoluntario.cep && <p className="font-mono-data text-[11px] text-[var(--text-muted)]">CEP: {selectedVoluntario.cep}</p>}
                </div>
              </div>
            )}
          </div>
        </DetailPanel>
      )}
    </div>
  );
}
