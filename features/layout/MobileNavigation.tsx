'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLedger } from '@/features/ledger/LedgerContext';

export function MobileNavigation() {
  const pathname = usePathname();
  const { setIsSettingsOpen } = useLedger();

  const isCurrent = (path: string) => {
    if (!pathname) return false;
    if (path === '/spend') {
      return pathname === '/spend' || pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-4px_24px_rgba(23,25,29,0.06)] border-t border-hairline">
      <div className="h-16 max-w-md mx-auto px-space-md flex items-center justify-around">
        <Link
          href="/spend"
          className={`flex flex-col items-center justify-center gap-1 w-20 h-12 rounded-xl transition-all active:scale-95 ${
            isCurrent('/spend') ? 'text-primary font-bold' : 'text-on-surface-variant'
          }`}
        >
          <span
            className={`material-symbols-outlined text-[22px] ${
              isCurrent('/spend') ? 'text-on-tertiary-container font-bold' : ''
            }`}
          >
            credit_card
          </span>
          <span className="font-label-sm text-[11px] tracking-tight">Spend</span>
        </Link>

        <Link
          href="/summary"
          className={`flex flex-col items-center justify-center gap-1 w-20 h-12 rounded-xl transition-all active:scale-95 ${
            isCurrent('/summary') ? 'text-primary font-bold' : 'text-on-surface-variant'
          }`}
        >
          <span
            className={`material-symbols-outlined text-[22px] ${
              isCurrent('/summary') ? 'text-primary font-bold' : ''
            }`}
          >
            pie_chart
          </span>
          <span className="font-label-sm text-[11px] tracking-tight">Summary</span>
        </Link>

        <Link
          href="/pocket"
          className={`flex flex-col items-center justify-center gap-1 w-20 h-12 rounded-xl transition-all active:scale-95 ${
            isCurrent('/pocket') ? 'text-primary font-bold' : 'text-on-surface-variant'
          }`}
        >
          <span
            className={`material-symbols-outlined text-[22px] ${
              isCurrent('/pocket') ? 'text-secondary font-bold' : ''
            }`}
          >
            add_circle
          </span>
          <span className="font-label-sm text-[11px] tracking-tight">Add Money</span>
        </Link>

        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          className="flex flex-col items-center justify-center gap-1 w-20 h-12 rounded-xl transition-all active:scale-95 text-on-surface-variant hover:text-primary"
        >
          <span className="material-symbols-outlined text-[22px]">settings</span>
          <span className="font-label-sm text-[11px] tracking-tight">Settings</span>
        </button>
      </div>
    </nav>
  );
}

