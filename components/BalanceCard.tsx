'use client';

import React from 'react';

interface BalanceCardProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  incomeTrend?: number;
  expenseTrend?: number;
  currencySymbol?: string;
  isBalanceVisible: boolean;
  onToggleBalance: () => void;
  onOpenAnalytics?: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  totalBalance,
  monthlyIncome,
  monthlyExpense,
  incomeTrend = 3.1,
  expenseTrend = 4.2,
  currencySymbol = '$',
  isBalanceVisible,
  onToggleBalance,
  onOpenAnalytics,
}) => {
  const formatAmount = (val: number) => {
    return `${currencySymbol}${val.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <section className="my-[12px] border border-[#e9e9ec] rounded-[20px] bg-[#fbfbfc] p-[17px_17px_18px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all hover:border-[#dfdfe4]">
      <div className="flex items-center justify-between">
        <div className="text-[14px] font-[500] text-[#17191d]">Total Balance</div>
        <button
          onClick={onOpenAnalytics}
          className="text-[12px] font-medium text-[#079be8] hover:underline"
        >
          Analytics &rarr;
        </button>
      </div>

      <div className="flex items-center gap-[12px] mt-[7px]">
        <div className="text-[36px] tracking-[-1.6px] font-[650] leading-[1.2] text-[#17191d]">
          {isBalanceVisible ? formatAmount(totalBalance) : '••••••••'}
        </div>
        <button
          className="border-0 bg-transparent p-[5px] text-[#222] hover:text-[#079be8] transition-colors active:scale-90"
          aria-label={isBalanceVisible ? 'Hide balance' : 'Show balance'}
          onClick={onToggleBalance}
          title={isBalanceVisible ? 'Hide balance' : 'Show balance'}
        >
          {isBalanceVisible ? (
            <svg viewBox="0 0 24 24" className="w-[19px] h-[19px] stroke-current fill-none stroke-[1.8]">
              <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-[19px] h-[19px] stroke-current fill-none stroke-[1.8]">
              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
              <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
              <line x1="2" y1="2" x2="22" y2="22" />
            </svg>
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-[12px] mt-[20px]">
        <div>
          <div className="text-[14px] text-[#85868a] mb-[7px]">Income</div>
          <div className="text-[19px] tracking-[-0.5px] whitespace-nowrap font-medium text-[#17191d]">
            {isBalanceVisible ? formatAmount(monthlyIncome) : '••••••'}{' '}
            <span className="inline-flex items-center gap-[5px] ml-[7px] text-[13px] px-[7px] py-[3px] rounded-[7px] text-[#fa4563] bg-[#ffe9ee] align-[2px]">
              <svg viewBox="0 0 24 24" className="w-[17px] h-[17px] stroke-current fill-none stroke-[2]">
                <path d="M19 5 5 19M5 9v10h10" />
              </svg>
              {incomeTrend}%
            </span>
          </div>
        </div>

        <div>
          <div className="text-[14px] text-[#85868a] mb-[7px]">Expense</div>
          <div className="text-[19px] tracking-[-0.5px] whitespace-nowrap font-medium text-[#17191d]">
            {isBalanceVisible ? formatAmount(monthlyExpense) : '••••••'}{' '}
            <span className="inline-flex items-center gap-[5px] ml-[7px] text-[13px] px-[7px] py-[3px] rounded-[7px] text-[#219b35] bg-[#e7f4e8] align-[2px]">
              <svg viewBox="0 0 24 24" className="w-[17px] h-[17px] stroke-current fill-none stroke-[2]">
                <path d="m5 19 14-14M9 5h10v10" />
              </svg>
              {expenseTrend}%
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
