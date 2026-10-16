'use client';

export type NotificacaoTipo =
  | 'reuniao'
  | 'projeto'
  | 'sistema'
  | 'aviso'
  | 'tarefa'
  | 'estoque'
  | 'recesso'
  | 'aniversario'
  | 'acao';

export interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: NotificacaoTipo;
  link?: string;
  lida: boolean;
  destinatario_nome?: string;
  destinatario_email?: string;
  reuniao_id?: string;
  created_at: string;
}

const STORAGE_KEY = 'elo_sistema_notificacoes_v1';
const EVENT_NAME = 'elo-notifications-updated';

/**
 * Normaliza e limpa strings para comparação segura de nomes e e-mails
 */
function cleanString(str?: string | null): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9\s]/g, ' ') // substitui pontuações e parênteses por espaço
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Notificações operacionais iniciais caso o storage esteja vazio
 */
function getInitialSeedNotificacoes(): Notificacao[] {
  const now = new Date();
  const hojeStr = now.toISOString();
  const ontem = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: 'seed-notif-1',
      titulo: 'Boas-vindas ao Elo!',
      mensagem: 'Sistema integrado do Instituto Ádapo. Acompanhe aqui comunicados, escalas, reuniões e alertas.',
      tipo: 'aviso',
      link: '/dashboard',
      lida: false,
      created_at: hojeStr,
    },
    {
      id: 'seed-notif-2',
      titulo: 'Cronograma de Oficinas Ativo',
      mensagem: 'As ações dos projetos sociais estão sincronizadas. Verifique as próximas atividades da semana.',
      tipo: 'acao',
      link: '/dashboard/calendario',
      lida: false,
      created_at: hojeStr,
    },
    {
      id: 'seed-notif-3',
      titulo: 'Monitoramento de Estoque',
      mensagem: 'Materiais pedagógicos e kits de acolhimento registrados no almoxarifado.',
      tipo: 'estoque',
      link: '/dashboard/estoque',
      lida: true,
      created_at: ontem,
    },
  ];
}

/**
 * Verifica com precisão se uma notificação se destina ao usuário logado
 */
export function isNotificationForUser(
  notif: Notificacao,
  userName?: string | null,
  userEmail?: string | null
): boolean {
  // Notificações gerais sem destinatário específico são transmitidas a todos
  if (!notif.destinatario_nome && !notif.destinatario_email) {
    return true;
  }

  // 1. Comparação por e-mail (caso ambos possuam)
  const nEmail = (notif.destinatario_email || '').toLowerCase().trim();
  const uEmail = (userEmail || '').toLowerCase().trim();
  if (nEmail && uEmail && nEmail === uEmail) {
    return true;
  }

  // 2. Comparação por nome
  const nNome = cleanString(notif.destinatario_nome);
  const uNome = cleanString(userName);

  if (!nNome || !uNome) {
    return false;
  }

  // Igualdade exata
  if (nNome === uNome) {
    return true;
  }

  // Prefixo (ex: "Kayro Costa" bate com "Kayro Costa (Diretor)")
  if (nNome.startsWith(uNome) || uNome.startsWith(nNome)) {
    return true;
  }

  // Comparação por palavras do nome
  const nWords = nNome.split(/\s+/).filter(Boolean);
  const uWords = uNome.split(/\s+/).filter(Boolean);

  if (nWords.length >= 2 && uWords.length >= 2) {
    if (nWords[0] === uWords[0] && nWords[nWords.length - 1] === uWords[uWords.length - 1]) {
      return true;
    }
    if (uWords.every((w) => nWords.includes(w))) {
      return true;
    }
  } else if (nWords.length === 1 || uWords.length === 1) {
    if (nWords[0] === uWords[0]) {
      return true;
    }
  }

  return false;
}

/**
 * Retorna todas as notificações armazenadas no sistema
 */
export function getNotificacoes(): Notificacao[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = getInitialSeedNotificacoes();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Erro ao ler notificações:', e);
    return [];
  }
}

/**
 * Retorna apenas as notificações destinadas ao usuário atual
 */
