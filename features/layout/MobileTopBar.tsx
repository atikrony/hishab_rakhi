'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useLedger } from '@/features/ledger/LedgerContext';
import { ThemeToggle } from '@/components/ThemeToggle';

const TITLES: Record<string, string> = {
  '/summary': 'Summary',
  '/pocket': 'Add Money',
  '/spend': 'Spend',
};

export function MobileTopBar() {
  const pathname = usePathname() || '/';
  const { user, setIsSettingsOpen } = useLedger();
  const title = Object.entries(TITLES).find(([p]) => pathname.startsWith(p))?.[1] ?? 'Spend';

  return (
    <header className="sticky top-0 z-40 w-full bg-surface/90 backdrop-blur-xl border-b border-hairline pt-safe">
      <div className="h-14 max-w-md mx-auto px-margin flex items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold text-sm tracking-tighter flex-shrink-0">
            HR
          </div>
          <h1 className="font-title-sm text-title-sm text-on-surface font-bold truncate">{title}</h1>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Open settings"
            className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center overflow-hidden ring-1 ring-hairline active:scale-95 transition-transform"
          >
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">person</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
