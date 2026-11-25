'use client';

import React, { useState } from 'react';

interface GlobalAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (data: {
    title: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    date: string;
    walletId: string;
    notes?: string;
    sourceStream?: string;
  }) => Promise<void>;
}

export function GlobalAddModal({ isOpen, onClose, onAddTransaction }: GlobalAddModalProps) {
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0 || !title.trim()) return;

    if (date > today) {
      setDateError('Future dates are not permitted. Please select today or a past date.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddTransaction({
        title: title.trim(),
        amount: num,
        type: txType,
        category: txType === 'income' ? (category === 'Food & Dining' ? 'Salary' : category) : category,
        date: new Date(date).toISOString(),
        walletId: 'wal_pocket',
        notes: notes.trim(),
        sourceStream: txType === 'income' ? category : undefined,
      });
      setTitle('');
      setAmount('');
      setNotes('');
      setDateError(null);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-space-lg shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto border border-hairline">
        {/* Header */}
        <div className="flex items-center justify-between pb-space-sm border-b border-surface-container">
          <div className="flex items-center gap-space-xs">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                txType === 'income'
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'bg-surface-container text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {txType === 'income' ? 'south_west' : 'receipt_long'}
              </span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
              {txType === 'income' ? 'Log Inflow Money' : 'Record Outflow Expense'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Type Switcher */}
        <div className="grid grid-cols-2 p-1 bg-surface-container-low rounded-xl mt-space-md border border-surface-container">
          <button
            type="button"
            onClick={() => {
              setTxType('expense');
              setCategory('Food & Dining');
            }}
            className={`py-2 rounded-lg font-label-md text-label-md transition-all font-semibold ${
              txType === 'expense'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Expense (Debit)
          </button>
          <button
            type="button"
            onClick={() => {
              setTxType('income');
              setCategory('Salary');
            }}
            className={`py-2 rounded-lg font-label-md text-label-md transition-all font-semibold ${
              txType === 'income'
                ? 'bg-secondary text-on-secondary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Income (Credit)
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-space-md flex flex-col gap-space-md">
          {/* Amount Input */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              Amount (৳) *
            </label>
            <div className="relative flex items-center bg-surface-container-low rounded-xl px-space-md border border-surface-container focus-within:ring-2 focus-within:ring-primary/20">
              <span
                className={`font-currency-display text-currency-display font-bold mr-1 ${
                  txType === 'income' ? 'text-secondary' : 'text-on-tertiary-container'
                }`}
              >
                ৳
              </span>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent py-3 font-currency-display text-currency-display text-on-surface font-extrabold outline-none placeholder:text-on-surface-variant/40"
              />
            </div>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              {txType === 'income' ? 'Source / Payer *' : 'Title / Merchant *'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={txType === 'income' ? 'e.g. Acme Labs, Client Wire' : 'e.g. Whole Foods, Uber'}
              className="w-full bg-surface-container-low text-on-surface rounded-xl px-space-md py-3 font-body-md text-body-md outline-none border border-surface-container focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/50"
            />
          </div>

          {/* Category & Date Grid */}
          <div className="grid grid-cols-2 gap-space-sm">
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Category
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-surface-container-low text-on-surface rounded-xl px-3 py-2.5 font-body-md text-body-md outline-none border border-surface-container appearance-none cursor-pointer pr-8"
                >
                  {txType === 'income' ? (
                    <>
                      <option value="Salary">Salary</option>
                      <option value="Freelance">Freelance</option>
                      <option value="Investment">Investment</option>
                      <option value="Gift">Gift</option>
                      <option value="Reimbursement">Reimbursement</option>
                    </>
                  ) : (
                    <>
                      <option value="Food & Dining">Food & Dining</option>
                      <option value="Tech & Gadgets">Tech & Gadgets</option>
                      <option value="Bills & Utilities">Bills & Utilities</option>
                      <option value="Transportation">Transportation</option>
                      <option value="Health & Meds">Health & Meds</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Shopping">Shopping</option>
                    </>
                  )}
                </select>
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Date (No Future Dates) *
              </label>
              <input
                type="date"
                required
                max={today}
                value={date}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val > today) {
                    setDateError('Future dates cannot be selected');
                    return;
                  }
                  setDateError(null);
                  setDate(val);
                }}
                className={`w-full bg-surface-container-low text-on-surface rounded-xl px-3 py-2.5 font-body-md text-body-md outline-none border ${
                  dateError ? 'border-error' : 'border-surface-container'
                }`}
              />
              {dateError && (
                <span className="text-[11px] text-error font-semibold mt-0.5">{dateError}</span>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              Memo / Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add specifics or invoice reference..."
              className="w-full bg-surface-container-low text-on-surface rounded-xl p-3 font-body-md text-body-md outline-none border border-surface-container resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center gap-space-sm pt-space-xs pb-safe">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-surface-container text-on-surface font-title-sm text-title-sm font-semibold hover:bg-surface-container-high transition-colors text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-3 rounded-xl text-white font-title-sm text-title-sm font-semibold active:scale-[0.98] transition-all shadow-md text-center disabled:opacity-50 ${
                txType === 'income' ? 'bg-secondary hover:bg-secondary/90' : 'bg-primary hover:bg-primary-container'
              }`}
            >
              {isSubmitting ? 'Saving...' : txType === 'income' ? 'Log Inflow' : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

