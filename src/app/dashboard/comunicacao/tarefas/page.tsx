'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { createClient } from '@/lib/supabase/client';
import {
  ComunicacaoTarefasKanban,
  TarefaAvulsaItem,
  ChecklistItem,
} from '@/components/dashboard/comunicacao/ComunicacaoTarefasKanban';
import { ConteudoItem } from '@/components/dashboard/comunicacao/ComunicacaoCalendario';
import { SolicitacaoComunicacaoItem } from '@/components/dashboard/comunicacao/ComunicacaoTickets';
import { Voluntario } from '@/components/dashboard/voluntarios/VoluntariosEquipe';

const safeSetItem = (key: string, value: any) => {
  try {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  } catch (e) {
    console.warn(`[localStorage] Falha ao salvar chave ${key}:`, e);
  }
};

async function safeFetch<T>(promise: PromiseLike<{ data: T | null; error: any }>, timeoutMs = 8000): Promise<{ data: T | null; error: any }> {
  try {
    const timeout = new Promise<{ data: null; error: any }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error('Timeout') }), timeoutMs)
    );
    return await Promise.race([Promise.resolve(promise), timeout]);
  } catch (err: any) {
    return { data: null, error: err };
  }
}

function TarefasContent() {
  const router = useRouter();
  const supabase = createClient();

  const [tarefas, setTarefas] = useState<TarefaAvulsaItem[]>([]);
  const [conteudos, setConteudos] = useState<ConteudoItem[]>([]);
  const [tickets, setTickets] = useState<SolicitacaoComunicacaoItem[]>([]);
  const [projetos, setProjetos] = useState<{ id: string; nome: string; cor_identificacao?: string }[]>([]);
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregamento inicial em cache (0ms)
  useEffect(() => {
    try {
      const cachedProj = localStorage.getItem('elo_comunicacao_projetos');
      const cachedVol = localStorage.getItem('elo_comunicacao_voluntarios');
      const cachedTar = localStorage.getItem('elo_comunicacao_tarefas');
      const cachedCont = localStorage.getItem('elo_comunicacao_conteudos');
      const cachedTick = localStorage.getItem('elo_comunicacao_tickets');

      if (cachedProj) setProjetos(JSON.parse(cachedProj));
      if (cachedVol) setVoluntarios(JSON.parse(cachedVol));
      if (cachedTar) setTarefas(JSON.parse(cachedTar));
      if (cachedCont) setConteudos(JSON.parse(cachedCont));
      if (cachedTick) setTickets(JSON.parse(cachedTick));

      if (cachedProj || cachedTar || cachedCont || cachedTick) {
        setLoading(false);
      }
    } catch (e) {
      console.warn('Erro ao restaurar cache inicial de tarefas:', e);
    }

    loadNetworkData();
  }, []);

  const loadNetworkData = async () => {
    try {
      const [respProj, respVol, respTar, respCont, respTick] = await Promise.all([
        safeFetch(supabase.from('projetos_sociais').select('id, nome, cor_identificacao').order('nome')),
        safeFetch(supabase.from('voluntarios').select('*').eq('status', 'ativo').order('nome_completo')),
        safeFetch(
          supabase
            .from('tarefas_comunicacao')
            .select('*, projetos_sociais(nome, cor_identificacao), voluntarios(nome_completo, avatar_url)')
            .order('created_at', { ascending: false })
        ),
        safeFetch(
          supabase
            .from('conteudos_comunicacao')
            .select('*, projetos_sociais(nome, cor_identificacao), campanhas_comunicacao(titulo), voluntarios(nome_completo, avatar_url)')
            .order('data_publicacao', { ascending: true })
        ),
        safeFetch(
          supabase
            .from('solicitacoes_comunicacao')
            .select('*, projetos_sociais(nome, cor_identificacao), responsavel:voluntarios!responsavel_comunicacao_id(nome_completo), solicitante:voluntarios!solicitante_id(nome_completo, avatar_url)')
            .order('created_at', { ascending: false })
        ),
      ]);

      if (respProj?.error) console.warn('[Kanban] Erro ao carregar projetos:', respProj.error);
      if (respVol?.error) console.warn('[Kanban] Erro ao carregar voluntários:', respVol.error);
      if (respTar?.error) console.warn('[Kanban] Erro ao carregar tarefas:', respTar.error);
      if (respCont?.error) console.warn('[Kanban] Erro ao carregar conteúdos:', respCont.error);
      if (respTick?.error) console.warn('[Kanban] Erro ao carregar tickets:', respTick.error);

      if (respProj?.data) {
        setProjetos(respProj.data as any);
        safeSetItem('elo_comunicacao_projetos', respProj.data);
      }
      if (respVol?.data) {
        setVoluntarios(respVol.data as Voluntario[]);
        safeSetItem('elo_comunicacao_voluntarios', respVol.data);
      }
      if (respTar?.data) {
        setTarefas(respTar.data as TarefaAvulsaItem[]);
        safeSetItem('elo_comunicacao_tarefas', respTar.data);
      }
      if (respCont?.data) {
        setConteudos(respCont.data as ConteudoItem[]);
        safeSetItem('elo_comunicacao_conteudos', respCont.data);
      }
      if (respTick?.data) {
        setTickets(respTick.data as SolicitacaoComunicacaoItem[]);
        safeSetItem('elo_comunicacao_tickets', respTick.data);
      }
    } catch (err) {
      console.error('Erro na sincronização de dados do Kanban:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTarefa = async (tarefa: Partial<TarefaAvulsaItem>) => {
    try {
      const proj = tarefa.projeto_id !== undefined ? projetos.find((p) => p.id === tarefa.projeto_id) : undefined;
      const vol = tarefa.responsavel_id !== undefined ? voluntarios.find((v) => v.id === tarefa.responsavel_id) : undefined;

      if (tarefa.id && !tarefa.id.startsWith('local-')) {
        const updatePayload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (tarefa.titulo !== undefined) updatePayload.titulo = tarefa.titulo;
        if (tarefa.descricao !== undefined) updatePayload.descricao = tarefa.descricao;
        if (tarefa.status !== undefined) updatePayload.status = tarefa.status;
        if (tarefa.prioridade !== undefined) updatePayload.prioridade = tarefa.prioridade;
        if (tarefa.projeto_id !== undefined) updatePayload.projeto_id = tarefa.projeto_id;
        if (tarefa.responsavel_id !== undefined) updatePayload.responsavel_id = tarefa.responsavel_id;
        if (tarefa.data_limite !== undefined) updatePayload.data_limite = tarefa.data_limite;
        if (tarefa.etiquetas !== undefined) updatePayload.etiquetas = tarefa.etiquetas;
        if (tarefa.checklist !== undefined) updatePayload.checklist = tarefa.checklist;

        setTarefas((prev) =>
          prev.map((t) =>
            t.id === tarefa.id
              ? ({
                  ...t,
                  ...updatePayload,
                  ...(tarefa.projeto_id !== undefined ? { projetos_sociais: proj ? { nome: proj.nome, cor_identificacao: proj.cor_identificacao } : null } : {}),
                  ...(tarefa.responsavel_id !== undefined ? { voluntarios: vol ? { nome_completo: vol.nome_completo, avatar_url: vol.avatar_url } : null } : {}),
                } as TarefaAvulsaItem)
              : t
          )
        );

        await supabase.from('tarefas_comunicacao').update(updatePayload).eq('id', tarefa.id);
      } else {
        const payload: Record<string, any> = {
          titulo: tarefa.titulo || 'Nova Tarefa',
          descricao: tarefa.descricao || null,
          status: tarefa.status || 'a_fazer',
          prioridade: tarefa.prioridade || 'normal',
          projeto_id: tarefa.projeto_id || null,
          responsavel_id: tarefa.responsavel_id || null,
          data_limite: tarefa.data_limite || null,
          etiquetas: tarefa.etiquetas || [],
          checklist: tarefa.checklist || [],
          updated_at: new Date().toISOString(),
        };

        const tempId = `local-${Date.now()}`;
        const tempItem: TarefaAvulsaItem = {
          id: tempId,
          created_at: new Date().toISOString(),
          ...payload,
          projetos_sociais: proj ? { nome: proj.nome, cor_identificacao: proj.cor_identificacao } : null,
          voluntarios: vol ? { nome_completo: vol.nome_completo, avatar_url: vol.avatar_url } : null,
        } as unknown as TarefaAvulsaItem;

        setTarefas((prev) => [tempItem, ...prev]);

        const { data, error } = await supabase
          .from('tarefas_comunicacao')
          .insert([payload])
          .select('*, projetos_sociais(nome, cor_identificacao), voluntarios(nome_completo, avatar_url)')
          .single();

        if (!error && data) {
          setTarefas((prev) => prev.map((t) => (t.id === tempId ? (data as TarefaAvulsaItem) : t)));
        }
      }
    } catch (err: any) {
      console.error('Erro ao salvar tarefa:', err);
      alert('Erro ao salvar tarefa: ' + err.message);
    }
  };

  const handleDeleteTarefa = async (id: string) => {
    setTarefas((prev) => prev.filter((t) => t.id !== id));
    await supabase.from('tarefas_comunicacao').delete().eq('id', id);
  };

  const handleUpdateConteudoStatus = async (id: string, status: ConteudoItem['status']) => {
    setConteudos((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    await supabase.from('conteudos_comunicacao').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  };

  const handleUpdateTicketStatus = async (id: string, status: SolicitacaoComunicacaoItem['status']) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    await supabase.from('solicitacoes_comunicacao').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  };

  // Atualização em tempo real de Checklist para qualquer item
  const handleUpdateChecklist = async (
    id: string,
    origem: 'conteudo' | 'ticket' | 'tarefa',
    checklist: ChecklistItem[]
  ) => {
    try {
      if (origem === 'tarefa') {
        setTarefas((prev) => prev.map((t) => (t.id === id ? { ...t, checklist } : t)));
        await supabase.from('tarefas_comunicacao').update({ checklist, updated_at: new Date().toISOString() }).eq('id', id);
      } else if (origem === 'conteudo') {
        setConteudos((prev) => prev.map((c) => (c.id === id ? ({ ...c, checklist } as any) : c)));
        await supabase.from('conteudos_comunicacao').update({ checklist, updated_at: new Date().toISOString() }).eq('id', id);
      } else if (origem === 'ticket') {
        setTickets((prev) => prev.map((t) => (t.id === id ? ({ ...t, checklist } as any) : t)));
        await supabase.from('solicitacoes_comunicacao').update({ checklist, updated_at: new Date().toISOString() }).eq('id', id);
      }
    } catch (err) {
      console.error('Erro ao atualizar checklist:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Quadro de Tarefas"
        subtitle="Sessão Trello da Comunicação: Produções das Redes Sociais, Demandas e Tarefas Operacionais"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-[1700px] w-full mx-auto space-y-6 flex-1 overflow-y-auto">
        <ComunicacaoTarefasKanban
          tarefas={tarefas}
          conteudos={conteudos}
          tickets={tickets}
          projetos={projetos}
          voluntarios={voluntarios}
          loading={loading && tarefas.length === 0 && conteudos.length === 0}
          canEdit={true}
          onRefresh={loadNetworkData}
          onSaveTarefa={handleSaveTarefa}
          onDeleteTarefa={handleDeleteTarefa}
          onUpdateConteudoStatus={handleUpdateConteudoStatus}
          onUpdateTicketStatus={handleUpdateTicketStatus}
          onUpdateChecklist={handleUpdateChecklist}
          onNavigateToTab={(tab) => {
            if (tab === 'tickets') {
              router.push('/dashboard/comunicacao/tickets');
            } else {
              router.push(`/dashboard/comunicacao/gestao?tab=${tab}`);
            }
          }}
        />
      </div>
    </div>
  );
}

export default function TarefasPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--text-muted)]">Carregando Quadro de Tarefas...</div>}>
      <TarefasContent />
    </Suspense>
  );
}
