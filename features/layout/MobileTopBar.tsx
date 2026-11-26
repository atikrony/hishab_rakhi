'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useLedger } from '@/features/ledger/LedgerContext';

const TITLES: Record<string, string> = {
  '/summary': 'Summary',
  '/pocket': 'Add Money',
  '/spend': 'Spend',
};

export function MobileTopBar() {
  const pathname = usePathname() || '/';
  const { user, setIsSettingsOpen, setIsShareOpen } = useLedger();
  const title = Object.entries(TITLES).find(([p]) => pathname.startsWith(p))?.[1] ?? 'Spend';

  return (
    <header className="sticky top-0 z-40 w-full glass-bar border-b pt-safe">
      <div className="h-14 max-w-md mx-auto px-margin flex items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold text-sm tracking-tighter flex-shrink-0">
            B
          </div>
          <h1 className="font-title-sm text-title-sm text-on-surface font-bold truncate">{title}</h1>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            aria-label="Share spending"
            title="Share spending"
            className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[22px]">ios_share</span>
          </button>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Open settings"
            data-tour="settings"
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
