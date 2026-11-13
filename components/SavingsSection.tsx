'use client';

import React from 'react';
import { SavingsGoal } from '@/lib/types';

interface SavingsSectionProps {
  goals: SavingsGoal[];
  currencySymbol?: string;
  onSeeAll: () => void;
  onDeposit: (goal: SavingsGoal) => void;
}

export const SavingsSection: React.FC<SavingsSectionProps> = ({
  goals,
  currencySymbol = '৳',
  onSeeAll,
  onDeposit,
}) => {
  const primaryGoal = goals[0];

  if (!primaryGoal) {
    return (
      <section className="mb-[22px]">
        <div className="flex items-center justify-between mx-[1px] mb-[14px]">
          <h2 className="text-[18px] font-[550] m-0 tracking-[-0.35px] text-[#17191d]">
            Savings
          </h2>
          <button
            onClick={onSeeAll}
            className="border-0 bg-transparent text-[#008fe0] text-[14px] p-[4px] hover:underline"
          >
            Create goal
          </button>
        </div>
        <div className="border border-[#e9e9ec] rounded-[19px] p-[18px] text-center text-[#8d8e91] text-[14px]">
          No savings goals set yet. Tap to create one!
        </div>
      </section>
    );
  }

  const percent = Math.min(
    100,
    Math.round((primaryGoal.currentAmount / primaryGoal.targetAmount) * 100)
  );

  return (
    <section className="mb-[22px]">
      <div className="flex items-center justify-between mx-[1px] mb-[14px]">
        <h2 className="text-[18px] font-[550] m-0 tracking-[-0.35px] text-[#17191d]">
          Savings
        </h2>
        <button
          onClick={onSeeAll}
          className="border-0 bg-transparent text-[#008fe0] text-[14px] p-[4px] hover:underline cursor-pointer active:opacity-70"
        >
          See all
        </button>
      </div>

      <div className="border border-[#e9e9ec] rounded-[19px] p-[15px_13px_13px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all hover:border-[#dcdce2] bg-white">
        <div className="flex items-center justify-between text-[17px]">
          <span className="font-[550] text-[#17191d]">{primaryGoal.title}</span>
          <div className="text-[15px] font-[550] text-[#17191d]">
            {currencySymbol}
            {primaryGoal.currentAmount.toLocaleString()}{' '}
            <span className="text-[#888] font-[400]">
              / {currencySymbol}
              {primaryGoal.targetAmount.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="h-[4px] bg-[#ededee] rounded-[9px] my-[12px] mb-[11px] overflow-hidden">
          <span
            className="block h-full bg-[#079fe9] rounded-[9px] transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-[13px] text-[#8d8e91]">
            {primaryGoal.note || `${percent}% completed`}
          </div>
          <button
            onClick={() => onDeposit(primaryGoal)}
            className="text-[12px] font-semibold text-[#079be8] bg-[#f0f8ff] px-2.5 py-1 rounded-full hover:bg-[#e0f1fe] transition-colors"
          >
            + Add Funds
          </button>
        </div>
      </div>
    </section>
  );
};

