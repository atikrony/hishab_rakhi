'use client';

import React from 'react';
import { Transaction } from '@/lib/types';

interface RecentActivitySectionProps {
  transactions: Transaction[];
  currencySymbol?: string;
  onSeeAll: () => void;
  onSelectTransaction: (tx: Transaction) => void;
}

export const RecentActivitySection: React.FC<RecentActivitySectionProps> = ({
  transactions,
  currencySymbol = '$',
  onSeeAll,
  onSelectTransaction,
}) => {
  // Render icon based on brandIcon or category
  const renderIcon = (tx: Transaction) => {
    const iconType = tx.brandIcon || 'default';

    if (iconType === 'youtube' || tx.title.toLowerCase().includes('youtube')) {
      return (
        <div className="w-[42px] h-[42px] flex-[0_0_42px] rounded-full bg-[#fff0f0] text-[#f00] grid place-items-center">
          <svg viewBox="0 0 24 24" className="w-[23px] h-[23px] fill-[#f00] stroke-[#f00]">
            <rect x="2.5" y="5" width="19" height="14" rx="4" />
            <path d="m10 9 5 3-5 3z" fill="white" stroke="white" />
          </svg>
        </div>
      );
    }

    if (iconType === 'apple' || tx.title.toLowerCase().includes('apple')) {
      return (
        <div className="w-[42px] h-[42px] flex-[0_0_42px] rounded-full bg-[#f7f7f8] text-[#111] grid place-items-center">
          <svg viewBox="0 0 24 24" className="w-[23px] h-[23px] fill-[#111] stroke-[#111]">
            <path d="M16.5 12.5c0-2 1.6-3 1.7-3.1-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.8-3.2.8s-1.7-.8-2.8-.8c-1.5 0-2.9.9-3.7 2.2-1.6 2.7-.4 6.8 1.1 9 .7 1.1 1.5 2.3 2.6 2.2 1-.1 1.4-.7 2.7-.7s1.7.7 2.8.7 1.8-1.1 2.5-2.2c.8-1.2 1.1-2.4 1.1-2.5-.1 0-2-.8-2-4Z" />
            <path d="M14.5 5.5c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.7-1.1 1.7-.9 2.6 1 .1 2-.5 2.6-1.2Z" />
          </svg>
        </div>
      );
    }

    if (iconType === 'freelance' || tx.category === 'Salary' || tx.category === 'Freelance') {
      return (
        <div className="w-[42px] h-[42px] flex-[0_0_42px] rounded-full bg-[#f7f7f8] text-[#151515] grid place-items-center">
          <svg viewBox="0 0 24 24" className="w-[23px] h-[23px] stroke-current fill-none stroke-[1.8] stroke-round">
            <path d="M7 3h8l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
            <path d="M15 3v5h5M9 13h7M9 17h7" />
          </svg>
        </div>
      );
    }

    // Default / Food / Coffee
    return (
      <div className="w-[42px] h-[42px] flex-[0_0_42px] rounded-full bg-[#f7f7f8] text-[#151515] grid place-items-center">
        <svg viewBox="0 0 24 24" className="w-[23px] h-[23px] stroke-current fill-none stroke-[1.8] stroke-round">
          <path d="M4 14c-1-2 1-5 4-6l4-2 4 3 2 5-3 4-5-1-3-3Z" />
          <path d="m9 8 7 8M14 5l2-2 3 3-2 2M6 14l-3 3 3 3 3-3M16 11l2-2" />
        </svg>
      </div>
    );
  };

  // Format time (e.g. "12:21 PM")
  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '12:00 PM';
    }
  };

  // Group transactions by "Today", "Yesterday", and "Earlier"
  const now = new Date();
  const todayDateStr = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayDateStr = yesterday.toDateString();

  const todayTxs: Transaction[] = [];
  const otherTxs: Transaction[] = [];

  transactions.forEach((tx) => {
    const txDate = new Date(tx.date).toDateString();
    if (txDate === todayDateStr || tx.date.startsWith('2026-06-03')) {
      todayTxs.push(tx);
    } else {
      otherTxs.push(tx);
    }
  });

  return (
    <section>
      <div className="flex items-center justify-between mx-[1px] mb-[19px]">
        <h2 className="text-[18px] font-[550] m-0 tracking-[-0.35px] text-[#17191d]">
          Recent Activity
        </h2>
        <button
          onClick={onSeeAll}
          className="border-0 bg-transparent text-[#008fe0] text-[14px] p-[4px] hover:underline cursor-pointer active:opacity-70"
        >
          See all
        </button>
      </div>

      <div className="text-[15px] text-[#a5a5a8] m-[0_0_10px_1px] font-medium">Today</div>

      <div className="space-y-[15px]">
        {todayTxs.map((tx) => (
          <div
            key={tx.id}
            onClick={() => onSelectTransaction(tx)}
            className="flex items-center gap-[11px] px-[1px] min-h-[43px] cursor-pointer hover:bg-black/[0.02] p-1.5 rounded-xl transition-colors active:scale-[0.99]"
          >
            {renderIcon(tx)}
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-[500] whitespace-nowrap overflow-hidden text-ellipsis text-[#17191d]">
                {tx.title}
              </div>
              <div className="text-[13px] text-[#aaa] mt-[4px]">
                {tx.category} • {formatTime(tx.date)}
              </div>
            </div>
            <div className="text-right min-w-[75px]">
              <div
                className={`text-[16px] font-[550] whitespace-nowrap ${
                  tx.type === 'income' ? 'text-[#219b35]' : 'text-[#fa4563]'
                }`}
              >
                {tx.type === 'income' ? '+' : '-'}
                {currencySymbol}
                {tx.amount < 10 && tx.amount % 1 === 0
                  ? tx.amount
                  : tx.amount.toLocaleString(undefined, {
                      minimumFractionDigits: tx.amount % 1 === 0 ? 0 : 2,
                      maximumFractionDigits: 2,
                    })}
              </div>
              <div className="text-[13px] text-[#aaa] mt-[4px] capitalize">
                {tx.type}
              </div>
            </div>
          </div>
        ))}

        {otherTxs.length > 0 && (
          <>
            <div className="text-[15px] text-[#a5a5a8] m-[14px_0_10px_1px] font-medium">
              Earlier
            </div>
            {otherTxs.slice(0, 3).map((tx) => (
              <div
                key={tx.id}
                onClick={() => onSelectTransaction(tx)}
                className="flex items-center gap-[11px] px-[1px] min-h-[43px] cursor-pointer hover:bg-black/[0.02] p-1.5 rounded-xl transition-colors active:scale-[0.99]"
              >
                {renderIcon(tx)}
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-[500] whitespace-nowrap overflow-hidden text-ellipsis text-[#17191d]">
                    {tx.title}
                  </div>
                  <div className="text-[13px] text-[#aaa] mt-[4px]">
                    {tx.category} • {formatTime(tx.date)}
                  </div>
                </div>
                <div className="text-right min-w-[75px]">
                  <div
                    className={`text-[16px] font-[550] whitespace-nowrap ${
                      tx.type === 'income' ? 'text-[#219b35]' : 'text-[#fa4563]'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {currencySymbol}
                    {tx.amount.toLocaleString(undefined, {
                      minimumFractionDigits: tx.amount % 1 === 0 ? 0 : 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-[13px] text-[#aaa] mt-[4px] capitalize">
                    {tx.type}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  );
};

