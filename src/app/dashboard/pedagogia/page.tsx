'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/client';
import { PedagogiaFrequencia } from '@/components/dashboard/pedagogia/PedagogiaFrequencia';
import { PedagogiaDossie } from '@/components/dashboard/pedagogia/PedagogiaDossie';
import { PedagogiaSocioemocional } from '@/components/dashboard/pedagogia/PedagogiaSocioemocional';
import { PedagogiaPlanosAula } from '@/components/dashboard/pedagogia/PedagogiaPlanosAula';
import {
  GraduationCap,
  FolderKanban,
  Users,
  Calendar,
  BookOpen,
  Heart,
  Target,
} from 'lucide-react';

interface ProjetoItem {
  id: string;
  nome: string;
  cor_identificacao?: string;
  status?: string;
  estrutura_objetivos?: any[];
  metas?: string;
}

type TabKey = 'frequencia' | 'dossie' | 'socioemocional' | 'planos_aula';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'frequencia', label: 'Frequência & Chamada', icon: <Calendar className="w-4 h-4" /> },
  { key: 'dossie', label: 'Dossiê do Beneficiário', icon: <Users className="w-4 h-4" /> },
  { key: 'socioemocional', label: 'Acomp. Socioemocional', icon: <Heart className="w-4 h-4" /> },
  { key: 'planos_aula', label: 'Planos de Aula', icon: <BookOpen className="w-4 h-4" /> },
];

