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
import { useUserRole } from '@/lib/hooks/useUserRole';
import { AcessoRestritoBrincante } from '@/components/auth/AcessoRestritoBrincante';
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
  Users,
  Baby,
  Smile,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ExternalLink,
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

function inferirGeneroResponsavel(nome: string, parentesco?: string | null): 'F' | 'M' {
  if (parentesco) {
    const p = parentesco.toLowerCase();
    if (
      p.includes('mãe') ||
      p.includes('mae') ||
      p.includes('avó') ||
      p.includes('avoa') ||
      p.includes('tia') ||
      p.includes('madrasta') ||
      p.includes('irmã') ||
      p.includes('irma')
    ) {
      return 'F';
    }
    if (
      p.includes('pai') ||
      p.includes('avô') ||
      p.includes('avoo') ||
      p.includes('tio') ||
      p.includes('padrasto') ||
      p.includes('irmão') ||
      p.includes('irmao')
    ) {
      return 'M';
    }
  }

  const primeiroNome = nome.trim().split(' ')[0].toLowerCase();

  const nomesMasculinos = new Set([
    'oseias',
    'elias',
    'lucas',
    'matias',
    'jonas',
    'dimas',
    'isaac',
    'isac',
    'jean',
    'davi',
    'daví',
    'levi',
    'samuel',
    'gabriel',
    'daniel',
    'rafael',
    'miguel',
    'carlos',
    'marcos',
    'joao',
    'joão',
    'jose',
    'josé',
    'antonio',
    'antônio',
    'francisco',
    'pedro',
    'paulo',
    'luis',
    'luiz',
    'jorge',
    'andre',
    'andré',
    'felipe',
    'gustavo',
    'rodrigo',
    'marcelo',
    'bruno',
    'eduardo',
  ]);
  if (nomesMasculinos.has(primeiroNome)) return 'M';

  const nomesFemininos = new Set([
    'alice',
    'elis',
    'helen',
    'inês',
    'ines',
    'iris',
    'laís',
    'lais',
    'lilian',
    'miriam',
    'myriam',
    'rachel',
    'raquel',
    'ruth',
    'carmen',
    'kelliane',
    'kellliane',
    'adylla',
    'dinalild',
    'deyse',
    'isarlene',
    'inalva',
  ]);
  if (nomesFemininos.has(primeiroNome)) return 'F';

  if (primeiroNome.endsWith('a') || primeiroNome.endsWith('e') || primeiroNome.endsWith('y')) {
    return 'F';
  }
  return 'M';
}

