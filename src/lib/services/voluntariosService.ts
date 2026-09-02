import { createClient } from '@/lib/supabase/client';
import { Voluntario } from '@/components/dashboard/voluntarios/VoluntariosEquipe';

interface CacheEntry {
  data: Voluntario[];
  timestamp: number;
}

let memoryCache: Record<string, CacheEntry> = {};
let activeFetches: Record<string, Promise<any> | null> = {};

const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutos de cache ativo

/**
 * Retorna dados em cache síncrono para inicializar useState sem nenhum atraso (0ms)
 */
export function getCachedVoluntariosSync(status: 'ativo' | 'todos' = 'ativo'): Voluntario[] {
  const cacheKey = `elo_voluntarios_${status}`;

  if (memoryCache[cacheKey] && memoryCache[cacheKey].data.length > 0) {
    return memoryCache[cacheKey].data;
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(cacheKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Voluntario[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryCache[cacheKey] = { data: parsed, timestamp: Date.now() };
          return parsed;
        }
      }
    } catch (e) {}
  }

  return [];
}

/**
 * Busca voluntários com estratégia Stale-While-Revalidate:
 * Retorna instantaneamente do cache (memória ou sessionStorage) e revalida em segundo plano.
 */
export async function getVoluntarios(options?: {
  status?: 'ativo' | 'todos';
  forceRefresh?: boolean;
}): Promise<Voluntario[]> {
  const status = options?.status || 'ativo';
  const cacheKey = `elo_voluntarios_${status}`;
  const now = Date.now();

  // 1. Se houver cache válido e não for forceRefresh, retorna imediatamente
  const cached = memoryCache[cacheKey];
  if (!options?.forceRefresh && cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // 2. Tenta recuperar do sessionStorage
  if (!options?.forceRefresh && typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(cacheKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Voluntario[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryCache[cacheKey] = { data: parsed, timestamp: now };
          // Revalida em background sem travar
          revalidateInBackground(status, cacheKey);
          return parsed;
        }
      }
    } catch (e) {}
  }

  // 3. Deduplicação de requisições em voo (se já estiver buscando, reutiliza a Promise)
  if (activeFetches[cacheKey]) {
    return activeFetches[cacheKey]!;
  }

  const fetchPromise = (async () => {
    try {
      const supabase = createClient();
      let query = supabase.from('voluntarios').select('*');

      if (status === 'ativo') {
        query = query.eq('status', 'ativo');
      }

      const { data, error } = await query.order('nome_completo', { ascending: true });

      if (error) throw error;

      const result = (data || []) as Voluntario[];
      memoryCache[cacheKey] = { data: result, timestamp: Date.now() };

      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(result));
        } catch (e) {}
      }

      return result;
    } finally {
      activeFetches[cacheKey] = null;
    }
  })();

  activeFetches[cacheKey] = fetchPromise;
  return fetchPromise;
}

/**
 * Revalidação silenciosa em segundo plano
 */
function revalidateInBackground(status: 'ativo' | 'todos', cacheKey: string) {
  if (activeFetches[cacheKey]) return;

  const fetchPromise = (async () => {
    try {
      const supabase = createClient();
      let query = supabase.from('voluntarios').select('*');

      if (status === 'ativo') {
        query = query.eq('status', 'ativo');
      }

      const { data, error } = await query.order('nome_completo', { ascending: true });

      if (!error && data) {
        const result = data as Voluntario[];
        memoryCache[cacheKey] = { data: result, timestamp: Date.now() };
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(result));
          } catch (e) {}
        }
      }
    } catch (e) {
      // Falha silenciosa em background
    } finally {
      activeFetches[cacheKey] = null;
    }
  })();

  activeFetches[cacheKey] = fetchPromise;
}

/**
 * Invalida o cache (chamar após cadastrar, editar ou alterar status)
 */
export function invalidateVoluntariosCache() {
  memoryCache = {};
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem('elo_voluntarios_ativo');
      sessionStorage.removeItem('elo_voluntarios_todos');
    } catch (e) {}
  }
}
