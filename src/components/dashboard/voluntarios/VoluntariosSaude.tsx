'use client';

import React, { useState, useMemo } from 'react';
import { Voluntario } from './VoluntariosEquipe';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PapelTimbradoModal } from '@/components/ui/PapelTimbradoModal';
import {
  Heart,
  Activity,
  AlertTriangle,
  PhoneCall,
  MessageCircle,
  Search,
  Printer,
  ShieldAlert,
  Droplet,
  Pill,
  CreditCard,
  User,
  Info,
  CheckCircle,
  X,
  Filter,
} from 'lucide-react';

interface VoluntariosSaudeProps {
  voluntarios: Voluntario[];
  loading: boolean;
}

type FiltroRapido = 'todos' | 'com_alergias' | 'sem_contato' | 'sem_tipo_sanguineo';

export function VoluntariosSaude({ voluntarios, loading }: VoluntariosSaudeProps) {
  const [search, setSearch] = useState('');
  const [filtroRapido, setFiltroRapido] = useState<FiltroRapido>('todos');
  const [selectedVoluntarioParaCracha, setSelectedVoluntarioParaCracha] = useState<Voluntario | null>(null);
  const [showCrachaModal, setShowCrachaModal] = useState(false);

  // Estatísticas de Prontuário Operacional
  const stats = useMemo(() => {
    const total = voluntarios.length;
    const comTipoSanguineo = voluntarios.filter(
      (v) => v.tipo_sanguineo && v.tipo_sanguineo !== 'Não informado' && v.tipo_sanguineo !== 'N/I'
    ).length;
    const comAlergias = voluntarios.filter(
      (v) => v.alergias && v.alergias.trim() !== '' && v.alergias !== 'Nenhuma' && v.alergias !== 'Não informado'
    ).length;
    const comContatoEmergencia = voluntarios.filter((v) => Boolean(v.contato_emergencia_telefone)).length;
    const pendentesContato = total - comContatoEmergencia;
    const pendentesSanguineo = total - comTipoSanguineo;

    return { total, comTipoSanguineo, comAlergias, comContatoEmergencia, pendentesContato, pendentesSanguineo };
  }, [voluntarios]);

  // Lista Filtrada por Busca e Filtro Rápido
  const filteredVoluntarios = useMemo(() => {
    return voluntarios.filter((v) => {
      // 1. Filtro Rápido
      if (filtroRapido === 'com_alergias') {
        const hasAlergia =
          v.alergias && v.alergias.trim() !== '' && v.alergias !== 'Nenhuma' && v.alergias !== 'Não informado';
        if (!hasAlergia) return false;
      } else if (filtroRapido === 'sem_contato') {
        if (v.contato_emergencia_telefone) return false;
      } else if (filtroRapido === 'sem_tipo_sanguineo') {
        if (v.tipo_sanguineo && v.tipo_sanguineo !== 'Não informado' && v.tipo_sanguineo !== 'N/I') return false;
      }

      // 2. Busca Textual
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      return (
        (v.nome_completo || '').toLowerCase().includes(term) ||
        (v.tipo_sanguineo || '').toLowerCase().includes(term) ||
        (v.alergias || '').toLowerCase().includes(term) ||
        (v.contato_emergencia_nome || '').toLowerCase().includes(term) ||
        (v.contato_emergencia_telefone || '').toLowerCase().includes(term) ||
        (v.funcao || '').toLowerCase().includes(term) ||
        (v.area_atuacao || '').toLowerCase().includes(term)
      );
    });
  }, [voluntarios, filtroRapido, search]);

  const getWhatsAppUrl = (tel?: string | null, nomeVol?: string, nomeContato?: string) => {
    if (!tel) return null;
    const cleanTel = tel.replace(/\D/g, '');
    if (cleanTel.length < 10) return null;
    const fullNumber = cleanTel.startsWith('55') ? cleanTel : `55${cleanTel}`;
    const msg = encodeURIComponent(
      `Olá ${nomeContato || 'Contato de Emergência'}! Sou da coordenação do Instituto Ádapo sobre o(a) voluntário(a) ${nomeVol || ''}.`
    );
    return `https://wa.me/${fullNumber}?text=${msg}`;
  };

  // Colunas da Tabela Desktop
  const columns: Column<Voluntario>[] = [
    {
      key: 'nome_completo',
      header: 'Voluntário(a)',
      width: '260px',
      render: (item) => (
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 font-bold flex items-center justify-center text-xs overflow-hidden shrink-0 border border-red-500/20 shadow-xs">
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
            <p className="text-[11px] text-[var(--text-muted)] truncate">
              {item.funcao || item.area_atuacao || 'Voluntário'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'tipo_sanguineo',
      header: 'Tipo Sanguíneo',
      width: '130px',
      align: 'center',
      headerClassName: 'text-center',
      render: (item) => (
        <span className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-extrabold bg-red-500/10 text-red-600 border border-red-500/20 shadow-2xs">
          <Droplet className="w-3 h-3 fill-current" />
          {item.tipo_sanguineo || 'N/I'}
        </span>
      ),
    },
    {
      key: 'alergias',
      header: 'Alergias & Restrições',
      width: '200px',
      render: (item) => {
        const hasAlergia =
          item.alergias && item.alergias.trim() !== '' && item.alergias !== 'Nenhuma' && item.alergias !== 'Não informado';
        return (
          <div className="text-xs min-w-0">
            {hasAlergia ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 max-w-[180px]">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                <span className="truncate">{item.alergias}</span>
              </span>
            ) : (
              <span className="text-[var(--text-muted)] text-[11px]">Nenhuma relatada</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'contato_emergencia',
      header: 'Contato SOS (Emergência)',
      width: '230px',
      render: (item) => {
        const waUrl = getWhatsAppUrl(
          item.contato_emergencia_telefone,
          item.nome_completo,
          item.contato_emergencia_nome || undefined
        );
        const hasContact = Boolean(item.contato_emergencia_telefone);

        if (!hasContact) {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
              <AlertTriangle className="w-3 h-3" />
              Sem contato SOS
            </span>
          );
        }

        return (
          <div className="text-xs min-w-0 space-y-1">
            <p className="font-semibold text-[var(--text-primary)] truncate">
              {item.contato_emergencia_nome || 'Responsável'}{' '}
              {item.contato_emergencia_parentesco ? `(${item.contato_emergencia_parentesco})` : ''}
            </p>
            <div className="flex items-center gap-2">
              <a
                href={`tel:${item.contato_emergencia_telefone}`}
                className="font-mono-data text-[11px] text-[var(--color-primary)] font-bold hover:underline flex items-center gap-1 min-h-[32px]"
                onClick={(e) => e.stopPropagation()}
              >
                <PhoneCall className="w-3 h-3" />
                {item.contato_emergencia_telefone}
              </a>
              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-[10px] font-bold flex items-center gap-1 transition-colors min-h-[32px]"
                  title="WhatsApp SOS"
                >
                  <MessageCircle className="w-3 h-3" />
                  SOS
                </a>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'plano_saude',
      header: 'Plano / SUS',
      width: '130px',
      render: (item) => (
        <div className="text-xs space-y-0.5">
          <p className="font-medium text-[var(--text-primary)] truncate">
            {item.plano_saude || 'SUS'}
          </p>
          {item.medicamentos_uso_continuo && item.medicamentos_uso_continuo !== 'Nenhum' && (
            <p className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold truncate flex items-center gap-1">
              <Pill className="w-3 h-3" />
              Medicação
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'acoes',
      header: 'Crachá SOS',
      width: '130px',
      align: 'center',
      headerClassName: 'text-center',
      render: (item) => (
        <Button
          variant="secondary"
          size="sm"
          className="text-xs min-h-[38px] px-3 mx-auto"
          icon={<Printer className="w-3.5 h-3.5 text-red-600" />}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedVoluntarioParaCracha(item);
            setShowCrachaModal(true);
          }}
        >
          Crachá PDF
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* ── 1. MICRO-KPIS DE SAÚDE OPERACIONAL COM SHIMMER ── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
              <Heart className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
                Prontuários Ativos
              </p>
              <p className="text-lg sm:text-xl font-display font-extrabold text-[var(--text-primary)]">
                {stats.total}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
              <Droplet className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
                Tipo Sanguíneo
              </p>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-lg sm:text-xl font-display font-extrabold text-[var(--text-primary)]">
                  {stats.comTipoSanguineo}
                </span>
                {stats.pendentesSanguineo > 0 && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                    ({stats.pendentesSanguineo} pend.)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
                Com Alergias
              </p>
              <p className="text-lg sm:text-xl font-display font-extrabold text-amber-600">
                {stats.comAlergias}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
                Contatos SOS
              </p>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-lg sm:text-xl font-display font-extrabold text-emerald-600">
                  {stats.comContatoEmergencia}
                </span>
                {stats.pendentesContato > 0 && (
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                    ({stats.pendentesContato} sem SOS)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. PAINEL DE BUSCA & FILTROS RÁPIDOS (DESIGN SYSTEM) ── */}
      <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-[var(--shadow-card)] space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Campo de Busca Oficial do Design System (Prevenção de Zoom no iOS) */}
          <div className="flex-1 w-full">
            <Input
              icon={<Search className="w-4 h-4" />}
              placeholder="Buscar prontuário por nome, tipo sanguíneo, alergia ou contato SOS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-h-[44px] text-base sm:text-sm"
            />
          </div>

          <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 shrink-0">
            <Info className="w-4 h-4 text-red-500 shrink-0" />
            <span className="hidden lg:inline">Ficha médica e contatos de socorro para segurança em campo.</span>
          </div>
        </div>

        {/* Pílulas de Filtro Rápido com Touch Targets de 44px */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 custom-scrollbar pt-1">
          <button
            type="button"
            onClick={() => setFiltroRapido('todos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer min-h-[44px] flex items-center gap-1.5 ${
              filtroRapido === 'todos'
                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)]'
            }`}
          >
            <span>Todos os Prontuários</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              filtroRapido === 'todos' ? 'bg-white/20 text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
            }`}>
              {stats.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroRapido('com_alergias')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer min-h-[44px] flex items-center gap-1.5 ${
              filtroRapido === 'com_alergias'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Com Alergias</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              filtroRapido === 'com_alergias' ? 'bg-white/20 text-white' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
            }`}>
              {stats.comAlergias}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroRapido('sem_contato')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer min-h-[44px] flex items-center gap-1.5 ${
              filtroRapido === 'sem_contato'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Sem Contato SOS</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              filtroRapido === 'sem_contato' ? 'bg-white/20 text-white' : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
            }`}>
              {stats.pendentesContato}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroRapido('sem_tipo_sanguineo')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer min-h-[44px] flex items-center gap-1.5 ${
              filtroRapido === 'sem_tipo_sanguineo'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)]'
            }`}
          >
            <Droplet className="w-3.5 h-3.5" />
            <span>Sem Tipo Sanguíneo</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              filtroRapido === 'sem_tipo_sanguineo' ? 'bg-white/20 text-white' : 'bg-red-500/10 text-red-700 dark:text-red-300'
            }`}>
              {stats.pendentesSanguineo}
            </span>
          </button>
        </div>
      </div>

      {/* ── 3. VISUALIZAÇÃO MOBILE-FIRST EM CARTÕES TÁTEIS SOS (SM:HIDDEN) ── */}
      <div className="block sm:hidden space-y-3">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)]" />
            ))}
          </div>
        ) : filteredVoluntarios.length === 0 ? (
          <div className="p-8 text-center bg-[var(--bg-elevated)] border border-dashed border-[var(--border-default)] rounded-2xl space-y-3">
            <Heart className="w-10 h-10 text-[var(--text-muted)] mx-auto opacity-50" />
            <div>
              <p className="font-bold text-sm text-[var(--text-primary)]">Nenhum prontuário localizado</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Tente ajustar o termo pesquisado ou remover os filtros.</p>
            </div>
            {(search || filtroRapido !== 'todos') && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setFiltroRapido('todos');
                }}
                className="min-h-[44px] mx-auto text-xs"
              >
                Limpar Filtros
              </Button>
            )}
          </div>
        ) : (
          filteredVoluntarios.map((vol) => {
            const hasAlergia =
              vol.alergias && vol.alergias.trim() !== '' && vol.alergias !== 'Nenhuma' && vol.alergias !== 'Não informado';
            const hasMedicamento =
              vol.medicamentos_uso_continuo &&
              vol.medicamentos_uso_continuo.trim() !== '' &&
              vol.medicamentos_uso_continuo !== 'Nenhum' &&
              vol.medicamentos_uso_continuo !== 'Não informado';
            const waUrl = getWhatsAppUrl(
              vol.contato_emergencia_telefone,
              vol.nome_completo,
              vol.contato_emergencia_nome || undefined
            );

            return (
              <div
                key={vol.id}
                className={`p-4 rounded-2xl border transition-all bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-3 ${
                  hasAlergia ? 'border-amber-500/30 ring-1 ring-amber-500/10' : 'border-[var(--border-default)]'
                }`}
              >
                {/* Header do Cartão: Avatar + Nome + Tipo Sanguíneo */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-600 font-bold flex items-center justify-center text-sm overflow-hidden shrink-0 border border-red-500/20 shadow-xs">
                      {vol.avatar_url ? (
                        <img src={vol.avatar_url} alt={vol.nome_completo} className="w-full h-full object-cover" />
                      ) : (
                        vol.nome_completo.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-[var(--text-primary)] truncate leading-tight">
                        {vol.nome_completo}
                      </h4>
                      <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                        {vol.funcao || vol.area_atuacao || 'Voluntário'}
                      </p>
                    </div>
                  </div>

                  {/* Badge de Tipo Sanguíneo em Destaque */}
                  <span className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-mono font-extrabold bg-red-500/10 text-red-600 border border-red-500/25 shrink-0 shadow-2xs">
                    <Droplet className="w-3.5 h-3.5 fill-current" />
                    {vol.tipo_sanguineo || 'N/I'}
                  </span>
                </div>

                {/* Badges de Alergias & Medicamentos */}
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {hasAlergia ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span className="truncate max-w-[240px]">Alergia: {vol.alergias}</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-[var(--text-muted)] px-1">Sem alergias conhecidas</span>
                  )}

                  {hasMedicamento && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                      <Pill className="w-3.5 h-3.5 shrink-0 text-sky-600" />
                      <span className="truncate max-w-[240px]">Medicação contínua</span>
                    </span>
                  )}

                  <span className="px-2 py-0.5 rounded-lg text-[11px] bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                    Plano: {vol.plano_saude || 'SUS'}
                  </span>
                </div>

                {/* Box de Contato SOS de Emergência */}
                <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Contato de Emergência (SOS)
                    </span>
                    {vol.contato_emergencia_parentesco && (
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {vol.contato_emergencia_parentesco}
                      </span>
                    )}
                  </div>

                  {vol.contato_emergencia_telefone ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-xs text-[var(--text-primary)]">
                        {vol.contato_emergencia_nome || 'Responsável Indicado'}
                      </p>

                      {/* Botões Táteis com min-h de 44px */}
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={`tel:${vol.contato_emergencia_telefone}`}
                          className="min-h-[44px] px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--color-primary)] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[var(--bg-secondary)] transition-colors touch-manipulation"
                        >
                          <PhoneCall className="w-4 h-4 shrink-0" />
                          <span>Ligar SOS</span>
                        </a>

                        {waUrl ? (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-h-[44px] px-3 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/25 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-500/20 transition-colors touch-manipulation"
                          >
                            <MessageCircle className="w-4 h-4 shrink-0" />
                            <span>WhatsApp</span>
                          </a>
                        ) : (
                          <div className="min-h-[44px] px-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-muted)] text-[11px] flex items-center justify-center">
                            Sem WhatsApp
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>Pendente: Contato SOS não cadastrado</span>
                    </div>
                  )}
                </div>

                {/* Botão de Emissão de Crachá PDF (Touch Target 44px) */}
                <Button
                  variant="secondary"
                  size="md"
                  className="w-full min-h-[44px] justify-center text-xs font-bold"
                  icon={<Printer className="w-4 h-4 text-red-600" />}
                  onClick={() => {
                    setSelectedVoluntarioParaCracha(vol);
                    setShowCrachaModal(true);
                  }}
                >
                  Emitir Crachá SOS (PDF)
                </Button>
              </div>
            );
          })
        )}
      </div>

      {/* ── 4. TABELA ANALÍTICA COMPLETA NO DESKTOP (HIDDEN SM:BLOCK) ── */}
      <div className="hidden sm:block">
        {loading ? (
          <div className="p-12 text-center text-sm text-[var(--text-muted)] animate-pulse">
            Carregando prontuários de saúde...
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredVoluntarios}
            keyExtractor={(v) => v.id}
            emptyMessage="Nenhum prontuário de saúde localizado."
          />
        )}
      </div>

      {/* ── 5. MODAL DE CRACHÁ / CARTÃO DE EMERGÊNCIA TIMBRADO ── */}
      {selectedVoluntarioParaCracha && (
        <PapelTimbradoModal
          isOpen={showCrachaModal}
          onClose={() => {
            setShowCrachaModal(false);
            setSelectedVoluntarioParaCracha(null);
          }}
          tituloDocumento="CARTÃO DE EMERGÊNCIA OPERACIONAL & SOCORRO MÉDICO"
          subtituloDocumento={`Instituto Ádapo — Protocolo de Segurança de Campo • Voluntário: ${selectedVoluntarioParaCracha.nome_completo}`}
        >
          <div className="space-y-6 text-black text-sm">
            {/* Box de Alerta no Topo do Crachá */}
            <div className="p-4 rounded-xl border-2 border-red-600 bg-red-50 text-red-950 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-8 h-8 text-red-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-base uppercase tracking-tight text-red-700">
                    Ficha de Socorro Rápido em Campo
                  </h4>
                  <p className="text-xs text-red-800">
                    Documento de porte obrigatório em saídas comunitárias, eventos e oficinas com crianças.
                  </p>
                </div>
              </div>
              <div className="text-center px-4 py-2 bg-red-600 text-white rounded-lg font-mono font-black text-xl">
                {selectedVoluntarioParaCracha.tipo_sanguineo || 'N/I'}
              </div>
            </div>

            {/* Dados de Identificação */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-gray-300 bg-gray-50 text-xs">
              <div>
                <p className="font-bold text-gray-500 uppercase">Nome Completo</p>
                <p className="font-bold text-sm text-gray-900">{selectedVoluntarioParaCracha.nome_completo}</p>
              </div>
              <div>
                <p className="font-bold text-gray-500 uppercase">CPF / Documento</p>
                <p className="font-mono text-sm text-gray-900">{selectedVoluntarioParaCracha.cpf || 'Não informado'}</p>
              </div>
              <div>
                <p className="font-bold text-gray-500 uppercase">Função / Área de Atuação</p>
                <p className="text-gray-900 font-semibold">
                  {selectedVoluntarioParaCracha.funcao || 'Voluntário'} (
                  {selectedVoluntarioParaCracha.area_atuacao || 'Geral'})
                </p>
              </div>
              <div>
                <p className="font-bold text-gray-500 uppercase">Telefone Principal</p>
                <p className="font-mono text-gray-900 font-semibold">
                  {selectedVoluntarioParaCracha.telefone || 'Não informado'}
                </p>
              </div>
            </div>

            {/* Informações Médicas Cruciais (Purple Ban Eliminado) */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1">
                Informações Médicas &amp; Alergias Conhecidas
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-gray-200">
                  <p className="font-bold text-gray-600">Alergias &amp; Restrições:</p>
                  <p className="text-red-700 font-semibold mt-0.5">
                    {selectedVoluntarioParaCracha.alergias || 'Nenhuma alergia relatada'}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-gray-200">
                  <p className="font-bold text-gray-600">Medicamentos de Uso Contínuo:</p>
                  <p className="text-sky-800 font-semibold mt-0.5">
                    {selectedVoluntarioParaCracha.medicamentos_uso_continuo || 'Nenhum medicamento contínuo'}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-gray-200">
                  <p className="font-bold text-gray-600">Plano de Saúde:</p>
                  <p className="text-gray-900 font-semibold mt-0.5">
                    {selectedVoluntarioParaCracha.plano_saude || 'Rede Pública (SUS)'}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-gray-200">
                  <p className="font-bold text-gray-600">Cartão do SUS / Registro:</p>
                  <p className="font-mono text-gray-900 font-semibold mt-0.5">
                    {selectedVoluntarioParaCracha.cartao_sus || 'Não informado'}
                  </p>
                </div>
              </div>
            </div>

            {/* Contato de Emergência SOS */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1">
                Contato de Emergência (Em caso de Acidente / Socorro)
              </h4>
              <div className="p-3.5 rounded-xl border border-red-300 bg-red-50/50 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-sm text-gray-900">
                    {selectedVoluntarioParaCracha.contato_emergencia_nome || 'Contato não informado'}
                  </p>
                  <p className="text-gray-600 font-medium">
                    Grau de Parentesco: {selectedVoluntarioParaCracha.contato_emergencia_parentesco || 'Não especificado'}
                  </p>
                </div>
                <div className="text-right font-mono font-bold text-sm text-red-700">
                  {selectedVoluntarioParaCracha.contato_emergencia_telefone || 'Sem telefone SOS'}
                </div>
              </div>
            </div>

            {/* Termo de Responsabilidade e Assinatura */}
            <div className="pt-8 border-t border-gray-300 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-2">
                <div className="border-b border-black w-48 mx-auto" />
                <p className="font-bold">{selectedVoluntarioParaCracha.nome_completo}</p>
                <p className="text-[10px] text-gray-500">Assinatura do Voluntário</p>
              </div>
              <div className="space-y-2">
                <div className="border-b border-black w-48 mx-auto" />
                <p className="font-bold">Instituto Ádapo</p>
                <p className="text-[10px] text-gray-500">Coordenação de Voluntariado</p>
              </div>
            </div>
          </div>
        </PapelTimbradoModal>
      )}
    </div>
  );
}
