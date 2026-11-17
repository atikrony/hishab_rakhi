'use client';

import React, { useState } from 'react';
import { FixedCost } from '@/lib/types';

interface FixedCostsCardProps {
  fixedCosts: FixedCost[];
  onToggle: (id: string, isPaid: boolean, month?: string) => Promise<void>;
  onAdd?: (data: {
    title: string;
    amount: number;
    category: string;
    dueDay?: number;
    notes?: string;
  }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  variant?: 'spend' | 'summary';
}

const FIXED_CATEGORIES = [
  'Bills & Utilities',
  'Housing & Rent',
  'Subscription',
  'Transportation',
  'Healthcare & Insurance',
  'Education',
  'Tech & Telecom',
  'Other',
];

export function FixedCostsCard({
  fixedCosts = [],
  onToggle,
  onAdd,
  onDelete,
  variant = 'spend',
}: FixedCostsCardProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('Bills & Utilities');
  const [newDueDay, setNewDueDay] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Month determination (YYYY-MM)
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Calculations for current month
  let totalFixedCost = 0;
  let paidFixedCost = 0;
  let paidCount = 0;

  fixedCosts.forEach((item) => {
    const amt = Number(item.amount) || 0;
    totalFixedCost += amt;
    const isPaid = (item.paidMonths || []).includes(currentMonthKey);
    if (isPaid) {
      paidFixedCost += amt;
      paidCount++;
    }
  });

  const unpaidFixedCost = Math.max(0, totalFixedCost - paidFixedCost);
  const percentPaid = totalFixedCost > 0 ? Math.round((paidFixedCost / totalFixedCost) * 100) : 0;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAdd || !newTitle.trim()) return;

