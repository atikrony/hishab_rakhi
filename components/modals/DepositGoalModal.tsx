'use client';

import React, { useState } from 'react';
import { SavingsGoal, WalletAccount } from '@/lib/types';

interface DepositGoalModalProps {
  goal: SavingsGoal | null;
  wallets: WalletAccount[];
  currencySymbol?: string;
  onClose: () => void;
  onDepositSuccess: () => void;
  onToast: (msg: string) => void;
}

export const DepositGoalModal: React.FC<DepositGoalModalProps> = ({
  goal,
  wallets,
  currencySymbol = '$',
  onClose,
  onDepositSuccess,
  onToast,
}) => {
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [loading, setLoading] = useState(false);

  if (!goal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/v1/savings/${goal.id}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: num, walletId }),
      });

      const data = await res.json();
      if (data.success) {
        onToast(`Deposited ${currencySymbol}${num} to ${goal.title}!`);
        onDepositSuccess();
        onClose();
      } else {
        onToast(data.error || 'Deposit failed');
      }
    } catch {
      onToast('Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-[430px] rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f2]">
          <h2 className="text-[19px] font-[650] text-[#17191d]">Add Funds to Goal</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f4f5f7] flex items-center justify-center text-[#666] hover:text-[#111]"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          <div className="bg-[#f8f9fa] p-3.5 rounded-2xl border border-[#ededf0]">
            <span className="text-xs text-[#888]">Target Goal</span>
            <div className="font-bold text-base text-[#17191d]">{goal.title}</div>
            <div className="text-xs text-[#079be8] font-semibold mt-1">
              Current: {currencySymbol}{goal.currentAmount.toLocaleString()} / {currencySymbol}{goal.targetAmount.toLocaleString()}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#888] uppercase">Deposit Amount ({currencySymbol})</label>
            <input
              type="number"
              step="1"
              min="1"
              required
              placeholder="e.g. 500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full mt-1 p-3 rounded-2xl border border-[#e2e2e6] text-xl font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#888] uppercase">Fund From Account</label>
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full mt-1 p-3 rounded-2xl border border-[#e2e2e6] text-sm bg-white"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} (Balance: {currencySymbol}{w.balance.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[50px] rounded-2xl bg-[#079be8] text-white font-semibold text-sm hover:bg-[#0689cf] transition-colors"
            >
              {loading ? 'Depositing...' : 'Confirm Deposit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

