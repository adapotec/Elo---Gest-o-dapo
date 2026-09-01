'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyRecessoRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/voluntarios/escalas?tab=folgas');
  }, [router]);

  return (
    <div className="p-8 flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
    </div>
  );
}
