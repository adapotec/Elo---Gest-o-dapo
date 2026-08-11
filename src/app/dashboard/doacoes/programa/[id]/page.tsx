'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import { createClient } from '@/lib/supabase/client';
import {
  Target,
  ArrowLeft,
  Users,
  TrendingUp,
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ExternalLink,
} from 'lucide-react';

interface ProgramaDetails {
  id: string;
  nome: string;
  descricao: string;
  tipo: string;
  status: string;
  meta_mensal: number;
  created_at: string;
  projetos_sociais?: {
    id: string;
    nome: string;
    icone: string;
    cor_identificacao: string;
  } | null;
}

interface PlanoAsaas {
  id: string;
  name: string;
  amount: number;
  cycle: string;
  description: string;
  active: boolean;
}

interface Assinante {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  status: string;
  created_at: string;
  plano_nome?: string;
  plano_valor?: number;
  status_assinatura?: string;
}

export default function DetalheProgramaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: programaId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [programa, setPrograma] = useState<ProgramaDetails | null>(null);
  const [planos, setPlanos] = useState<PlanoAsaas[]>([]);
  const [assinantes, setAssinantes] = useState<Assinante[]>([]);

  const [mrrAtual, setMrrAtual] = useState(0);

  const fetchDetails = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // 1. Buscar Programa de Captação
      const { data: progData } = await supabase
        .from('programas_captacao')
        .select(`
          *,
          projetos_sociais (id, nome, icone, cor_identificacao)
        `)
        .eq('id', programaId)
        .single();

      if (progData) {
        setPrograma(progData as ProgramaDetails);
      }

      // 2. Buscar Planos vinculados a este programa (ou todos os planos do Asaas se for o programa principal)
      const { data: plansData } = await supabase
        .from('plans')
        .select('*')
        .order('amount', { ascending: true });

      if (plansData) {
        setPlanos(plansData as PlanoAsaas[]);
      }

      // 3. Buscar Subscribers e Subscriptions do Asaas
      const { data: subData } = await supabase
        .from('subscribers')
        .select(`
          id,
          name,
          email,
          cpf,
          phone,
          status,
          created_at,
          plans (name, amount, programa_captacao_id),
          subscriptions (status, payment_method)
        `);

      if (subData) {
        let calcMrr = 0;
        const listFormatted: Assinante[] = [];

        subData.forEach((s: any) => {
          const subStatus = s.subscriptions?.[0]?.status || s.status || 'ACTIVE';
          const pAmount = Number(s.plans?.amount || 0);

          if (subStatus === 'ACTIVE') {
            calcMrr += pAmount;
          }

          listFormatted.push({
            id: s.id,
            name: s.name || 'Doador sem nome',
            email: s.email || '-',
            cpf: s.cpf || '-',
            phone: s.phone || '-',
            status: s.status,
            created_at: s.created_at,
            plano_nome: s.plans?.name || 'Recorrente',
            plano_valor: pAmount,
            status_assinatura: subStatus,
          });
        });

        setAssinantes(listFormatted);
        setMrrAtual(calcMrr);
      }
    } catch (err) {
      console.error('Erro ao carregar detalhes do programa:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [programaId]);

  const columnsAssinantes: Column<Assinante>[] = [
    {
      key: 'name',
      header: 'Assinante / Doador',
      render: (item) => (
        <div>
          <p className="font-semibold text-[var(--text-primary)]">{item.name}</p>
          <p className="text-[11px] font-mono-data text-[var(--text-muted)]">CPF: {item.cpf}</p>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Contato',
      render: (item) => (
        <div className="text-xs">
          <p className="text-[var(--text-primary)]">{item.email}</p>
          <p className="text-[11px] text-[var(--text-muted)] font-mono-data">{item.phone}</p>
        </div>
      ),
    },
    {
      key: 'plano_nome',
      header: 'Plano Assinado',
      render: (item) => (
        <div>
          <span className="text-xs font-semibold text-[var(--text-primary)]">{item.plano_nome}</span>
          <p className="text-[11px] font-mono-data text-[var(--color-success)] font-bold">
            R$ {item.plano_valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / mês
          </p>
        </div>
      ),
    },
    {
      key: 'status_assinatura',
      header: 'Status Asaas',
      render: (item) => {
        let variant: 'success' | 'warning' | 'danger' | 'neutral' = 'neutral';
        if (item.status_assinatura === 'ACTIVE') variant = 'success';
        if (item.status_assinatura === 'OVERDUE') variant = 'warning';
        if (item.status_assinatura === 'CANCELLED') variant = 'danger';

        return <Badge variant={variant}>{item.status_assinatura}</Badge>;
      },
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center text-sm text-[var(--text-muted)]">
        Carregando informações do programa...
      </div>
    );
  }

  if (!programa) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] p-6">
        <p className="text-center text-sm text-[var(--text-muted)]">Programa de Captação não encontrado.</p>
        <div className="text-center mt-4">
          <Link href="/dashboard/doacoes">
            <Button variant="secondary">Voltar para Doações</Button>
          </Link>
        </div>
      </div>
    );
  }

  const percentMeta =
    programa.meta_mensal > 0
      ? Math.min(Math.round((mrrAtual / programa.meta_mensal) * 100), 100)
      : 0;

  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      <Topbar
        title={`Programa: ${programa.nome}`}
        subtitle="Gestão de arrecadação recorrente, metas e doadores associados"
        action={
          <Link href="/dashboard/doacoes">
            <Button size="sm" variant="ghost" className="gap-1.5 whitespace-nowrap">
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar
            </Button>
          </Link>
        }
      />

      <main className="p-6 space-y-6">
        {/* Banner do Programa */}
        <Card className="p-6 bg-gradient-to-r from-[var(--bg-card)] via-[var(--bg-secondary)] to-[var(--bg-card)] border-[var(--border-default)]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center font-bold text-2xl shadow-sm">
                <Target className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-[var(--text-primary)]">{programa.nome}</h1>
                  <Badge variant={programa.status === 'ativo' ? 'success' : 'warning'}>
                    {programa.status}
                  </Badge>
                </div>
                <p className="text-xs font-semibold text-[var(--color-primary)] mt-0.5">
                  Projeto Vinculado: {programa.projetos_sociais?.nome || 'Institucional Ádapo'}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xl">
                  {programa.descricao || 'Sem descrição.'}
                </p>
              </div>
            </div>

            <div className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border-default)] min-w-[240px] space-y-2">
              <div className="flex justify-between text-xs font-mono-data">
                <span className="text-[var(--text-muted)]">Progresso da Meta</span>
                <span className="font-bold text-[var(--color-success)]">{percentMeta}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                <div
                  className="h-full bg-[var(--color-success)] rounded-full transition-all duration-500"
                  style={{ width: `${percentMeta}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono-data font-bold">
                <span className="text-[var(--color-success)]">
                  R$ {mrrAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[var(--text-muted)]">
                  Meta: R$ {Number(programa.meta_mensal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Planos Cadastrados no Asaas */}
        <div className="space-y-3">
          <h2 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[var(--color-primary)]" /> Planos de Contribuição Ativos (Asaas Gateway)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {planos.map((plano) => (
              <div
                key={plano.id}
                className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-sm space-y-2 hover:border-[var(--color-primary)] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[var(--text-primary)]">{plano.name}</h3>
                  <span className="text-xs font-mono-data font-bold text-[var(--color-success)]">
                    R$ {Number(plano.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  {plano.description}
                </p>
                <div className="pt-2 flex justify-between text-[10px] text-[var(--text-muted)]">
                  <span>Cobrança: {plano.cycle}</span>
                  <span className="text-[var(--color-success)] font-bold">Ativo no Asaas</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de Assinantes do Programa */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--color-primary)]" /> Doadores & Assinantes ({assinantes.length})
            </h2>
            <span className="text-xs text-[var(--text-muted)] font-mono-data">
              Atualizado em tempo real via webhooks Asaas
            </span>
          </div>

          <DataTable
            columns={columnsAssinantes}
            data={assinantes}
            keyExtractor={(item) => item.id}
            loading={loading}
            emptyMessage="Nenhum assinante cadastrado neste programa."
          />
        </div>
      </main>
    </div>
  );
}
