'use client';

import React from 'react';
import { UserProfile } from '@/lib/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onResetDb: () => Promise<void>;
  onLogout?: () => void;
  databaseMode?: 'dummy' | 'real';
  databaseFile?: string;
}

export function SettingsModal({
  isOpen,
  onClose,
  user,
  onResetDb,
  onLogout,
  databaseMode = 'dummy',
  databaseFile = 'hishab_dummy.json',
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-space-lg shadow-2xl flex flex-col space-y-space-md border border-[#E5E7EB]">
        <div className="flex items-center justify-between border-b border-surface-container pb-space-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-on-surface">settings</span>
            <h3 className="font-title-sm text-title-sm text-on-surface font-bold">
              Account & Ledger Settings
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* User Info */}
        <div className="p-space-md bg-surface-container-low rounded-xl flex items-center gap-space-md border border-surface-container">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/10"
          />
          <div className="flex flex-col">
            <span className="font-title-sm text-title-sm text-on-surface font-bold">{user.name}</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
              {user.email}
            </span>
            <span className="hidden sm:inline-block font-label-sm text-[10px] text-secondary font-semibold uppercase mt-0.5">
              {user.plan || 'Premium Plan'} • Currency: {user.currency || 'BDT'} ({user.currencySymbol || '৳'})
            </span>
          </div>
        </div>

        {/* Data & Security Guarantees */}
        <div className="flex flex-col gap-2">
          <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider">
            Active Security Guarantees
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low font-semibold text-on-surface">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">verified_user</span>
              <span>Git Excluded</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low font-semibold text-on-surface">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">lock</span>
              <span>Input Sanitized</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low font-semibold text-on-surface">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">speed</span>
              <span>Rate Limited</span>
            </div>
          </div>
        </div>

        {/* Database & Sync Options */}
        <div className="flex flex-col gap-2">
          <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider">
            Ledger Data Maintenance
          </span>
          <button
            type="button"
            onClick={async () => {
              if (confirm(`Reset active ${databaseMode} database back to default template? This cannot be undone.`)) {
                await onResetDb();
                onClose();
              }
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors border border-surface-container text-left"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-error">restart_alt</span>
              <span className="font-label-md text-label-md font-semibold text-on-surface">
                Reset {databaseMode === 'real' ? 'Real Ledger' : 'Dummy Ledger'}
              </span>
            </div>
            <span className="text-outline text-xs">Restore defaults</span>
          </button>
        </div>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-error-container/20 hover:bg-error-container/30 text-error font-label-md text-label-md font-bold transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Sign Out of Solo Account</span>
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-primary text-on-primary rounded-xl font-label-md text-label-md font-semibold mt-1"
        >
          Close
        </button>
      </div>
    </div>
  );
}

