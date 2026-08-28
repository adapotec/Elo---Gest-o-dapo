'use client';

import React, { useState, useMemo } from 'react';
import { Voluntario } from './VoluntariosEquipe';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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
} from 'lucide-react';

interface VoluntariosSaudeProps {
  voluntarios: Voluntario[];
  loading: boolean;
}

export function VoluntariosSaude({ voluntarios, loading }: VoluntariosSaudeProps) {
  const [search, setSearch] = useState('');
  const [selectedVoluntarioParaCracha, setSelectedVoluntarioParaCracha] = useState<Voluntario | null>(null);
  const [showCrachaModal, setShowCrachaModal] = useState(false);

  // Estatísticas de Prontuário
  const stats = useMemo(() => {
    const total = voluntarios.length;
    const comTipoSanguineo = voluntarios.filter((v) => v.tipo_sanguineo && v.tipo_sanguineo !== 'Não informado').length;
    const comAlergias = voluntarios.filter((v) => v.alergias && v.alergias.trim() !== '' && v.alergias !== 'Nenhuma').length;
    const comContatoEmergencia = voluntarios.filter((v) => v.contato_emergencia_telefone).length;

    return { total, comTipoSanguineo, comAlergias, comContatoEmergencia };
  }, [voluntarios]);

  const filteredVoluntarios = useMemo(() => {
    return voluntarios.filter((v) => {
      return (
        (v.nome_completo || '').toLowerCase().includes(search.toLowerCase()) ||
        (v.tipo_sanguineo || '').toLowerCase().includes(search.toLowerCase()) ||
        (v.alergias || '').toLowerCase().includes(search.toLowerCase()) ||
        (v.contato_emergencia_nome || '').toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [voluntarios, search]);

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

  const columns: Column<Voluntario>[] = [
    {
      key: 'nome_completo',
      header: 'Voluntário(a)',
      render: (item) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 font-bold flex items-center justify-center text-xs overflow-hidden shrink-0 border border-red-500/20 shadow-xs">
            {item.avatar_url ? (
              <img src={item.avatar_url} alt={item.nome_completo} className="w-full h-full object-cover" />
            ) : (
              item.nome_completo.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
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
      render: (item) => {
        const hasAlergia = item.alergias && item.alergias.trim() !== '' && item.alergias !== 'Nenhuma' && item.alergias !== 'Não informado';
        return (
          <div className="text-xs min-w-0">
            {hasAlergia ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[200px]">{item.alergias}</span>
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
      header: 'Contato de Emergência (SOS)',
      render: (item) => {
        const waUrl = getWhatsAppUrl(item.contato_emergencia_telefone, item.nome_completo, item.contato_emergencia_nome || undefined);
        const hasContact = Boolean(item.contato_emergencia_telefone);

        if (!hasContact) {
          return <span className="text-[11px] text-[var(--text-muted)] italic">Sem contato SOS</span>;
        }

        return (
          <div className="text-xs min-w-0 space-y-0.5">
            <p className="font-semibold text-[var(--text-primary)] truncate">
              {item.contato_emergencia_nome || 'Responsável'} {item.contato_emergencia_parentesco ? `(${item.contato_emergencia_parentesco})` : ''}
            </p>
            <div className="flex items-center gap-2">
              <a
                href={`tel:${item.contato_emergencia_telefone}`}
                className="font-mono-data text-[11px] text-[var(--color-primary)] font-bold hover:underline flex items-center gap-1"
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
                  className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-[10px] font-bold flex items-center gap-1"
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
      width: '140px',
      render: (item) => (
        <div className="text-xs">
          <p className="font-medium text-[var(--text-primary)] truncate">
            {item.plano_saude || 'SUS'}
          </p>
          {item.medicamentos_uso_continuo && item.medicamentos_uso_continuo !== 'Nenhum' && (
            <p className="text-[10px] text-purple-600 font-semibold truncate flex items-center gap-1">
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
      width: '120px',
      align: 'center',
      headerClassName: 'text-center',
      render: (item) => (
        <Button
          variant="secondary"
          size="sm"
          className="text-xs h-8 px-2.5"
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
    <div className="space-y-6">
      {/* ── 1. CARDS DE KPIS DE SAÚDE OPERACIONAL ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-5 flex items-center gap-3.5 border-l-4 border-l-red-500">
          <div className="w-11 h-11 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Prontuários
            </p>
            <p className="text-xl sm:text-2xl font-display font-extrabold text-[var(--text-primary)]">
              {stats.total}
            </p>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 flex items-center gap-3.5 border-l-4 border-l-rose-500">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
            <Droplet className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Tipo Sanguíneo
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-display font-extrabold text-[var(--text-primary)]">
                {stats.comTipoSanguineo}
              </span>
              <span className="text-xs text-[var(--text-muted)]">({stats.total - stats.comTipoSanguineo} pendentes)</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 flex items-center gap-3.5 border-l-4 border-l-amber-500">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Alergias Mapeadas
            </p>
            <p className="text-xl sm:text-2xl font-display font-extrabold text-amber-600">
              {stats.comAlergias}
            </p>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 flex items-center gap-3.5 border-l-4 border-l-emerald-500">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Contatos SOS Ativos
            </p>
            <p className="text-xl sm:text-2xl font-display font-extrabold text-emerald-600">
              {stats.comContatoEmergencia}
            </p>
          </div>
        </Card>
      </div>

      {/* ── 2. PAINEL DE BUSCA DE PRONTUÁRIO ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-[var(--shadow-card)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Buscar por nome, tipo sanguíneo, alergia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-default)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-red-500 transition-all"
          />
        </div>

        <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 self-end sm:self-center">
          <Info className="w-4 h-4 text-red-500" />
          <span>Ficha médica e contatos de emergência para suporte em saídas de campo.</span>
        </div>
      </div>

      {/* ── 3. TABELA DE SAÚDE & EMERGÊNCIA ── */}
      {loading ? (
        <div className="p-12 text-center text-sm text-[var(--text-muted)]">
          Carregando dados de saúde...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredVoluntarios}
          keyExtractor={(v) => v.id}
          emptyMessage="Nenhum prontuário de saúde localizado."
        />
      )}

      {/* ── 4. MODAL DE CRACHÁ / CARTÃO DE EMERGÊNCIA TIMBRADO ── */}
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
                <p className="font-mono text-sm text-gray-900">{selectedVoluntarioParaCracha.cpf}</p>
              </div>
              <div>
                <p className="font-bold text-gray-500 uppercase">Função / Área de Atuação</p>
                <p className="text-gray-900 font-semibold">{selectedVoluntarioParaCracha.funcao || 'Voluntário'} ({selectedVoluntarioParaCracha.area_atuacao || 'Geral'})</p>
              </div>
              <div>
                <p className="font-bold text-gray-500 uppercase">Telefone Principal</p>
                <p className="font-mono text-gray-900 font-semibold">{selectedVoluntarioParaCracha.telefone}</p>
              </div>
            </div>

            {/* Informações Médicas Cruciais */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1">
                Informações Médicas & Alergias Conhecidas
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-gray-200">
                  <p className="font-bold text-gray-600">Alergias & Restrições:</p>
                  <p className="text-red-700 font-semibold mt-0.5">
                    {selectedVoluntarioParaCracha.alergias || 'Nenhuma alergia relatada'}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-gray-200">
                  <p className="font-bold text-gray-600">Medicamentos de Uso Contínuo:</p>
                  <p className="text-purple-900 font-semibold mt-0.5">
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
