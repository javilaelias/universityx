'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Lang, TranslationKey } from '@/lib/i18n';
import { translate } from '@/lib/i18n';

// ── Theme ─────────────────────────────────────────────────────────────────────

type Theme = 'light' | 'dark';

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeCtx>({ theme: 'light', toggle: () => {} });

// ── Language ──────────────────────────────────────────────────────────────────

interface LangCtx {
  lang: Lang;
  toggle: () => void;
  t: (key: TranslationKey) => string;
}

const LangContext = createContext<LangCtx>({
  lang: 'es',
  toggle: () => {},
  t: (k) => k,
});

// ── Provider combinado ────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [lang,  setLang]  = useState<Lang>('es');

  // Inicializar desde localStorage (una sola vez en el cliente)
  useEffect(() => {
    const savedTheme = (localStorage.getItem('ux-theme') as Theme) ?? 'light';
    const savedLang  = (localStorage.getItem('ux-lang')  as Lang)  ?? 'es';
    setTheme(savedTheme);
    setLang(savedLang);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('ux-theme', next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      return next;
    });
  }, []);

  const toggleLang = useCallback(() => {
    setLang(prev => {
      const next = prev === 'es' ? 'en' : 'es';
      localStorage.setItem('ux-lang', next);
      document.documentElement.lang = next;
      return next;
    });
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translate(lang, key),
    [lang],
  );

  return (
    <ThemeContext.Provider value={{ theme, toggle: toggleTheme }}>
      <LangContext.Provider value={{ lang, toggle: toggleLang, t }}>
        {children}
      </LangContext.Provider>
    </ThemeContext.Provider>
  );
}

export function useTheme() { return useContext(ThemeContext); }
export function useLang()  { return useContext(LangContext);  }
