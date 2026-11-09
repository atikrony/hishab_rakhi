'use client';

import React, { useState } from 'react';
import { Transaction } from '@/lib/types';

interface SeeAllTransactionsModalProps {
  isOpen: boolean;
  transactions: Transaction[];
  currencySymbol?: string;
  onClose: () => void;
  onSelectTransaction: (tx: Transaction) => void;
}

export const SeeAllTransactionsModal: React.FC<SeeAllTransactionsModalProps> = ({
  isOpen,
  transactions,
  currencySymbol = '$',
  onClose,
  onSelectTransaction,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');

  if (!isOpen) return null;

  const categories = ['All', 'Food', 'Subscription', 'Salary', 'Freelance', 'Shopping', 'Bills', 'Transport'];

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      (t.notes && t.notes.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'All' || t.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesType = selectedType === 'all' || t.type === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-[480px] rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl animate-slide-up max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f2]">
          <div>
            <h2 className="text-[19px] font-[650] text-[#17191d]">All Transactions</h2>
            <p className="text-xs text-[#888]">Total {filtered.length} recorded items</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f4f5f7] flex items-center justify-center text-[#666] hover:text-[#111]"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="pt-3 pb-2">
          <input
            type="text"
            placeholder="Search by title, note, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl border border-[#e2e2e6] text-sm outline-none focus:border-[#079be8]"
          />
        </div>

        {/* Type Filter */}
        <div className="grid grid-cols-3 gap-2 py-1 text-xs">
          <button
            onClick={() => setSelectedType('all')}
            className={`py-1.5 rounded-xl font-semibold border ${
              selectedType === 'all' ? 'bg-[#17191d] text-white border-[#17191d]' : 'border-[#e2e2e6] text-[#666]'
            }`}
          >
            All Types
          </button>
          <button
            onClick={() => setSelectedType('income')}
            className={`py-1.5 rounded-xl font-semibold border ${
              selectedType === 'income' ? 'bg-[#219b35] text-white border-[#219b35]' : 'border-[#e2e2e6] text-[#666]'
            }`}
          >
            Incomes (+)
          </button>
          <button
            onClick={() => setSelectedType('expense')}
            className={`py-1.5 rounded-xl font-semibold border ${
              selectedType === 'expense' ? 'bg-[#fa4563] text-white border-[#fa4563]' : 'border-[#e2e2e6] text-[#666]'
            }`}
          >
            Expenses (-)
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto py-2 no-scrollbar text-xs">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === c
                  ? 'bg-[#079be8] text-white font-medium'
                  : 'bg-[#f4f5f7] text-[#666] hover:bg-[#eaebee]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Transactions List */}
        <div className="flex-1 overflow-y-auto space-y-2 py-2 mt-1">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-[#888] text-sm">
              No transactions match your search criteria.
            </div>
          ) : (
            filtered.map((tx) => (
              <div
                key={tx.id}
                onClick={() => {
                  onSelectTransaction(tx);
                  onClose();
                }}
                className="flex items-center justify-between p-3 rounded-2xl border border-[#ededf0] hover:border-[#079be8] hover:bg-[#f0f8ff]/40 cursor-pointer transition-all active:scale-[0.99]"
              >
                <div>
                  <div className="text-[15px] font-semibold text-[#17191d]">{tx.title}</div>
                  <div className="text-xs text-[#888]">
                    {tx.category} • {new Date(tx.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-[15px] font-bold ${
                      tx.type === 'income' ? 'text-[#219b35]' : 'text-[#fa4563]'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {currencySymbol}
                    {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-[#aaa] capitalize">{tx.type}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