export default function BeneficiariosPage() {
  const { isBrincante } = useUserRole();
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal In-App de Exclusão
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [beneficiarioToDelete, setBeneficiarioToDelete] = useState<Beneficiario | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchBeneficiarios = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('beneficiarios')
      .select(
        'id, nome_completo, data_nascimento, genero, cpf, rg, cep, rua, numero, bairro, comunidade, cidade, uf, telefone, email, escolaridade, status, nome_responsavel, parentesco_responsavel, telefone_responsavel, renda_familiar, num_dependentes, observacoes, created_at'
      )
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
          telefone: matchTel ? matchTel[1].trim() : item.telefone || 'Sem contato',
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

    const message = `Olá *${nomeResp}*, aqui é da equipe do Instituto Ádapo, tudo bem?\n\nEntramos em contato para falar sobre ${nomeCrianca}.`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Métricas Sociais Solicitadas pelo Usuário
  const stats = useMemo(() => {
    let meninos = 0;
    let meninas = 0;
    const responsaveisMap = new Map<string, { nome: string; parentesco?: string }>();
    const comunidadesSet = new Set<string>();

    beneficiarios.forEach((b) => {
      // 1. Crianças por gênero
      const gen = getGeneroInfo(b);
      if (gen === 'Feminino' || gen === 'F') {
        meninas++;
      } else {
        meninos++;
      }

      // 2. Territórios
      if (b.comunidade) comunidadesSet.add(b.comunidade.trim());
      else if (b.bairro) comunidadesSet.add(b.bairro.trim());

      // 3. Responsáveis únicos
      const resp = getResponsavelInfo(b);
      if (resp.nome && resp.nome !== 'Não informado') {
        const key = resp.nome.trim().toLowerCase();
        if (!responsaveisMap.has(key)) {
          responsaveisMap.set(key, { nome: resp.nome, parentesco: b.parentesco_responsavel || undefined });
        }
      }
    });

    let responsaveisMulheres = 0;
    let responsaveisHomens = 0;

    responsaveisMap.forEach(({ nome, parentesco }) => {
      const g = inferirGeneroResponsavel(nome, parentesco);
      if (g === 'F') {
        responsaveisMulheres++;
      } else {
        responsaveisHomens++;
      }
    });

    const totalCriancas = beneficiarios.length;
    const totalResponsaveis = responsaveisMap.size;
    const totalBeneficiarios = totalCriancas + totalResponsaveis;

    return {
      totalBeneficiarios,
      totalCriancas,
      meninos,
      meninas,
      totalResponsaveis,
      responsaveisMulheres,
      responsaveisHomens,
      totalTerritorios: comunidadesSet.size || 1,
    };
  }, [beneficiarios]);

  // Comunidades únicas disponíveis com contagem
  const comunidadesStats = useMemo(() => {
    const counts: Record<string, number> = {};
    beneficiarios.forEach((b) => {
      const c = b.comunidade || b.bairro || 'São Luís/MA';
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
        (generoFilter === 'M' && (genero === 'Masculino' || genero === 'M')) ||
        (generoFilter === 'F' && (genero === 'Feminino' || genero === 'F'));

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

  const handleOpenDeleteModal = (beneficiario: Beneficiario) => {
    setBeneficiarioToDelete(beneficiario);
  };

  const handleConfirmDelete = async () => {
    if (!beneficiarioToDelete) return;
    setDeletingId(beneficiarioToDelete.id);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('beneficiarios').delete().eq('id', beneficiarioToDelete.id);
      if (error) {
        showToast(`Erro ao remover: ${error.message}`, 'error');
      } else {
        showToast('Beneficiário removido com sucesso.', 'success');
        if (selectedBeneficiario?.id === beneficiarioToDelete.id) {
          setSelectedBeneficiario(null);
        }
        setBeneficiarioToDelete(null);
        fetchBeneficiarios();
      }
    } catch {
      showToast('Falha ao conectar com o banco de dados.', 'error');
    } finally {
      setDeletingId(null);
    }
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
                <p className="text-[10px] text-[var(--text-muted)] font-medium">
                  {genero === 'Masculino' || genero === 'M' ? '👦 Menino' : '👧 Menina'}
                </p>
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
            <p className="font-medium text-[var(--text-primary)] truncate">{resp.nome}</p>
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
      width: '110px',
      align: 'right',
      headerClassName: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => handleOpenWhatsApp(item)}
            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-500/10 transition-colors"
            title="WhatsApp com o responsável"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
          <Link href={`/dashboard/beneficiarios/${item.id}`}>
            <Button size="sm" variant="ghost" icon={<Edit className="w-3.5 h-3.5" />}>
              Editar
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  if (isBrincante) {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title="Beneficiários & Famílias"
          subtitle="Cadastro, prontuários e histórico dos atendidos no Instituto Ádapo"
        />
        <div className="p-4 sm:p-6 lg:p-8 flex-1 flex items-center justify-center">
          <AcessoRestritoBrincante modulo="Beneficiários" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Gestão de Beneficiários"
        subtitle={`Banco de dados sociofamiliar do Instituto Ádapo (${stats.totalBeneficiarios} pessoas impactadas)`}
        action={
          <Link href="/dashboard/beneficiarios/novo">
            <Button icon={<Plus className="w-4 h-4" />} className="min-h-[44px]">
              Cadastrar Criança
            </Button>
          </Link>
        }
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full flex-1 overflow-y-auto">
        {/* Notificação Toast */}
        {toast && (
          <div
            className={`p-4 rounded-xl text-xs sm:text-sm font-medium border shadow-xs flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200 ${
              toast.type === 'success'
                ? 'bg-[var(--color-success-soft)] text-[var(--color-success)] border-[var(--color-success)]/20'
                : 'bg-[var(--color-danger-soft)] text-[var(--color-danger)] border-[var(--color-danger)]/20'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {/* ── 1. CARDS BENTO DE INDICADORES (SOLICITADOS PELO USUÁRIO) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: TOTAL DE BENEFICIÁRIOS (EM DESTAQUE) */}
          <div className="p-5 rounded-2xl border-2 border-[var(--color-primary)] bg-gradient-to-br from-[var(--color-primary-soft)]/40 to-[var(--bg-elevated)] shadow-[var(--shadow-card)] relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
                Impacto Social Total
              </span>
              <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center shadow-sm">
                <HeartHandshake className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)]">
                  {loading ? '—' : stats.totalBeneficiarios}
                </span>
                <span className="text-xs font-semibold text-[var(--color-primary)] uppercase tracking-wide">
                  Beneficiários
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                {stats.totalCriancas} crianças + {stats.totalResponsaveis} responsáveis familiares
              </p>
            </div>
          </div>

          {/* Card 2: NÚMERO DE CRIANÇAS (MENINOS E MENINAS) */}
          <div className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Crianças & Jovens</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Baby className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                  {loading ? '—' : stats.totalCriancas}
                </span>
                <span className="text-xs text-[var(--text-muted)] font-medium">atendidas</span>
              </div>
              <div className="flex items-center gap-3 pt-1 text-xs">
                <span className="inline-flex items-center gap-1 text-[var(--text-primary)] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  {stats.meninos} Meninos
                </span>
                <span className="inline-flex items-center gap-1 text-[var(--text-primary)] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-pink-500" />
                  {stats.meninas} Meninas
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: NÚMERO DE RESPONSÁVEIS (MULHERES E HOMENS) */}
          <div className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Responsáveis Familiares</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                  {loading ? '—' : stats.totalResponsaveis}
                </span>
                <span className="text-xs text-[var(--text-muted)] font-medium">famílias</span>
              </div>
              <div className="flex items-center gap-3 pt-1 text-xs">
                <span className="inline-flex items-center gap-1 text-[var(--text-primary)] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {stats.responsaveisMulheres} Mulheres
                </span>
                <span className="inline-flex items-center gap-1 text-[var(--text-primary)] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-teal-600" />
                  {stats.responsaveisHomens} Homens
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: POLOS & TERRITÓRIOS */}
          <div className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Territórios & Comunidades</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                  {loading ? '—' : stats.totalTerritorios}
                </span>
                <span className="text-xs text-[var(--text-muted)] font-medium">polos ativos</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] truncate">
                Novo Angelim, Vila Sapo, Angelim Velho...
              </p>
            </div>
          </div>
        </div>

        {/* ── 2. PAINEL DE BUSCA & FILTROS AVANÇADOS ── */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-[var(--shadow-card)] space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Campo de Busca Seguro sem Auto-Zoom no iOS */}
            <div className="relative sm:col-span-6 lg:col-span-5">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Buscar por criança, responsável, telefone ou comunidade..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] rounded-xl text-base sm:text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition-all"
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
                className="text-base sm:text-sm min-h-[44px]"
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
                className="text-base sm:text-sm min-h-[44px]"
              />
            </div>

            <div className="sm:col-span-12 lg:col-span-2 flex items-center gap-2">
              <div className="flex-1">
                <Select
                  options={[
                    { value: 'todos', label: 'Status' },
                    { value: 'ativo', label: 'Ativo' },
                    { value: 'pendente', label: 'Pendente' },
                    { value: 'suspenso', label: 'Suspenso' },
                  ]}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-base sm:text-sm min-h-[44px]"
                />
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="p-2.5 min-h-[44px] min-w-[44px] rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--color-danger)] hover:border-[var(--color-danger)]/40 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                  title="Limpar todos os filtros"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Linha 2: Pílulas Rápidas por Território em Carrossel Horizontal Tátil */}
          <div className="pt-2 border-t border-[var(--border-default)]">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
              <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
                <MapPin className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                Território:
              </span>

              <button
                type="button"
                onClick={() => setComunidadeFilter('todas')}
                className={`px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer ${
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
                    className={`px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs'
                        : 'bg-[var(--bg-secondary)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <span>{com}</span>
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
        </div>

        {/* ── 3. VISUALIZAÇÃO HÍBRIDA (DESKTOP: TABELA | MOBILE: CARDS TÁTEIS) ── */}
        {loading ? (
          /* Shimmer Skeleton Bento */
          <div className="space-y-3">
            <div className="h-64 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] animate-pulse" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Visualização Desktop (>= md) */}
            <div className="hidden md:block">
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
            </div>

            {/* Visualização Mobile (< md): Cards Móveis Táteis sem Rolagem Horizontal */}
            <div className="block md:hidden space-y-3">
              {paginatedBeneficiarios.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs text-[var(--text-muted)] space-y-2">
                  <p className="font-semibold text-sm text-[var(--text-primary)]">Nenhuma criança encontrada</p>
                  <p>Tente ajustar os filtros ou o termo de busca.</p>
                </div>
              ) : (
                paginatedBeneficiarios.map((b) => {
                  const resp = getResponsavelInfo(b);
                  const idade = calcularIdade(b.data_nascimento);
                  const genero = getGeneroInfo(b);
                  const hasValidPhone = resp.telefone && resp.telefone !== 'Sem contato';

                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBeneficiario(b)}
                      className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-3 active:scale-[0.99] transition-transform cursor-pointer"
                    >
                      {/* Topo do Card */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/15 text-[var(--color-primary)] font-bold flex items-center justify-center text-sm shrink-0">
                            {b.nome_completo.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-display font-bold text-sm text-[var(--text-primary)] truncate">
                              {b.nome_completo}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                              <span>{idade !== null ? `${idade} anos` : 'Sem idade'}</span>
                              <span>•</span>
                              <span>{genero === 'Masculino' || genero === 'M' ? 'Menino' : 'Menina'}</span>
                            </div>
                          </div>
                        </div>

                        <Badge variant={b.status === 'ativo' ? 'success' : b.status === 'pendente' ? 'warning' : 'danger'}>
                          {b.status.toUpperCase()}
                        </Badge>
                      </div>

                      {/* Informações de Família & Território */}
                      <div className="p-3 rounded-xl bg-[var(--bg-secondary)] space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-[var(--text-secondary)]">
                          <span className="text-[11px] text-[var(--text-muted)]">Responsável:</span>
                          <span className="font-semibold text-[var(--text-primary)] truncate max-w-[180px]">
                            {resp.nome}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[var(--text-secondary)]">
                          <span className="text-[11px] text-[var(--text-muted)]">Território:</span>
                          <span className="font-medium flex items-center gap-1 text-[var(--text-primary)] truncate">
                            <MapPin className="w-3 h-3 text-[var(--color-primary)] shrink-0" />
                            {b.comunidade || b.bairro || 'São Luís/MA'}
                          </span>
                        </div>
                      </div>

                      {/* Ações Móveis Rápidas */}
                      <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                        {hasValidPhone && (
                          <Button
                            type="button"
                            variant="primary"
                            className="flex-1 min-h-[44px] justify-center bg-[#25D366] hover:bg-[#1EBE5D] text-white border-none text-xs font-semibold shadow-xs"
                            icon={<MessageCircle className="w-4 h-4" />}
                            onClick={() => handleOpenWhatsApp(b)}
                          >
                            WhatsApp
                          </Button>
                        )}
                        <Link href={`/dashboard/beneficiarios/${b.id}`} className="flex-1">
                          <Button variant="secondary" className="w-full min-h-[44px] justify-center text-xs font-semibold" icon={<Edit className="w-4 h-4" />}>
                            Editar
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ── BARRA DE PAGINAÇÃO RESPONSIVA ── */}
            {totalItems > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-[var(--shadow-card)] text-xs">
                <div className="flex items-center gap-2 text-[var(--text-muted)]">
                  <span>
                    Exibindo <strong>{startIndex + 1}</strong> a <strong>{Math.min(startIndex + pageSize, totalItems)}</strong> de <strong>{totalItems}</strong> crianças
                  </span>
                  {hasActiveFilters && (
                    <Badge variant="primary" className="text-[10px]">Filtrado</Badge>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[var(--text-muted)]">Por página:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="px-2.5 py-1.5 rounded-lg text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium focus:outline-none focus:border-[var(--color-primary)]"
                    >
                      <option value={15}>15</option>
                      <option value={30}>30</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(1)}
                      className="p-2 min-h-[36px] min-w-[36px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer"
                      title="Primeira página"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="p-2 min-h-[36px] min-w-[36px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer"
                      title="Página anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <span className="px-3 py-1 font-semibold text-[var(--text-primary)]">
                      {currentPage} / {totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="p-2 min-h-[36px] min-w-[36px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer"
                      title="Próxima página"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                      className="p-2 min-h-[36px] min-w-[36px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer"
                      title="Última página"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 4. PAINEL CONTEXTUAL LATERAL (DETAIL PANEL) ── */}
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
                  <Button size="sm" variant="secondary" icon={<Edit className="w-3.5 h-3.5" />} className="min-h-[40px]">
                    Editar
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="danger"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() => handleOpenDeleteModal(selectedBeneficiario)}
                  className="min-h-[40px]"
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
                <div className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                  <span className="text-[10px] text-[var(--text-muted)] block">Gênero</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {getGeneroInfo(selectedBeneficiario) || 'Não informado'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg-secondary)]">
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
                              className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors inline-flex items-center justify-center cursor-pointer"
                              title={copiedId === `panel-${selectedBeneficiario.id}` ? 'Número copiado!' : 'Copiar número'}
                              aria-label="Copiar número de telefone"
                            >
                              {copiedId === `panel-${selectedBeneficiario.id}` ? (
                                <Check className="w-3.5 h-3.5 text-[var(--color-success)]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
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
                          className="w-full justify-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white border-none shadow-sm font-semibold cursor-pointer min-h-[44px]"
                          icon={<MessageCircle className="w-4 h-4" />}
                          disabled={!hasValidPhone}
                          onClick={() => handleOpenWhatsApp(selectedBeneficiario)}
                        >
                          Conversar no WhatsApp
                        </Button>
                        <p className="text-[10px] text-[var(--text-muted)] text-center leading-tight">
                          Canal institucional de acolhimento e comunicação com as famílias
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
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)] space-y-1">
                <p className="font-semibold text-[var(--text-primary)]">
                  {selectedBeneficiario.comunidade || selectedBeneficiario.bairro || 'Sem comunidade informada'}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {selectedBeneficiario.cidade} / {selectedBeneficiario.uf}
                </p>
              </div>
            </div>

            {selectedBeneficiario.observacoes && (
              <div className="space-y-1 p-3 rounded-xl bg-[var(--bg-secondary)]/60 border border-[var(--border-default)]">
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Observações</span>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{selectedBeneficiario.observacoes}</p>
              </div>
            )}
          </div>
        )}
      </DetailPanel>

      {/* ── 5. MODAL IN-APP DE EXCLUSÃO SEGURA ── */}
      {beneficiarioToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-danger-soft)] text-[var(--color-danger)] flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                Remover Beneficiário?
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Tem certeza de que deseja remover o cadastro de <strong>{beneficiarioToDelete.nome_completo}</strong>? Esta ação excluirá os vínculos sociofamiliares no sistema.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1 min-h-[44px]"
                onClick={() => setBeneficiarioToDelete(null)}
                disabled={!!deletingId}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                className="flex-1 min-h-[44px]"
                onClick={handleConfirmDelete}
                disabled={!!deletingId}
              >
                {deletingId ? 'Removendo...' : 'Sim, Remover'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
