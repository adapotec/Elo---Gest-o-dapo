/**
 * Utilitários para tratamento consistente de datas e fusos horários no Sistema Elo.
 * 
 * Problema resolvido:
 * Os inputs HTML5 (<input type="datetime-local">) manipulam datas no formato "YYYY-MM-DDTHH:mm"
 * sem informação explícita de fuso horário. O PostgreSQL (Supabase) armazena colunas TIMESTAMPTZ em UTC.
 * Ao salvar uma string sem offset ("2026-09-25T02:01"), o PostgreSQL assume UTC, fazendo com que
 * no fuso horário de Brasília (UTC-3), o navegador subtraia 3 horas e exiba "24/09/2026 23:01".
 *
 * Estas funções garantem a conversão bidirecional correta entre o fuso horário local e o UTC do banco.
 */

/**
 * Converte qualquer formato de data retornado pelo Supabase (TIMESTAMPTZ, ISO string ou Date)
 * para a string esperada pelo input type="datetime-local" ("YYYY-MM-DDTHH:mm")
 * no fuso horário LOCAL do navegador do usuário.
 */
export function formatToDateTimeLocal(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Converte o valor retornado por um input type="datetime-local" ("YYYY-MM-DDTHH:mm")
 * em uma string ISO 8601 completa em UTC ("YYYY-MM-DDTHH:mm:ss.sssZ"),
 * garantindo que o PostgreSQL (Supabase) armazene o instante exato correspondente ao horário local.
 */
export function parseDateTimeLocalToISO(localStr?: string | null): string {
  if (!localStr) return new Date().toISOString();

  // Se já for uma string ISO completa com timezone Z ou offset (+00, -03:00, etc.)
  if (localStr.includes('Z') || /[+-]\d{2}(?::?\d{2})?$/.test(localStr)) {
    const d = new Date(localStr);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }

  // Trata formato "YYYY-MM-DDTHH:mm" ou "YYYY-MM-DD HH:mm"
  const parts = localStr.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (parts) {
    const [_, y, m, d, h, min, s] = parts;
    const localDate = new Date(
      parseInt(y, 10),
      parseInt(m, 10) - 1,
      parseInt(d, 10),
      parseInt(h, 10),
      parseInt(min, 10),
      s ? parseInt(s, 10) : 0
    );
    return isNaN(localDate.getTime()) ? new Date().toISOString() : localDate.toISOString();
  }

  const fallback = new Date(localStr);
  return isNaN(fallback.getTime()) ? new Date().toISOString() : fallback.toISOString();
}

/**
 * Retorna o mês (0 a 11) no fuso horário LOCAL a partir de qualquer string de data,
 * mantendo alinhamento perfeito com o calendário mensal visual e filtros.
 */
export function getLocalMonthFromDateStr(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d.getMonth();
}

/**
 * Determina se um conteúdo editorial está em atraso.
 * Um conteúdo é considerado em atraso se:
 * 1. Não estiver com status 'publicado' nem 'cancelado';
 * 2. E seu status for explicitamente 'em_atraso' OU sua data de publicação for anterior ao momento atual (já passou do prazo).
 */
export function isConteudoEmAtraso(c?: { status?: string | null; data_publicacao?: string | null } | null): boolean {
  if (!c) return false;
  if (c.status === 'publicado' || c.status === 'cancelado') return false;
  if (c.status === 'em_atraso') return true;
  if (!c.data_publicacao) return false;

  const dataPub = new Date(c.data_publicacao);
  if (isNaN(dataPub.getTime())) return false;
  return dataPub.getTime() < Date.now();
}

/**
 * Formata qualquer data (string YYYY-MM-DD, TIMESTAMPTZ ou Date) para "DD/MM/YYYY" de forma segura,
 * prevenindo que datas puras "YYYY-MM-DD" percam 1 dia por interpretação como UTC meia-noite no fuso local.
 */
export function formatDisplayDate(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  if (typeof dateInput === 'string') {
    const plainMatch = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (plainMatch) {
      const [_, y, m, d] = plainMatch;
      return `${d}/${m}/${y}`;
    }
    // Normaliza strings vindas do PostgreSQL com " 00:00:00+00"
    const normalized = dateInput.replace(' ', 'T').replace(/\+00$/, '+00:00');
    const d = new Date(normalized);
    if (!isNaN(d.getTime())) return d.toLocaleDateString('pt-BR');
  }
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR');
}

/**
 * Retorna o timestamp numérico para comparação e ordenação cronológica rigorosa.
 * Garante que datas puras "YYYY-MM-DD" e ISO com timezone sejam comparáveis de forma justa.
 * Retorna Infinity para itens sem data definida (colocando-os no fim da fila ascendente).
 */
export function getComparableTimestamp(dateStr?: string | null): number {
  if (!dateStr) return Infinity;
  if (typeof dateStr === 'string') {
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const [_, y, m, d] = match;
      return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10), 12, 0, 0).getTime();
    }
    const normalized = dateStr.replace(' ', 'T').replace(/\+00$/, '+00:00');
    const d = new Date(normalized);
    if (!isNaN(d.getTime())) return d.getTime();
  }
  const fallback = new Date(dateStr);
  return isNaN(fallback.getTime()) ? Infinity : fallback.getTime();
}

/**
 * Verifica se um prazo limite já venceu em relação ao momento atual.
 * Itens concluídos não são considerados vencidos.
 */
export function isPrazoVencido(dateStr?: string | null, status?: string | null): boolean {
  if (!dateStr) return false;
  if (status === 'concluido' || status === 'publicado') return false;
  const ts = getComparableTimestamp(dateStr);
  if (ts === Infinity) return false;
  return ts < Date.now();
}


