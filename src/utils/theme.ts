import { useState, useEffect, useCallback } from 'react';

export type Theme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'legend_theme';
export const THEME_CHANGE_EVENT = 'legend_theme_changed';

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch (e) {
    console.warn('Failed to read theme from localStorage:', e);
  }
  return 'dark';
}

export function applyThemeToDOM(theme: Theme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;

  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
    if (body) {
      body.classList.remove('bg-neutral-100', 'text-neutral-900');
      body.classList.add('bg-neutral-950', 'text-neutral-100');
    }
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
    if (body) {
      body.classList.remove('bg-neutral-950', 'text-neutral-100');
      body.classList.add('bg-neutral-100', 'text-neutral-900');
    }
  }
}

export function setStoredTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {
    console.warn('Failed to save theme to localStorage:', e);
  }
  applyThemeToDOM(theme);
  // Dispatch asynchronously to avoid updating other components synchronously during render
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: theme }));
  }, 0);
}

export function initTheme(): Theme {
  const theme = getStoredTheme();
  applyThemeToDOM(theme);
  return theme;
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());

  useEffect(() => {
    // Ensure DOM matches on mount
    applyThemeToDOM(theme);

    const handleThemeChange = (e: any) => {
      if (e.detail && (e.detail === 'dark' || e.detail === 'light')) {
        setThemeState(e.detail);
        applyThemeToDOM(e.detail);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && (e.newValue === 'dark' || e.newValue === 'light')) {
        setThemeState(e.newValue);
        applyThemeToDOM(e.newValue);
      }
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const toggleTheme = useCallback(() => {
    const current = getStoredTheme();
    const next: Theme = current === 'dark' ? 'light' : 'dark';
    setThemeState(next);
    setStoredTheme(next);
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    setStoredTheme(newTheme);
  }, []);

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme,
  };
}
