'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLedger } from '@/features/ledger/LedgerContext';
import { ThemeToggle } from '@/components/ThemeToggle';

export function HishabSidebar() {
  const pathname = usePathname();
  const { user, setIsSettingsOpen, handleLogout } = useLedger();

  const isCurrent = (path: string) => {
    if (!pathname) return false;
    if (path === '/spend') {
      return pathname === '/spend' || pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex-col justify-between p-space-lg select-none border-r border-hairline">
      <div className="flex flex-col gap-space-xl">
        {/* Brand Header */}
        <div className="flex items-center gap-space-sm px-space-xs">
          <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold text-base tracking-tighter shadow-sm">
            HR
          </div>
          <div className="flex flex-col">
            <span className="font-title-sm text-title-sm text-on-surface tracking-tight leading-none font-bold">
              Hishab Rakhi
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant leading-none mt-1">
              হিসাব রাখি
            </span>
          </div>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-space-sm px-space-xs py-space-sm bg-surface-container-low rounded-xl">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center overflow-hidden ring-2 ring-black/5">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            )}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-title-sm text-title-sm text-on-surface truncate font-semibold">
              {user.name}
            </span>
          </div>
        </div>

        {/* Main Navigation - Routes to separate pages (Spend -> Summary -> Add Money) */}
        <nav className="flex flex-col gap-1.5">
          <Link
            href="/spend"
            className={`w-full flex items-center gap-space-md px-space-md py-space-sm rounded-xl transition-all text-left ${
              isCurrent('/spend')
                ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-medium'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                isCurrent('/spend') ? 'text-secondary-fixed' : ''
              }`}
            >
              payments
            </span>
            <span>Spend</span>
          </Link>

          <Link
            href="/summary"
            className={`w-full flex items-center gap-space-md px-space-md py-space-sm rounded-xl transition-all text-left ${
              isCurrent('/summary')
                ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-medium'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                isCurrent('/summary') ? 'text-secondary-fixed' : ''
              }`}
            >
              insights
            </span>
            <span>Summary</span>
          </Link>

          <Link
            href="/pocket"
            className={`w-full flex items-center gap-space-md px-space-md py-space-sm rounded-xl transition-all text-left ${
              isCurrent('/pocket')
                ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-medium'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                isCurrent('/pocket') ? 'text-secondary-fixed' : ''
              }`}
            >
              add_circle
            </span>
            <span>Add Money</span>
          </Link>
        </nav>
      </div>

      {/* Footer Navigation */}
      <div className="flex flex-col gap-space-xs pt-space-lg border-t border-surface-container">
        {/* Settings Button */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-full flex items-center gap-space-md px-space-md py-space-sm rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface text-left transition-colors font-medium"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
          <span className="font-label-md text-label-md">Settings</span>
        </button>

        {/* Theme */}
        <ThemeToggle variant="row" />

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-space-md px-space-md py-space-sm rounded-xl text-error hover:bg-error-container/20 hover:text-error text-left transition-colors font-semibold"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="font-label-md text-label-md">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