export default function PedagogiaPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('frequencia');
  const [projetos, setProjetos] = useState<ProjetoItem[]>([]);
  const [selectedProjetoId, setSelectedProjetoId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Dados do projeto selecionado
  const [inscritos, setInscritos] = useState<any[]>([]);
  const [acoes, setAcoes] = useState<any[]>([]);
  const [metas, setMetas] = useState<any[]>([]);
  const [voluntarios, setVoluntarios] = useState<any[]>([]);

  // 1. Carregar lista de projetos sociais
  const carregarProjetos = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('projetos_sociais')
      .select('id, nome, cor_identificacao, status, estrutura_objetivos, metas')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      setProjetos(data);
      if (!selectedProjetoId) {
        setSelectedProjetoId(data[0].id);
      }
    }

    // Carregar voluntários para selects de responsáveis
    const { data: volData } = await supabase
      .from('voluntarios')
      .select('id, nome_completo, area_atuacao')
      .eq('status', 'ativo');
    if (volData) setVoluntarios(volData);

    setLoading(false);
  };

  useEffect(() => {
    carregarProjetos();
  }, []);

  // 2. Carregar dados específicos do projeto vigente selecionado
  const carregarDadosDoProjeto = async () => {
    if (!selectedProjetoId) return;
    const supabase = createClient();

    // A. Beneficiários inscritos neste projeto
    const { data: inscData } = await supabase
      .from('inscricoes')
      .select('id, beneficiarios(id, nome_completo, data_nascimento, cpf, rg, telefone, email, rua, numero, bairro, comunidade, cidade, uf, contatos_emergencia, observacoes)')
      .eq('projeto_id', selectedProjetoId)
      .eq('status', 'ativo');

    const listaBeneficiarios = (inscData || [])
      .map((item: any) => item.beneficiarios)
      .filter(Boolean);
    setInscritos(listaBeneficiarios);

    // B. Ações / Encontros cadastrados para este projeto
    const { data: acoesData } = await supabase
      .from('acoes_projeto')
      .select('id, nome_acao, data_hora, documento_estruturador')
      .eq('projeto_id', selectedProjetoId)
      .order('data_hora', { ascending: true });
    setAcoes(acoesData || []);

    // C. Metas cadastradas para este projeto
    const proj = projetos.find((p) => p.id === selectedProjetoId);
    if (proj) {
      const metasFormatadas: any[] = [];
      if (Array.isArray(proj.estrutura_objetivos) && proj.estrutura_objetivos.length > 0) {
        proj.estrutura_objetivos.forEach((obj: any) => {
          if (Array.isArray(obj.metas)) {
            obj.metas.forEach((m: any) => {
              metasFormatadas.push({
                id: m.id || crypto.randomUUID(),
                descricao: m.descricao || m.texto || 'Meta sem descrição',
                indicador: m.indicador,
                meta_quantitativa: m.meta_quantitativa,
              });
            });
          }
        });
      }

      // Se houver metas em texto simples e nenhuma estrutura
      if (metasFormatadas.length === 0 && proj.metas) {
        metasFormatadas.push({
          id: 'meta-geral-1',
          descricao: proj.metas,
        });
      }
      setMetas(metasFormatadas);
    }
  };

  useEffect(() => {
    carregarDadosDoProjeto();
  }, [selectedProjetoId, projetos]);

  const projetoAtivo = projetos.find((p) => p.id === selectedProjetoId);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Gestão Pedagógica & Metodologia"
        subtitle="Controle de Frequência, Dossiê do Aluno, Acompanhamento Socioemocional e Planos de Aula"
        action={
          selectedProjetoId ? (
            <Link href={`/dashboard/projetos/${selectedProjetoId}`}>
              <Button variant="secondary" size="sm" icon={<FolderKanban className="w-4 h-4" />}>
                Ver Projeto Completo
              </Button>
            </Link>
          ) : null
        }
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-5 flex-1 overflow-y-auto">
        {/* ═══════════════════════════════════════════════════════════════
            BLOCO 1: SELETOR DE PROJETO + MÉTRICAS RÁPIDAS
        ═══════════════════════════════════════════════════════════════ */}
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] overflow-hidden">
          {/* Cabeçalho do seletor */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] block">
                  Projeto Social Vigente
                </span>
                {loading ? (
                  <div className="text-xs text-[var(--text-muted)]">Carregando projetos...</div>
                ) : projetos.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] italic">
                    Nenhum projeto cadastrado no sistema.
                  </p>
                ) : (
                  <select
                    value={selectedProjetoId}
                    onChange={(e) => setSelectedProjetoId(e.target.value)}
                    className="mt-0.5 w-full max-w-xs px-3 py-1.5 rounded-lg text-sm font-bold bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] cursor-pointer transition-all"
                  >
                    {projetos.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.nome} ({proj.status || 'Ativo'})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Indicadores rápidos */}
          {projetoAtivo && (
            <div className="grid grid-cols-3 border-t border-[var(--border-default)]">
              <div className="p-3 sm:p-4 text-center border-r border-[var(--border-default)] last:border-r-0">
                <Users className="w-4 h-4 text-[var(--text-muted)] mx-auto mb-1" />
                <span className="text-lg sm:text-xl font-bold text-[var(--text-primary)] block leading-tight">{inscritos.length}</span>
                <span className="text-[10px] sm:text-[11px] text-[var(--text-muted)] font-medium">Inscritos</span>
              </div>
              <div className="p-3 sm:p-4 text-center border-r border-[var(--border-default)] last:border-r-0">
                <Calendar className="w-4 h-4 text-[var(--text-muted)] mx-auto mb-1" />
                <span className="text-lg sm:text-xl font-bold text-[var(--text-primary)] block leading-tight">{acoes.length}</span>
                <span className="text-[10px] sm:text-[11px] text-[var(--text-muted)] font-medium">Encontros</span>
              </div>
              <div className="p-3 sm:p-4 text-center">
                <Target className="w-4 h-4 text-[var(--text-muted)] mx-auto mb-1" />
                <span className="text-lg sm:text-xl font-bold text-[var(--text-primary)] block leading-tight">{metas.length}</span>
                <span className="text-[10px] sm:text-[11px] text-[var(--text-muted)] font-medium">Metas</span>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            BLOCO 2: NAVEGAÇÃO POR ABAS
        ═══════════════════════════════════════════════════════════════ */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
          {TABS.map((tab, idx) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                activeTab === tab.key
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{idx + 1}.</span> {tab.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            BLOCO 3: CONTEÚDO DA ABA ATIVA
        ═══════════════════════════════════════════════════════════════ */}
        {!selectedProjetoId ? (
          <div className="p-12 rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] text-center">
            <GraduationCap className="w-10 h-10 mx-auto text-[var(--text-muted)] opacity-40 mb-3" />
            <p className="text-sm font-semibold text-[var(--text-secondary)]">
              Selecione um projeto acima para gerenciar a pedagogia.
            </p>
          </div>
        ) : (
          <div>
            {activeTab === 'frequencia' && (
              <PedagogiaFrequencia
                projetoId={selectedProjetoId}
                projetoNome={projetoAtivo?.nome || 'Projeto Social'}
                acoes={acoes}
                inscritos={inscritos}
                onRefresh={carregarDadosDoProjeto}
              />
            )}

            {activeTab === 'dossie' && (
              <PedagogiaDossie
                projetoId={selectedProjetoId}
                projetoNome={projetoAtivo?.nome || 'Projeto Social'}
                inscritos={inscritos}
              />
            )}

            {activeTab === 'socioemocional' && (
              <PedagogiaSocioemocional
                projetoId={selectedProjetoId}
                projetoNome={projetoAtivo?.nome || 'Projeto Social'}
                inscritos={inscritos}
                voluntarios={voluntarios}
                onRefresh={carregarDadosDoProjeto}
              />
            )}

            {activeTab === 'planos_aula' && (
              <PedagogiaPlanosAula
                projetoId={selectedProjetoId}
                projetoNome={projetoAtivo?.nome || 'Projeto Social'}
                metas={metas}
                acoes={acoes}
                voluntarios={voluntarios}
                onRefresh={carregarDadosDoProjeto}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