export function getNotificacoesForUser(
  userName?: string | null,
  userEmail?: string | null
): Notificacao[] {
  const todas = getNotificacoes();
  return todas.filter((n) => isNotificationForUser(n, userName, userEmail));
}

/**
 * Retorna a contagem de notificações não lidas para o usuário atual
 */
export function getUnreadNotificacoesCount(
  userName?: string | null,
  userEmail?: string | null
): number {
  const filtradas = getNotificacoesForUser(userName, userEmail);
  return filtradas.filter((n) => !n.lida).length;
}

/**
 * Salva a lista e emite evento para sincronizar Topbar e telas
 */
function salvarETransmitir(lista: Notificacao[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista.slice(0, 100)));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { lista } }));
  } catch (e) {
    console.error('Erro ao salvar notificações:', e);
  }
}

/**
 * Dispara notificações nominais de convocação para os participantes selecionados na reunião
 */
export function dispararNotificacoesConvocacaoReuniao(params: {
  reuniaoId: string;
  titulo: string;
  dataHora: string;
  localOuLink?: string;
  participantes: string[];
  isEdicao?: boolean;
  voluntarios?: { nome_completo: string; email?: string }[];
}) {
  const { reuniaoId, titulo, dataHora, localOuLink, participantes, isEdicao, voluntarios = [] } = params;
  if (!participantes || participantes.length === 0) return;

  const dataObj = new Date(dataHora);
  const dataFormatada = dataObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horaFormatada = dataObj.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const listaAtual = getNotificacoes();
  const novas: Notificacao[] = [];

  participantes.forEach((nome) => {
    const volMatch = voluntarios.find(
      (v) => cleanString(v.nome_completo) === cleanString(nome)
    );

    const prefixoAcao = isEdicao ? 'Atualização de Reunião' : 'Convocação para Reunião';
    const notificacao: Notificacao = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      titulo: `${prefixoAcao}: ${titulo}`,
      mensagem: `${nome}, você foi ${isEdicao ? 'notificado(a) sobre alterações na' : 'convocado(a) para a'} reunião em ${dataFormatada} às ${horaFormatada}h (${localOuLink || 'Sede do Instituto Ádapo'}).`,
      tipo: 'reuniao',
      link: `/dashboard/institucional?reuniaoId=${reuniaoId}`,
      lida: false,
      destinatario_nome: nome,
      destinatario_email: volMatch?.email || undefined,
      reuniao_id: reuniaoId,
      created_at: new Date().toISOString(),
    };
    novas.push(notificacao);
  });

  salvarETransmitir([...novas, ...listaAtual]);
}

/**
 * Dispara notificação específica para o voluntário designado como Secretário da Reunião
 */
export function dispararNotificacaoSecretarioDesignado(params: {
  reuniaoId: string;
  titulo: string;
  dataHora: string;
  secretarioNome: string;
  voluntarios?: { nome_completo: string; email?: string }[];
}) {
  const { reuniaoId, titulo, dataHora, secretarioNome, voluntarios = [] } = params;
  if (!secretarioNome || !secretarioNome.trim()) return;

  const dataObj = new Date(dataHora);
  const dataFormatada = dataObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horaFormatada = dataObj.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const volMatch = voluntarios.find(
    (v) => cleanString(v.nome_completo) === cleanString(secretarioNome)
  );

  const listaAtual = getNotificacoes();
  const notificacao: Notificacao = {
    id: `notif-sec-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    titulo: `Designação como Secretário(a): ${titulo}`,
    mensagem: `${secretarioNome}, você foi designado(a) como Secretário(a) da reunião "${titulo}" agendada para ${dataFormatada} às ${horaFormatada}h. Você será responsável pela condução de presenças e lavratura da ata.`,
    tipo: 'reuniao',
    link: `/dashboard/institucional?reuniaoId=${reuniaoId}&tab=ata`,
    lida: false,
    destinatario_nome: secretarioNome,
    destinatario_email: volMatch?.email || undefined,
    reuniao_id: reuniaoId,
    created_at: new Date().toISOString(),
  };

  salvarETransmitir([notificacao, ...listaAtual]);
}

/**
 * Dispara notificação de Tarefa de Comunicação atribuída ou atualizada
 */
export function dispararNotificacaoTarefa(params: {
  tarefaTitulo: string;
  responsavelNome?: string;
  responsavelEmail?: string;
  status: string;
}) {
  const { tarefaTitulo, responsavelNome, responsavelEmail, status } = params;
  const listaAtual = getNotificacoes();

  const notificacao: Notificacao = {
    id: `notif-task-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    titulo: `Tarefa de Comunicação: ${tarefaTitulo}`,
    mensagem: responsavelNome
      ? `${responsavelNome}, a tarefa "${tarefaTitulo}" foi atualizada para o status: ${status}.`
      : `A tarefa "${tarefaTitulo}" está no status: ${status}.`,
    tipo: 'tarefa',
    link: '/dashboard/comunicacao/tarefas',
    lida: false,
    destinatario_nome: responsavelNome,
    destinatario_email: responsavelEmail,
    created_at: new Date().toISOString(),
  };

  salvarETransmitir([notificacao, ...listaAtual]);
}

