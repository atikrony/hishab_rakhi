'use client';

import React from 'react';
import { Transaction } from '@/lib/types';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onDelete?: (id: string) => Promise<void>;
}

export function TransactionDetailModal({
  transaction,
  onClose,
  onDelete,
}: TransactionDetailModalProps) {
  if (!transaction) return null;

  const isIncome = transaction.type === 'income';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-surface-container-lowest rounded-2xl p-space-lg shadow-2xl flex flex-col space-y-space-md border border-[#E5E7EB]">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
            {isIncome ? 'Inbound Receipt' : 'Expense Receipt'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Amount & Title */}
        <div className="text-center py-space-xs">
          <span
            className={`px-space-sm py-0.5 rounded-full font-label-sm text-label-sm font-semibold ${
              isIncome
                ? 'bg-secondary-container text-on-secondary-container'
                : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            {transaction.category}
          </span>
          <h4 className="font-headline-md text-headline-md text-on-surface mt-2 font-bold">
            {transaction.title}
          </h4>
          <div
            className={`font-headline-xl-mobile text-headline-xl-mobile font-currency-display mt-1 font-bold ${
              isIncome ? 'text-secondary' : 'text-on-tertiary-container'
            }`}
          >
            {isIncome ? '+' : '-'}৳
            {Math.round(transaction.amount).toLocaleString()}
          </div>
        </div>

        {/* Detailed Breakdown Card */}
        <div className="bg-surface-container-low rounded-xl p-space-md space-y-space-xs border border-surface-container">
          <div className="flex justify-between items-center text-label-sm font-label-sm">
            <span className="text-on-surface-variant">Date</span>
            <span className="text-on-surface font-semibold">
              {new Date(transaction.date).toLocaleDateString('en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="flex justify-between items-center text-label-sm font-label-sm">
            <span className="text-on-surface-variant">Status</span>
            <span
              className={`font-semibold flex items-center gap-1 ${
                isIncome ? 'text-secondary' : 'text-on-surface'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isIncome ? 'bg-secondary' : 'bg-outline'}`} />
              {transaction.status || 'Completed'}
            </span>
          </div>
          {transaction.notes && (
            <div className="flex justify-between items-start text-label-sm font-label-sm pt-1 border-t border-surface-container/60">
              <span className="text-on-surface-variant">Notes</span>
              <span className="text-on-surface text-right max-w-[65%] font-medium">
                {transaction.notes}
              </span>
            </div>
          )}
        </div>

        {/* Modal Buttons */}
        <div className="flex gap-space-xs pt-1">
          {onDelete && (
            <button
              type="button"
              onClick={async () => {
                if (confirm('Delete this transaction?')) {
                  await onDelete(transaction.id);
                  onClose();
                }
              }}
              className="px-3 py-2.5 rounded-lg bg-error-container text-on-error-container hover:bg-error/20 font-label-md text-label-md transition-colors"
              title="Delete transaction"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-surface-container text-on-surface py-2.5 rounded-lg font-label-md text-label-md hover:bg-surface-container-high transition-colors font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

