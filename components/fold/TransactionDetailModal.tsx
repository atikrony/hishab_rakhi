'use client';

import React, { useState, useEffect } from 'react';
import { Transaction } from '@/lib/types';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onDelete?: (id: string) => Promise<void>;
  onUpdate?: (id: string, updates: Partial<Transaction>) => Promise<boolean | void>;
}

const DEFAULT_CATEGORIES = [
  'Food & Dining',
  'Bills & Utilities',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Healthcare',
  'Salary',
  'Freelance',
  'Gift',
  'Investment',
  'Other',
];

export function TransactionDetailModal({
  transaction,
  onClose,
  onDelete,
  onUpdate,
}: TransactionDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (transaction) {
      setTitle(transaction.title || '');
      setAmount(String(Math.round(transaction.amount) || ''));
      setCategory(transaction.category || 'Other');
      setDate(
        transaction.date
          ? transaction.date.split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setNotes(transaction.notes || '');
      setIsEditing(false);
    }
  }, [transaction]);

  if (!transaction) return null;

  const isIncome = transaction.type === 'income';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdate) return;

    const parsedAmount = Math.max(1, Math.round(parseFloat(amount) || 0));
    if (!title.trim() || parsedAmount <= 0) return;

    setSaving(true);
    try {
      const success = await onUpdate(transaction.id, {
        title: title.trim(),
        amount: parsedAmount,
        category: category.trim() || 'Other',
        date: new Date(date).toISOString(),
        notes: notes.trim(),
      });
      if (success !== false) {
        setIsEditing(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-surface-container-lowest rounded-2xl p-space-lg shadow-2xl flex flex-col space-y-space-md border border-[#E5E7EB]">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
            {isEditing
              ? isIncome
                ? 'Edit Inbound Receipt'
                : 'Edit Expense'
              : isIncome
              ? 'Inbound Receipt'
              : 'Expense Receipt'}
          </span>
          <div className="flex items-center gap-1">
            {!isEditing && !isIncome && onUpdate && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
                title="Edit expense"
                aria-label="Edit expense"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {isEditing ? (
          /* Inline Edit Form */
          <form onSubmit={handleSave} className="flex flex-col gap-space-sm pt-1">
            {/* Title */}
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Title / Merchant
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Grocery Store"
                className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-label-md font-semibold outline-none border border-transparent focus:border-primary focus:bg-surface-container-lowest transition-all"
              />
            </div>

            {/* Amount */}
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Amount (৳ BDT)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-on-surface-variant font-bold">৳</span>
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full h-10 pl-7 pr-3 rounded-xl bg-surface-container-low text-on-surface text-label-md font-bold outline-none border border-transparent focus:border-primary focus:bg-surface-container-lowest transition-all"
                />
              </div>
            </div>

            {/* Category & Date in 2 columns */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-2 rounded-xl bg-surface-container-low text-on-surface text-label-md font-medium outline-none border border-transparent focus:border-primary focus:bg-surface-container-lowest transition-all"
                >
                  {DEFAULT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  {!DEFAULT_CATEGORIES.includes(category) && category && (
                    <option value={category}>{category}</option>
                  )}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-10 px-2 rounded-xl bg-surface-container-low text-on-surface text-label-md font-medium outline-none border border-transparent focus:border-primary focus:bg-surface-container-lowest transition-all"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add optional notes..."
                className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-label-md font-medium outline-none border border-transparent focus:border-primary focus:bg-surface-container-lowest transition-all"
              />
            </div>

            {/* Edit Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={saving}
                className="flex-1 py-2.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-md font-semibold text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors font-label-md font-bold text-center flex items-center justify-center gap-1 shadow-sm"
              >
                {saving ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">check</span>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Normal Receipt View */
          <>
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
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isIncome ? 'bg-secondary' : 'bg-outline'
                    }`}
                  />
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
              {!isIncome && onUpdate && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md transition-colors font-semibold"
                  title="Edit expense"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  <span>Edit</span>
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
          </>
        )}
      </div>
    </div>
  );
}