    const amt = Math.round(parseFloat(newAmount));
    if (isNaN(amt) || amt <= 0) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        title: newTitle.trim(),
        amount: amt,
        category: newCategory,
        dueDay: newDueDay ? parseInt(newDueDay, 10) : undefined,
      });
      setNewTitle('');
      setNewAmount('');
      setNewDueDay('');
      setShowAddForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-[#E5E7EB] flex flex-col gap-space-md">
      {/* Header */}
      <span className="text-[11px] font-semibold text-secondary text-center px-2 py-0.5 rounded bg-secondary-container/30">
        {currentMonthName}

      </span>
      <div className="flex items-center justify-between">

        <div className="flex items-center gap-space-xs">

          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">event_repeat</span>
          </div>

          <div className="flex flex-col">

            <div className="flex items-center gap-2">
              <h3 className="font-title-sm text-title-sm text-on-surface font-bold">
                Fixed Cost
              </h3>

            </div>

          </div>
        </div>

        {variant === 'spend' && onAdd && (
          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary-container transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">
              {showAddForm ? 'close' : 'add'}
            </span>
            <span>{showAddForm ? 'Cancel' : 'Add Cost'}</span>
          </button>
        )}
      </div>

      {/* Progress & Quick Stats */}
      {fixedCosts.length > 0 && (
        <div className="p-space-sm rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-space-xs">
          <div className="flex items-center justify-between text-label-sm font-medium">
            <span className="text-on-surface font-semibold">
              Settlement Status: {percentPaid}%
            </span>
            <span className="text-on-surface-variant">
              ৳{paidFixedCost.toLocaleString()} paid of ৳{totalFixedCost.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
            <div
              className="bg-secondary h-full rounded-full transition-all duration-500"
              style={{ width: `${percentPaid}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-outline pt-0.5">
            <span className="flex items-center gap-1 text-secondary font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              {paidCount} Settled
            </span>
            <span className="flex items-center gap-1 text-on-tertiary-container font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container" />
              ৳{unpaidFixedCost.toLocaleString()} Remaining
            </span>
          </div>
        </div>
      )}

      {/* Add Cost Form (Spend Mode) */}
      {showAddForm && (
        <form
          onSubmit={handleAddSubmit}
          className="p-space-md rounded-xl bg-surface-container-low border border-primary/20 flex flex-col gap-space-sm animate-fadeIn"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm font-bold text-on-surface uppercase tracking-wider">
              Add New Fixed Cost
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
              Title / Obligation *
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Apartment Rent, WiFi Bill, Gym"
              className="h-9 px-3 rounded-lg bg-surface-container-lowest text-on-surface text-label-md font-medium outline-none border border-surface-container focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                Amount (৳) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="0"
                className="h-9 px-3 rounded-lg bg-surface-container-lowest text-on-surface text-label-md font-bold outline-none border border-surface-container focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                Due Day of Month
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={newDueDay}
                onChange={(e) => setNewDueDay(e.target.value)}
                placeholder="e.g. 5"
                className="h-9 px-3 rounded-lg bg-surface-container-lowest text-on-surface text-label-md font-medium outline-none border border-surface-container focus:border-primary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
              Category
            </label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="h-9 px-2 rounded-lg bg-surface-container-lowest text-on-surface text-label-md font-medium outline-none border border-surface-container focus:border-primary"
            >
              {FIXED_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container-high"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-bold hover:bg-primary-container disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Fixed Cost'}
            </button>
          </div>
        </form>
      )}

      {/* Checklist of Fixed Costs */}
      <div className="flex flex-col divide-y divide-surface-container/60">
        {fixedCosts.length === 0 ? (
          <div className="py-6 text-center text-outline flex flex-col items-center">
            <span className="material-symbols-outlined text-[32px] text-outline mb-1">
              playlist_add_check
            </span>
            <p className="text-body-md text-on-surface font-medium">No fixed costs set up</p>
            <p className="text-label-sm text-on-surface-variant mt-0.5">
              {variant === 'spend'
                ? 'Add monthly expenses like Rent or Utilities to check them off each month.'
                : 'Configure your recurring fixed costs in the Spend section.'}
            </p>
          </div>
        ) : (
          fixedCosts.map((item) => {
            const isPaid = (item.paidMonths || []).includes(currentMonthKey);

            return (
              <div
                key={item.id}
                className={`py-2.5 flex items-center justify-between gap-space-sm group px-2.5 rounded-lg transition-all border-l-2 ${
                  isPaid
                    ? 'border-l-transparent hover:bg-surface-container-low/40'
                    : 'border-l-amber-500 bg-amber-500/[0.04] hover:bg-amber-500/[0.08]'
                }`}
              >
                {/* Checkmark Button and Details */}
                <div className="flex items-center gap-space-sm min-w-0">
                  <button
                    type="button"
                    onClick={() => onToggle(item.id, !isPaid, currentMonthKey)}
                    className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                      isPaid
                        ? 'bg-secondary text-on-secondary shadow-sm scale-105'
                        : 'border-2 border-amber-500 bg-amber-500/10 text-transparent hover:text-amber-600 hover:bg-amber-500/20 shadow-xs'
                    }`}
                    title={isPaid ? 'Mark as unpaid (not spent yet)' : 'Mark as spent (settled)'}
                  >
                    <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                  </button>

                  <div className="flex flex-col min-w-0">
                    <span
                      className={`font-title-sm text-title-sm truncate font-semibold transition-all ${
                        isPaid ? 'line-through text-outline' : 'text-on-surface'
                      }`}
                    >
                      {item.title}
                    </span>
                    <div className="flex items-center gap-2 text-label-sm">
                      <span className="text-[11px] text-on-surface-variant font-medium">
                        {item.category}
                      </span>
                      {item.dueDay && (
                        <span className="text-[10px] text-outline bg-surface-container px-1.5 py-0.2 rounded font-medium">
                          Due {item.dueDay}th
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount, Status & Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span
                      className={`font-currency-md text-currency-md font-bold block ${
                        isPaid ? 'text-secondary line-through opacity-75' : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      ৳{Math.round(item.amount).toLocaleString()}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded mt-0.5 inline-block ${
                        isPaid
                          ? 'text-secondary bg-secondary/15 border border-secondary/30'
                          : 'text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30'
                      }`}
                    >
                      {isPaid ? 'Paid' : 'Not spent yet'}
                    </span>
                  </div>

                  {variant === 'spend' && onDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Remove fixed cost "${item.title}"?`)) {
                          onDelete(item.id);
                        }
                      }}
                      className="w-7 h-7 rounded-lg text-outline hover:text-error hover:bg-error-container/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete fixed cost"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

