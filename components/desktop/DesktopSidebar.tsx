'use client';

import React from 'react';
import Link from 'next/link';
import { UserProfile, NotificationItem } from '@/lib/types';

export type DesktopNavView =
  | 'overview'
  | 'transactions'
  | 'wallets'
  | 'analytics'
  | 'budgets'
  | 'scanner'
  | 'settings';

interface DesktopSidebarProps {
  currentView: DesktopNavView;
  onSelectView: (view: DesktopNavView) => void;
  user: UserProfile;
  notifications: NotificationItem[];
  onToggleMobilePreview: () => void;
  onOpenNotifications: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  currentView,
  onSelectView,
  user,
  notifications,
  onToggleMobilePreview,
  onOpenNotifications,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;

  const navItems: { id: DesktopNavView; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current fill-none stroke-[2] stroke-round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current fill-none stroke-[2] stroke-round">
          <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
          <path d="M9 7h6M9 11h6M9 15h4" />
        </svg>
      ),
    },
    {
      id: 'wallets',
      label: 'Wallets & Cards',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current fill-none stroke-[2] stroke-round">
          <rect x="2" y="5" width="20" height="14" rx="2.5" />
          <path d="M2 10h20M16 14h2" />
        </svg>
      ),
    },
    {
      id: 'analytics',
      label: 'Analytics & Reports',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current fill-none stroke-[2] stroke-round">
          <path d="M3 19 9 12l4 3 8-10M17 5h4v4" />
        </svg>
      ),
    },
    {
      id: 'budgets',
      label: 'Budgets & Goals',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current fill-none stroke-[2] stroke-round">
          <circle cx="12" cy="12" r="9" />
          <path d="m12 6 2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1z" />
        </svg>
      ),
    },
    {
      id: 'scanner',
      label: 'Receipt OCR Scanner',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current fill-none stroke-[2] stroke-round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3M8 12h8" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Settings & API',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current fill-none stroke-[2] stroke-round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#e9e9ec] h-screen sticky top-0 flex flex-col justify-between p-4 z-30 select-none shadow-[1px_0_4px_rgba(0,0,0,0.02)]">
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-3 px-2 py-3 mb-6 border-b border-[#f0f0f2]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#079be8] to-[#19aaf5] flex items-center justify-center text-white shadow-md shadow-[#079be8]/20">
            <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-current fill-none stroke-[2.2]">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-[17px] text-[#17191d] tracking-tight flex items-center gap-1.5">
              Hishab Rakhi
              <span className="text-[10px] font-bold uppercase bg-[#079be8]/10 text-[#079be8] px-1.5 py-0.5 rounded-md">
                Pro
              </span>
            </div>
            <div className="text-[11px] text-[#888]">Fintech Desktop Suite</div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#079be8] text-white shadow-sm shadow-[#079be8]/25'
                    : 'text-[#555] hover:bg-[#f4f5f7] hover:text-[#17191d]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-white' : 'text-[#888]'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-red-50 text-[#fa4563]'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Quick Links / Mobile API */}
        <div className="mt-6 pt-5 border-t border-[#f0f0f2] px-2 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#aaa]">
            Developer & Mobile
          </div>
          <Link
            href="/api-docs"
            className="flex items-center gap-2.5 text-xs font-semibold text-[#079be8] hover:bg-[#f0f8ff] p-2 rounded-xl transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            REST API Playground &rarr;
          </Link>
        </div>
      </div>

      {/* Footer User Info & Mode Switcher */}
      <div className="pt-4 border-t border-[#f0f0f2] space-y-3">
        {/* Toggle to Mobile View */}
        <button
          onClick={onToggleMobilePreview}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-[#e2e2e6] hover:border-[#079be8] hover:bg-[#f0f8ff] text-xs font-semibold text-[#444] transition-all"
        >
          <span>📱</span>
          <span>Switch to Mobile View</span>
        </button>

        {/* User Card */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#fafafa] border border-[#f0f0f2]">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-9 h-9 rounded-full object-cover border border-white shadow-sm flex-shrink-0"
            />
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#17191d] truncate">{user.name}</div>
              <div className="text-[10px] text-[#888] truncate">{user.email}</div>
            </div>
          </div>
          <button
            onClick={onOpenNotifications}
            className="relative p-1.5 rounded-lg text-[#666] hover:bg-white hover:text-black transition-colors"
            title="Notifications"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none stroke-[2]">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#fa4563] rounded-full"></span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
