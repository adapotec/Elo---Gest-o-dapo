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
import { FieldInfo } from '@/components/ui/FieldInfo';
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

interface TabItem {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}

const TABS: TabItem[] = [
  { key: 'frequencia', label: 'Frequência & Chamada', icon: Calendar, color: '#F2632D' },
  { key: 'dossie', label: 'Dossiê do Beneficiário', icon: Users, color: '#1C9C82' },
  { key: 'socioemocional', label: 'Acomp. Socioemocional', icon: Heart, color: '#93368F' },
  { key: 'planos_aula', label: 'Planos de Aula', icon: BookOpen, color: '#3B82F6' },
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
                descricao: m.descricao_meta || m.descricao || m.texto || 'Meta sem descrição',
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

      <div className="p-8 max-w-6xl space-y-6 flex-1 overflow-y-auto">
        {/* ═══════════════════════════════════════════════════════════════
            CABEÇALHO DO PROJETO VIGENTE (PADRÃO IDÊNTICO A PROJETOS)
        ═══════════════════════════════════════════════════════════════ */}
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] overflow-hidden transition-all">
          <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0 transition-transform hover:scale-105"
                style={{ backgroundColor: projetoAtivo?.cor_identificacao || '#3B82F6' }}
              >
                <GraduationCap className="w-7 h-7" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {projetos.length > 1 ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedProjetoId}
                        onChange={(e) => setSelectedProjetoId(e.target.value)}
                        className="font-display font-bold text-xl text-[var(--text-primary)] bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)] border border-[var(--border-default)] px-3 py-1 rounded-xl focus:outline-none focus:border-[var(--color-primary)] cursor-pointer transition-all"
                      >
                        {projetos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <h2 className="font-display font-bold text-xl text-[var(--text-primary)] truncate">
                      {projetoAtivo?.nome || 'Carregando Projeto...'}
                    </h2>
                  )}
                  <Badge variant={projetoAtivo?.status === 'ativo' ? 'success' : 'warning'}>
                    {(projetoAtivo?.status || 'ATIVO').toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Inscritos: <strong className="text-[var(--text-secondary)] font-mono-data">{inscritos.length}</strong> • Encontros: <strong className="text-[var(--text-secondary)] font-mono-data">{acoes.length}</strong> • Metas: <strong className="text-[var(--text-secondary)] font-mono-data">{metas.length}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {selectedProjetoId && (
                <Link href={`/dashboard/projetos/${selectedProjetoId}`}>
                  <Button variant="secondary" size="sm" icon={<FolderKanban className="w-4 h-4" />}>
                    Ver Projeto Completo
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            PAINEL DE NAVEGAÇÃO SUPERIOR POR ÁREAS (PADRÃO IDÊNTICO A PROJETOS)
        ═══════════════════════════════════════════════════════════════ */}
        <div className="p-2 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {TABS.map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold cursor-pointer ${
                    isActive
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-sm scale-[1.02]'
                      : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <IconComp className="w-5 h-5" style={{ color: isActive ? 'var(--color-primary)' : tab.color }} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
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
