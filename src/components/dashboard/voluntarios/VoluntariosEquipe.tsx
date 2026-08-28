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

  // Estatísticas e KPIs para o topo
  const stats = useMemo(() => {
    const total = voluntarios.length;
    const ativos = voluntarios.filter((v) => v.status === 'ativo').length;
    const inativos = total - ativos;
    const operacionais = voluntarios.filter((v) => v.tipo === 'operacional').length;
    const externos = voluntarios.filter((v) => v.tipo === 'externo').length;

    return { total, ativos, inativos, operacionais, externos };
  }, [voluntarios]);

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
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold flex items-center justify-center text-xs overflow-hidden shrink-0 border border-[var(--border-default)] shadow-xs">
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
      width: '120px',
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
    <div className="space-y-6">
      {/* ── 1. CARDS DE KPIS EXECUTIVOS (SOFT BENTO) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-5 flex items-center gap-3.5 border border-[var(--border-default)] shadow-[var(--shadow-card)]">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0 shadow-xs">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
              Total Voluntários
            </p>
            <p className="text-xl sm:text-2xl font-display font-extrabold text-[var(--text-primary)]">
              {stats.total}
            </p>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 flex items-center gap-3.5 border border-[var(--border-default)] shadow-[var(--shadow-card)]">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
            <UserCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
              Ativos / Campo
            </p>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xl sm:text-2xl font-display font-extrabold text-[var(--text-primary)]">
                {stats.ativos}
              </span>
              <span className="text-xs text-[var(--text-muted)]">({stats.inativos} inativos)</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 flex items-center gap-3.5 border border-[var(--border-default)] shadow-[var(--shadow-card)]">
          <div className="w-12 h-12 rounded-2xl bg-[#93368F]/10 text-[#93368F] flex items-center justify-center shrink-0 shadow-xs">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
              Operacionais
            </p>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xl sm:text-2xl font-display font-extrabold text-[var(--text-primary)]">
                {stats.operacionais}
              </span>
              <span className="text-xs text-[var(--text-muted)]">({stats.externos} apoio)</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 flex items-center gap-3.5 border border-[var(--border-default)] shadow-[var(--shadow-card)]">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
              Habilidades
            </p>
            <p className="text-xl sm:text-2xl font-display font-extrabold text-[var(--text-primary)]">
              {todasHabilidades.length > 0 ? `${todasHabilidades.length} Tags` : '100% Equipe'}
            </p>
          </div>
        </Card>
      </div>

      {/* ── 2. PAINEL DE BUSCA & FILTROS (ALINHAMENTO EM LINHA FLUIDA) ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-[var(--shadow-card)] space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Input de Busca com flex-1 */}
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

          {/* Filtros Dropdowns em Linha */}
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
            <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mr-1">
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

      {/* ── 3. TABELA DE VOLUNTÁRIOS ── */}
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

      {/* ── 4. PAINEL LATERAL DE DETALHES DO VOLUNTÁRIO (DETAILPANEL) ── */}
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
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={selectedVoluntario.status === 'ativo' ? 'success' : 'danger'}>
                    {selectedVoluntario.status.toUpperCase()}
                  </Badge>
                  <Badge variant="neutral">
                    {selectedVoluntario.tipo === 'operacional' ? 'Operacional' : 'Externo'}
                  </Badge>
                </div>
                <p className="font-display font-bold text-sm text-[var(--text-primary)] truncate mt-1">
                  {selectedVoluntario.funcao || 'Voluntário'}
                </p>
                <p className="text-xs text-[var(--color-primary)] font-medium truncate">
                  Área: {selectedVoluntario.area_atuacao || 'Geral'}
                </p>
              </div>
            </div>

            {/* Ações Rápidas de Documentos Oficiais */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Documentos & Atestados Oficiais
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-center text-xs"
                  icon={<FileText className="w-3.5 h-3.5 text-[var(--color-primary)]" />}
                  onClick={() => {
                    if (onSelectParaDocumento) {
                      onSelectParaDocumento(selectedVoluntario, 'termo');
                    }
                  }}
                >
                  Termo de Adesão
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-center text-xs"
                  icon={<Award className="w-3.5 h-3.5 text-amber-500" />}
                  onClick={() => {
                    if (onSelectParaDocumento) {
                      onSelectParaDocumento(selectedVoluntario, 'certificado');
                    }
                  }}
                >
                  Certificado Horas
                </Button>
              </div>
            </div>

            {/* Informações de Contato */}
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Canais de Contato
              </p>
              <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    Telefone:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-data font-semibold text-[var(--text-primary)]">
                      {selectedVoluntario.telefone}
                    </span>
                    {getWhatsAppUrl(selectedVoluntario.telefone, selectedVoluntario.nome_completo) && (
                      <a
                        href={getWhatsAppUrl(selectedVoluntario.telefone, selectedVoluntario.nome_completo)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 font-bold text-[10px] flex items-center gap-1"
                      >
                        <MessageCircle className="w-3 h-3" />
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[var(--border-default)]/60 pt-2">
                  <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    E-mail:
                  </span>
                  <span className="font-mono-data text-[var(--text-primary)] truncate max-w-[200px]">
                    {selectedVoluntario.email}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-[var(--border-default)]/60 pt-2">
                  <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Início:
                  </span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {new Date(selectedVoluntario.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Endereço Residencial */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                Endereço
              </p>
              <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs space-y-1">
                <p className="font-medium text-[var(--text-primary)]">
                  {selectedVoluntario.rua ? `${selectedVoluntario.rua}, nº ${selectedVoluntario.numero || 'S/N'}` : 'Endereço não cadastrado'}
                </p>
                <p className="text-[var(--text-muted)]">
                  {selectedVoluntario.bairro} — {selectedVoluntario.cidade || 'São Luís'}/{selectedVoluntario.uf || 'MA'}
                </p>
                {selectedVoluntario.cep && (
                  <p className="font-mono-data text-[11px] text-[var(--text-muted)]">
                    CEP: {selectedVoluntario.cep}
                  </p>
                )}
              </div>
            </div>

            {/* Botões de Ação do Voluntário */}
            <div className="pt-4 border-t border-[var(--border-default)] flex items-center justify-between gap-3">
              <Link href={`/dashboard/voluntarios/${selectedVoluntario.id}`} className="flex-1">
                <Button variant="secondary" className="w-full justify-center" icon={<Edit className="w-4 h-4" />}>
                  Editar Cadastro
                </Button>
              </Link>
            </div>
          </div>
        </DetailPanel>
      )}
    </div>
  );
}
