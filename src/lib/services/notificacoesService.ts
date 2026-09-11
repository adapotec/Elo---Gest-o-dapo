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
 * Retorna a lista de notificações armazenadas
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
 * Retorna a contagem de notificações não lidas
 */
export function getUnreadNotificacoesCount(): number {
  const lista = getNotificacoes();
  return lista.filter((n) => !n.lida).length;
}

/**
 * Salva a lista e emite evento para sincronizar Topbar e telas
 */
function salvarETransmitir(lista: Notificacao[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista.slice(0, 50))); // guarda até 50 mais recentes
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { lista } }));
  } catch (e) {
    console.error('Erro ao salvar notificações:', e);
  }
}

/**
 * Dispara notificações de convocação para os participantes selecionados na reunião
 */
export function dispararNotificacoesConvocacaoReuniao(params: {
  reuniaoId: string;
  titulo: string;
  dataHora: string;
  localOuLink?: string;
  participantes: string[];
  isEdicao?: boolean;
}) {
  const { reuniaoId, titulo, dataHora, localOuLink, participantes, isEdicao } = params;
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
    const prefixoAcao = isEdicao ? 'Atualização de Reunião' : 'Convocação para Reunião';
    const notificacao: Notificacao = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      titulo: `${prefixoAcao}: ${titulo}`,
      mensagem: `${nome}, você foi ${isEdicao ? 'notificado(a) sobre alterações na' : 'convocado(a) para a'} reunião em ${dataFormatada} às ${horaFormatada}h (${localOuLink || 'Sede do Instituto Ádapo'}).`,
      tipo: 'reuniao',
      link: `/dashboard/institucional?reuniaoId=${reuniaoId}`,
      lida: false,
      destinatario_nome: nome,
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
 * Marca todas as notificações como lidas
 */
export function marcarTodasComoLidas() {
  const lista = getNotificacoes();
  const atualizadas = lista.map((n) => ({ ...n, lida: true }));
  salvarETransmitir(atualizadas);
}

/**
 * Remove todas as notificações
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
