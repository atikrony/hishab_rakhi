'use client';

import React from 'react';
import { useLedger } from '@/features/ledger/LedgerContext';

/** Card next to Net Balance that opens the savings-plan assistant. */
export function SavingsPlanCard({ compact = false }: { compact?: boolean }) {
  const { setIsSavingsPlanOpen } = useLedger();
  return (
    <button
      type="button"
      onClick={() => setIsSavingsPlanOpen(true)}
      data-tour="savings-plan"
      className={`group relative overflow-hidden rounded-xl hero-gradient text-white text-left shadow-lg hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.99] transition-all ${
        compact ? 'p-space-md' : 'p-space-lg'
      } flex flex-col justify-between gap-3`}
    >
      <span className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/15 blur-xl group-hover:scale-125 transition-transform duration-500" />
      <div className="flex items-center justify-between relative">
        <span className="font-label-md text-label-md font-semibold text-white/90">Savings plan</span>
        <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
          <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
        </span>
      </div>
      <div className="relative">
        <div className={`${compact ? 'text-title-sm' : 'font-headline-md text-headline-md'} font-bold leading-tight`}>
          How much to save
        </div>
        <div className="flex items-center gap-1 text-label-sm font-semibold text-white/85 mt-1">
          See your plan
          <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </div>
      </div>
    </button>
  );
}
