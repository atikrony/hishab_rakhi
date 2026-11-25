'use client';

import React, { useState } from 'react';

interface AddInflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    amount: number;
    category: string;
    date: string;
    walletId: string;
    notes?: string;
    sourceStream?: string;
  }) => Promise<void>;
}

export function AddInflowModal({ isOpen, onClose, onSubmit }: AddInflowModalProps) {
  const [amount, setAmount] = useState('');
  const [sourceCategory, setSourceCategory] = useState('Salary');
  const [sourceName, setSourceName] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];

  const handleSourceSelect = (cat: string) => {
    setSourceCategory(cat);
    if (!sourceName || ['Salary', 'Freelance', 'Gift', 'Investment'].includes(sourceName)) {
      setSourceName(cat === 'Gift' ? 'Family Birthday Gift' : cat);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;

    if (date > today) {
      setDateError('Future dates are not permitted. Please select today or a past date.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: sourceName.trim() || `${sourceCategory} Transfer`,
        amount: num,
        category: sourceCategory,
        date: new Date(date).toISOString(),
        walletId: 'wal_pocket',
        notes: notes.trim(),
        sourceStream: sourceCategory,
      });
      setAmount('');
      setSourceName('');
      setNotes('');
      setDateError(null);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay items-end sm:items-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-space-lg shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto border border-hairline">
        {/* Handle for mobile */}
        <div className="w-12 h-1.5 bg-surface-container rounded-full mx-auto mb-space-md sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-space-sm border-b border-surface-container">
          <div className="flex items-center gap-space-xs">
            <div className="w-8 h-8 rounded-full bg-secondary-container/40 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[18px]">south_west</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
              Add Money
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-space-md flex flex-col gap-space-md">
          {/* Amount Input */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
              Amount Received (৳) *
            </label>
            <div className="relative flex items-center bg-surface-container-low rounded-xl px-space-md border border-surface-container focus-within:ring-2 focus-within:ring-secondary/40">
              <span className="font-currency-display text-currency-display text-secondary font-bold mr-1">
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
                className="w-full bg-transparent py-3 font-currency-display text-currency-display text-on-surface font-bold outline-none placeholder:text-on-surface-variant/40"
              />
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex gap-2">
            {['100', '250', '500', '1500'].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(val)}
                className="flex-1 py-1 px-2 rounded-lg bg-surface-container-low hover:bg-surface-container font-label-sm text-label-sm font-semibold transition-colors border border-surface-container"
              >
                +৳{parseInt(val, 10).toLocaleString()}
              </button>
            ))}
          </div>

          {/* Source Chips */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
              Received From (Category) *
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[
                { id: 'Salary', icon: 'corporate_fare', label: 'Salary' },
                { id: 'Freelance', icon: 'laptop_mac', label: 'Freelance' },
                { id: 'Gift', icon: 'featured_seasonal_and_gifts', label: 'Gift' },
                { id: 'Investment', icon: 'show_chart', label: 'Invest' },
              ].map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => handleSourceSelect(chip.id)}
                  className={`py-2 px-1 rounded-xl text-[12px] font-label-md flex flex-col items-center gap-1 transition-all border ${
                    sourceCategory === chip.id
                      ? 'bg-secondary-container text-on-secondary-container font-bold border-secondary'
                      : 'bg-surface-container-low text-on-surface-variant border-surface-container hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{chip.icon}</span>
                  {chip.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              required
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              placeholder="e.g. Acme Studio, Client Name, Friend"
              className="w-full bg-surface-container-low text-on-surface rounded-xl px-space-md py-3 font-body-md text-body-md outline-none border border-surface-container focus:ring-2 focus:ring-secondary/40 placeholder:text-on-surface-variant/50"
            />
          </div>

          {/* Date Picker */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
              Date *
            </label>
            <div className={`relative flex items-center bg-surface-container-low rounded-xl px-space-md py-2 border ${
              dateError ? 'border-error' : 'border-surface-container'
            }`}>
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant mr-2">
                calendar_today
              </span>
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
                className="w-full bg-transparent font-body-md text-body-md text-on-surface outline-none"
              />
            </div>
            {dateError && (
              <span className="text-[11px] text-error font-semibold mt-0.5">{dateError}</span>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add invoice #, sender message, or milestone details..."
              className="w-full bg-surface-container-low text-on-surface rounded-xl p-space-md font-body-md text-body-md outline-none border border-surface-container focus:ring-2 focus:ring-secondary/40 resize-none placeholder:text-on-surface-variant/50"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-space-md pt-space-xs pb-safe">
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
              className="flex-1 py-3 rounded-xl bg-secondary text-on-secondary font-title-sm text-title-sm font-semibold active:scale-[0.98] transition-all shadow-md hover:bg-secondary/90 disabled:opacity-50 text-center"
            >
              {isSubmitting ? 'Saving...' : 'Save Money'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

