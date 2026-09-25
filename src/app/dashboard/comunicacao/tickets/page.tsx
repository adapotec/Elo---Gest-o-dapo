'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { createClient } from '@/lib/supabase/client';
import {
  ComunicacaoTickets,
  SolicitacaoComunicacaoItem,
} from '@/components/dashboard/comunicacao/ComunicacaoTickets';
import { Voluntario } from '@/components/dashboard/voluntarios/VoluntariosEquipe';

const safeSetItem = (key: string, value: any) => {
  try {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  } catch (e) {
    console.warn(`[localStorage] Falha ao salvar chave ${key}:`, e);
  }
};

async function safeFetch<T>(
  promise: PromiseLike<{ data: T | null; error: any }>,
  timeoutMs = 8000
): Promise<{ data: T | null; error: any }> {
  try {
    const timeout = new Promise<{ data: null; error: any }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error('Timeout') }), timeoutMs)
    );
    return await Promise.race([Promise.resolve(promise), timeout]);
  } catch (err: any) {
    return { data: null, error: err };
  }
}

function TicketsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const novoParam = searchParams.get('novo') === 'true';

  const [tickets, setTickets] = useState<SolicitacaoComunicacaoItem[]>([]);
  const [projetos, setProjetos] = useState<{ id: string; nome: string; cor_identificacao?: string }[]>([]);
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    try {
      const cachedTick = localStorage.getItem('elo_comunicacao_tickets');
      const cachedProj = localStorage.getItem('elo_comunicacao_projetos');
      const cachedVol = localStorage.getItem('elo_comunicacao_voluntarios');

      if (cachedTick) setTickets(JSON.parse(cachedTick));
      if (cachedProj) setProjetos(JSON.parse(cachedProj));
      if (cachedVol) setVoluntarios(JSON.parse(cachedVol));

      if (cachedTick || cachedProj) {
        setLoading(false);
      }
    } catch (e) {
      console.warn('Erro ao restaurar cache inicial de tickets:', e);
    }

    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [respTick, respProj, respVol] = await Promise.all([
        safeFetch(
          supabase
            .from('solicitacoes_comunicacao')
            .select('id, titulo, descricao_detalhes, status, urgencia, tipo_material, prazo_desejado, publico_alvo, objetivo, links_referencia, observacoes_referencia, resposta_comunicacao, checklist, solicitante_nome, projeto_id, solicitante_id, responsavel_comunicacao_id, conteudo_criado_id, projetos_sociais(nome, cor_identificacao), responsavel:voluntarios!responsavel_comunicacao_id(nome_completo), solicitante:voluntarios!solicitante_id(nome_completo)')
            .order('created_at', { ascending: false })
        ),
        safeFetch(
          supabase
            .from('projetos_sociais')
            .select('id, nome, cor_identificacao')
            .order('nome')
        ),
        safeFetch(
          supabase
            .from('voluntarios')
            .select('id, nome_completo, area_atuacao, funcao, status')
            .eq('status', 'ativo')
            .order('nome_completo')
        ),
      ]);

      if (respTick?.data) {
        setTickets(respTick.data as SolicitacaoComunicacaoItem[]);
        safeSetItem('elo_comunicacao_tickets', respTick.data);
      }
      if (respProj?.data) {
        setProjetos(respProj.data as any);
        safeSetItem('elo_comunicacao_projetos', respProj.data);
      }
      if (respVol?.data) {
        setVoluntarios(respVol.data as Voluntario[]);
        safeSetItem('elo_comunicacao_voluntarios', respVol.data);
      }
    } catch (err) {
      console.error('Erro ao carregar solicitações e tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTicket = async (ticket: Partial<SolicitacaoComunicacaoItem>) => {
    try {
      const proj = ticket.projeto_id !== undefined ? projetos.find((p) => p.id === ticket.projeto_id) : undefined;
      const volResp = ticket.responsavel_comunicacao_id !== undefined ? voluntarios.find((v) => v.id === ticket.responsavel_comunicacao_id) : undefined;

      if (ticket.id && !ticket.id.startsWith('local-')) {
        const updatePayload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (ticket.titulo !== undefined) updatePayload.titulo = ticket.titulo;
        if (ticket.projeto_id !== undefined) updatePayload.projeto_id = ticket.projeto_id;
        if (ticket.solicitante_id !== undefined) updatePayload.solicitante_id = ticket.solicitante_id;
        if (ticket.solicitante_nome !== undefined) updatePayload.solicitante_nome = ticket.solicitante_nome;
        if (ticket.tipo_material !== undefined) updatePayload.tipo_material = ticket.tipo_material;
        if (ticket.publico_alvo !== undefined) updatePayload.publico_alvo = ticket.publico_alvo;
        if (ticket.objetivo !== undefined) updatePayload.objetivo = ticket.objetivo;
        if (ticket.descricao_detalhes !== undefined) updatePayload.descricao_detalhes = ticket.descricao_detalhes;
        if (ticket.prazo_desejado !== undefined) updatePayload.prazo_desejado = ticket.prazo_desejado;
        if (ticket.urgencia !== undefined) updatePayload.urgencia = ticket.urgencia;
        if (ticket.links_referencia !== undefined) updatePayload.links_referencia = ticket.links_referencia;
        if (ticket.observacoes_referencia !== undefined) updatePayload.observacoes_referencia = ticket.observacoes_referencia;
        if (ticket.status !== undefined) updatePayload.status = ticket.status;
        if (ticket.resposta_comunicacao !== undefined) updatePayload.resposta_comunicacao = ticket.resposta_comunicacao;
        if (ticket.responsavel_comunicacao_id !== undefined) updatePayload.responsavel_comunicacao_id = ticket.responsavel_comunicacao_id;
        if (ticket.conteudo_criado_id !== undefined) updatePayload.conteudo_criado_id = ticket.conteudo_criado_id;

        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticket.id
              ? ({
                  ...t,
                  ...updatePayload,
                  ...(proj !== undefined ? { projetos_sociais: proj ? { nome: proj.nome, cor_identificacao: proj.cor_identificacao } : null } : {}),
                  ...(volResp !== undefined ? { responsavel: volResp ? { nome_completo: volResp.nome_completo } : null } : {}),
                } as SolicitacaoComunicacaoItem)
              : t
          )
        );

        await supabase.from('solicitacoes_comunicacao').update(updatePayload).eq('id', ticket.id);
      } else {
        const payload: Record<string, any> = {
          titulo: ticket.titulo || 'Nova Solicitação',
          projeto_id: ticket.projeto_id || null,
          solicitante_id: ticket.solicitante_id || null,
          solicitante_nome: ticket.solicitante_nome || null,
          tipo_material: ticket.tipo_material || 'carrossel',
          publico_alvo: ticket.publico_alvo || null,
          objetivo: ticket.objetivo || null,
          descricao_detalhes: ticket.descricao_detalhes || null,
          prazo_desejado: ticket.prazo_desejado || null,
          urgencia: ticket.urgencia || 'normal',
          links_referencia: ticket.links_referencia || null,
          observacoes_referencia: ticket.observacoes_referencia || null,
          status: ticket.status || 'pendente',
          resposta_comunicacao: ticket.resposta_comunicacao || null,
          responsavel_comunicacao_id: ticket.responsavel_comunicacao_id || null,
          conteudo_criado_id: ticket.conteudo_criado_id || null,
          updated_at: new Date().toISOString(),
        };

        const tempId = `local-${Date.now()}`;
        const tempItem: SolicitacaoComunicacaoItem = {
          id: tempId,
          created_at: new Date().toISOString(),
          ...payload,
          projetos_sociais: proj ? { nome: proj.nome, cor_identificacao: proj.cor_identificacao } : null,
          responsavel: volResp ? { nome_completo: volResp.nome_completo } : null,
        } as unknown as SolicitacaoComunicacaoItem;

        setTickets((prev) => [tempItem, ...prev]);

        const { data, error } = await supabase
          .from('solicitacoes_comunicacao')
          .insert([payload])
          .select('id, titulo, descricao_detalhes, status, urgencia, tipo_material, prazo_desejado, publico_alvo, objetivo, links_referencia, observacoes_referencia, resposta_comunicacao, checklist, solicitante_nome, projeto_id, solicitante_id, responsavel_comunicacao_id, conteudo_criado_id, projetos_sociais(nome, cor_identificacao), responsavel:voluntarios!responsavel_comunicacao_id(nome_completo), solicitante:voluntarios!solicitante_id(nome_completo)')
          .single();

        if (!error && data) {
          setTickets((prev) => prev.map((t) => (t.id === tempId ? (data as SolicitacaoComunicacaoItem) : t)));
        }
      }

      loadInitialData();
    } catch (err: any) {
      console.error('Erro ao salvar ticket:', err);
      alert('Erro ao salvar solicitação: ' + err.message);
    }
  };

  const handleDeleteTicket = async (id: string) => {
    setTickets((prev) => prev.filter((t) => t.id !== id));
    await supabase.from('solicitacoes_comunicacao').delete().eq('id', id);
    loadInitialData();
  };

  const handleConvertToConteudo = async (ticket: SolicitacaoComunicacaoItem) => {
    const tipoMap: Record<string, any> = {
      carrossel: 'carrossel',
      reels: 'reels',
      stories: 'stories',
      estatico: 'estatico',
      video_longo: 'video_longo',
      artigo: 'artigo',
    };

    const prefill = {
      titulo: ticket.titulo,
      projeto_id: ticket.projeto_id || undefined,
      tipo_conteudo: tipoMap[ticket.tipo_material] || 'carrossel',
      observacoes: [
        ticket.descricao_detalhes,
        ticket.observacoes_referencia ? `[Destaques da Referência / Inspiração]:\n${ticket.observacoes_referencia}` : null,
      ].filter(Boolean).join('\n\n') || undefined,
      roteiro_legenda: ticket.objetivo ? `Objetivo: ${ticket.objetivo}\nPúblico: ${ticket.publico_alvo || 'Geral'}` : undefined,
      data_publicacao: ticket.prazo_desejado ? new Date(ticket.prazo_desejado).toISOString() : new Date().toISOString(),
      categoria: 'avulso',
      link_producao: ticket.links_referencia || undefined,
      status: 'producao',
    };

    try {
      sessionStorage.setItem('elo_prefill_conteudo', JSON.stringify(prefill));
    } catch (e) {
      console.warn('Erro ao salvar prefill no sessionStorage:', e);
    }

    await handleSaveTicket({ id: ticket.id, status: 'em_producao' });
    router.push('/dashboard/comunicacao/gestao?tab=calendario');
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Solicitações & Tickets"
        subtitle="Central de pedidos de materiais, peças gráficas, brindes e coberturas para voluntários e projetos"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6 flex-1 overflow-y-auto">
        <ComunicacaoTickets
          tickets={tickets}
          projetos={projetos}
          voluntarios={voluntarios}
          loading={loading}
          onRefresh={loadInitialData}
          onSaveTicket={handleSaveTicket}
          onDeleteTicket={handleDeleteTicket}
          onConvertToConteudo={handleConvertToConteudo}
          initialOpenNew={novoParam}
        />
      </div>
    </div>
  );
}

export default function TicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-[var(--text-muted)]">
          Carregando Solicitações & Tickets...
        </div>
      }
    >
      <TicketsContent />
    </Suspense>
  );
}
