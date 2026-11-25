'use client';

import { useCallback, useSyncExternalStore } from 'react';

import { THEME_STORAGE_KEY } from './theme-script';

export type Theme = 'light' | 'dark';

const listeners = new Set<() => void>();

function readTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function setTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.add('theme-transition');
  root.classList.toggle('dark', theme === 'dark');
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* storage unavailable (private mode) – theme still applies for this visit */
  }
  window.setTimeout(() => root.classList.remove('theme-transition'), 250);
  listeners.forEach((l) => l());
}

export function useTheme() {
  const theme = useSyncExternalStore<Theme>(subscribe, readTheme, () => 'light');
  const toggleTheme = useCallback(() => setTheme(readTheme() === 'dark' ? 'light' : 'dark'), []);
  return { theme, setTheme, toggleTheme };
}
