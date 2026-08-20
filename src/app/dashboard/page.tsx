'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Users,
  HeartHandshake,
  FolderKanban,
  Gift,
  Package,
  Plus,
  Calendar,
  Sparkles,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  GraduationCap,
  Megaphone,
  CheckCircle2,
  Activity,
  Layers,
  ChevronRight,
  ExternalLink,
  Cake,
  FolderOpen,
  FileText,
  Image as ImageIcon,
  Heart,
  Sun,
  Moon,
  CloudSun,
  TrendingUp,
} from 'lucide-react';

interface AniversarianteItem {
  id: string;
  nome: string;
  tipo: 'beneficiario' | 'voluntario';
  diaMes: string;
  dataNasc: string;
}

export default function DashboardPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);

  // Usuário Autenticado
  const [userInfo, setUserInfo] = useState<{
    name: string;
    role: string;
    email: string;
    avatarUrl: string | null;
    funcao: string;
  }>({
    name: 'Voluntário',
    role: 'voluntario_operacional',
    email: '',
    avatarUrl: null,
    funcao: 'Voluntário(a) Social',
  });

  // Saudação Dinâmica e Ícone do Horário
  const [greetingData, setGreetingData] = useState<{
    text: string;
    emoji: string;
    icon: any;
    periodo: 'manha' | 'tarde' | 'noite';
  }>({
    text: 'Bem-vindo(a)',
    emoji: '☀️',
    icon: Sun,
    periodo: 'manha',
  });

  // Estatísticas e Contagens Principais
  const [stats, setStats] = useState({
    beneficiarios: 0,
    voluntarios: 0,
    projetos: 0,
    encontrosMes: 0,
    estoqueItens: 0,
    estoqueBaixoCount: 0,
    doacoesCount: 0,
  });

  // Alertas Operacionais Críticos
  const [alertas, setAlertas] = useState({
    estoqueBaixoCount: 0,
    projetosPlanejados: 0,
    fichasSocioemocionalMes: 0,
    requisicoesPendentes: 0,
  });

  // Próximas Ações do Cronograma (Próximos 7 dias)
  const [proximasAtividades, setProximasAtividades] = useState<any[]>([]);

  // Aniversariantes do Mês
  const [aniversariantes, setAniversariantes] = useState<AniversarianteItem[]>([]);

  // Logs / Feed de Últimas Movimentações
  const [historicoRecente, setHistoricoRecente] = useState<any[]>([]);

  // Data de hoje formatada por extenso
  const [dataPorExtenso, setDataPorExtenso] = useState('');

  // 1. Configurar Saudação e Horário
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreetingData({ text: 'Bom dia', emoji: '☀️', icon: Sun, periodo: 'manha' });
    } else if (hour >= 12 && hour < 18) {
      setGreetingData({ text: 'Boa tarde', emoji: '🌤️', icon: CloudSun, periodo: 'tarde' });
    } else {
      setGreetingData({ text: 'Boa noite', emoji: '🌙', icon: Moon, periodo: 'noite' });
    }

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    const hojeStr = new Date().toLocaleDateString('pt-BR', options);
    // Capitaliza a primeira letra do dia da semana
    setDataPorExtenso(hojeStr.charAt(0).toUpperCase() + hojeStr.slice(1));
  }, []);

  // 2. Carregar Dados Reais do Sistema no Supabase
  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);

        // A. Dados do Usuário Logado com Fallback para Voluntários
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('nome_completo, role, email, avatar_url')
            .eq('id', user.id)
            .maybeSingle();

          let userAvatar = prof?.avatar_url || null;
          let userFuncao = 'Voluntário(a) Social';

          if (prof?.role === 'admin') userFuncao = 'Administrador(a)';
          else if (prof?.role === 'coordenador') userFuncao = 'Coordenador(a)';

          if (user.email) {
            const { data: vol } = await supabase
              .from('voluntarios')
              .select('avatar_url, funcao, area_atuacao')
              .eq('email', user.email)
              .maybeSingle();

            if (vol) {
              if (!userAvatar && vol.avatar_url) userAvatar = vol.avatar_url;
              if (vol.funcao) {
                userFuncao = vol.funcao;
              } else if (vol.area_atuacao) {
                userFuncao = vol.area_atuacao;
              }
            }
          }

          setUserInfo({
            name: prof?.nome_completo || user.email?.split('@')[0] || 'Voluntário',
            role: prof?.role || 'voluntario_operacional',
            email: prof?.email || user.email || '',
            avatarUrl: userAvatar,
            funcao: userFuncao,
          });
        }

        // B. Filtros temporais
        const mesAtualInt = new Date().getMonth() + 1; // 1 - 12
        const mesAtualStr = new Date().toISOString().substring(0, 7); // YYYY-MM
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        // 7 dias à frente
        const seteDiasDepois = new Date();
        seteDiasDepois.setDate(today.getDate() + 7);
        seteDiasDepois.setHours(23, 59, 59, 999);
        const seteDiasStr = seteDiasDepois.toISOString();

        // C. Consultas Paralelas no Banco
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
          { data: allBeneficiariosNasc },
          { data: allVoluntariosNasc },
          { data: recentBen },
          { data: recentDoac },
          { data: recentAcoes },
          { count: countAcoesMes },
        ] = await Promise.all([
          supabase.from('beneficiarios').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
          supabase.from('voluntarios').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
          supabase.from('projetos_sociais').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
          supabase.from('estoque_itens').select('*', { count: 'exact', head: true }),
          supabase.from('estoque_itens').select('*').lte('quantidade', 10).limit(5),
          supabase.from('doacoes').select('*', { count: 'exact', head: true }),
          supabase
            .from('acoes_projeto')
            .select('id, nome_acao, data_hora, descricao, projeto_id, projetos_sociais(id, nome, cor_identificacao)')
            .gte('data_hora', todayStr)
            .order('data_hora', { ascending: true })
            .limit(6),
          supabase.from('requisicoes_material').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
          supabase.from('acompanhamento_socioemocional').select('*', { count: 'exact', head: true }).eq('mes_referencia', mesAtualStr),
          supabase.from('projetos_sociais').select('*', { count: 'exact', head: true }).eq('status', 'planejamento'),
          supabase.from('beneficiarios').select('id, nome_completo, data_nascimento').not('data_nascimento', 'is', null).limit(200),
          supabase.from('voluntarios').select('id, nome_completo, data_nascimento').not('data_nascimento', 'is', null).limit(100),
          supabase.from('beneficiarios').select('id, nome_completo, created_at, comunidade').order('created_at', { ascending: false }).limit(4),
          supabase.from('doacoes').select('id, tipo_doacao, descricao_itens, created_at, data_doacao, valor').order('created_at', { ascending: false }).limit(4),
          supabase.from('acoes_projeto').select('id, nome_acao, created_at, data_hora, projetos_sociais(nome)').order('created_at', { ascending: false }).limit(4),
          supabase.from('acoes_projeto').select('*', { count: 'exact', head: true }).gte('data_hora', `${mesAtualStr}-01`),
        ]);

        // D. Atualiza Estados Numéricos
        setStats({
          beneficiarios: countBen || 0,
          voluntarios: countVol || 0,
          projetos: countProj || 0,
          encontrosMes: countAcoesMes || acoesData?.length || 0,
          estoqueItens: countEst || 0,
          estoqueBaixoCount: lowStockData?.length || 0,
          doacoesCount: countDoac || 0,
        });

        setAlertas({
          estoqueBaixoCount: lowStockData?.length || 0,
          projetosPlanejados: countProjPlanejamento || 0,
          fichasSocioemocionalMes: countFichasMes || 0,
          requisicoesPendentes: countReqPendentes || 0,
        });

        setProximasAtividades(acoesData || []);

        // E. Processar Aniversariantes do Mês
        const anivList: AniversarianteItem[] = [];

        if (allBeneficiariosNasc) {
          allBeneficiariosNasc.forEach((b: any) => {
            if (b.data_nascimento) {
              const [, mes, dia] = b.data_nascimento.split('-');
              if (parseInt(mes, 10) === mesAtualInt) {
                anivList.push({
                  id: 'b_' + b.id,
                  nome: b.nome_completo,
                  tipo: 'beneficiario',
                  diaMes: `${dia}/${mes}`,
                  dataNasc: b.data_nascimento,
                });
              }
            }
          });
        }

        if (allVoluntariosNasc) {
          allVoluntariosNasc.forEach((v: any) => {
            if (v.data_nascimento) {
              const [, mes, dia] = v.data_nascimento.split('-');
              if (parseInt(mes, 10) === mesAtualInt) {
                anivList.push({
                  id: 'v_' + v.id,
                  nome: v.nome_completo,
                  tipo: 'voluntario',
                  diaMes: `${dia}/${mes}`,
                  dataNasc: v.data_nascimento,
                });
              }
            }
          });
        }

        // Ordena aniversariantes pelo dia do mês
        anivList.sort((a, b) => {
          const diaA = parseInt(a.diaMes.split('/')[0], 10);
          const diaB = parseInt(b.diaMes.split('/')[0], 10);
          return diaA - diaB;
        });

        setAniversariantes(anivList.slice(0, 8));

        // F. Montar Feed / Logs de Últimas Movimentações
        const feedMerged: any[] = [];

        if (recentBen) {
          recentBen.forEach((b: any) => {
            feedMerged.push({
              id: 'ben_' + b.id,
              titulo: `Novo beneficiário cadastrado`,
              descricao: `${b.nome_completo} • ${b.comunidade || 'Território Social'}`,
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
            feedMerged.push({
              id: 'doac_' + d.id,
              titulo: `Doação registrada`,
              descricao: `${d.descricao_itens || d.tipo_doacao || 'Doação recebida'} ${d.valor ? `(R$ ${d.valor})` : ''}`,
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
            feedMerged.push({
              id: 'acao_' + a.id,
              titulo: `Ação programada no cronograma`,
              descricao: `${a.nome_acao} ${a.projetos_sociais?.nome ? `• ${a.projetos_sociais.nome}` : ''}`,
              data: a.created_at || a.data_hora || new Date().toISOString(),
              tipo: 'acao',
              icon: Calendar,
              color: '#F2632D',
              href: '/dashboard/calendario',
            });
          });
        }

        // Ordena feed por data decrescente
        feedMerged.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
        setHistoricoRecente(feedMerged.slice(0, 6));

      } catch (err) {
        console.error('Erro ao carregar dados do painel inicial:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const roleNames: Record<string, string> = {
    admin: 'Administrador(a)',
    coordenador: 'Coordenador(a)',
    voluntario_operacional: 'Voluntário(a) Operacional',
    voluntario_externo: 'Voluntário(a) Externo',
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-primary)]">
      {/* ── TOPBAR FIXA ── */}
      <Topbar
        title="Painel Inicial"
        subtitle="Cockpit executivo e operacional do Instituto Ádapo"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* ========================================================================= */}
        {/* 1. BANNER DE BOAS-VINDAS HUMANIZADO (SOFT BENTO CARD) */}
        {/* ========================================================================= */}
        <div className="relative overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6 sm:p-8 shadow-[var(--shadow-card)]">
          {/* Fundo decorativo sutil */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--color-primary)]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Bloco do Usuário e Saudação */}
            <div className="flex items-center gap-4 sm:gap-5 min-w-0">
              {/* Foto ou Iniciais */}
              <div className="relative shrink-0">
                {userInfo.avatarUrl ? (
                  <img
                    src={userInfo.avatarUrl}
                    alt={userInfo.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[var(--color-primary)] shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[var(--color-primary)] text-white font-bold text-2xl sm:text-3xl flex items-center justify-center shadow-md">
                    {userInfo.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Textos da Saudação */}
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display font-bold text-xl sm:text-2xl text-[var(--text-primary)] leading-tight">
                    {greetingData.text}, {userInfo.name.split(' ')[0]}! {greetingData.emoji}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[var(--color-primary-soft)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                    {userInfo.funcao}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] font-medium">
                  {dataPorExtenso} • <span className="text-[var(--color-primary)] font-semibold">"Dando linha pra sonhar"</span> • <span className="text-[var(--text-secondary)]">Instituto Ádapo</span>
                </p>
              </div>
            </div>

            {/* Ação Rápida de Acolhimento */}
            <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
              <Link href="/dashboard/calendario">
                <Button size="sm" variant="secondary" icon={<Calendar className="w-4 h-4 text-[var(--color-primary)]" />}>
                  Ver Calendário Geral
                </Button>
              </Link>
              <Link href="/dashboard/beneficiarios/novo">
                <Button size="sm" variant="primary" icon={<Plus className="w-4 h-4" />}>
                  Nova Inscrição
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. TRILHO DE ALERTAS PRIORITÁRIOS (SOFT BENTO HORIZONTAL) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Alerta 1: Estoque Baixo */}
          <Link
            href="/dashboard/estoque"
            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
              alertas.estoqueBaixoCount > 0
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200 hover:bg-amber-500/15'
                : 'bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`p-2 rounded-xl shrink-0 ${alertas.estoqueBaixoCount > 0 ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'}`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">Estoque de Materiais</p>
                <p className="text-[11px] opacity-80 truncate">
                  {alertas.estoqueBaixoCount > 0 ? `${alertas.estoqueBaixoCount} itens com estoque baixo` : 'Estoque regularizado'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 opacity-50 shrink-0" />
          </Link>

          {/* Alerta 2: Projetos em Planejamento */}
          <Link
            href="/dashboard/projetos"
            className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-all flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-[#F7955F]/15 text-[#F2632D] shrink-0">
                <FolderKanban className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--text-primary)] truncate">Projetos Sociais</p>
                <p className="text-[11px] text-[var(--text-muted)] truncate">
                  {alertas.projetosPlanejados > 0 ? `${alertas.projetosPlanejados} em fase de planejamento` : 'Projetos em execução'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 opacity-50 shrink-0 text-[var(--text-muted)]" />
          </Link>

          {/* Alerta 3: Acompanhamento Socioemocional */}
          <Link
            href="/dashboard/pedagogia"
            className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-all flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-[#93368F]/15 text-[#93368F] shrink-0">
                <Heart className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--text-primary)] truncate">Socioemocional</p>
                <p className="text-[11px] text-[var(--text-muted)] truncate">
                  {alertas.fichasSocioemocionalMes} avaliações no mês
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 opacity-50 shrink-0 text-[var(--text-muted)]" />
          </Link>

          {/* Alerta 4: Status do Sistema */}
          <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--text-primary)] truncate">Base Integrada</p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium truncate">
                  Sincronizado e Ativo
                </p>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. 4 KPIS EXECUTIVOS COM MICRO-INDICADORES (SOFT BENTO GRID) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Beneficiários Ativos */}
          <Link
            href="/dashboard/beneficiarios"
            className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] hover:border-[var(--color-primary)] transition-all group space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Beneficiários</span>
              <div className="p-2 rounded-xl bg-[#93368F]/10 text-[#93368F] group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl sm:text-3xl font-bold font-mono-data text-[var(--text-primary)]">
                {stats.beneficiarios}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-[var(--color-success)] font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Ativos no prontuário</span>
              </div>
            </div>
          </Link>

          {/* KPI 2: Encontros Deste Mês */}
          <Link
            href="/dashboard/calendario"
            className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] hover:border-[var(--color-primary)] transition-all group space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Encontros no Mês</span>
              <div className="p-2 rounded-xl bg-[#F2632D]/10 text-[#F2632D] group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl sm:text-3xl font-bold font-mono-data text-[var(--text-primary)]">
                {stats.encontrosMes}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-[var(--color-primary)] font-medium">
                <span>Oficinas & dinâmicas</span>
              </div>
            </div>
          </Link>

          {/* KPI 3: Projetos Sociais */}
          <Link
            href="/dashboard/projetos"
            className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] hover:border-[var(--color-primary)] transition-all group space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Projetos Ativos</span>
              <div className="p-2 rounded-xl bg-[#F7955F]/15 text-[#F2632D] group-hover:scale-110 transition-transform">
                <FolderKanban className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl sm:text-3xl font-bold font-mono-data text-[var(--text-primary)]">
                {stats.projetos}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] font-medium">
                <span>Em execução no instituto</span>
              </div>
            </div>
          </Link>

          {/* KPI 4: Voluntários & Equipe */}
          <Link
            href="/dashboard/voluntarios"
            className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] hover:border-[var(--color-primary)] transition-all group space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Voluntários</span>
              <div className="p-2 rounded-xl bg-[#1C9C82]/10 text-[#1C9C82] group-hover:scale-110 transition-transform">
                <HeartHandshake className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl sm:text-3xl font-bold font-mono-data text-[var(--text-primary)]">
                {stats.voluntarios}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-[#1C9C82] font-medium">
                <span>Equipe engajada</span>
              </div>
            </div>
          </Link>
        </div>

        {/* ========================================================================= */}
        {/* 4. ATALHOS RÁPIDOS DE 1 CLIQUE (FAST ACTIONS BAR) */}
        {/* ========================================================================= */}
        <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] shrink-0 px-2">
              Atalhos Rápidos:
            </span>

            <div className="flex items-center gap-2 shrink-0">
              <Link href="/dashboard/beneficiarios/novo">
                <Button size="sm" variant="secondary" icon={<Plus className="w-3.5 h-3.5 text-[#93368F]" />}>
                  Nova Inscrição
                </Button>
              </Link>

              <Link href="/dashboard/projetos">
                <Button size="sm" variant="secondary" icon={<FolderKanban className="w-3.5 h-3.5 text-[#F2632D]" />}>
                  Cadastrar Ação
                </Button>
              </Link>

              <Link href="/dashboard/pedagogia">
                <Button size="sm" variant="secondary" icon={<GraduationCap className="w-3.5 h-3.5 text-[#93368F]" />}>
                  Plano de Aula
                </Button>
              </Link>

              <Link href="/dashboard/doacoes/nova">
                <Button size="sm" variant="secondary" icon={<Gift className="w-3.5 h-3.5 text-[#1C9C82]" />}>
                  Registrar Doação
                </Button>
              </Link>

              <Link href="/dashboard/estoque/movimentacao/nova">
                <Button size="sm" variant="secondary" icon={<Package className="w-3.5 h-3.5 text-[#8B4A2E]" />}>
                  Movimentar Estoque
                </Button>
              </Link>

              <Link href="/dashboard/calendario">
                <Button size="sm" variant="secondary" icon={<Calendar className="w-3.5 h-3.5 text-[#E85D04]" />}>
                  Calendário
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. GRID PRINCIPAL: CRONOGRAMA & FEED (ESQUERDA) VS ANIVERSARIANTES & DRIVE (DIREITA) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── COLUNA ESQUERDA (2/3): PRÓXIMAS AÇÕES & FEED DE AUDITORIA ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bloco 1: Próximas Ações do Cronograma (Próximos 7 dias) */}
            <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm sm:text-base text-[var(--text-primary)]">
                      Próximas Ações do Cronograma
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">Atividades e oficinas agendadas para os próximos dias</p>
                  </div>
                </div>

                <Link href="/dashboard/calendario" className="text-xs font-semibold text-[var(--color-primary)] hover:underline flex items-center gap-1 shrink-0">
                  Ver Calendário Completo →
                </Link>
              </div>

              {proximasAtividades.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-[var(--border-default)] rounded-2xl bg-[var(--bg-secondary)]/30 space-y-2">
                  <Calendar className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
                  <p className="text-xs text-[var(--text-muted)] font-medium">
                    Nenhuma ação agendada para os próximos dias no cronograma.
                  </p>
                  <Link href="/dashboard/projetos">
                    <Button size="sm" variant="secondary" icon={<Plus className="w-3.5 h-3.5" />}>
                      Cadastrar Ação em Projetos
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {proximasAtividades.map((acao, idx) => {
                    const dataAcao = acao.data_hora ? new Date(acao.data_hora) : null;
                    const projetoNome = acao.projetos_sociais?.nome || 'Projeto Social';
                    const projetoCor = acao.projetos_sociais?.cor_identificacao || '#F2632D';

                    return (
                      <div
                        key={acao.id || idx}
                        className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Badge de Data */}
                          <div className="w-12 h-12 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] flex flex-col items-center justify-center text-center shrink-0 shadow-xs font-mono-data">
                            <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase">
                              {dataAcao ? dataAcao.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') : '—'}
                            </span>
                            <span className="text-sm font-bold text-[var(--text-primary)] leading-none">
                              {dataAcao ? dataAcao.getDate() : '—'}
                            </span>
                          </div>

                          {/* Detalhes da Ação */}
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-display font-bold text-xs sm:text-sm text-[var(--text-primary)] truncate">
                                {acao.nome_acao}
                              </h4>
                              <span
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-2xs truncate max-w-[140px]"
                                style={{ backgroundColor: projetoCor }}
                              >
                                {projetoNome}
                              </span>
                            </div>
                            <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                              <span>{dataAcao ? dataAcao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Horário a definir'}</span>
                              {acao.descricao && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">{acao.descricao}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Botão de Ação */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {acao.projeto_id ? (
                            <Link href={`/dashboard/projetos/${acao.projeto_id}`}>
                              <Button size="sm" variant="ghost" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                                Ver Projeto
                              </Button>
                            </Link>
                          ) : (
                            <Link href="/dashboard/calendario">
                              <Button size="sm" variant="ghost" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                                Calendário
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bloco 2: Logs de Últimas Movimentações no Sistema (Feed de Auditoria) */}
            <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#1C9C82]/10 text-[#1C9C82]">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm sm:text-base text-[var(--text-primary)]">
                      Últimas Movimentações no Sistema
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">Histórico recente de cadastros, doações e registros</p>
                  </div>
                </div>
              </div>

              {historicoRecente.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] italic py-4 text-center">
                  Nenhuma atividade recente registrada ainda.
                </p>
              ) : (
                <div className="space-y-3">
                  {historicoRecente.map((item, idx) => {
                    const IconComp = item.icon;
                    return (
                      <Link
                        key={item.id || idx}
                        href={item.href || '#'}
                        className="p-3.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)] transition-colors flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="p-2.5 rounded-xl shrink-0 text-white shadow-2xs group-hover:scale-105 transition-transform"
                            style={{ backgroundColor: item.color || '#F2632D' }}
                          >
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                              {item.titulo}
                            </p>
                            <p className="text-[11px] text-[var(--text-muted)] truncate">
                              {item.descricao}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-[var(--text-muted)] font-mono-data block">
                            {new Date(item.data).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── COLUNA DIREITA (1/3): ANIVERSARIANTES & PASTAS GOOGLE DRIVE ── */}
          <div className="space-y-6">
            {/* Card 1: Aniversariantes do Mês (Acolhimento Comunitário) */}
            <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400">
                    <Cake className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                      Aniversariantes do Mês
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)]">Crianças e voluntários celebrando a vida</p>
                  </div>
                </div>
              </div>

              {aniversariantes.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-[var(--border-default)] rounded-xl bg-[var(--bg-secondary)]/30 space-y-1">
                  <Cake className="w-6 h-6 text-[var(--text-muted)] mx-auto opacity-50" />
                  <p className="text-xs text-[var(--text-muted)]">
                    Nenhum aniversariante cadastrado para este mês.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {aniversariantes.map((aniv, aIdx) => (
                    <div
                      key={aniv.id || aIdx}
                      className="p-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/30 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 font-bold flex items-center justify-center text-xs shrink-0">
                          {aniv.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                            {aniv.nome}
                          </p>
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-semibold ${aniv.tipo === 'voluntario' ? 'bg-[#F2632D]/10 text-[#F2632D]' : 'bg-[#93368F]/10 text-[#93368F]'}`}>
                            {aniv.tipo === 'voluntario' ? 'Voluntário' : 'Beneficiário'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="px-2 py-1 rounded-lg text-xs font-bold bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] font-mono-data">
                          🎉 {aniv.diaMes}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Card 2: Galeria & Pastas no Google Drive do Ádapo */}
            <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
                      Galeria & Google Drive
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)]">Acervo e documentos na nuvem</p>
                  </div>
                </div>
              </div>

              {/* Lista de Pastas Rápidas */}
              <div className="space-y-2">
                <a
                  href="https://drive.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)] transition-colors flex items-center justify-between gap-2 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ImageIcon className="w-4 h-4 text-[#F2632D] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                        Fotos & Mídias das Oficinas
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)]">Registros fotográficos dos projetos</p>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--color-primary)] shrink-0" />
                </a>

                <a
                  href="https://drive.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)] transition-colors flex items-center justify-between gap-2 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ShieldCheck className="w-4 h-4 text-[#93368F] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                        Termos de Imagem & Autorizações
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)]">Documentos assinados pelas famílias</p>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--color-primary)] shrink-0" />
                </a>

                <a
                  href="https://drive.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)] transition-colors flex items-center justify-between gap-2 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-[#1C9C82] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                        Documentos Institucionais & Atas
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)]">Estatuto, atas e relatórios oficiais</p>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--color-primary)] shrink-0" />
                </a>
              </div>

              {/* Botão de Acesso Geral */}
              <div className="pt-2">
                <a
                  href="https://drive.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors"
                >
                  <span>Abrir Google Drive do Instituto</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
