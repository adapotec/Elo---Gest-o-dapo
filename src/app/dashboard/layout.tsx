import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNavProvider } from '@/components/layout/MobileNavContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MobileNavProvider>
      <div className="min-h-screen flex bg-[var(--bg-primary)]">
        {/* Sidebar Navegação (Desktop Fixa / Mobile Gaveta Deslizante) */}
        <Sidebar />

        {/* Área Central de Conteúdo com adaptação fluida */}
        <main className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
          {children}
        </main>
      </div>
    </MobileNavProvider>
  );
}
