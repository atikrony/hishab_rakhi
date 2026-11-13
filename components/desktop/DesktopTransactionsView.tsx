'use client';

import React, { useState } from 'react';
import { Transaction } from '@/lib/types';

interface DesktopTransactionsViewProps {
  transactions: Transaction[];
  currencySymbol?: string;
  onSelectTransaction: (tx: Transaction) => void;
  onAddTransaction: () => void;
  onDeleteTransaction: (id: string) => void;
}

export const DesktopTransactionsView: React.FC<DesktopTransactionsViewProps> = ({
  transactions,
  currencySymbol = '৳',
  onSelectTransaction,
  onAddTransaction,
  onDeleteTransaction,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');

  const categories = [
    'All',
    'Food',
    'Subscription',
    'Salary',
    'Freelance',
    'Shopping',
    'Bills',
    'Entertainment',
    'Transport',
  ];

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      (t.notes && t.notes.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      categoryFilter === 'All' || t.category.toLowerCase() === categoryFilter.toLowerCase();

    const matchesType = typeFilter === 'all' || t.type === typeFilter;

    return matchesSearch && matchesCategory && matchesType;
  });

  const exportCSV = () => {
    const headers = ['ID', 'Title', 'Amount', 'Type', 'Category', 'Date', 'Notes'];
    const rows = filtered.map((t) => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      t.amount,
      t.type,
      t.category,
      t.date,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#17191d]">Transactions Ledger</h1>
          <p className="text-xs text-[#888]">
            Full searchable transaction history across all linked accounts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 rounded-xl border border-[#e2e2e6] bg-white text-xs font-semibold text-[#17191d] hover:bg-[#fafafa]"
          >
            📥 Export CSV ({filtered.length})
          </button>
          <button
            onClick={onAddTransaction}
            className="px-4 py-2 rounded-xl bg-[#079be8] text-white text-xs font-bold hover:bg-[#0689cf] shadow-sm shadow-[#079be8]/20"
          >
            + New Transaction
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#e9e9ec] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="w-72">
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-[#e2e2e6] text-xs bg-[#f8f9fa] outline-none focus:border-[#079be8]"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center bg-[#f4f5f7] rounded-xl p-1 text-xs">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              typeFilter === 'all' ? 'bg-white text-black shadow-xs font-semibold' : 'text-[#666]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTypeFilter('income')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              typeFilter === 'income' ? 'bg-white text-[#219b35] shadow-xs font-semibold' : 'text-[#666]'
            }`}
          >
            Incomes (+)
          </button>
          <button
            onClick={() => setTypeFilter('expense')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              typeFilter === 'expense' ? 'bg-white text-[#fa4563] shadow-xs font-semibold' : 'text-[#666]'
            }`}
          >
            Expenses (-)
          </button>
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-[#e2e2e6] text-xs bg-white text-[#555] outline-none"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              Category: {c}
            </option>
          ))}
        </select>
      </div>

      {/* Full Ledger Table */}
      <div className="bg-white rounded-2xl border border-[#e9e9ec] shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#fcfcfd] border-b border-[#e9e9ec] text-[#888] uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Payee / Merchant</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f4f5f7]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-[#888] text-sm">
                  No transactions match the selected filters.
                </td>
              </tr>
            ) : (
              filtered.map((tx) => (
                <tr
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className="hover:bg-[#fafafa] transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4">
                    <div className="font-semibold text-sm text-[#17191d] group-hover:text-[#079be8] transition-colors">
                      {tx.title}
                    </div>
                    {tx.notes && <div className="text-[11px] text-[#aaa]">{tx.notes}</div>}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 rounded-full bg-[#f4f5f7] text-[#555] font-medium text-[11px]">
                      {tx.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#777]">
                    {new Date(tx.date).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="py-3 px-4 capitalize">
                    <span
                      className={`font-semibold ${
                        tx.type === 'income' ? 'text-[#219b35]' : 'text-[#fa4563]'
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`font-bold text-sm ${
                        tx.type === 'income' ? 'text-[#219b35]' : 'text-[#fa4563]'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {currencySymbol}
                      {Math.round(tx.amount).toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTransaction(tx);
                        }}
                        className="text-[#079be8] font-medium hover:underline p-1"
                      >
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete "${tx.title}"?`)) {
                            onDeleteTransaction(tx.id);
                          }
                        }}
                        className="text-[#fa4563] font-medium hover:underline p-1"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
