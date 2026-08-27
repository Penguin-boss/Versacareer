import { create } from 'zustand';

interface ThemeState {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

const getInitialTheme = (): 'dark' | 'light' => {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = window.localStorage.getItem('versacareer-theme');
    if (stored === 'light' || stored === 'dark') return stored;
  } catch (e) {}
  return 'dark'; // Default to dark on first load per instructions
};

export const useTheme = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    try { window.localStorage.setItem('versacareer-theme', newTheme); } catch(e) {}
    if (newTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    return { theme: newTheme };
  }),
  setTheme: (theme) => set(() => {
    try { window.localStorage.setItem('versacareer-theme', theme); } catch(e) {}
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    return { theme };
  })
}));
