'use client';

export interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: 'reuniao' | 'projeto' | 'sistema' | 'aviso';
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

  // Se ambas têm pelo menos 2 partes (ex: "Kayro Costa")
  if (nWords.length >= 2 && uWords.length >= 2) {
    // Primeiro nome e último sobrenome coincidem
    if (nWords[0] === uWords[0] && nWords[nWords.length - 1] === uWords[uWords.length - 1]) {
      return true;
    }
    // Todas as palavras do nome do usuário estão presentes no destinatário
    if (uWords.every((w) => nWords.includes(w))) {
      return true;
    }
  } else if (nWords.length === 1 || uWords.length === 1) {
    // Caso de primeiro nome único
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
    if (!raw) return [];
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista.slice(0, 100))); // guarda até 100 mais recentes
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
    // Tenta encontrar o e-mail do voluntário caso esteja na base
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

  // Colocar as novas no topo da lista
  salvarETransmitir([...novas, ...listaAtual]);
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
  // Mantém apenas as notificações que NÃO pertencem a este usuário
  const restantes = lista.filter((n) => !isNotificationForUser(n, userName, userEmail));
  salvarETransmitir(restantes);
}

/**
 * Remove todas as notificações do sistema (para administradores / reset geral)
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
