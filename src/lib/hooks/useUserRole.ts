'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface UserRoleInfo {
  isBrincante: boolean;
  tipo: string | null;
  role: string | null;
  email: string | null;
  nomeCompleto: string | null;
  loading: boolean;
}

export function useUserRole(): UserRoleInfo {
  const [roleInfo, setRoleInfo] = useState<UserRoleInfo>(() => {
    // Leitura síncrona do cache em memória para resposta instantânea (0ms)
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('elo_user_profile_cache') || localStorage.getItem('elo_user_profile_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          const isBrinc =
            parsed.isBrincante === true ||
            parsed.tipo === 'brincante' ||
            parsed.role === 'brincante' ||
            parsed.role === 'voluntario_brincante';

          return {
            isBrincante: isBrinc,
            tipo: parsed.tipo || null,
            role: parsed.role || null,
            email: parsed.email || null,
            nomeCompleto: parsed.name || parsed.nome_completo || null,
            loading: false,
          };
        }
      } catch (e) {
        console.warn('Erro ao ler cache de papel do usuário:', e);
      }
    }

    return {
      isBrincante: false,
      tipo: null,
      role: null,
      email: null,
      nomeCompleto: null,
      loading: true,
    };
  });

  useEffect(() => {
    let isMounted = true;

    async function checkRole() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          if (isMounted) {
            setRoleInfo((prev) => ({ ...prev, loading: false }));
          }
          return;
        }

        const [respProfile, respVol] = await Promise.all([
          supabase
            .from('profiles')
            .select('role, nome_completo, email')
            .eq('id', user.id)
            .maybeSingle(),
          user.email
            ? supabase
                .from('voluntarios')
                .select('tipo, funcao, area_atuacao, nome_completo')
                .eq('email', user.email)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

        const profile = respProfile?.data;
        const vol = respVol?.data;

        const isBrinc =
          vol?.tipo === 'brincante' ||
          profile?.role === 'brincante' ||
          profile?.role === 'voluntario_brincante';

        const updated: UserRoleInfo = {
          isBrincante: isBrinc,
          tipo: vol?.tipo || null,
          role: profile?.role || vol?.funcao || null,
          email: user.email || null,
          nomeCompleto: profile?.nome_completo || vol?.nome_completo || null,
          loading: false,
        };

        if (isMounted) {
          setRoleInfo(updated);
        }

        // Atualiza cache compartilhado do sistema
        try {
          const cached = sessionStorage.getItem('elo_user_profile_cache') || localStorage.getItem('elo_user_profile_cache');
          const prev = cached ? JSON.parse(cached) : {};
          const merged = {
            ...prev,
            tipo: vol?.tipo,
            isBrincante: isBrinc,
            role: profile?.role || vol?.funcao,
          };
          sessionStorage.setItem('elo_user_profile_cache', JSON.stringify(merged));
          localStorage.setItem('elo_user_profile_cache', JSON.stringify(merged));
        } catch (e) {}
      } catch (err) {
        console.error('Erro ao verificar papéis de acesso do usuário:', err);
        if (isMounted) {
          setRoleInfo((prev) => ({ ...prev, loading: false }));
        }
      }
    }

    checkRole();

    return () => {
      isMounted = false;
    };
  }, []);

  return roleInfo;
}
