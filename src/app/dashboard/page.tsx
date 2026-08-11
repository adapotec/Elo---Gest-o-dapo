'use client';

import React, { useState, useEffect } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DetailPanel } from '@/components/ui/DetailPanel';
import { createClient } from '@/lib/supabase/client';
import {
  Users,
  HeartHandshake,
  FolderKanban,
  Gift,
  Package,
  TrendingUp,
  Plus,
  BarChart2,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    beneficiarios: 0,
    voluntarios: 0,
    projetos: 0,
    doacoesValor: 0,
    estoqueItens: 0,
  });

  const [selectedMetric, setSelectedMetric] = useState<{
    title: string;
    description: string;
    details: string[];
  } | null>(null);

  useEffect(() => {
    async function loadStats() {
      const supabase = createClient();

      const [
        { count: countBeneficiarios },
        { count: countVoluntarios },
        { count: countProjetos },
        { count: countEstoque },
      ] = await Promise.all([
        supabase.from('beneficiarios').select('*', { count: 'exact', head: true }),
        supabase.from('voluntarios').select('*', { count: 'exact', head: true }),
        supabase.from('projetos_sociais').select('*', { count: 'exact', head: true }),
        supabase.from('estoque_itens').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        beneficiarios: countBeneficiarios || 0,
        voluntarios: countVoluntarios || 0,
        projetos: countProjetos || 0,
        doacoesValor: 0,
        estoqueItens: countEstoque || 0,
      });
    }

    loadStats();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Painel Inicial"
        subtitle="Visão geral da operação do Instituto Ádapo"
        action={
          <Link href="/dashboard/beneficiarios">
            <Button size="sm" icon={<Plus className="w-4 h-4" />}>
              Novo Beneficiário
            </Button>
          </Link>
        }
      />

      <div className="p-8 space-y-8 flex-1 overflow-y-auto">
        {/* Banner Institucional Boas-Vindas */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[var(--raw-laranja)] to-[var(--raw-laranja-claro)] text-white shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              Sistema ELO v1.0
            </span>
            <h2 className="font-display font-bold text-2xl mt-2">Bem-vindo(a) à Gestão do Instituto Ádapo</h2>
            <p className="text-sm opacity-90 mt-1 max-w-xl">
              Plataforma única para centralizar beneficiários, voluntários, projetos sociais, doações e estoque.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="neutral" className="bg-white/90 text-[var(--raw-laranja)] font-semibold border-none">
              Status: Ativo
            </Badge>
          </div>
        </div>

        {/* Grid de Cards KPi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div
            onClick={() =>
              setSelectedMetric({
                title: 'Beneficiários Ativos',
                description: 'Famílias e jovens cadastrados no programa social.',
                details: [
                  `Total cadastrado: ${stats.beneficiarios}`,
                  'Acompanhamento contínuo por assistentes sociais',
                  'Integração com projetos pedagógicos',
                ],
              })
            }
            className="cursor-pointer"
          >
            <Card
              title="Beneficiários"
              value={stats.beneficiarios}
              subtitle="Cadastrados no sistema"
              icon={<Users className="w-5 h-5" />}
              trend={{ value: '12%', isPositive: true }}
            />
          </div>

          <div
            onClick={() =>
              setSelectedMetric({
                title: 'Equipe de Voluntários',
                description: 'Voluntários operacionais e externos atuantes.',
                details: [
                  `Total voluntários: ${stats.voluntarios}`,
                  'Voluntários Operacionais (pedagogia, comunicação, gestão)',
                  'Monitores de Projetos específicos',
                ],
              })
            }
            className="cursor-pointer"
          >
            <Card
              title="Voluntários"
              value={stats.voluntarios}
              subtitle="Operacionais e monitores"
              icon={<HeartHandshake className="w-5 h-5 text-[var(--color-primary)]" />}
            />
          </div>

          <div
            onClick={() =>
              setSelectedMetric({
                title: 'Projetos Sociais',
                description: 'Atividades, cursos e oficinas em andamento.',
                details: [
                  `Projetos ativos: ${stats.projetos}`,
                  'Cursos pedagógicos, oficinas e palestras',
                  'Vínculos N:N com beneficiários inscritos',
                ],
              })
            }
            className="cursor-pointer"
          >
            <Card
              title="Projetos Sociais"
              value={stats.projetos}
              subtitle="Projetos e oficinas ativas"
              icon={<FolderKanban className="w-5 h-5 text-[var(--color-accent-purple)]" />}
            />
          </div>

          <div
            onClick={() =>
              setSelectedMetric({
                title: 'Controle de Estoque',
                description: 'Itens estocados e disponíveis para doação.',
                details: [
                  `Tipos de itens em estoque: ${stats.estoqueItens}`,
                  'Controle por lote automático',
                  'Rastreabilidade total de fornecedores',
                ],
              })
            }
            className="cursor-pointer"
          >
            <Card
              title="Itens no Estoque"
              value={stats.estoqueItens}
              subtitle="Itens cadastrados"
              icon={<Package className="w-5 h-5 text-[var(--color-accent-brown)]" />}
            />
          </div>
        </div>

        {/* Seção de Módulos e Atalhos Rápidos */}
        <div className="space-y-4">
          <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">Módulos da Plataforma</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Link
              href="/dashboard/beneficiarios"
              className="p-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--color-primary)] transition-all group shadow-[var(--shadow-card)]"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                Gestão de Beneficiários
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Cadastre, edite e consulte históricos completos de atendimentos e participações.
              </p>
            </Link>

            <Link
              href="/dashboard/voluntarios"
              className="p-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--color-primary)] transition-all group shadow-[var(--shadow-card)]"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                Gestão de Voluntários
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Gerencie equipes operacionais, áreas de atuação e monitores externos por projeto.
              </p>
            </Link>

            <Link
              href="/dashboard/projetos"
              className="p-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--color-primary)] transition-all group shadow-[var(--shadow-card)]"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FolderKanban className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                Projetos Sociais & Inscrições
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Crie projetos, cursos e vincule beneficiários e voluntários com histórico.
              </p>
            </Link>

            <Link
              href="/dashboard/doacoes"
              className="p-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--color-primary)] transition-all group shadow-[var(--shadow-card)]"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Gift className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                Registro de Doações
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Registre doações financeiras ou em itens com rastreamento e sem duplicidades.
              </p>
            </Link>

            <Link
              href="/dashboard/estoque"
              className="p-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--color-primary)] transition-all group shadow-[var(--shadow-card)]"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Package className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                Controle de Estoque & Fornecedores
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Entradas e saídas de itens, cadastro de doadores/fornecedores e lote automático.
              </p>
            </Link>

            <Link
              href="/dashboard/usuarios"
              className="p-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--color-primary)] transition-all group shadow-[var(--shadow-card)]"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <BarChart2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                Controle de Acesso (RLS)
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Gerencie usuários internos, papéis (roles) e permissões de segurança.
              </p>
            </Link>
          </div>
        </div>
      </div>

      {/* Painel Contextual Lateral ao Clicar em Alguma Métrica */}
      <DetailPanel
        isOpen={!!selectedMetric}
        onClose={() => setSelectedMetric(null)}
        title={selectedMetric?.title || ''}
        subtitle="Detalhamento do indicador social"
      >
        <p className="text-sm text-[var(--text-secondary)]">{selectedMetric?.description}</p>
        <div className="space-y-2 pt-4 border-t border-[var(--border-default)]">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Informações Adicionais</h4>
          <ul className="space-y-2">
            {selectedMetric?.details.map((item, idx) => (
              <li key={idx} className="text-xs p-2.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </DetailPanel>
    </div>
  );
}
