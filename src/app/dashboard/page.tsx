'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/components/layout/ThemeProvider';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DetailPanel } from '@/components/ui/DetailPanel';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  Users,
  HeartHandshake,
  FolderKanban,
  Gift,
  Package,
  Plus,
  BarChart3,
  Calendar,
  Sparkles,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  GraduationCap,
  Megaphone,
  Landmark,
  Sliders,
  CheckCircle2,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface MetricDetail {
  title: string;
  subtitle: string;
  description: string;
  details: string[];
  actionHref?: string;
  actionText?: string;
}

export default function DashboardPage() {
  const supabase = createClient();
  const { theme, bgStyle } = useTheme();

  // Seleciona a logo ideal do Ádapo com base no estilo de fundo e no tema:
  // - Fundo Suave (sutil + light mode): logo preta
  // - Fundo Cor Viva estilo Trello (imersivo) ou Dark Mode: logo branca
  const isVibrantOrDark = bgStyle === 'imersivo' || theme === 'dark';
  const logoSrc = isVibrantOrDark
    ? '/logo/logo-branca-sem-fundo.png'
    : '/logo/logo-preta-sem-fundo.png';

  const [activeTab, setActiveTab] = useState<'geral' | 'modulos' | 'historico'>('geral');
  const [loading, setLoading] = useState(true);

  // User Profile Data
  const [userInfo, setUserInfo] = useState<{
    name: string;
    role: string;
    email: string;
  }>({
    name: 'Voluntário',
    role: 'voluntario_operacional',
    email: '',
  });

  // Operational System Stats
  const [stats, setStats] = useState({
    beneficiarios: 0,
    voluntarios: 0,
    projetos: 0,
    estoqueItens: 0,
    estoqueBaixoCount: 0,
    doacoesCount: 0,
  });

  // Real Next Activities List (acoes_projeto)
  const [proximasAtividades, setProximasAtividades] = useState<any[]>([]);

  // Real Operational Alerts
  const [alertas, setAlertas] = useState({
    requisicoesPendentes: 0,
    fichasSocioemocionalMes: 0,
    projetosPlanejados: 0,
  });

  // Real Recent Activities History
  const [historicoRecente, setHistoricoRecente] = useState<any[]>([]);

  // Low Stock Items Alert List
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);

  // Selected KPI Detail Modal
  const [selectedMetric, setSelectedMetric] = useState<MetricDetail | null>(null);

  // Dynamic Greeting based on time of day
  const [greeting, setGreeting] = useState('Bem-vindo(a)');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');
  }, []);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);

        // 1. Fetch Auth User & Profile
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('nome_completo, role, email')
            .eq('id', user.id)
            .maybeSingle();

          if (prof) {
            setUserInfo({
              name: prof.nome_completo || user.email?.split('@')[0] || 'Voluntário',
              role: prof.role || 'voluntario_operacional',
              email: prof.email || user.email || '',
            });
          }
        }

        // 2. Fetch Operational System Counts & Real Activities in Parallel
        const mesAtualStr = new Date().toISOString().substring(0, 7);

        const [
          { count: countBen },
          { count: countVol },
          { count: countProj },
          { count: countEst },
          { data: lowStockData },
          { count: countDoac },
          { data: acoesData },
          { count: countReqPendentes },
          { count: countFichasMes },
          { count: countProjPlanejamento },
          { data: recentBen },
          { data: recentDoac },
          { data: recentAcoes },
        ] = await Promise.all([
          supabase.from('beneficiarios').select('*', { count: 'exact', head: true }),
          supabase.from('voluntarios').select('*', { count: 'exact', head: true }),
          supabase.from('projetos_sociais').select('*', { count: 'exact', head: true }),
          supabase.from('estoque_itens').select('*', { count: 'exact', head: true }),
          supabase.from('estoque_itens').select('*').lte('quantidade', 10).limit(5),
          supabase.from('doacoes').select('*', { count: 'exact', head: true }),
          supabase
            .from('acoes_projeto')
            .select('id, nome_acao, data_hora, descricao, projeto_id, projetos_sociais(id, nome, cor_identificacao)')
            .order('data_hora', { ascending: true })
            .limit(6),
          supabase
            .from('requisicoes_material')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pendente'),
          supabase
            .from('acompanhamento_socioemocional')
            .select('*', { count: 'exact', head: true })
            .eq('mes_referencia', mesAtualStr),
          supabase
            .from('projetos_sociais')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'planejado'),
          supabase
            .from('beneficiarios')
            .select('id, nome_completo, created_at, comunidade, bairro')
            .order('created_at', { ascending: false })
            .limit(3),
          supabase
            .from('doacoes')
            .select('id, tipo_doacao, descricao_itens, created_at, data_doacao, valor')
            .order('created_at', { ascending: false })
            .limit(3),
          supabase
            .from('acoes_projeto')
            .select('id, nome_acao, created_at, data_hora, projetos_sociais(nome)')
            .order('created_at', { ascending: false })
            .limit(3),
        ]);

        setStats({
          beneficiarios: countBen || 0,
          voluntarios: countVol || 0,
          projetos: countProj || 0,
          estoqueItens: countEst || 0,
          estoqueBaixoCount: lowStockData?.length || 0,
          doacoesCount: countDoac || 0,
        });

        setLowStockItems(lowStockData || []);
        setProximasAtividades(acoesData || []);
        setAlertas({
          requisicoesPendentes: countReqPendentes || 0,
          fichasSocioemocionalMes: countFichasMes || 0,
          projetosPlanejados: countProjPlanejamento || 0,
        });

        // Montar histórico unificado real
        const histMerged: any[] = [];
        if (recentBen) {
          recentBen.forEach((b: any) => {
            histMerged.push({
              id: 'ben_' + b.id,
              titulo: `Novo beneficiário cadastrado: ${b.nome_completo}`,
              subtitulo: b.comunidade ? `Território: ${b.comunidade}` : 'Cadastro no prontuário social',
              data: b.created_at || new Date().toISOString(),
              tipo: 'beneficiario',
              icon: Users,
              color: '#93368F',
              href: '/dashboard/beneficiarios',
            });
          });
        }
        if (recentDoac) {
          recentDoac.forEach((d: any) => {
            histMerged.push({
              id: 'doac_' + d.id,
              titulo: `Registro de doação: ${d.descricao_itens || d.tipo_doacao || 'Doação recebida'}`,
              subtitulo: d.valor ? `Valor estimado: R$ ${d.valor}` : 'Entrada registrada no sistema',
              data: d.created_at || d.data_doacao || new Date().toISOString(),
              tipo: 'doacao',
              icon: Gift,
              color: '#1C9C82',
              href: '/dashboard/doacoes',
            });
          });
        }
        if (recentAcoes) {
          recentAcoes.forEach((a: any) => {
            histMerged.push({
              id: 'acao_' + a.id,
              titulo: `Ação programada: ${a.nome_acao}`,
              subtitulo: a.projetos_sociais?.nome ? `Projeto: ${a.projetos_sociais.nome}` : 'Ação de cronograma',
              data: a.created_at || a.data_hora || new Date().toISOString(),
              tipo: 'acao',
              icon: FolderKanban,
              color: '#F2632D',
              href: '/dashboard/projetos',
            });
          });
        }
        histMerged.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
        setHistoricoRecente(histMerged);
      } catch (err) {
        console.error('Erro ao carregar dados do Dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [supabase]);

  const roleLabels: Record<string, string> = {
    admin: 'Administrador (Acesso Total)',
    coordenador: 'Coordenador de Projetos',
    voluntario_operacional: 'Voluntário Operacional',
    voluntario_externo: 'Voluntário Externo',
  };

  const modulesList = [
    {
      title: 'Gestão de Beneficiários',
      description: 'Cadastro, prontuário social e histórico das famílias e jovens atendidos pelo Instituto Ádapo.',
      href: '/dashboard/beneficiarios',
      icon: Users,
      color: '#93368F',
      tag: `${stats.beneficiarios} Cadastrados`,
    },
    {
      title: 'Gestão de Voluntários',
      description: 'Gestão de equipes operacionais, áreas de atuação e monitores externos por projetos.',
      href: '/dashboard/voluntarios',
      icon: HeartHandshake,
      color: '#F2632D',
      tag: `${stats.voluntarios} Ativos`,
    },
    {
      title: 'Projetos Sociais & Inscrições',
      description: 'Criação de projetos, oficinas pedagógicas, socioemocionais e controle de participantes.',
      href: '/dashboard/projetos',
      icon: FolderKanban,
      color: '#F7955F',
      tag: `${stats.projetos} Projetos`,
    },
    {
      title: 'Pedagogia & Oficinas',
      description: 'Planos de aula, reforço escolar, apoio pedagógico e materiais didáticos.',
      href: '/dashboard/pedagogia',
      icon: GraduationCap,
      color: '#93368F',
      tag: 'Oficinas',
    },
    {
      title: 'Comunicação & Mídia',
      description: 'Divulgação institucional, relatórios de prestação de contas e imagens de eventos.',
      href: '/dashboard/comunicacao',
      icon: Megaphone,
      color: '#EF4444',
      tag: 'Mídia & Redes',
    },
    {
      title: 'Controle de Parceiros',
      description: 'Mapeamento de empresas parceiras, ONGs aliadas e mantenedores institucionais.',
      href: '/dashboard/parceiros',
      icon: Building2,
      color: '#1C9C82',
      tag: 'Rede Ádapo',
    },
    {
      title: 'Registro de Doações',
      description: 'Recebimento de doações financeiras, alimentos, roupas e suprimentos com rastreabilidade.',
      href: '/dashboard/doacoes',
      icon: Gift,
      color: '#1C9C82',
      tag: `${stats.doacoesCount} Doações`,
    },
    {
      title: 'Controle de Estoque',
      description: 'Entradas e saídas de almoxarifado, controle por lote e alertas de estoque baixo.',
      href: '/dashboard/estoque',
      icon: Package,
      color: '#8B4A2E',
      tag: `${stats.estoqueItens} Itens`,
    },
    {
      title: 'Calendário Geral',
      description: 'Agenda centralizada de oficinas, reuniões de equipe, entregas de cestas e mutirões.',
      href: '/dashboard/calendario',
      icon: Calendar,
      color: '#E85D04',
      tag: 'Agenda',
    },
    {
      title: 'Indicadores Sociais',
      description: 'Métricas de impacto social, gráficos de atendimento e relatórios analíticos.',
      href: '/dashboard/indicadores',
      icon: BarChart3,
      color: '#3B82F6',
      tag: 'Métricas',
    },
    {
      title: 'Gestão Institucional',
      description: 'Documentos oficiais, estatutos, modelos de papéis timbrados e relatórios de governança.',
      href: '/dashboard/institucional',
      icon: Landmark,
      color: '#6D28D9',
      tag: 'Documentos',
    },
    {
      title: 'Usuários & Permissões',
      description: 'Gerenciamento de acessos da equipe interna, papéis RLS e permissões de segurança.',
      href: '/dashboard/usuarios',
      icon: ShieldCheck,
      color: '#4A1B57',
      tag: 'Segurança',
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto select-none">
      {/* Header Padronizado */}
      <PageHeader
        title="INSTITUTO ÁDAPO - Painel Inicial"
        description="Visão geral da operação, estatísticas e indicadores de impacto do Instituto Ádapo."
        iconTransparent
        icon={
          <img
            src={logoSrc}
            alt="Logo Instituto Ádapo"
            className="w-16 h-16 object-contain drop-shadow-sm transition-opacity duration-200"
          />
        }
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link href="/dashboard/beneficiarios/novo">
              <Button size="sm" icon={<Plus className="w-4 h-4" />}>
                Novo Beneficiário
              </Button>
            </Link>
            <Link href="/dashboard/doacoes/nova">
              <Button size="sm" variant="secondary" icon={<Gift className="w-4 h-4 text-[var(--color-primary)]" />}>
                Registrar Doação
              </Button>
            </Link>
          </div>
        }
      />

      {/* Hero Welcome Banner */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl p-6 shadow-[var(--shadow-card)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--color-primary-soft)] rounded-full blur-3xl opacity-35 -mr-16 -mt-16 pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-[var(--color-primary)]/20">
                <Sparkles className="w-3.5 h-3.5" />
                Sistema ELO v1.5
              </span>
              <Badge variant="purple">{roleLabels[userInfo.role] || userInfo.role}</Badge>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold font-display text-[var(--text-primary)] leading-tight">
              {greeting}, {userInfo.name}! 👋
            </h1>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-2xl">
              Plataforma unificada do Instituto Ádapo. Conectando beneficiários, voluntários, projetos sociais e recursos em um único ecossistema.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
            <Link href="/dashboard/perfil">
              <Button variant="ghost" size="sm" icon={<Sliders className="w-4 h-4" />}>
                Personalizar Tema
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs de Navegação Operacional */}
      <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('geral')}
          className={`px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2 ${activeTab === 'geral' ? 'tab-btn-active' : 'tab-btn-unselected'
            }`}
        >
          <Activity className="w-4 h-4" />
          Visão Geral Operacional
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('modulos')}
          className={`px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2 ${activeTab === 'modulos' ? 'tab-btn-active' : 'tab-btn-unselected'
            }`}
        >
          <Layers className="w-4 h-4" />
          Módulos da Plataforma ({modulesList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('historico')}
          className={`px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2 ${activeTab === 'historico' ? 'tab-btn-active' : 'tab-btn-unselected'
            }`}
        >
          <Clock className="w-4 h-4" />
          Agenda & Avisos
        </button>
      </div>

      {/* CONTEÚDO DA ABA 1: VISÃO GERAL OPERACIONAL */}
      {activeTab === 'geral' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Grid de Cards de KPI Interativos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div
              onClick={() =>
                setSelectedMetric({
                  title: 'Beneficiários Ativos',
                  subtitle: 'Famílias e jovens participantes dos programas do Instituto Ádapo',
                  description: 'Total de pessoas cadastradas no prontuário social com histórico ativo de atendimentos.',
                  details: [
                    `Total cadastrado: ${stats.beneficiarios} pessoas`,
                    'Acompanhamento contínuo por assistentes sociais e monitores',
                    'Integração direta com as oficinas pedagógicas e socioemocionais',
                  ],
                  actionHref: '/dashboard/beneficiarios',
                  actionText: 'Ver Todos os Beneficiários',
                })
              }
              className="cursor-pointer group"
            >
              <Card
                title="Beneficiários"
                value={stats.beneficiarios}
                subtitle="Cadastrados no sistema"
                icon={<Users className="w-5 h-5 text-[var(--color-primary)]" />}
              />
            </div>

            <div
              onClick={() =>
                setSelectedMetric({
                  title: 'Equipe de Voluntários',
                  subtitle: 'Voluntários operacionais e monitores de oficinas',
                  description: 'Comunidade engajada atuante na pedagogia, comunicação, gestão e campo.',
                  details: [
                    `Total voluntários: ${stats.voluntarios} voluntários`,
                    'Voluntários Operacionais (pedagogia, comunicação, gestão)',
                    'Monitores de Projetos específicos com histórico de atuação',
                  ],
                  actionHref: '/dashboard/voluntarios',
                  actionText: 'Gerenciar Voluntários',
                })
              }
              className="cursor-pointer group"
            >
              <Card
                title="Voluntários Ativos"
                value={stats.voluntarios}
                subtitle="Equipe e monitores"
                icon={<HeartHandshake className="w-5 h-5 text-[#F2632D]" />}
              />
            </div>

            <div
              onClick={() =>
                setSelectedMetric({
                  title: 'Projetos Sociais & Oficinas',
                  subtitle: 'Atividades pedagógicas, culturais e de capacitação',
                  description: 'Projetos em andamento que promovem a transformação comunitária.',
                  details: [
                    `Projetos ativos: ${stats.projetos} iniciativas`,
                    'Cursos pedagógicos, reforço escolar, cultura e oficinas socioemocionais',
                    'Vínculos diretos com a frequência dos beneficiários inscritos',
                  ],
                  actionHref: '/dashboard/projetos',
                  actionText: 'Ver Projetos Sociais',
                })
              }
              className="cursor-pointer group"
            >
              <Card
                title="Projetos Sociais"
                value={stats.projetos}
                subtitle="Iniciativas e oficinas"
                icon={<FolderKanban className="w-5 h-5 text-[#93368F]" />}
              />
            </div>

            <div
              onClick={() =>
                setSelectedMetric({
                  title: 'Itens no Estoque & Suprimentos',
                  subtitle: 'Controle de almoxarifado e insumos para doação',
                  description: 'Alimentos, vestuários, materiais escolares e recursos disponíveis.',
                  details: [
                    `Itens cadastrados: ${stats.estoqueItens} categorias`,
                    `Itens em estoque crítico (<= 10 un): ${stats.estoqueBaixoCount} alerta(s)`,
                    'Rastreabilidade total de fornecedores e doadores',
                  ],
                  actionHref: '/dashboard/estoque',
                  actionText: 'Ir para o Estoque',
                })
              }
              className="cursor-pointer group"
            >
              <Card
                title="Itens no Estoque"
                value={stats.estoqueItens}
                subtitle={
                  stats.estoqueBaixoCount > 0
                    ? `⚠️ ${stats.estoqueBaixoCount} com estoque baixo`
                    : 'Estoque regular'
                }
                icon={<Package className="w-5 h-5 text-[#8B4A2E]" />}
              />
            </div>
          </div>

          {/* Seção Dupla: Agenda do Instituto & Alertas Operacionais */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Próximas Atividades / Agenda */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[var(--color-primary)]" />
                    <h3 className="font-bold text-base text-[var(--text-primary)]">Próximas Atividades do Instituto</h3>
                  </div>
                  <Link href="/dashboard/calendario">
                    <span className="text-xs text-[var(--color-primary)] font-semibold hover:underline flex items-center gap-1">
                      Ver Calendário Completo
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                </div>

                {proximasAtividades.length === 0 ? (
                  <div className="p-8 text-center rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-secondary)]/40 space-y-2">
                    <Calendar className="w-8 h-8 mx-auto text-[var(--text-muted)] opacity-40" />
                    <p className="text-xs font-semibold text-[var(--text-secondary)]">Nenhuma atividade ou oficina agendada no momento.</p>
                    <p className="text-[11px] text-[var(--text-muted)]">Cadastre encontros no cronograma dos projetos sociais para acompanhá-los aqui e no calendário geral.</p>
                    <div className="pt-2">
                      <Link href="/dashboard/projetos">
                        <Button size="sm" variant="secondary">Ir para Projetos Sociais</Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {proximasAtividades.map((item) => {
                      const dataValida = item.data_hora ? new Date(item.data_hora) : new Date();
                      const diaSemana = isNaN(dataValida.getTime()) ? 'DIA' : dataValida.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase();
                      const diaMes = isNaN(dataValida.getTime()) ? '--' : dataValida.getDate().toString().padStart(2, '0');
                      const horaFormatada = isNaN(dataValida.getTime()) ? '' : dataValida.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                      const projetoNome = item.projetos_sociais?.nome || 'Projeto Social';
                      const projetoCor = item.projetos_sociais?.cor_identificacao || '#93368F';

                      return (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] flex items-start justify-between gap-4 hover:border-[var(--color-primary)]/40 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="w-10 h-10 rounded-xl font-bold flex flex-col items-center justify-center text-xs shrink-0 border"
                              style={{
                                backgroundColor: `${projetoCor}15`,
                                color: projetoCor,
                                borderColor: `${projetoCor}30`,
                              }}
                            >
                              <span className="text-[10px] uppercase font-semibold">{diaSemana}</span>
                              <span className="font-mono-data">{diaMes}</span>
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-[var(--text-primary)]">{item.nome_acao}</h4>
                              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                {projetoNome} {horaFormatada ? `• ${horaFormatada}` : ''}
                              </p>
                              {item.descricao && (
                                <p className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-1">
                                  {item.descricao}
                                </p>
                              )}
                            </div>
                          </div>
                          <Link href={`/dashboard/projetos/${item.projeto_id}`}>
                            <Badge variant="purple" style={{ borderColor: `${projetoCor}40`, color: projetoCor }}>
                              {projetoNome}
                            </Badge>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>

            {/* Painel de Alertas & Pendências */}
            <div className="space-y-4">
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-base text-[var(--text-primary)]">Alertas Operacionais</h3>
                </div>

                <div className="space-y-3">
                  {/* Alerta de Estoque */}
                  {stats.estoqueBaixoCount > 0 ? (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200">
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                        <span>Atenção: Estoque Baixo ({stats.estoqueBaixoCount} itens)</span>
                      </div>
                      <p className="text-[11px] mt-1 opacity-90 leading-relaxed">
                        Existem itens no almoxarifado com quantidade inferior ou igual a 10 unidades.
                      </p>
                      <Link href="/dashboard/estoque" className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-2 block underline">
                        Verificar almoxarifado →
                      </Link>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200">
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                        <span>Estoque Regular</span>
                      </div>
                      <p className="text-[11px] mt-1 opacity-90">
                        Todos os itens do almoxarifado estão em níveis seguros.
                      </p>
                    </div>
                  )}

                  {/* Alerta de Requisições Pendentes */}
                  {alertas.requisicoesPendentes > 0 ? (
                    <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-800 dark:text-purple-200">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>Requisições de Material</span>
                        <Badge variant="purple">{alertas.requisicoesPendentes} pendente(s)</Badge>
                      </div>
                      <p className="text-[11px] mt-1 opacity-90 leading-relaxed">
                        Solicitações de materiais aguardando liberação da coordenação no estoque.
                      </p>
                      <Link href="/dashboard/estoque" className="text-[11px] font-bold text-purple-600 dark:text-purple-400 mt-2 block underline">
                        Analisar requisições →
                      </Link>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)]">
                      <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]">
                        <span>Requisições de Material</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">0 pendentes</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1">
                        Nenhuma requisição de insumo pendente de liberação.
                      </p>
                    </div>
                  )}

                  {/* Alerta de Acompanhamento Socioemocional */}
                  <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)]">
                    <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]">
                      <span>Acompanhamento Socioemocional</span>
                      <span className="text-[var(--color-primary)] font-bold font-mono-data">
                        {alertas.fichasSocioemocionalMes} fichas
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                      Fichas dos 4 eixos registradas para o mês vigente.
                    </p>
                    <Link href="/dashboard/pedagogia" className="text-[11px] font-bold text-[var(--color-primary)] mt-1.5 block underline">
                      Abrir fichas pedagógicas →
                    </Link>
                  </div>

                  {/* Alerta de Projetos em Planejamento */}
                  {alertas.projetosPlanejados > 0 && (
                    <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-800 dark:text-blue-200">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>Projetos em Planejamento</span>
                        <Badge variant="primary">{alertas.projetosPlanejados}</Badge>
                      </div>
                      <p className="text-[11px] mt-1 opacity-90 leading-relaxed">
                        Projetos cadastrados que ainda estão em fase de estruturação e diagnóstico.
                      </p>
                      <Link href="/dashboard/projetos" className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-2 block underline">
                        Acessar projetos →
                      </Link>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: MÓDULOS DA PLATAFORMA */}
      {activeTab === 'modulos' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
              Módulos da Plataforma ELO
            </h3>
            <span className="text-xs text-[var(--text-secondary)]">Total de 12 módulos operacionais</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {modulesList.map((mod) => {
              const IconComponent = mod.icon;

              return (
                <Link
                  key={mod.href}
                  href={mod.href}
                  className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--color-primary)] transition-all group shadow-[var(--shadow-card)] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105"
                        style={{ backgroundColor: mod.color }}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <Badge variant="neutral">{mod.tag}</Badge>
                    </div>

                    <h4 className="font-bold text-base text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                      {mod.title}
                    </h4>

                    <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                      {mod.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--border-default)] flex items-center justify-between text-xs font-bold text-[var(--color-primary)] group-hover:translate-x-1 transition-transform">
                    <span>Acessar módulo</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 3: AGENDA & HISTÓRICO */}
      {activeTab === 'historico' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-3">
              <Clock className="w-5 h-5 text-[var(--color-primary)]" />
              <h3 className="font-bold text-base text-[var(--text-primary)]">Histórico de Atividades & Alterações Recentes</h3>
            </div>

            {historicoRecente.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-secondary)]/40 space-y-2">
                <Clock className="w-8 h-8 mx-auto text-[var(--text-muted)] opacity-40" />
                <p className="text-xs font-semibold text-[var(--text-secondary)]">Nenhuma atividade recente registrada no sistema.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historicoRecente.map((hist) => {
                  const IconComponent = hist.icon;
                  const dateObj = new Date(hist.data);
                  const dataFormatada = isNaN(dateObj.getTime())
                    ? 'Recentemente'
                    : dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

                  return (
                    <Link
                      key={hist.id}
                      href={hist.href}
                      className="flex items-start gap-4 p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] hover:border-[var(--color-primary)]/40 transition-colors group"
                    >
                      <div
                        className="w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs shrink-0"
                        style={{ backgroundColor: `${hist.color}20`, color: hist.color }}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                          {hist.titulo}
                        </p>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{hist.subtitulo}</p>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono-data mt-1 block">{dataFormatada}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--color-primary)] transition-colors self-center" />
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Slide-over Contextual DetailPanel */}
      <DetailPanel
        isOpen={!!selectedMetric}
        onClose={() => setSelectedMetric(null)}
        title={selectedMetric?.title || ''}
        subtitle={selectedMetric?.subtitle || 'Detalhamento do indicador social'}
      >
        {selectedMetric && (
          <div className="space-y-5">
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              {selectedMetric.description}
            </p>

            <div className="space-y-2 pt-3 border-t border-[var(--border-default)]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Informações Operacionais
              </h4>
              <ul className="space-y-2">
                {selectedMetric.details.map((item, idx) => (
                  <li
                    key={idx}
                    className="text-xs p-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] flex items-center gap-2.5 border border-[var(--border-default)] font-medium"
                  >
                    <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {selectedMetric.actionHref && (
              <div className="pt-4 flex justify-end">
                <Link href={selectedMetric.actionHref}>
                  <Button size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                    {selectedMetric.actionText || 'Acessar Módulo'}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </DetailPanel>
    </div>
  );
}
