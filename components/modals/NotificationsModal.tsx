'use client';

import React from 'react';
import { NotificationItem } from '@/lib/types';

interface NotificationsModalProps {
  isOpen: boolean;
  notifications: NotificationItem[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  notifications,
  onClose,
  onMarkAllRead,
  onClearAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-[430px] rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl animate-slide-up max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f2]">
          <div className="flex items-center gap-2">
            <h2 className="text-[19px] font-[650] text-[#17191d]">Notifications</h2>
            <span className="text-xs bg-[#f4f5f7] text-[#666] px-2 py-0.5 rounded-full font-bold">
              {notifications.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f4f5f7] flex items-center justify-center text-[#666] hover:text-[#111]"
          >
            ✕
          </button>
        </div>

        <div className="flex justify-between items-center py-2 text-xs">
          <button
            onClick={onMarkAllRead}
            className="text-[#079be8] font-medium hover:underline"
          >
            Mark all read
          </button>
          <button
            onClick={onClearAll}
            className="text-[#fa4563] font-medium hover:underline"
          >
            Clear all
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 py-2">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-[#888] text-sm">
              No new notifications. You're all caught up!
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  !n.read
                    ? 'border-[#079be8]/40 bg-[#f0f8ff]/50'
                    : 'border-[#e9e9ec] bg-white opacity-80'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="font-semibold text-sm text-[#17191d]">{n.title}</div>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-[#079be8] mt-1"></span>
                  )}
                </div>
                <div className="text-xs text-[#555] mt-1">{n.message}</div>
                <div className="text-[10px] text-[#aaa] mt-2">
                  {new Date(n.date).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

