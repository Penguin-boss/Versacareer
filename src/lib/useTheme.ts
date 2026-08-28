import { create } from 'zustand';
import React, { useEffect } from 'react';

export type Theme = 'dark' | 'light' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useTheme = create<ThemeState>((set) => ({
  theme: ((): Theme => {
    if (typeof window === 'undefined') return 'system';
    try {
      const stored = window.localStorage.getItem('versacareer-theme');
      if (stored === 'light' || stored === 'dark' || stored === 'system') return stored as Theme;
    } catch (e) {}
    return 'system';
  })(),
  setTheme: (theme: Theme) => set(() => {
    try { window.localStorage.setItem('versacareer-theme', theme); } catch(e) {}
    return { theme };
  })
}));

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useTheme(state => state.theme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  // Handle system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = () => {
      const currentTheme = useTheme.getState().theme;
      if (currentTheme === 'system') {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(mediaQuery.matches ? 'light' : 'dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return React.createElement(React.Fragment, null, children);
}
