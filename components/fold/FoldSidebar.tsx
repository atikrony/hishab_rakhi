'use client';

import React from 'react';
import { UserProfile } from '@/lib/types';

export type FoldTab = 'summary' | 'pocket' | 'spend' | 'settings' | 'help';

interface FoldSidebarProps {
  activeTab: FoldTab;
  onTabChange: (tab: FoldTab) => void;
  user: UserProfile;
  isMobileDeviceView: boolean;
  onToggleDeviceView: () => void;
}

export function FoldSidebar({
  activeTab,
  onTabChange,
  user,
  isMobileDeviceView,
  onToggleDeviceView,
}: FoldSidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between p-space-lg select-none border-r border-hairline">
      <div className="flex flex-col gap-space-xl">
        {/* Brand Header */}
        <div className="flex items-center gap-space-sm px-space-xs">
          <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold text-lg tracking-tighter shadow-sm">
            F
          </div>
          <div className="flex flex-col">
            <span className="font-title-sm text-title-sm text-on-surface tracking-tight leading-none font-bold">
              Fold Finance
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant leading-none mt-1">
              Personal Ledger
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
            <span className="font-label-sm text-label-sm text-secondary truncate font-medium">
              {user.plan || 'Premium Plan'}
            </span>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex flex-col gap-1.5">
          <button
            onClick={() => onTabChange('summary')}
            className={`w-full flex items-center gap-space-md px-space-md py-space-sm rounded-xl transition-all text-left ${
              activeTab === 'summary'
                ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-medium'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                activeTab === 'summary' ? 'text-secondary-fixed' : ''
              }`}
            >
              insights
            </span>
            <span>Summary</span>
          </button>

          <button
            onClick={() => onTabChange('pocket')}
            className={`w-full flex items-center gap-space-md px-space-md py-space-sm rounded-xl transition-all text-left ${
              activeTab === 'pocket'
                ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-medium'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                activeTab === 'pocket' ? 'text-secondary-fixed' : ''
              }`}
            >
              savings
            </span>
            <span>Pocket</span>
          </button>

          <button
            onClick={() => onTabChange('spend')}
            className={`w-full flex items-center gap-space-md px-space-md py-space-sm rounded-xl transition-all text-left ${
              activeTab === 'spend'
                ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-medium'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                activeTab === 'spend' ? 'text-secondary-fixed' : ''
              }`}
            >
              payments
            </span>
            <span>Spend</span>
          </button>
        </nav>
      </div>

      {/* Footer Navigation & View Toggle */}
      <div className="flex flex-col gap-space-xs pt-space-lg border-t border-surface-container">
        {/* Responsive viewport switch preview */}
        <button
          onClick={onToggleDeviceView}
          className="flex items-center justify-between px-space-md py-2 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-on-surface transition-colors mb-2 text-left"
          title="Toggle Mobile viewport preview"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
              {isMobileDeviceView ? 'smartphone' : 'laptop'}
            </span>
            <span className="font-label-sm text-label-sm font-semibold">
              {isMobileDeviceView ? 'Mobile View' : 'Desktop View'}
            </span>
          </div>
          <span className="font-label-sm text-[10px] uppercase tracking-wider text-secondary bg-secondary-container/40 px-1.5 py-0.5 rounded font-bold">
            Live
          </span>
        </button>

        <button
          onClick={() => onTabChange('settings')}
          className={`flex items-center gap-space-md px-space-md py-space-sm rounded-xl transition-colors text-left ${
            activeTab === 'settings'
              ? 'bg-primary-container text-on-primary font-semibold'
              : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-medium'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
          <span>Settings</span>
        </button>

        <button
          onClick={() => onTabChange('help')}
          className={`flex items-center gap-space-md px-space-md py-space-sm rounded-xl transition-colors text-left ${
            activeTab === 'help'
              ? 'bg-primary-container text-on-primary font-semibold'
              : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-medium'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">help</span>
          <span>Help & Support</span>
        </button>
      </div>
    </aside>
  );
}

