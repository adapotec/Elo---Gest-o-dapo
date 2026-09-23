import { createBrowserClient } from '@supabase/ssr';

// Singleton para o cliente de navegador Supabase
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (typeof window !== 'undefined' && browserClient) {
    return browserClient;
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://jkpmioffpsdcoitgghyo.supabase.co';

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprcG1pb2ZmcHNkY29pdGdnaHlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMDgwMzIsImV4cCI6MjEwMTc4NDAzMn0.PYNjYs_n-OHB9iqlcSTGSFQH9phGKalIpp4RfhONEK8';

  const client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    global: {
      fetch: async (url, options = {}) => {
        let response = await fetch(url, options);

        // Se o Supabase responder 401 Unauthorized (JWT expirado ou token corrompido)
        const urlStr = typeof url === 'string' ? url : url.toString();
        const isAuthEndpoint = urlStr.includes('/auth/v1/');

        if (response.status === 401 && !isAuthEndpoint) {
          try {
            // Tenta renovar o token da sessão
            const { data, error } = await client.auth.refreshSession();
            if (data?.session && !error) {
              const headers = new Headers(options.headers);
              headers.set('Authorization', `Bearer ${data.session.access_token}`);
              response = await fetch(url, { ...options, headers });
            } else {
              // Se a sessão expirou completamente ou não pôde ser renovada, limpa a sessão local
              // e retenta imediatamente usando a chave anônima (garantindo carregamento de dados com RLS público)
              await client.auth.signOut({ scope: 'local' }).catch(() => {});
              const headers = new Headers(options.headers);
              headers.set('Authorization', `Bearer ${supabaseAnonKey}`);
              response = await fetch(url, { ...options, headers });
            }
          } catch {
            // Fallback seguro com chave anônima
            const headers = new Headers(options.headers);
            headers.set('Authorization', `Bearer ${supabaseAnonKey}`);
            response = await fetch(url, { ...options, headers });
          }
        }

        return response;
      },
    },
  });

  if (typeof window !== 'undefined') {
    browserClient = client;
  }

  return client;
}
