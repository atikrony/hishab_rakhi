'use client';

import React, { useState } from 'react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    amount: number;
    category: string;
    date: string;
    walletId: string;
    notes?: string;
  }) => Promise<void>;
}

export function AddExpenseModal({ isOpen, onClose, onSubmit }: AddExpenseModalProps) {
  const [amount, setAmount] = useState('45');
  const [title, setTitle] = useState('Artisan Grocery & Market');
  const [category, setCategory] = useState('Food & Dining');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('Organic vegetables, milk, coffee beans for home kitchen');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  // Custom Categories
  const defaultCategories = [
    'Food & Dining',
    'Tech & Gadgets',
    'Bills & Utilities',
    'Transportation',
    'Health & Meds',
    'Entertainment',
    'Shopping',
  ];
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('hr_custom_categories');
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const allCategories = React.useMemo(() => {
    return Array.from(new Set([...defaultCategories, ...customCategories]));
  }, [customCategories]);

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (!allCategories.includes(trimmed)) {
      const next = [...customCategories, trimmed];
      setCustomCategories(next);
      if (typeof window !== 'undefined') {
        localStorage.setItem('hr_custom_categories', JSON.stringify(next));
      }
    }
    setCategory(trimmed);
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

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
      await onSubmit({
        title: title.trim(),
        amount: num,
        category,
        date: new Date(date).toISOString(),
        walletId: 'wal_pocket',
        notes: notes.trim(),
      });
      setAmount('10');
      setTitle('');
      setNotes('');
      setDateError(null);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-space-lg shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto border border-[#E5E7EB]">
        {/* Mobile handle */}
        <div className="w-12 h-1.5 bg-surface-container rounded-full mx-auto mb-space-md sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-space-sm border-b border-surface-container">
          <div className="flex items-center gap-space-xs">
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
              Add Expense
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="mt-space-md flex flex-col gap-space-md">
          {/* Amount Card */}
          <div className="flex flex-col p-4 rounded-xl bg-surface-container-low border border-surface-container">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Amount *
              </label>
              <span className="font-label-sm text-label-sm text-on-tertiary-container bg-tertiary-fixed px-2 py-0.5 rounded-full font-semibold">
                Expense Outflow
              </span>
            </div>

            <div className="relative flex items-baseline gap-1 my-1">
              <span className="font-headline-xl-mobile text-headline-xl-mobile text-on-tertiary-container select-none font-bold">
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
                className="w-full bg-transparent font-currency-display text-currency-display text-on-surface font-extrabold outline-none p-0 tracking-tight"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 pt-2 overflow-x-auto">
              <span className="font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap font-medium">
                Quick fill:
              </span>
              {['10', '25', '50', '100'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className="px-2.5 py-1 rounded-lg bg-surface-container-lowest font-label-md text-label-md text-on-surface hover:bg-primary hover:text-on-primary transition-colors shadow-sm border border-surface-container font-semibold"
                >
                  ৳{parseInt(preset, 10).toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Expense Name */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              Expense Name / Merchant *
            </label>
            <div className="relative flex items-center rounded-xl bg-surface-container-low px-3 py-2.5 border border-surface-container focus-within:bg-surface-container-lowest focus-within:shadow-md transition-all">
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center mr-2.5 text-on-surface-variant shrink-0">
                <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
              </div>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Blue Bottle Coffee, Target, Uber"
                className="w-full bg-transparent font-title-sm text-title-sm text-on-surface outline-none placeholder:text-outline"
              />
              {title && (
                <button
                  type="button"
                  onClick={() => setTitle('')}
                  className="text-outline hover:text-on-surface p-1"
                >
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                </button>
              )}
            </div>
          </div>

          {/* Date & Category Grid */}
          <div className="grid grid-cols-2 gap-space-sm">
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

            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Category
              </label>

              {isAddingCategory ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    autoFocus
                    placeholder="New category..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCategory();
                      }
                    }}
                    className="flex-1 bg-surface-container-low text-on-surface rounded-xl px-2.5 py-2 text-xs outline-none border border-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-2.5 py-2 bg-primary text-on-primary rounded-xl text-xs font-semibold hover:bg-primary-container"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategory(false);
                      setNewCategoryName('');
                    }}
                    className="p-1.5 text-outline hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setIsAddingCategory(true);
                      } else {
                        setCategory(e.target.value);
                      }
                    }}
                    className="w-full bg-surface-container-low text-on-surface rounded-xl px-3 py-2.5 font-body-md text-body-md outline-none border border-surface-container appearance-none cursor-pointer pr-8"
                  >
                    {allCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__add_new__" className="text-primary font-bold">
                      + Add Category...
                    </option>
                  </select>
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    expand_more
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details about this purchase..."
              className="w-full bg-surface-container-low text-on-surface rounded-xl p-3 font-body-md text-body-md outline-none border border-surface-container resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-space-sm pt-space-xs pb-safe">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[44px] px-space-md py-space-sm rounded-lg bg-surface-container text-on-surface font-title-sm text-title-sm hover:bg-surface-container-high transition-colors text-center font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 min-h-[44px] px-space-md py-space-sm rounded-lg bg-primary text-on-primary font-title-sm text-title-sm hover:bg-primary-container transition-colors text-center font-semibold disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

