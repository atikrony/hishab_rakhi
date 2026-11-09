'use client';

import React from 'react';
import { UserProfile, NotificationItem } from '@/lib/types';

interface TopBarProps {
  user: UserProfile;
  notifications: NotificationItem[];
  selectedDateText: string;
  onOpenNotifications: () => void;
  onOpenCalendar: () => void;
  onOpenProfile: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  user,
  notifications,
  selectedDateText,
  onOpenNotifications,
  onOpenCalendar,
  onOpenProfile,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="h-[54px] flex items-center gap-[10px] px-[2px] pb-[10px]">
      <button
        onClick={onOpenProfile}
        className="relative group transition-transform active:scale-95"
        title="View profile & settings"
      >
        <img
          className="w-[45px] h-[45px] rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-black/5"
          src={user.avatar}
          alt={user.name}
        />
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
      </button>

      <div className="flex-1 min-w-0" onClick={onOpenProfile}>
        <div className="text-[18px] font-[550] tracking-[-0.45px] text-[#17191d] truncate">
          Hello {user.name}!
        </div>
        <div className="text-[13px] text-[#a4a5a8] mt-[2px] truncate">
          {selectedDateText || 'Tue 3 Jun, 2025'}
        </div>
      </div>

      <button
        className="relative border-0 bg-[#fafafa] hover:bg-[#f0f0f2] transition-colors w-[46px] h-[46px] rounded-full grid place-items-center text-[#15171a] ml-[3px] active:scale-95"
        aria-label="Notifications"
        onClick={onOpenNotifications}
      >
        <svg
          viewBox="0 0 24 24"
          className="w-[21px] h-[21px] stroke-current fill-none stroke-[1.8] stroke-round"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-[10px] right-[10px] w-[8px] h-[8px] bg-[#fa4563] rounded-full ring-2 ring-white"></span>
        )}
      </button>

      <button
        className="border-0 bg-[#fafafa] hover:bg-[#f0f0f2] transition-colors w-[46px] h-[46px] rounded-full grid place-items-center text-[#15171a] ml-[3px] active:scale-95"
        aria-label="Calendar"
        onClick={onOpenCalendar}
      >
        <svg
          viewBox="0 0 24 24"
          className="w-[21px] h-[21px] stroke-current fill-none stroke-[1.8] stroke-round"
        >
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18M8 14h3v3H8z" />
        </svg>
      </button>
    </header>
  );
};
