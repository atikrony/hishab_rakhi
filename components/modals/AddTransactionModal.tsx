'use client';

import React, { useState } from 'react';
import { WalletAccount, TransactionType, TransactionCategory } from '@/lib/types';

interface AddTransactionModalProps {
  isOpen: boolean;
  wallets: WalletAccount[];
  currencySymbol?: string;
  onClose: () => void;
  onSubmit: (tx: any) => Promise<void>;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  wallets,
  currencySymbol = '$',
  onClose,
  onSubmit,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('Food');
  const [walletId, setWalletId] = useState(wallets[0]?.id || 'wal_main');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0) return;

    try {
      setLoading(true);
      await onSubmit({
        title: title.trim(),
        amount: numAmount,
        type,
        category,
        walletId,
        notes: notes.trim(),
        date: new Date().toISOString(),
      });
      // reset form
      setTitle('');
      setAmount('');
      setNotes('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const categories: TransactionCategory[] = [
    'Food',
    'Subscription',
    'Salary',
    'Freelance',
    'Shopping',
    'Bills',
    'Entertainment',
    'Transport',
    'Health',
    'Investment',
    'Other',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-[430px] rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#f0f0f2]">
          <h2 className="text-[19px] font-[650] text-[#17191d]">Add Transaction</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f4f5f7] flex items-center justify-center text-[#666] hover:text-[#111]"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Income / Expense Toggle */}
          <div className="grid grid-cols-2 p-1 bg-[#f4f5f7] rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                if (category === 'Salary' || category === 'Freelance') setCategory('Food');
              }}
              className={`py-2 rounded-xl text-sm font-semibold transition-all ${
                type === 'expense'
                  ? 'bg-white text-[#fa4563] shadow-sm'
                  : 'text-[#666] hover:text-[#111]'
              }`}
            >
              Expense (-)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory('Salary');
              }}
              className={`py-2 rounded-xl text-sm font-semibold transition-all ${
                type === 'income'
                  ? 'bg-white text-[#219b35] shadow-sm'
                  : 'text-[#666] hover:text-[#111]'
              }`}
            >
              Income (+)
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="text-xs font-semibold text-[#888] uppercase">Amount ({currencySymbol})</label>
            <div className="relative mt-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-[#666]">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-3 rounded-2xl border border-[#e2e2e6] text-xl font-bold outline-none focus:border-[#079be8] focus:ring-2 focus:ring-[#079be8]/20"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-[#888] uppercase">Title / Payee</label>
            <input
              type="text"
              required
              placeholder={type === 'expense' ? 'e.g. GoFood - Ayam Geprek' : 'e.g. Youtube Adsense'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 rounded-2xl border border-[#e2e2e6] text-sm outline-none focus:border-[#079be8]"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold text-[#888] uppercase">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TransactionCategory)}
              className="w-full mt-1 px-4 py-2.5 rounded-2xl border border-[#e2e2e6] text-sm bg-white outline-none focus:border-[#079be8]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Wallet / Account */}
          <div>
            <label className="text-xs font-semibold text-[#888] uppercase">Payment Account</label>
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 rounded-2xl border border-[#e2e2e6] text-sm bg-white outline-none focus:border-[#079be8]"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({currencySymbol}{w.balance.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-[#888] uppercase">Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Lunch with friends"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 rounded-2xl border border-[#e2e2e6] text-sm outline-none focus:border-[#079be8]"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full h-[52px] rounded-2xl text-white font-semibold text-[16px] shadow-md transition-all active:scale-[0.98] ${
                type === 'income'
                  ? 'bg-gradient-to-r from-emerald-600 to-green-500 hover:opacity-95'
                  : 'bg-gradient-to-b from-[#19aaf5] to-[#008fe0] hover:opacity-95'
              }`}
            >
              {loading ? 'Adding...' : type === 'income' ? '+ Record Income' : '- Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

