'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DetailPanel } from '@/components/ui/DetailPanel';
import { Select } from '@/components/ui/Select';
import { createClient } from '@/lib/supabase/client';
import {
  Plus,
  Search,
  User,
  Phone,
  MapPin,
  Calendar,
  Trash2,
  Edit,
  HeartHandshake,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Sparkles,
  Copy,
  Check,
  MessageCircle,
} from 'lucide-react';

interface Beneficiario {
  id: string;
  nome_completo: string;
  data_nascimento: string;
  genero?: string;
  cpf?: string;
  telefone?: string;
  nome_responsavel?: string;
  parentesco_responsavel?: string;
  telefone_responsavel?: string;
  comunidade?: string;
  bairro?: string;
  cidade: string;
  uf: string;
  status: 'ativo' | 'pendente' | 'suspenso';
  escolaridade?: string;
  renda_familiar?: number;
  num_dependentes?: number;
  observacoes?: string;
  created_at: string;
}

export default function BeneficiariosPage() {
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [comunidadeFilter, setComunidadeFilter] = useState('todas');
  const [faixaEtariaFilter, setFaixaEtariaFilter] = useState('todas');
  const [generoFilter, setGeneroFilter] = useState('todos');
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  
  const [selectedBeneficiario, setSelectedBeneficiario] = useState<Beneficiario | null>(null);

  const fetchBeneficiarios = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('beneficiarios')
      .select('*')
      .order('nome_completo', { ascending: true });

    if (!error && data) {
      setBeneficiarios(data as Beneficiario[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBeneficiarios();
  }, []);

  const calcularIdade = (dataNasc?: string) => {
    if (!dataNasc) return null;
    const nasc = new Date(dataNasc);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      idade--;
    }
    return idade;
  };

  const getResponsavelInfo = (item: Beneficiario) => {
    if (item.nome_responsavel && item.nome_responsavel !== 'Não informado') {
      return {
        nome: item.nome_responsavel,
        telefone: item.telefone_responsavel || item.telefone || 'Sem contato',
      };
    }
    if (item.observacoes) {
      const matchResp = item.observacoes.match(/Responsável:\s*([^|]+)/i);
      const matchTel = item.observacoes.match(/Tel:\s*([^|]+)/i);
      if (matchResp && matchResp[1].trim() !== 'Não informado') {
        return {
          nome: matchResp[1].trim(),
          telefone: matchTel ? matchTel[1].trim() : (item.telefone || 'Sem contato'),
        };
      }
    }
    return {
      nome: 'Não informado',
      telefone: item.telefone && item.telefone !== '98900000000' ? item.telefone : 'Sem contato',
    };
  };

  const getGeneroInfo = (item: Beneficiario) => {
    if (item.genero && item.genero !== 'Não informado') return item.genero;
    if (item.observacoes) {
      const match = item.observacoes.match(/Gênero:\s*([^|]+)/i);
      if (match && match[1].trim() !== 'Não informado') return match[1].trim();
    }
    return null;
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyPhone = (e: React.MouseEvent, phone: string, id: string) => {
    e.stopPropagation();
    if (!phone || phone === 'Sem contato') return;
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 2000);
  };

  const handleOpenWhatsApp = (beneficiario: Beneficiario) => {
    const resp = getResponsavelInfo(beneficiario);
    if (!resp.telefone || resp.telefone === 'Sem contato') return;

    let cleanPhone = resp.telefone.replace(/\D/g, '');
    if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
      cleanPhone = `55${cleanPhone}`;
    }

    const nomeResp = resp.nome && resp.nome !== 'Não informado' ? resp.nome : 'Responsável';
    const nomeCrianca = beneficiario.nome_completo;

    const message = `Olá *${nomeResp}*, aqui é do Ádapo, tudo bem?\n\nEntro em contato para falar sobre ${nomeCrianca}`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Comunidades únicas disponíveis com contagem
  const comunidadesStats = useMemo(() => {
    const counts: Record<string, number> = {};
    beneficiarios.forEach((b) => {
      const c = b.comunidade || b.bairro || 'Outra';
      counts[c] = (counts[c] || 0) + 1;
    });
    return counts;
  }, [beneficiarios]);

  // Lista filtrada
  const filteredBeneficiarios = useMemo(() => {
    return beneficiarios.filter((b) => {
      const q = search.toLowerCase().trim();
      const resp = getResponsavelInfo(b);
      const matchNome = b.nome_completo?.toLowerCase().includes(q);
      const matchComunidade = b.comunidade?.toLowerCase().includes(q) || b.bairro?.toLowerCase().includes(q);
      const matchResp = resp.nome.toLowerCase().includes(q);
      const matchTel = resp.telefone.includes(q);
      const matchCpf = b.cpf ? b.cpf.includes(q) : false;
      const matchQuery = !q || matchNome || matchComunidade || matchResp || matchTel || matchCpf;

      const matchStatus = statusFilter === 'todos' || b.status === statusFilter;
      
      const matchComunidadeFilter =
        comunidadeFilter === 'todas' ||
        (b.comunidade && b.comunidade.toLowerCase() === comunidadeFilter.toLowerCase()) ||
        (b.bairro && b.bairro.toLowerCase() === comunidadeFilter.toLowerCase());

      const genero = getGeneroInfo(b);
      const matchGenero =
        generoFilter === 'todos' ||
        (generoFilter === 'M' && genero === 'Masculino') ||
        (generoFilter === 'F' && genero === 'Feminino');

      const idade = calcularIdade(b.data_nascimento);
      let matchFaixa = true;
      if (faixaEtariaFilter === '0-5') matchFaixa = idade !== null && idade <= 5;
      else if (faixaEtariaFilter === '6-10') matchFaixa = idade !== null && idade >= 6 && idade <= 10;
      else if (faixaEtariaFilter === '11-15') matchFaixa = idade !== null && idade >= 11;

      return matchQuery && matchStatus && matchComunidadeFilter && matchGenero && matchFaixa;
    });
  }, [beneficiarios, search, statusFilter, comunidadeFilter, generoFilter, faixaEtariaFilter]);

  // Resetar página quando os filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, comunidadeFilter, generoFilter, faixaEtariaFilter, pageSize]);

  // Paginação
  const totalItems = filteredBeneficiarios.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedBeneficiarios = useMemo(() => {
    return filteredBeneficiarios.slice(startIndex, startIndex + pageSize);
  }, [filteredBeneficiarios, startIndex, pageSize]);

  const hasActiveFilters =
    search !== '' ||
    statusFilter !== 'todos' ||
    comunidadeFilter !== 'todas' ||
    generoFilter !== 'todos' ||
    faixaEtariaFilter !== 'todas';

  const limparFiltros = () => {
    setSearch('');
    setStatusFilter('todos');
    setComunidadeFilter('todas');
    setGeneroFilter('todos');
    setFaixaEtariaFilter('todas');
  };

  const columns: Column<Beneficiario>[] = [
    {
      key: 'nome_completo',
      header: 'Criança / Beneficiário',
      render: (item) => {
        const genero = getGeneroInfo(item);
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)]/15 text-[var(--color-primary)] font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
              {item.nome_completo.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-xs text-[var(--text-primary)] truncate">{item.nome_completo}</p>
              {genero && (
                <p className="text-[10px] text-[var(--text-muted)] font-medium">{genero}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'data_nascimento',
      header: 'Idade',
      width: '110px',
      align: 'center',
      className: 'whitespace-nowrap text-center',
      headerClassName: 'text-center',
      render: (item) => {
        const idade = calcularIdade(item.data_nascimento);
        return (
          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] whitespace-nowrap shadow-xs">
            {idade !== null ? `${idade} anos` : '—'}
          </span>
        );
      },
    },
    {
      key: 'nome_responsavel',
      header: 'Responsável & Contato',
      render: (item) => {
        const resp = getResponsavelInfo(item);
        const hasValidPhone = resp.telefone && resp.telefone !== 'Sem contato';
        return (
          <div className="text-xs min-w-0 space-y-0.5">
            <p className="font-medium text-[var(--text-primary)] truncate">
              {resp.nome}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-mono-data text-[var(--color-primary)] font-semibold">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 shrink-0 opacity-75" />
                {resp.telefone}
              </span>
              {hasValidPhone && (
                <button
                  type="button"
                  onClick={(e) => handleCopyPhone(e, resp.telefone, item.id)}
                  className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors inline-flex items-center justify-center cursor-pointer"
                  title={copiedId === item.id ? 'Número copiado!' : 'Copiar número'}
                  aria-label="Copiar número de telefone"
                >
                  {copiedId === item.id ? (
                    <Check className="w-3 h-3 text-[var(--color-success)]" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'comunidade',
      header: 'Região / Território',
      width: '170px',
      className: 'whitespace-nowrap',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] whitespace-nowrap">
          <MapPin className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0 opacity-75" />
          <span className="font-medium truncate">{item.comunidade || item.bairro || 'São Luís/MA'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      align: 'center',
      headerClassName: 'text-center',
      render: (item) => {
        const variants = {
          ativo: 'success',
          pendente: 'warning',
          suspenso: 'danger',
        } as const;
        return <Badge variant={variants[item.status] || 'neutral'}>{item.status.toUpperCase()}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Ações',
      width: '90px',
      align: 'right',
      headerClassName: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Link href={`/dashboard/beneficiarios/${item.id}`}>
            <Button size="sm" variant="ghost" icon={<Edit className="w-3.5 h-3.5" />}>
              Editar
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover esta criança?')) {
      const supabase = createClient();
      await supabase.from('beneficiarios').delete().eq('id', id);
      setSelectedBeneficiario(null);
      fetchBeneficiarios();
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Gestão de Beneficiários"
        subtitle={`Banco de dados de crianças e adolescentes do Instituto Ádapo (${beneficiarios.length} cadastrados)`}
        action={
          <Link href="/dashboard/beneficiarios/novo">
            <Button icon={<Plus className="w-4 h-4" />}>Cadastrar Criança</Button>
          </Link>
        }
      />

      <div className="p-4 sm:p-8 space-y-4 sm:space-y-5 flex-1 overflow-y-auto">
        {/* ── PAINEL DE BUSCA & FILTROS AVANÇADOS ── */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-[var(--shadow-card)] space-y-3.5">
          {/* Linha 1: Input de Busca e Dropdowns Rápidos */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="relative sm:col-span-6 lg:col-span-5">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Buscar por criança, responsável, telefone ou comunidade..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition-all"
              />
            </div>

            <div className="sm:col-span-3 lg:col-span-3">
              <Select
                options={[
                  { value: 'todas', label: 'Todas as Faixas Etárias' },
                  { value: '0-5', label: '0 a 5 anos (1ª Infância)' },
                  { value: '6-10', label: '6 a 10 anos (Crianças)' },
                  { value: '11-15', label: '11 a 15 anos (Adolescentes)' },
                ]}
                value={faixaEtariaFilter}
                onChange={(e) => setFaixaEtariaFilter(e.target.value)}
              />
            </div>

            <div className="sm:col-span-3 lg:col-span-2">
              <Select
                options={[
                  { value: 'todos', label: 'Todos os Gêneros' },
                  { value: 'M', label: 'Meninos (M)' },
                  { value: 'F', label: 'Meninas (F)' },
                ]}
                value={generoFilter}
                onChange={(e) => setGeneroFilter(e.target.value)}
              />
            </div>

            <div className="sm:col-span-12 lg:col-span-2 flex items-center gap-2">
              <div className="flex-1">
                <Select
                  options={[
                    { value: 'todos', label: 'Todos os Status' },
                    { value: 'ativo', label: 'Ativo' },
                    { value: 'pendente', label: 'Pendente' },
                    { value: 'suspenso', label: 'Suspenso' },
                  ]}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                />
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="p-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--color-danger)] hover:border-[var(--color-danger)]/40 transition-colors shrink-0"
                  title="Limpar todos os filtros"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Linha 2: Pílulas Rápidas por Território / Comunidade */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[var(--border-default)]">
            <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mr-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[var(--color-primary)]" />
              Território:
            </span>

            <button
              type="button"
              onClick={() => setComunidadeFilter('todas')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                comunidadeFilter === 'todas'
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs'
                  : 'bg-[var(--bg-secondary)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Todos ({beneficiarios.length})
            </button>

            {Object.entries(comunidadesStats).map(([com, count]) => {
              const isSelected = comunidadeFilter.toLowerCase() === com.toLowerCase();
              return (
                <button
                  key={com}
                  type="button"
                  onClick={() => setComunidadeFilter(com)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs'
                      : 'bg-[var(--bg-secondary)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {com}
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[var(--border-default)] text-[var(--text-muted)]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── TABELA DE DADOS ── */}
        {loading ? (
          <div className="p-12 text-center text-xs text-[var(--text-muted)]">Carregando banco de dados...</div>
        ) : (
          <div className="space-y-3">
            <DataTable
              columns={columns}
              data={paginatedBeneficiarios}
              keyExtractor={(b) => b.id}
              onRowClick={(b) => setSelectedBeneficiario(b)}
              selectedRowId={selectedBeneficiario?.id}
              emptyMessage={
                hasActiveFilters
                  ? 'Nenhuma criança encontrada com os filtros selecionados. Tente limpar os filtros.'
                  : 'Nenhuma criança cadastrada.'
              }
            />

            {/* ── BARRA DE PAGINAÇÃO ── */}
            {totalItems > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 py-2 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-[var(--shadow-card)] text-xs">
                <div className="flex items-center gap-2 text-[var(--text-muted)]">
                  <span>
                    Exibindo <strong>{startIndex + 1}</strong> a <strong>{Math.min(startIndex + pageSize, totalItems)}</strong> de <strong>{totalItems}</strong> crianças
                  </span>
                  {hasActiveFilters && (
                    <Badge variant="primary" className="text-[10px]">Filtrado</Badge>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Seletor de itens por página */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[var(--text-muted)]">Itens por página:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="px-2 py-1 rounded-lg text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium focus:outline-none focus:border-[var(--color-primary)]"
                    >
                      <option value={15}>15</option>
                      <option value={30}>30</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  {/* Controles de página */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(1)}
                      className="p-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Primeira página"
                    >
                      <ChevronsLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Página anterior"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    <span className="px-3 py-1 font-semibold text-[var(--text-primary)]">
                      {currentPage} / {totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="p-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Próxima página"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                      className="p-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Última página"
                    >
                      <ChevronsRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Painel Contextual de Detalhes à Direita */}
      <DetailPanel
        isOpen={!!selectedBeneficiario}
        onClose={() => setSelectedBeneficiario(null)}
        title={selectedBeneficiario?.nome_completo || ''}
        subtitle={
          selectedBeneficiario?.data_nascimento
            ? `Nasc: ${new Date(selectedBeneficiario.data_nascimento).toLocaleDateString('pt-BR')} (${calcularIdade(selectedBeneficiario.data_nascimento)} anos)`
            : 'Beneficiário Ádapo'
        }
      >
        {selectedBeneficiario && (
          <div className="space-y-5 text-xs">
            <div className="flex items-center justify-between">
              <Badge variant={selectedBeneficiario.status === 'ativo' ? 'success' : 'warning'}>
                {selectedBeneficiario.status.toUpperCase()}
              </Badge>
              <div className="flex items-center gap-2">
                <Link href={`/dashboard/beneficiarios/${selectedBeneficiario.id}`}>
                  <Button size="sm" variant="secondary" icon={<Edit className="w-3.5 h-3.5" />}>
                    Editar
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="danger"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() => handleDelete(selectedBeneficiario.id)}
                >
                  Excluir
                </Button>
              </div>
            </div>

            {/* Informações da Criança */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                Dados da Criança
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)]">
                  <span className="text-[10px] text-[var(--text-muted)] block">Gênero</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {getGeneroInfo(selectedBeneficiario) || 'Não informado'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)]">
                  <span className="text-[10px] text-[var(--text-muted)] block">Escolaridade</span>
                  <span className="font-semibold text-[var(--text-primary)] truncate block">
                    {selectedBeneficiario.escolaridade || 'Não informada'}
                  </span>
                </div>
              </div>
            </div>

            {/* Informações do Responsável & Ação de Contato */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                Responsável Legal &amp; Contato
              </h4>
              <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] space-y-3 border border-[var(--border-default)]">
                {(() => {
                  const resp = getResponsavelInfo(selectedBeneficiario);
                  const hasValidPhone = resp.telefone && resp.telefone !== 'Sem contato';

                  return (
                    <>
                      <div className="space-y-1">
                        <p className="font-semibold text-xs text-[var(--text-primary)]">
                          {resp.nome}
                          {selectedBeneficiario.parentesco_responsavel ? ` (${selectedBeneficiario.parentesco_responsavel})` : ''}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono-data text-[var(--color-primary)] font-semibold">
                          <Phone className="w-3 h-3 text-[var(--color-primary)] shrink-0" />
                          <span>{resp.telefone}</span>
                          {hasValidPhone && (
                            <button
                              type="button"
                              onClick={(e) => handleCopyPhone(e, resp.telefone, `panel-${selectedBeneficiario.id}`)}
                              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors inline-flex items-center justify-center cursor-pointer"
                              title={copiedId === `panel-${selectedBeneficiario.id}` ? 'Número copiado!' : 'Copiar número'}
                              aria-label="Copiar número de telefone"
                            >
                              {copiedId === `panel-${selectedBeneficiario.id}` ? (
                                <Check className="w-3 h-3 text-[var(--color-success)]" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Botão Entrar em Contato via WhatsApp */}
                      <div className="pt-2.5 border-t border-[var(--border-default)]/60 space-y-1.5">
                        <Button
                          type="button"
                          variant="primary"
                          className="w-full justify-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white border-none shadow-sm font-semibold cursor-pointer"
                          icon={<MessageCircle className="w-4 h-4" />}
                          disabled={!hasValidPhone}
                          onClick={() => handleOpenWhatsApp(selectedBeneficiario)}
                        >
                          Entrar em contato
                        </Button>
                        <p className="text-[10.5px] text-[var(--text-muted)] text-center leading-tight">
                          Esse contato deve ser feito prioritariamente através do Whatsapp oficial do Instituto
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                Território & Endereço
              </h4>
              <div className="p-3 rounded-lg bg-[var(--bg-secondary)] space-y-1">
                <p className="font-semibold text-[var(--text-primary)]">
                  {selectedBeneficiario.comunidade || selectedBeneficiario.bairro || 'Sem comunidade informada'}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {selectedBeneficiario.cidade} / {selectedBeneficiario.uf}
                </p>
              </div>
            </div>

            {selectedBeneficiario.observacoes && (
              <div className="space-y-1 p-2.5 rounded-lg bg-[var(--bg-secondary)]/50 border border-[var(--border-default)]">
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Observações</span>
                <p className="text-[11px] text-[var(--text-secondary)]">{selectedBeneficiario.observacoes}</p>
              </div>
            )}
          </div>
        )}
      </DetailPanel>
    </div>
  );
}
