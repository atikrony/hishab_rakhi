'use client';

import React from 'react';
import { NotificationItem } from '@/lib/types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
}

export function NotificationsModal({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
}: NotificationsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-space-lg shadow-2xl flex flex-col space-y-space-md border border-hairline">
        <div className="flex items-center justify-between border-b border-surface-container pb-space-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[22px]">
              notifications_active
            </span>
            <h3 className="font-title-sm text-title-sm text-on-surface font-bold">
              Ledger Wire & Alerts
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

        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-center font-label-md text-label-md text-outline py-6">
              No new alerts or wire updates.
            </p>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-space-sm rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface font-bold">
                    {notif.title}
                  </span>
                  <span className="font-label-sm text-[10px] text-outline">
                    {new Date(notif.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant text-xs">
                  {notif.message}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-surface-container">
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="text-secondary font-label-sm text-label-sm font-semibold hover:underline"
          >
            Mark all read
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

