'use client';

import React, { useState } from 'react';

interface AddSavingsModalProps {
  isOpen: boolean;
  currencySymbol?: string;
  onClose: () => void;
  onSubmit: (goal: any) => Promise<void>;
}

export const AddSavingsModal: React.FC<AddSavingsModalProps> = ({
  isOpen,
  currencySymbol = '$',
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    const initial = parseFloat(currentAmount) || 0;

    if (!title.trim() || isNaN(target) || target <= 0) return;

    try {
      setLoading(true);
      await onSubmit({
        title: title.trim(),
        targetAmount: target,
        currentAmount: initial,
        category,
        targetDate,
      });
      setTitle('');
      setTargetAmount('');
      setCurrentAmount('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-[430px] rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#f0f0f2]">
          <h2 className="text-[19px] font-[650] text-[#17191d]">New Savings Goal</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f4f5f7] flex items-center justify-center text-[#666] hover:text-[#111]"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <label className="text-xs font-semibold text-[#888] uppercase">Goal Name</label>
            <input
              type="text"
              required
              placeholder="e.g. PC Gaming / Vacation Trip"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 rounded-2xl border border-[#e2e2e6] text-sm outline-none focus:border-[#079be8]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#888] uppercase">Target Amount ({currencySymbol})</label>
            <input
              type="number"
              step="1"
              min="1"
              required
              placeholder="e.g. 150000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 rounded-2xl border border-[#e2e2e6] text-sm font-semibold outline-none focus:border-[#079be8]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#888] uppercase">Already Saved ({currencySymbol})</label>
            <input
              type="number"
              step="1"
              min="0"
              placeholder="e.g. 21291"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 rounded-2xl border border-[#e2e2e6] text-sm outline-none focus:border-[#079be8]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#888] uppercase">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 rounded-2xl border border-[#e2e2e6] text-sm bg-white outline-none focus:border-[#079be8]"
            >
              <option value="Electronics">Electronics & Tech</option>
              <option value="Travel">Travel & Vacations</option>
              <option value="Vehicle">Vehicle / Car</option>
              <option value="Safety">Emergency Fund</option>
              <option value="Home">Home & Renovation</option>
              <option value="Education">Education</option>
              <option value="Other">Other Goal</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#888] uppercase">Target Date (Optional)</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 rounded-2xl border border-[#e2e2e6] text-sm outline-none focus:border-[#079be8]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[52px] rounded-2xl text-white font-semibold text-[16px] bg-gradient-to-b from-[#3b3b3b] to-[#171717] shadow-md hover:opacity-95 active:scale-[0.98] transition-all"
            >
              {loading ? 'Creating...' : 'Create Savings Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

