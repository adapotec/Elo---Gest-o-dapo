'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type ThemeMode = 'light' | 'dark';
export type ThemePalette = 'laranja' | 'roxo' | 'verde' | 'azul' | 'vermelho' | 'amarelo' | 'rosa';
export type BgStyleMode = 'sutil' | 'imersivo';

interface ThemeContextType {
  theme: ThemeMode;
  palette: ThemePalette;
  bgStyle: BgStyleMode;
  toggleTheme: () => void;
  setPalette: (newPalette: ThemePalette) => Promise<void>;
  setBgStyle: (newStyle: BgStyleMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'elo-theme';
const PALETTE_STORAGE_KEY = 'elo-palette';
const BG_STYLE_STORAGE_KEY = 'elo-bg-style';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [palette, setPaletteState] = useState<ThemePalette>('laranja');
  const [bgStyle, setBgStyleState] = useState<BgStyleMode>('sutil');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    const initialTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    const savedPalette = localStorage.getItem(PALETTE_STORAGE_KEY) as ThemePalette | null;
    const initialPalette = savedPalette || 'laranja';

    const savedBgStyle = localStorage.getItem(BG_STYLE_STORAGE_KEY) as BgStyleMode | null;
    const initialBgStyle = savedBgStyle || 'sutil';

    setTheme(initialTheme);
    setPaletteState(initialPalette);
    setBgStyleState(initialBgStyle);

    document.documentElement.setAttribute('data-theme', initialTheme);
    document.documentElement.setAttribute('data-palette', initialPalette);
    document.documentElement.setAttribute('data-bg-style', initialBgStyle);

    setMounted(true);

    // Tenta carregar a preferência do perfil do usuário logado
    const fetchUserPreference = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('theme_preference')
            .eq('id', user.id)
            .maybeSingle();

          if (profile?.theme_preference) {
            // Se a preferência contiver ambos separados por vírgula (ex: "laranja,imersivo")
            const parts = profile.theme_preference.split(',');
            const userPalette = (parts[0] || 'laranja') as ThemePalette;
            const userBgStyle = (parts[1] || 'sutil') as BgStyleMode;

            setPaletteState(userPalette);
            setBgStyleState(userBgStyle);

            document.documentElement.setAttribute('data-palette', userPalette);
            document.documentElement.setAttribute('data-bg-style', userBgStyle);

            localStorage.setItem(PALETTE_STORAGE_KEY, userPalette);
            localStorage.setItem(BG_STYLE_STORAGE_KEY, userBgStyle);
          }
        }
      } catch (err) {
        // Ignora silenciosamente se o usuário não estiver logado
      }
    };

    fetchUserPreference();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  };

  const setPalette = async (newPalette: ThemePalette) => {
    setPaletteState(newPalette);
    document.documentElement.setAttribute('data-palette', newPalette);
    localStorage.setItem(PALETTE_STORAGE_KEY, newPalette);

    await savePreferenceToProfile(newPalette, bgStyle);
  };

  const setBgStyle = async (newStyle: BgStyleMode) => {
    setBgStyleState(newStyle);
    document.documentElement.setAttribute('data-bg-style', newStyle);
    localStorage.setItem(BG_STYLE_STORAGE_KEY, newStyle);

    await savePreferenceToProfile(palette, newStyle);
  };

  const savePreferenceToProfile = async (p: ThemePalette, b: BgStyleMode) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({
            theme_preference: `${p},${b}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      }
    } catch (err) {
      console.error('Erro ao salvar preferência no perfil:', err);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, palette, bgStyle, toggleTheme, setPalette, setBgStyle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
