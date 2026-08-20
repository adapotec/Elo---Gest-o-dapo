'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface MobileNavContextType {
  isMobileOpen: boolean;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  toggleMobileNav: () => void;
}

const MobileNavContext = createContext<MobileNavContextType>({
  isMobileOpen: false,
  openMobileNav: () => {},
  closeMobileNav: () => {},
  toggleMobileNav: () => {},
});

export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  // Fecha o menu móvel automaticamente ao mudar de rota
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Trava a rolagem do body quando a gaveta móvel estiver aberta
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  const openMobileNav = () => setIsMobileOpen(true);
  const closeMobileNav = () => setIsMobileOpen(false);
  const toggleMobileNav = () => setIsMobileOpen((prev) => !prev);

  return (
    <MobileNavContext.Provider
      value={{
        isMobileOpen,
        openMobileNav,
        closeMobileNav,
        toggleMobileNav,
      }}
    >
      {children}
    </MobileNavContext.Provider>
  );
}

export function useMobileNav() {
  return useContext(MobileNavContext);
}
