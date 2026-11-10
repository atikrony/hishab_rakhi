'use client';

import React from 'react';
import { SavingsGoal } from '@/lib/types';

interface SeeAllSavingsModalProps {
  isOpen: boolean;
  goals: SavingsGoal[];
  currencySymbol?: string;
  onClose: () => void;
  onAddNewGoal: () => void;
  onDeposit: (goal: SavingsGoal) => void;
  onDeleteGoal: (goalId: string) => void;
}

export const SeeAllSavingsModal: React.FC<SeeAllSavingsModalProps> = ({
  isOpen,
  goals,
  currencySymbol = '$',
  onClose,
  onAddNewGoal,
  onDeposit,
  onDeleteGoal,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-[480px] rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl animate-slide-up max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f2]">
          <div>
            <h2 className="text-[19px] font-[650] text-[#17191d]">Savings Goals</h2>
            <p className="text-xs text-[#888]">Track and fund your milestone targets</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f4f5f7] flex items-center justify-center text-[#666] hover:text-[#111]"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 py-3">
          {goals.map((g) => {
            const percent = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));

            return (
              <div
                key={g.id}
                className="border border-[#e9e9ec] rounded-2xl p-4 bg-white shadow-sm hover:border-[#079be8] transition-all"
              >
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="text-[16px] font-bold text-[#17191d]">{g.title}</h3>
                    <span className="text-xs text-[#888]">{g.category || 'General Goal'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#079be8]">
                      {percent}%
                    </span>
                  </div>
                </div>

                <div className="text-sm font-semibold text-[#17191d] mt-2">
                  {currencySymbol}
                  {g.currentAmount.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-[#888]">
                    / {currencySymbol}
                    {g.targetAmount.toLocaleString()}
                  </span>
                </div>

                <div className="h-2 w-full bg-[#ededee] rounded-full overflow-hidden my-2">
                  <div
                    className="h-full bg-[#079fe9] rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs text-[#888] mt-2">
                  <span>{g.note}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onDeleteGoal(g.id)}
                      className="text-[#fa4563] hover:underline"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => {
                        onDeposit(g);
                        onClose();
                      }}
                      className="font-semibold text-[#079be8] bg-[#f0f8ff] px-2.5 py-1 rounded-full hover:bg-[#e0f1fe]"
                    >
                      + Deposit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-[#f0f0f2]">
          <button
            onClick={() => {
              onAddNewGoal();
              onClose();
            }}
            className="w-full py-3 rounded-2xl bg-[#17191d] text-white text-sm font-semibold hover:bg-black transition-colors"
          >
            + Create Another Savings Goal
          </button>
        </div>
      </div>
    </div>
  );
};

