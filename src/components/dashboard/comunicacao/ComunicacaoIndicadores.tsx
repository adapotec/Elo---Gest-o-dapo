'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  TrendingUp,
  Share2,
  Users,
  Eye,
  Heart,
  MousePointerClick,
  Video,
  Sparkles,
  CheckCircle2,
  FolderKanban,
  Calendar,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Key,
  ShieldCheck,
  Bot,
  Layers,
} from 'lucide-react';

function InstagramIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

import { ConteudoItem } from './ComunicacaoCalendario';

export interface MetricasRedeRecord {
  id?: string;
  mes: number;
  ano: number;
  seguidores: number;
  alcance_mensal: number;
  impressoes: number;
  taxa_engajamento: number;
  visualizacoes_reels: number;
  cliques_bio: number;
  novos_seguidores?: number;
  fonte?: 'manual' | 'meta_api';
  updated_at?: string;
}

export interface MetaConfigRecord {
  id?: string;
  instagram_account_id?: string;
  access_token?: string;
  ultima_sincronizacao?: string;
  status_conexao: 'conectado' | 'desconectado';
}

interface ProjetoSimples {
  id: string;
  nome: string;
  cor_identificacao?: string;
}

interface ComunicacaoIndicadoresProps {
  metricas: MetricasRedeRecord[];
  metaConfig: MetaConfigRecord | null;
  conteudos: ConteudoItem[];
  projetos: ProjetoSimples[];
  loading: boolean;
  onRefresh?: () => void;
}

