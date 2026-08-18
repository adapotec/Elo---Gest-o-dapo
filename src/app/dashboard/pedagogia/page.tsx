'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface ProjetoItem {
  id: string;
  nome: string;
  cor_identificacao?: string;
  status?: string;
  estrutura_objetivos?: any[];
  metas?: string;
}

export default function PedagogiaPage() {
  const [activeTab, setActiveTab] = useState<'frequencia' | 'dossie' | 'socioemocional' | 'planos_aula'>('frequencia');
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

      <div className="p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 flex-1 overflow-y-auto">
        {/* BARRA SUPERIOR: SELETOR GLOBAL DE PROJETO VIGENTE & MÉTRICAS */}
        <Card className="p-5 border-[var(--border-default)] bg-[var(--bg-elevated)] space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
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
                    className="px-3 py-1.5 rounded-xl text-sm font-bold bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] cursor-pointer"
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

            {/* Resumo de Indicadores Rápidos do Projeto Vigente */}
            {projetoAtivo && (
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-center">
                  <span className="text-[10px] text-[var(--text-muted)] block font-medium">Inscritos</span>
                  <span className="text-sm font-bold text-[var(--text-primary)]">{inscritos.length}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-center">
                  <span className="text-[10px] text-[var(--text-muted)] block font-medium">Encontros</span>
                  <span className="text-sm font-bold text-[var(--text-primary)]">{acoes.length}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-center">
                  <span className="text-[10px] text-[var(--text-muted)] block font-medium">Metas</span>
                  <span className="text-sm font-bold text-[var(--text-primary)]">{metas.length}</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* NAVEGAÇÃO ENTRE AS 4 ABAS PEDAGÓGICAS */}
        <div className="flex border-b border-[var(--border-default)] gap-2 overflow-x-auto text-xs pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('frequencia')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap border ${
              activeTab === 'frequencia'
                ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-default)] hover:text-[var(--text-primary)] hover:border-[var(--color-primary)]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            1. Frequência & Chamada
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dossie')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap border ${
              activeTab === 'dossie'
                ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-default)] hover:text-[var(--text-primary)] hover:border-[var(--color-primary)]'
            }`}
          >
            <Users className="w-4 h-4" />
            2. Dossiê do Beneficiário
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('socioemocional')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap border ${
              activeTab === 'socioemocional'
                ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-default)] hover:text-[var(--text-primary)] hover:border-[var(--color-primary)]'
            }`}
          >
            <Heart className="w-4 h-4" />
            3. Acompanhamento Socioemocional
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('planos_aula')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap border ${
              activeTab === 'planos_aula'
                ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-default)] hover:text-[var(--text-primary)] hover:border-[var(--color-primary)]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            4. Planos de Aula
          </button>
        </div>

        {/* CONTEÚDO DA ABA ATIVA */}
        {!selectedProjetoId ? (
          <Card className="p-12 text-center border-[var(--border-default)] bg-[var(--bg-elevated)]">
            <p className="text-sm font-semibold text-[var(--text-secondary)]">Selecione um projeto acima para gerenciar a pedagogia.</p>
          </Card>
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
