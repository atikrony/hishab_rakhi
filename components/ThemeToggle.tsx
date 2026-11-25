'use client';

import React from 'react';
import { useTheme } from '@/lib/theme';

interface ThemeToggleProps {
  /** `icon`: round icon button. `row`: full-width row with label (sidebar / settings). */
  variant?: 'icon' | 'row';
  className?: string;
}

export function ThemeToggle({ variant = 'icon', className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  if (variant === 'row') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={label}
        className={`w-full flex items-center gap-space-md px-space-md py-space-sm rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface text-left transition-colors font-medium ${className}`}
      >
        <span className="material-symbols-outlined text-[20px]">{isDark ? 'light_mode' : 'dark_mode'}</span>
        <span className="font-label-md text-label-md">{isDark ? 'Light mode' : 'Dark mode'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container active:scale-95 transition-all ${className}`}
    >
      <span className="material-symbols-outlined text-[22px]">{isDark ? 'light_mode' : 'dark_mode'}</span>
    </button>
  );
}