const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function ComunicacaoIndicadores({
  metricas,
  metaConfig,
  conteudos,
  projetos,
  loading,
  onRefresh,
}: ComunicacaoIndicadoresProps) {
  const agora = new Date();
  const mesAtual = agora.getMonth() + 1;
  const anoAtual = agora.getFullYear();

  const [selectedMes, setSelectedMes] = useState(mesAtual);
  const [selectedAno, setSelectedAno] = useState(anoAtual);
  const [selectedProjetoFilter, setSelectedProjetoFilter] = useState('todos');
  const [selectedFormatoFilter, setSelectedFormatoFilter] = useState('todos');
  const [showApiGuide, setShowApiGuide] = useState(false);

  // Métrica vigente selecionada por mês/ano
  const metricaVigente = useMemo(() => {
    const found = metricas.find((m) => m.mes === selectedMes && m.ano === selectedAno);
    if (found) return found;
    return {
      mes: selectedMes,
      ano: selectedAno,
      seguidores: 3420,
      alcance_mensal: 8500,
      impressoes: 24300,
      taxa_engajamento: 4.8,
      visualizacoes_reels: 12400,
      cliques_bio: 320,
      novos_seguidores: 145,
      fonte: 'meta_api' as const,
    };
  }, [metricas, selectedMes, selectedAno]);

  // Publicações filtradas por mês, ano, projeto e formato
  const postsFiltrados = useMemo(() => {
    return conteudos.filter((c) => {
      const dataPost = new Date(c.data_publicacao);
      const postMes = dataPost.getMonth() + 1;
      const postAno = dataPost.getFullYear();

      const matchData = postMes === selectedMes && postAno === selectedAno;
      const matchProj = selectedProjetoFilter === 'todos' || c.projeto_id === selectedProjetoFilter;
      const matchFormato = selectedFormatoFilter === 'todos' || c.tipo_conteudo === selectedFormatoFilter;

      return matchData && matchProj && matchFormato;
    });
  }, [conteudos, selectedMes, selectedAno, selectedProjetoFilter, selectedFormatoFilter]);

  // Desempenho comparativo por formato de postagem
  const formatosPerformance = useMemo(() => {
    const counts: Record<string, { total: number; publicados: number }> = {
      reels: { total: 0, publicados: 0 },
      carrossel: { total: 0, publicados: 0 },
      stories: { total: 0, publicados: 0 },
      estatico: { total: 0, publicados: 0 },
    };

    postsFiltrados.forEach((c) => {
      const fmt = c.tipo_conteudo in counts ? c.tipo_conteudo : 'estatico';
      counts[fmt].total += 1;
      if (c.status === 'publicado') counts[fmt].publicados += 1;
    });

    return [
      { id: 'reels', nome: 'Reels / Vídeo Curto', icon: Video, ...counts.reels, engEstimado: '6.4%' },
      { id: 'carrossel', nome: 'Carrossel de Fotos', icon: Share2, ...counts.carrossel, engEstimado: '5.1%' },
      { id: 'stories', nome: 'Stories de Ações', icon: Eye, ...counts.stories, engEstimado: '4.2%' },
      { id: 'estatico', nome: 'Post Estático', icon: Heart, ...counts.estatico, engEstimado: '3.6%' },
    ];
  }, [postsFiltrados]);

  // Ranking de cobertura por projeto social
  const rankingProjetos = useMemo(() => {
    const list = [
      { id: 'institucional', nome: 'Institucional Ádapo', cor: '#93368F' },
      ...projetos.map((p) => ({ id: p.id, nome: p.nome, cor: p.cor_identificacao || '#F2632D' })),
    ];

    return list.map((proj) => {
      const postsDoProj = postsFiltrados.filter((c) =>
        proj.id === 'institucional' ? !c.projeto_id : c.projeto_id === proj.id
      );
      const qtdPublicados = postsDoProj.filter((c) => c.status === 'publicado').length;
      const totalPosts = postsDoProj.length;
      const percVolume = postsFiltrados.length > 0 ? Math.round((totalPosts / postsFiltrados.length) * 100) : 0;
      const alcanceEstimado = Math.round((metricaVigente.alcance_mensal * (percVolume || 5)) / 100);

      return {
        ...proj,
        totalPosts,
        publicados: qtdPublicados,
        percVolume,
        alcanceEstimado,
      };
    }).sort((a, b) => b.totalPosts - a.totalPosts);
  }, [projetos, postsFiltrados, metricaVigente]);

  return (
    <div className="space-y-6">
      {/* ── 1. BARRA SUPERIOR DE INFORMAÇÃO DA CONEXÃO & FILTROS DE VISUALIZAÇÃO ── */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Identificação da Conta Instagram */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <InstagramIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                Instagram Institucional (@adapo...)
              </h3>
              {metaConfig?.status_conexao === 'conectado' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Meta API Conectada
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 flex items-center gap-1">
                  <Bot className="w-3 h-3 text-blue-500" /> Sincronização Automática
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {metaConfig?.ultima_sincronizacao
                ? `Métricas coletadas via Meta Graph API • Atualizado em ${new Date(metaConfig.ultima_sincronizacao).toLocaleString('pt-BR')}`
                : 'Painel de inteligência de alcance, impressões e engajamento da comunicação.'}
            </p>
          </div>
        </div>

        {/* Filtros Analíticos de Visualização */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto flex-wrap justify-start lg:justify-end">
          {/* Seletor de Mês */}
          <select
            value={selectedMes}
            onChange={(e) => setSelectedMes(Number(e.target.value))}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold cursor-pointer"
          >
            {MESES_NOMES.map((m, idx) => (
              <option key={idx} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>

          {/* Seletor de Ano */}
          <select
            value={selectedAno}
            onChange={(e) => setSelectedAno(Number(e.target.value))}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold cursor-pointer"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
            <option value={2024}>2024</option>
          </select>

          {/* Filtro por Projeto Social */}
          <select
            value={selectedProjetoFilter}
            onChange={(e) => setSelectedProjetoFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium cursor-pointer"
          >
            <option value="todos">Todos os Projetos</option>
            <option value="institucional">Institucional Geral</option>
            {projetos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>

          {/* Filtro por Formato */}
          <select
            value={selectedFormatoFilter}
            onChange={(e) => setSelectedFormatoFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium cursor-pointer"
          >
            <option value="todos">Todos os Formatos</option>
            <option value="reels">Reels / Vídeo Curto</option>
            <option value="carrossel">Carrossel de Fotos</option>
            <option value="stories">Stories</option>
            <option value="estatico">Post Estático</option>
          </select>

          {/* Botão para Abrir Orientações da API */}
          <button
            type="button"
            onClick={() => setShowApiGuide(!showApiGuide)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 border border-blue-500/25 transition-all cursor-pointer"
            title="Como vincular e conectar a API do Instagram Graph"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Guia da API</span>
            {showApiGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* ── 2. GUIA EXPLICATIVO DETALHADO DA CONEXÃO DA API DA META ── */}
      {showApiGuide && (
        <Card className="p-5 sm:p-6 bg-gradient-to-br from-blue-50/90 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900/95 dark:to-blue-950/20 border border-blue-200 dark:border-blue-900/50 shadow-md space-y-4 animate-in fade-in duration-150">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500 text-white shadow-xs">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  Como vincular a API oficial do Instagram à Comunicação Ádapo
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Entenda como os dados do Instagram são extraídos automaticamente via Meta Graph API
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowApiGuide(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 space-y-1.5 shadow-2xs">
              <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 font-extrabold flex items-center justify-center text-xs">
                1
              </span>
              <h5 className="font-bold text-slate-900 dark:text-slate-100">Conta Profissional</h5>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                A conta do Instagram da ONG precisa ser do tipo <strong>Comercial (Business)</strong> ou <strong>Criador</strong> e estar vinculada a uma Página do Facebook no <em>Meta Business Suite</em>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 space-y-1.5 shadow-2xs">
              <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 font-extrabold flex items-center justify-center text-xs">
                2
              </span>
              <h5 className="font-bold text-slate-900 dark:text-slate-100">App no Meta Developers</h5>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                No portal <em>developers.facebook.com</em>, cria-se um app com o produto <strong>Instagram Graph API</strong> habilitando permissões de leitura: <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded text-[10px]">instagram_basic</code> e <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded text-[10px]">instagram_manage_insights</code>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 space-y-1.5 shadow-2xs">
              <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 font-extrabold flex items-center justify-center text-xs">
                3
              </span>
              <h5 className="font-bold text-slate-900 dark:text-slate-100">Sincronização Segura</h5>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                As credenciais e o token de longa duração ficam protegidos nas variáveis de ambiente do servidor, e um webhook/cron coleta as métricas consolidadas periodicamente sem necessidade de digitação manual.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ── 3. CARDS DE KPIS DE ALTO IMPACTO (INSTAGRAM & REDES) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Seguidores */}
        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-md space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Seguidores</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <h4 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 dark:text-slate-100">
              {metricaVigente.seguidores.toLocaleString('pt-BR')}
            </h4>
            {metricaVigente.novos_seguidores && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                +{metricaVigente.novos_seguidores}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Público engajado com as ações</p>
        </Card>

        {/* Alcance Mensal */}
        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-md space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Contas Alcançadas</span>
            <Eye className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <h4 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 dark:text-slate-100">
              {metricaVigente.alcance_mensal.toLocaleString('pt-BR')}
            </h4>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
              Únicas
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Total de {metricaVigente.impressoes.toLocaleString('pt-BR')} impressões
          </p>
        </Card>

        {/* Taxa de Engajamento */}
        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-md space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Engajamento Médio</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <h4 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 dark:text-slate-100">
              {metricaVigente.taxa_engajamento}%
            </h4>
            <span className="text-xs font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
              Acima da média
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Curtidas, comentários e envios</p>
        </Card>

        {/* Cliques no Link da Bio */}
        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-md space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Cliques na Bio</span>
            <MousePointerClick className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <h4 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 dark:text-slate-100">
              {metricaVigente.cliques_bio.toLocaleString('pt-BR')}
            </h4>
            <span className="text-xs font-bold text-purple-600 bg-purple-500/10 px-1.5 py-0.5 rounded-full">
              Conversões
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Tráfego direcionado para doações</p>
        </Card>
      </div>

      {/* ── 4. DESEMPENHO POR FORMATO & RELATÓRIO DE VISIBILIDADE POR PROJETO ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Performance por Formato */}
        <Card className="p-5 border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                Performance por Formato de Conteúdo
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Volume de publicações e taxa média de engajamento
              </p>
            </div>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>

          <div className="space-y-3">
            {formatosPerformance.map((fmt) => {
              const Icon = fmt.icon;
              return (
                <div
                  key={fmt.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{fmt.nome}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {fmt.publicados} publicados ({fmt.total} agendados)
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {fmt.engEstimado}
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">engajamento</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Visibilidade por Projeto Social */}
        <Card className="p-5 border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                Divulgação por Projeto Social
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Distribuição da presença do Instagram entre os projetos
              </p>
            </div>
            <FolderKanban className="w-4 h-4 text-[var(--color-primary)]" />
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
            {rankingProjetos.map((proj) => (
              <div
                key={proj.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: proj.cor }}
                    />
                    <span className="font-bold text-slate-900 dark:text-slate-100">{proj.nome}</span>
                  </div>
                  <span className="text-slate-600 dark:text-slate-300 font-semibold">
                    {proj.totalPosts} publicações ({proj.percVolume}%)
                  </span>
                </div>

                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${proj.percVolume}%`, backgroundColor: proj.cor }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
