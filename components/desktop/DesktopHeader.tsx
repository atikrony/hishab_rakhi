'use client';

import React from 'react';
import { NotificationItem } from '@/lib/types';

interface DesktopHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedDateFilter: string;
  onSelectDateFilter: (val: string) => void;
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
  onAddTransaction: () => void;
  onTransfer: () => void;
  onScanReceipt: () => void;
  onAddSaving: () => void;
  onToggleMobilePreview: () => void;
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  searchQuery,
  onSearchChange,
  selectedDateFilter,
  onSelectDateFilter,
  notifications,
  onOpenNotifications,
  onAddTransaction,
  onTransfer,
  onScanReceipt,
  onAddSaving,
  onToggleMobilePreview,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="h-16 bg-white border-b border-[#e9e9ec] px-8 flex items-center justify-between sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888]">
            <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none stroke-[2]">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search payees, categories, notes... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-12 py-2 rounded-xl border border-[#e2e2e6] text-xs outline-none focus:border-[#079be8] bg-[#f8f9fa] transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-white border border-[#d2d2d6] text-[#777] px-1.5 py-0.5 rounded font-mono shadow-xs">
            /
          </kbd>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Date Filter Dropdown */}
        <div className="flex items-center bg-[#f4f5f7] rounded-xl p-1 text-xs">
          {['Today', 'This Week', 'This Month', 'All Time'].map((f) => (
            <button
              key={f}
              onClick={() => onSelectDateFilter(f)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedDateFilter === f
                  ? 'bg-white text-[#17191d] shadow-sm font-semibold'
                  : 'text-[#666] hover:text-black'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#e9e9ec]">
          <button
            onClick={onScanReceipt}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#e2e2e6] text-xs font-semibold text-[#17191d] hover:bg-[#fafafa] transition-colors"
            title="Scan paper or digital receipt"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current fill-none stroke-[2]">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3M8 12h8" />
            </svg>
            Scan
          </button>

          <button
            onClick={onTransfer}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#e2e2e6] text-xs font-semibold text-[#17191d] hover:bg-[#fafafa] transition-colors"
            title="Internal account transfer"
          >
            ⇄ Transfer
          </button>

          <button
            onClick={onAddSaving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#e2e2e6] text-xs font-semibold text-[#17191d] hover:bg-[#fafafa] transition-colors"
            title="Create savings target"
          >
            + Goal
          </button>

          <button
            onClick={onAddTransaction}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#079be8] to-[#008fe0] text-white text-xs font-bold hover:opacity-95 shadow-sm shadow-[#079be8]/30 transition-all active:scale-95"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current fill-none stroke-[2.5]">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Transaction
          </button>
        </div>

        {/* Notifications */}
        <button
          onClick={onOpenNotifications}
          className="relative w-9 h-9 rounded-xl border border-[#e2e2e6] hover:bg-[#fafafa] flex items-center justify-center text-[#555] transition-colors ml-1"
          aria-label="Notifications"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none stroke-[2]">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#fa4563] rounded-full ring-2 ring-white"></span>
          )}
        </button>

        {/* Mobile View Toggle */}
        <button
          onClick={onToggleMobilePreview}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f0f8ff] border border-[#079be8]/30 text-[#079be8] text-xs font-bold hover:bg-[#e0f1fe] transition-colors ml-1"
          title="Toggle Mobile Prototype Frame"
        >
          <span>📱</span>
          <span>Mobile Mode</span>
        </button>
      </div>
    </header>
  );
};
