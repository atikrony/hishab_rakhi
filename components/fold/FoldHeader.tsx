'use client';

import React from 'react';
import { UserProfile } from '@/lib/types';

interface FoldHeaderProps {
  user: UserProfile;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onOpenAddModal: () => void;
  onOpenNotifications: () => void;
  unreadNotifsCount: number;
}

export function FoldHeader({
  user,
  searchQuery,
  onSearchChange,
  selectedMonth,
  onMonthChange,
  onOpenAddModal,
  onOpenNotifications,
  unreadNotifsCount,
}: FoldHeaderProps) {
  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 px-margin-desktop flex items-center justify-between border-b border-hairline">
      {/* Live Search Input */}
      <div className="flex items-center gap-space-md flex-1 max-w-md">
        <div className="flex items-center gap-space-sm bg-surface-container-lowest px-space-md py-space-xs rounded-lg w-full shadow-[0_1px_3px_0_rgba(23,25,29,0.03)] border border-surface-container">
          <span className="material-symbols-outlined text-outline text-[18px]">search</span>
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-transparent w-full text-on-surface placeholder:text-outline text-body-md font-body-md outline-none border-none p-0 focus:ring-0"
            placeholder="Search transactions, labels, notes..."
            type="text"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="text-outline hover:text-on-surface"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">cancel</span>
            </button>
          )}
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-space-md">
        {/* Month / Date Selector */}
        <div className="relative">
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="flex items-center gap-space-xs bg-surface-container-lowest pl-8 pr-7 py-2 rounded-lg shadow-[0_1px_3px_0_rgba(23,25,29,0.03)] text-on-surface font-label-md text-label-md border border-surface-container appearance-none cursor-pointer outline-none focus:border-primary"
          >
            <option value="Nov 2024">Nov 2024</option>
            <option value="Oct 2024">Oct 2024</option>
            <option value="All Time">All Time</option>
          </select>
          <span className="material-symbols-outlined text-on-surface-variant text-[18px] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            calendar_today
          </span>
          <span className="material-symbols-outlined text-on-surface-variant text-[16px] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            expand_more
          </span>
        </div>

        {/* Global Add Transaction Button */}
        <button
          onClick={onOpenAddModal}
          className="h-9 px-space-md rounded-lg bg-primary text-on-primary font-label-md text-label-md flex items-center gap-space-xs shadow-[0_1px_3px_0_rgba(23,25,29,0.03)] hover:bg-primary-container hover:text-on-primary transition-colors active:scale-[0.98]"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Add Transaction</span>
        </button>

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors shadow-[0_1px_3px_0_rgba(23,25,29,0.03)] border border-surface-container relative"
          type="button"
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          {unreadNotifsCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-secondary ring-2 ring-white"></span>
          )}
        </button>

        {/* User Mini Avatar */}
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center overflow-hidden ring-1 ring-black/10">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
          )}
        </div>
      </div>
    </header>
  );
}

