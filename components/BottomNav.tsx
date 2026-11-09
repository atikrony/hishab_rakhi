'use client';

import React from 'react';

export type NavTab = 'Home' | 'Wallet' | 'Analytics' | 'Statistics' | 'Profile';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav
      className="fixed z-20 bottom-[9px] left-1/2 -translate-x-1/2 w-[min(calc(100%-28px),400px)] h-[57px] rounded-[34px] bg-[#ffffffea] shadow-[0_4px_16px_rgba(0,0,0,0.08)] flex items-center justify-around backdrop-blur-[12px] border border-[#f3f3f4]"
      aria-label="Main navigation"
    >
      {/* Home */}
      <button
        onClick={() => onTabChange('Home')}
        className={`w-[43px] h-[43px] border-0 rounded-full bg-transparent flex items-center justify-center transition-all ${
          activeTab === 'Home' ? 'bg-[#f5f6f8] text-[#111]' : 'text-[#a2a3a6] hover:text-[#444]'
        }`}
        aria-label="Home"
        title="Home"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-[22px] h-[22px] stroke-current fill-none stroke-[1.8] stroke-round"
        >
          <path d="m3 11 9-8 9 8M5 10v10h5v-6h4v6h5V10" />
        </svg>
      </button>

      {/* Wallet */}
      <button
        onClick={() => onTabChange('Wallet')}
        className={`w-[43px] h-[43px] border-0 rounded-full bg-transparent flex items-center justify-center transition-all ${
          activeTab === 'Wallet' ? 'bg-[#f5f6f8] text-[#111]' : 'text-[#a2a3a6] hover:text-[#444]'
        }`}
        aria-label="Wallet"
        title="Wallet & Accounts"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-[22px] h-[22px] stroke-current fill-none stroke-[1.8] stroke-round"
        >
          <rect x="3" y="5" width="18" height="15" rx="2" />
          <path d="M3 8h18M16 14h2" />
        </svg>
      </button>

      {/* Analytics */}
      <button
        onClick={() => onTabChange('Analytics')}
        className={`w-[43px] h-[43px] border-0 rounded-full bg-transparent flex items-center justify-center transition-all ${
          activeTab === 'Analytics' ? 'bg-[#f5f6f8] text-[#111]' : 'text-[#a2a3a6] hover:text-[#444]'
        }`}
        aria-label="Analytics"
        title="Analytics & Trends"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-[22px] h-[22px] stroke-current fill-none stroke-[1.8] stroke-round"
        >
          <path d="M3 19 9 12l4 3 7-9M16 6h4v4" />
        </svg>
      </button>

      {/* Statistics / Budgets */}
      <button
        onClick={() => onTabChange('Statistics')}
        className={`w-[43px] h-[43px] border-0 rounded-full bg-transparent flex items-center justify-center transition-all ${
          activeTab === 'Statistics' ? 'bg-[#f5f6f8] text-[#111]' : 'text-[#a2a3a6] hover:text-[#444]'
        }`}
        aria-label="Statistics"
        title="Budget & Statistics"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-[22px] h-[22px] stroke-current fill-none stroke-[1.8] stroke-round"
        >
          <path d="M12 3v9h9M20.5 15A9 9 0 1 1 9 3.5" />
        </svg>
      </button>

      {/* Profile */}
      <button
        onClick={() => onTabChange('Profile')}
        className={`w-[43px] h-[43px] border-0 rounded-full bg-transparent flex items-center justify-center transition-all ${
          activeTab === 'Profile' ? 'bg-[#f5f6f8] text-[#111]' : 'text-[#a2a3a6] hover:text-[#444]'
        }`}
        aria-label="Profile"
        title="Profile & Mobile API"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-[22px] h-[22px] stroke-current fill-none stroke-[1.8] stroke-round"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      </button>
    </nav>
  );
};
