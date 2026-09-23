'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ComunicacaoRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const tab = searchParams.get('tab');
    const novo = searchParams.get('novo');

    if (tab === 'indicadores') {
      router.replace('/dashboard/comunicacao/indicadores');
    } else if (tab === 'tarefas') {
      router.replace('/dashboard/comunicacao/tarefas');
    } else if (tab && ['calendario', 'campanhas', 'galeria', 'tickets'].includes(tab)) {
      const query = novo ? `?tab=${tab}&novo=true` : `?tab=${tab}`;
      router.replace(`/dashboard/comunicacao/gestao${query}`);
    } else {
      router.replace('/dashboard/comunicacao/tarefas');
    }
  }, [searchParams, router]);

  return (
    <div className="flex-1 flex items-center justify-center p-8 text-sm text-[var(--text-muted)]">
      Redirecionando para o módulo de comunicação...
    </div>
  );
}

export default function ComunicacaoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-8 text-sm text-[var(--text-muted)]">
          Carregando Comunicação...
        </div>
      }
    >
      <ComunicacaoRedirect />
    </Suspense>
  );
}
