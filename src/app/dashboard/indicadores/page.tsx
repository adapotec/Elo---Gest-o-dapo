'use client';

import React, { useState, useEffect } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';
import {
  IndicadoresCharts,
  type MensalData,
  type ProjetoMetric,
  type AreaVoluntario,
} from '@/components/dashboard/indicadores/IndicadoresCharts';
import {
  BarChart3,
  Users,
  HeartHandshake,
  FolderKanban,
  Gift,
  Package,
  TrendingUp,
  AlertTriangle,
  ClipboardList,
  DollarSign,
  Printer,
  RefreshCw,
} from 'lucide-react';

const PALETA_CORES = [
  '#F2632D',
  '#93368F',
  '#1C9C82',
  '#F9C859',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#10B981',
];

export default function IndicadoresSociaisPage() {
  const [loading, setLoading] = useState(true);

  // Indicadores Consolidados
  const [totalBeneficiarios, setTotalBeneficiarios] = useState(0);
  const [totalVoluntarios, setTotalVoluntarios] = useState(0);
  const [totalProjetos, setTotalProjetos] = useState(0);
  const [totalDoacoesFinanceiras, setTotalDoacoesFinanceiras] = useState(0);
  const [totalItensEstoque, setTotalItensEstoque] = useState(0);
  const [itensCriticos, setItensCriticos] = useState(0);
  const [reqsPendentes, setReqsPendentes] = useState(0);

  // Dados dos Gráficos
  const [dadosMensais, setDadosMensais] = useState<MensalData[]>([]);
  const [projetosMetrics, setProjetosMetrics] = useState<ProjetoMetric[]>([]);
  const [voluntariosAreas, setVoluntariosAreas] = useState<AreaVoluntario[]>([]);

  useEffect(() => {
    loadDashboardBIData();
  }, []);

  const loadDashboardBIData = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // 1. Contagens
      const [
        { count: cBenef },
        { count: cVol },
        { count: cProj },
        { count: cEstoque },
        { count: cReqP },
      ] = await Promise.all([
        supabase.from('beneficiarios').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
        supabase.from('voluntarios').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
        supabase.from('projetos_sociais').select('*', { count: 'exact', head: true }),
        supabase.from('estoque_itens').select('*', { count: 'exact', head: true }),
        supabase.from('requisicoes_material').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
      ]);

      setTotalBeneficiarios(cBenef || 0);
      setTotalVoluntarios(cVol || 0);
      setTotalProjetos(cProj || 0);
      setTotalItensEstoque(cEstoque || 0);
      setReqsPendentes(cReqP || 0);

      // 2. Estoque Crítico
      const { data: estoqueData } = await supabase.from('estoque_itens').select('quantidade, quantidade_minima');
      if (estoqueData) {
        setItensCriticos(estoqueData.filter((i) => i.quantidade <= (i.quantidade_minima || 10)).length);
      }

      // 3. Doações Totais
      const { data: doacoesData } = await supabase.from('doacoes').select('tipo, valor, data_doacao');
      if (doacoesData) {
        const fin = doacoesData.filter((d) => d.tipo === 'financeira');
        setTotalDoacoesFinanceiras(fin.reduce((acc, d) => acc + (d.valor || 0), 0));
      }

      // 4. Voluntários por Área
      const { data: volData } = await supabase.from('voluntarios').select('area_atuacao').eq('status', 'ativo');
      if (volData) {
        const areaMap: Record<string, number> = {};
        volData.forEach((v) => {
          const area = v.area_atuacao || 'Operacional';
          areaMap[area] = (areaMap[area] || 0) + 1;
        });
        const volAreaList = Object.entries(areaMap).map(([name, value], idx) => ({
          name,
          value,
          color: PALETA_CORES[idx % PALETA_CORES.length],
        }));
        setVoluntariosAreas(volAreaList);
      }

      // 5. Métricas por Projeto
      const { data: projData } = await supabase
        .from('projetos_sociais')
        .select('id, nome, cor_identificacao, num_beneficiarios_diretos')
        .eq('status', 'ativo');

      if (projData) {
        const pMetrics = await Promise.all(
          projData.map(async (p) => {
            const { count } = await supabase
              .from('inscricoes')
              .select('*', { count: 'exact', head: true })
              .eq('projeto_id', p.id);

            const inscritos = count || 0;
            const meta = p.num_beneficiarios_diretos || 50;

            return {
              nome: p.nome,
              cor: p.cor_identificacao || '#F2632D',
              inscritos,
              meta,
              taxa: Math.round((inscritos / (meta || 1)) * 100),
            };
          })
        );
        setProjetosMetrics(pMetrics);
      }

      // 6. Dados Mensais Mock/Série Histórica
      setDadosMensais([
        { mes: 'Jan', doacoes: 12000, inscricoes: 45, entradasEstoque: 120, saidasEstoque: 90 },
        { mes: 'Fev', doacoes: 18500, inscricoes: 60, entradasEstoque: 150, saidasEstoque: 110 },
        { mes: 'Mar', doacoes: 15400, inscricoes: 55, entradasEstoque: 200, saidasEstoque: 140 },
        { mes: 'Abr', doacoes: 22000, inscricoes: 80, entradasEstoque: 180, saidasEstoque: 160 },
        { mes: 'Mai', doacoes: 26500, inscricoes: 95, entradasEstoque: 220, saidasEstoque: 190 },
        { mes: 'Jun', doacoes: 31000, inscricoes: 110, entradasEstoque: 260, saidasEstoque: 210 },
      ]);
    } catch (err) {
      console.error('Erro ao carregar indicadores BI:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Topbar
        title="Indicadores Sociais & Business Intelligence"
        subtitle="Dashboard consolidado de métricas de impacto, arrecadação, voluntariado e gestão de insumos"
        action={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={loadDashboardBIData}
            >
              Atualizar Dados
            </Button>
            <Button
              size="sm"
              variant="primary"
              icon={<Printer className="w-4 h-4" />}
              onClick={() => window.print()}
            >
              Imprimir Relatório
            </Button>
          </div>
        }
      />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-4 border-l-4 border-l-[#93368F]">
            <div className="p-3 rounded-xl bg-[#93368F]/10 text-[#93368F]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Beneficiários Ativos</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{totalBeneficiarios}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4 border-l-4 border-l-[#F2632D]">
            <div className="p-3 rounded-xl bg-[#F2632D]/10 text-[#F2632D]">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Voluntários na Equipe</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{totalVoluntarios}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4 border-l-4 border-l-emerald-500">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Arrecadação Total</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {totalDoacoesFinanceiras.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4 border-l-4 border-l-amber-500">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase">Alertas de Estoque</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{itensCriticos}</p>
            </div>
          </Card>
        </div>

        {/* Componente de Gráficos Extraído */}
        {loading ? (
          <Card className="p-12 text-center text-[var(--text-muted)]">
            Carregando indicadores e métricas...
          </Card>
        ) : (
          <IndicadoresCharts
            dadosMensais={dadosMensais}
            projetosMetrics={projetosMetrics}
            voluntariosPorArea={voluntariosAreas}
          />
        )}
      </main>
    </div>
  );
}