/**
 * Dispara notificação de Estoque de Materiais Crítico
 */
export function dispararNotificacaoEstoque(params: {
  itemNome: string;
  quantidade: number;
}) {
  const { itemNome, quantidade } = params;
  const listaAtual = getNotificacoes();

  const notificacao: Notificacao = {
    id: `notif-est-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    titulo: `Alerta de Estoque: ${itemNome}`,
    mensagem: `O item "${itemNome}" está com nível crítico (${quantidade} unidades restantes). Providencie reposição.`,
    tipo: 'estoque',
    link: '/dashboard/estoque',
    lida: false,
    created_at: new Date().toISOString(),
  };

  salvarETransmitir([notificacao, ...listaAtual]);
}

/**
 * Dispara notificação de Aniversário
 */
export function dispararNotificacaoAniversario(params: {
  nome: string;
  tipo: 'beneficiario' | 'voluntario';
}) {
  const { nome, tipo } = params;
  const listaAtual = getNotificacoes();

  const notificacao: Notificacao = {
    id: `notif-aniv-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    titulo: `Aniversariante: ${nome}! 🎉`,
    mensagem: `Hoje é aniversário de ${nome} (${tipo === 'voluntario' ? 'Voluntário(a)' : 'Beneficiário(a)'}). Não esqueça de parabenizar!`,
    tipo: 'aniversario',
    link: '/dashboard',
    lida: false,
    created_at: new Date().toISOString(),
  };

  salvarETransmitir([notificacao, ...listaAtual]);
}

/**
 * Marca uma notificação individual como lida
 */
export function marcarComoLida(id: string) {
  const lista = getNotificacoes();
  const atualizadas = lista.map((n) => (n.id === id ? { ...n, lida: true } : n));
  salvarETransmitir(atualizadas);
}

/**
 * Marca como lidas apenas as notificações do usuário especificado
 */
export function marcarTodasComoLidas(
  userName?: string | null,
  userEmail?: string | null
) {
  const lista = getNotificacoes();
  const atualizadas = lista.map((n) => {
    if (isNotificationForUser(n, userName, userEmail)) {
      return { ...n, lida: true };
    }
    return n;
  });
  salvarETransmitir(atualizadas);
}

/**
 * Remove apenas as notificações pertencentes ao usuário logado
 */
export function limparNotificacoesDoUsuario(
  userName?: string | null,
  userEmail?: string | null
) {
  const lista = getNotificacoes();
  const restantes = lista.filter((n) => !isNotificationForUser(n, userName, userEmail));
  salvarETransmitir(restantes);
}

/**
 * Remove todas as notificações do sistema
 */
export function limparTodasNotificacoes() {
  salvarETransmitir([]);
}

/**
 * Adiciona listener para atualizações em tempo real
 */
export function onNotificacoesChange(callback: (notificacoes: Notificacao[]) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = () => {
    callback(getNotificacoes());
  };

  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener('storage', handler);
  };
}
