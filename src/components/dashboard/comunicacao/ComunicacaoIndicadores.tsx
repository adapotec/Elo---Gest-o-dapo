'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  TrendingUp,
  RefreshCw,
  Settings,
  Share2,
  Users,
  Eye,
  Heart,
  MousePointerClick,
  Video,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  Calendar,
  Save,
  X,
  ExternalLink,
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
  onRefresh: () => void;
  onSaveMetricas: (metricas: MetricasRedeRecord) => Promise<void>;
  onSaveMetaConfig: (config: MetaConfigRecord) => Promise<void>;
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
  onSaveMetricas,
  onSaveMetaConfig,
}: ComunicacaoIndicadoresProps) {
  const agora = new Date();
  const mesAtual = agora.getMonth() + 1;
  const anoAtual = agora.getFullYear();

  const [selectedMes, setSelectedMes] = useState(mesAtual);
  const [selectedAno, setSelectedAno] = useState(anoAtual);

  // Métrica vigente
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
      novos_seguidores: 180,
      fonte: 'manual' as const,
    };
  }, [metricas, selectedMes, selectedAno]);

  // Modal de Configuração da Meta
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [inputAccountId, setInputAccountId] = useState(metaConfig?.instagram_account_id || '');
  const [inputToken, setInputToken] = useState(metaConfig?.access_token || '');
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Modal de Ajuste Manual de Métricas
  const [showEditMetricasModal, setShowEditMetricasModal] = useState(false);
  const [formSeguidores, setFormSeguidores] = useState(metricaVigente.seguidores);
  const [formAlcance, setFormAlcance] = useState(metricaVigente.alcance_mensal);
  const [formImpressoes, setFormImpressoes] = useState(metricaVigente.impressoes);
  const [formEngajamento, setFormEngajamento] = useState(metricaVigente.taxa_engajamento);
  const [formReels, setFormReels] = useState(metricaVigente.visualizacoes_reels);
  const [formCliques, setFormCliques] = useState(metricaVigente.cliques_bio);
  const [formNovos, setFormNovos] = useState(metricaVigente.novos_seguidores || 0);

  // Sincronizar via API da Meta
  const handleSyncMeta = async () => {
    if (!metaConfig?.access_token || !metaConfig?.instagram_account_id) {
      setShowConfigModal(true);
      return;
    }

    setSyncing(true);
    setSyncStatus('Consultando dados no Meta Graph API...');
    try {
      const resp = await fetch('/api/meta/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync_metrics',
          accessToken: metaConfig.access_token,
          accountId: metaConfig.instagram_account_id,
        }),
      });

      const resData = await resp.json();
      if (!resp.ok) {
        throw new Error(resData.error || 'Erro ao sincronizar com o Instagram.');
      }

      await onSaveMetricas(resData.metrics);
      await onSaveMetaConfig({
        ...metaConfig,
        ultima_sincronizacao: new Date().toISOString(),
        status_conexao: 'conectado',
      });

      setSyncStatus('Sincronização concluída com sucesso!');
      setTimeout(() => setSyncStatus(null), 4000);
      onRefresh();
    } catch (err: any) {
      alert('Falha na sincronização: ' + err.message);
      setSyncStatus(null);
    } finally {
      setSyncing(false);
    }
  };

  // Salvar Credenciais da Meta
  const handleSaveMetaCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncing(true);

    try {
      // Testa a conexão antes de salvar
      const resp = await fetch('/api/meta/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_connection',
          accessToken: inputToken.trim(),
          accountId: inputAccountId.trim(),
        }),
      });

      const resData = await resp.json();
      if (!resp.ok) {
        throw new Error(resData.error || 'Token ou ID do Instagram inválido.');
      }

      await onSaveMetaConfig({
        instagram_account_id: inputAccountId.trim(),
        access_token: inputToken.trim(),
        status_conexao: 'conectado',
        ultima_sincronizacao: new Date().toISOString(),
      });

      setShowConfigModal(false);
      alert(`Conectado com sucesso à conta @${resData.account?.username || 'Instagram'}!`);
      onRefresh();
    } catch (err: any) {
      alert('Erro na validação da Meta: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  // Salvar Ajustes Manuais
  const handleSaveManualMetricas = async () => {
    await onSaveMetricas({
      mes: selectedMes,
      ano: selectedAno,
      seguidores: Number(formSeguidores) || 0,
      alcance_mensal: Number(formAlcance) || 0,
      impressoes: Number(formImpressoes) || 0,
      taxa_engajamento: Number(formEngajamento) || 0,
      visualizacoes_reels: Number(formReels) || 0,
      cliques_bio: Number(formCliques) || 0,
      novos_seguidores: Number(formNovos) || 0,
      fonte: 'manual',
    });
    setShowEditMetricasModal(false);
    onRefresh();
  };

  // Estatísticas de Visibilidade por Projeto Social
  const visibilidadePorProjeto = useMemo(() => {
    const totalPosts = conteudos.length || 1;

    return projetos.map((proj) => {
      const postsDoProj = conteudos.filter((c) => c.projeto_id === proj.id);
      const qtdPublicados = postsDoProj.filter((c) => c.status === 'publicado').length;
      const percVolume = Math.round((postsDoProj.length / totalPosts) * 100);

      // Estimativa proporcional de alcance
      const alcanceEstimado = Math.round((metricaVigente.alcance_mensal * (postsDoProj.length / totalPosts)) || 0);

      return {
        id: proj.id,
        nome: proj.nome,
        cor: proj.cor_identificacao || '#F2632D',
        totalPosts: postsDoProj.length,
        publicados: qtdPublicados,
        percVolume,
        alcanceEstimado,
      };
    }).sort((a, b) => b.totalPosts - a.totalPosts);
  }, [projetos, conteudos, metricaVigente]);

  return (
    <div className="space-y-6">
      {/* ── 1. BARRA DE INTEGRAÇÃO COM INSTAGRAM / META & SELETOR DE MÊS ── */}
      <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status da Conexão */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <InstagramIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-sm sm:text-base text-[var(--text-primary)]">
                Instagram Institucional
              </h3>
              {metaConfig?.status_conexao === 'conectado' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Meta API Conectada
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-[var(--text-muted)] border border-[var(--border-default)]">
                  Modo Manual / Desconectado
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              {metaConfig?.ultima_sincronizacao
                ? `Última sincronização: ${new Date(metaConfig.ultima_sincronizacao).toLocaleString('pt-BR')}`
                : 'Métricas atualizadas mensalmente.'}
            </p>
          </div>
        </div>

        {/* Ações: Sincronizar, Configurar e Selecionar Mês */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
          <select
            value={selectedMes}
            onChange={(e) => setSelectedMes(Number(e.target.value))}
            className="px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-bold cursor-pointer"
          >
            {MESES_NOMES.map((m, idx) => (
              <option key={idx} value={idx + 1}>
                {m} {selectedAno}
              </option>
            ))}
          </select>

          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-[var(--color-primary)]' : ''}`} />}
            onClick={handleSyncMeta}
            disabled={syncing}
            title="Sincronizar dados automaticamente com o Instagram"
          >
            {syncing ? 'Sincronizando...' : 'Sincronizar Meta'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            icon={<Settings className="w-3.5 h-3.5" />}
            onClick={() => {
              setInputAccountId(metaConfig?.instagram_account_id || '');
              setInputToken(metaConfig?.access_token || '');
              setShowConfigModal(true);
            }}
            title="Configurar Chaves da Meta API"
          >
            Configurar API
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFormSeguidores(metricaVigente.seguidores);
              setFormAlcance(metricaVigente.alcance_mensal);
              setFormImpressoes(metricaVigente.impressoes);
              setFormEngajamento(metricaVigente.taxa_engajamento);
              setFormReels(metricaVigente.visualizacoes_reels);
              setFormCliques(metricaVigente.cliques_bio);
              setFormNovos(metricaVigente.novos_seguidores || 0);
              setShowEditMetricasModal(true);
            }}
          >
            Ajustar Valores
          </Button>
        </div>
      </div>

      {syncStatus && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold animate-in fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {syncStatus}
        </div>
      )}

      {/* ── 2. CARDS DE KPIS DE ALTO IMPACTO (INSTAGRAM & REDES) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Seguidores</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl font-display font-extrabold text-[var(--text-primary)]">
            {metricaVigente.seguidores.toLocaleString('pt-BR')}
          </p>
          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
            +{metricaVigente.novos_seguidores || 0} neste mês
          </span>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Alcance Mensal</span>
            <Share2 className="w-4 h-4 text-[#F2632D]" />
          </div>
          <p className="text-xl font-display font-extrabold text-[#F2632D]">
            {metricaVigente.alcance_mensal.toLocaleString('pt-BR')}
          </p>
          <span className="text-[10px] text-[var(--text-muted)]">Contas alcançadas</span>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Impressões</span>
            <Eye className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-display font-extrabold text-blue-600">
            {metricaVigente.impressoes.toLocaleString('pt-BR')}
          </p>
          <span className="text-[10px] text-[var(--text-muted)]">Visualizações totais</span>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Engajamento</span>
            <Heart className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xl font-display font-extrabold text-rose-600">
            {metricaVigente.taxa_engajamento}%
          </p>
          <span className="text-[10px] text-[var(--text-muted)]">Taxa média</span>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Reels Views</span>
            <Video className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-display font-extrabold text-amber-600">
            {metricaVigente.visualizacoes_reels.toLocaleString('pt-BR')}
          </p>
          <span className="text-[10px] text-[var(--text-muted)]">Em vídeos curtos</span>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Cliques na Bio</span>
            <MousePointerClick className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-xl font-display font-extrabold text-teal-600">
            {metricaVigente.cliques_bio.toLocaleString('pt-BR')}
          </p>
          <span className="text-[10px] text-[var(--text-muted)]">Links de doação/inscrição</span>
        </Card>
      </div>

      {/* ── 3. RELATÓRIO DE VISIBILIDADE POR PROJETO SOCIAL ── */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-default)] pb-3">
          <div className="space-y-0.5">
            <h3 className="font-display font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-[var(--color-primary)]" />
              Relatório de Visibilidade por Projeto Social
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Métricas e participação de cada projeto nas redes sociais para prestação de contas a patrocinadores e editais
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {visibilidadePorProjeto.map((proj) => (
            <div
              key={proj.id}
              className="p-3.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/40 space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: proj.cor }} />
                  <span className="font-bold text-[var(--text-primary)]">{proj.nome}</span>
                </div>
                <div className="flex items-center gap-4 text-[11px]">
                  <span className="text-[var(--text-muted)]">
                    <strong>{proj.publicados}</strong> publicados de <strong>{proj.totalPosts}</strong> planejados
                  </span>
                  <span className="font-bold text-[var(--color-primary)]">
                    ~{proj.alcanceEstimado.toLocaleString('pt-BR')} pessoas alcançadas
                  </span>
                </div>
              </div>

              {/* Barra de Progresso de Participação */}
              <div className="w-full h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${proj.percVolume}%`,
                    backgroundColor: proj.cor,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── 4. MODAL: CONFIGURAR CONEXÃO META / INSTAGRAM GRAPH API ── */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center gap-2">
                <InstagramIcon className="w-5 h-5 text-rose-500" />
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                  Conexão Meta Graph API (Instagram)
                </h3>
              </div>
              <button onClick={() => setShowConfigModal(false)} className="p-1 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMetaCredentials} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-300 leading-relaxed">
                Para atualizar métricas automaticamente, vincule a conta Instagram Business/Creator do Instituto Ádapo ao Meta Developer Portal e insira seu <strong>Instagram Business Account ID</strong> e <strong>User Access Token</strong>.
              </div>

              <div>
                <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                  Instagram Account ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 17841400000000000"
                  value={inputAccountId}
                  onChange={(e) => setInputAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-mono-data"
                />
              </div>

              <div>
                <label className="font-semibold text-[var(--text-secondary)] block mb-1">
                  Meta User Access Token *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="EAABw..."
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-mono-data text-[11px] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-default)]">
                <Button variant="secondary" size="sm" onClick={() => setShowConfigModal(false)}>
                  Cancelar
                </Button>
                <Button size="sm" disabled={syncing} icon={<Save className="w-4 h-4" />}>
                  {syncing ? 'Testando Conexão...' : 'Testar & Salvar Conexão'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 5. MODAL: AJUSTE MANUAL DAS MÉTRICAS DO MÊS ── */}
      {showEditMetricasModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                Ajustar Métricas de {MESES_NOMES[selectedMes - 1]} {selectedAno}
              </h3>
              <button onClick={() => setShowEditMetricasModal(false)} className="p-1 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">Seguidores Totais</label>
                  <input
                    type="number"
                    value={formSeguidores}
                    onChange={(e) => setFormSeguidores(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">Novos Seguidores</label>
                  <input
                    type="number"
                    value={formNovos}
                    onChange={(e) => setFormNovos(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">Alcance Mensal</label>
                  <input
                    type="number"
                    value={formAlcance}
                    onChange={(e) => setFormAlcance(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">Impressões Totais</label>
                  <input
                    type="number"
                    value={formImpressoes}
                    onChange={(e) => setFormImpressoes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">Engajamento %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formEngajamento}
                    onChange={(e) => setFormEngajamento(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">Reels Views</label>
                  <input
                    type="number"
                    value={formReels}
                    onChange={(e) => setFormReels(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[var(--text-secondary)] block mb-1">Cliques Bio</label>
                  <input
                    type="number"
                    value={formCliques}
                    onChange={(e) => setFormCliques(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-default)]">
              <Button variant="secondary" size="sm" onClick={() => setShowEditMetricasModal(false)}>
                Cancelar
              </Button>
              <Button size="sm" icon={<Save className="w-4 h-4" />} onClick={handleSaveManualMetricas}>
                Salvar Métricas
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
