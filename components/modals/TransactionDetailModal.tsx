'use client';

import React from 'react';
import { Transaction } from '@/lib/types';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  currencySymbol?: string;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  currencySymbol = '$',
  onClose,
  onDelete,
}) => {
  if (!transaction) return null;

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${transaction.title}"?`)) {
      await onDelete(transaction.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-[430px] rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f2]">
          <h2 className="text-[19px] font-[650] text-[#17191d]">Transaction Details</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f4f5f7] flex items-center justify-center text-[#666] hover:text-[#111]"
          >
            ✕
          </button>
        </div>

        <div className="py-4 space-y-4">
          <div className="text-center py-2">
            <div
              className={`text-[32px] font-bold ${
                transaction.type === 'income' ? 'text-[#219b35]' : 'text-[#fa4563]'
              }`}
            >
              {transaction.type === 'income' ? '+' : '-'}
              {currencySymbol}
              {transaction.amount.toFixed(2)}
            </div>
            <div className="text-[17px] font-semibold text-[#17191d] mt-1">
              {transaction.title}
            </div>
            <span
              className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mt-2 capitalize ${
                transaction.type === 'income'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {transaction.type}
            </span>
          </div>

          <div className="border border-[#ededf0] rounded-2xl p-4 bg-[#fafafa] space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-[#888]">Category</span>
              <span className="font-semibold text-[#17191d]">{transaction.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888]">Date & Time</span>
              <span className="font-semibold text-[#17191d]">
                {new Date(transaction.date).toLocaleString([], {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888]">Reference ID</span>
              <span className="font-mono text-xs text-[#666]">{transaction.id}</span>
            </div>
            {transaction.notes && (
              <div className="pt-2 border-t border-[#ededf0]">
                <span className="text-[#888] block text-xs">Notes:</span>
                <span className="text-[#333] text-xs">{transaction.notes}</span>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={handleDelete}
              className="w-full py-3 rounded-2xl bg-red-50 text-[#fa4563] text-sm font-semibold hover:bg-red-100 transition-colors"
            >
              🗑️ Delete This Transaction
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
