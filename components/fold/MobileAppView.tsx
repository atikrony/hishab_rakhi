'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DashboardSummary, Transaction, FixedCost } from '@/lib/types';
import { FixedCostsCard } from './FixedCostsCard';

interface MobileAppViewProps {
  summary: DashboardSummary;
  transactions: Transaction[];
  activeTab?: 'pocket' | 'spend' | 'summary';
  onOpenAddMoney: () => void;
  onOpenAddExpense: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  onOpenSettings: () => void;
  startDate?: string;
  endDate?: string;
  onDateRangeChange?: (start: string, end: string) => void;
  onResetDateRange?: () => void;
  totalTransactionsCount?: number;
  fixedCosts?: FixedCost[];
  onAddFixedCost?: (data: {
    title: string;
    amount: number;
    category: string;
    dueDay?: number;
    notes?: string;
  }) => Promise<void>;
  onToggleFixedCost?: (id: string, isPaid: boolean, month?: string) => Promise<void>;
  onDeleteFixedCost?: (id: string) => Promise<void>;
}

export function MobileAppView({
  summary,
  transactions,
  activeTab,
  onOpenAddMoney,
  onOpenAddExpense,
  onSelectTransaction,
  onOpenSettings,
  startDate,
  endDate,
  onDateRangeChange,
  onResetDateRange,
  totalTransactionsCount,
  fixedCosts,
  onAddFixedCost,
  onToggleFixedCost,
  onDeleteFixedCost,
}: MobileAppViewProps) {
  const [activeMobileTab, setActiveMobileTab] = useState<'spend' | 'summary' | 'pocket'>('spend');
  const currentTab = activeTab || activeMobileTab;
  const [sourceFilter, setSourceFilter] = useState('All');
  const [spendTab, setSpendTab] = useState('All Spends');

  const inboundTransactions = transactions
    .filter((t) => {
      if (t.type !== 'income') return false;
      if (sourceFilter !== 'All') {
        return (
          t.category.toLowerCase() === sourceFilter.toLowerCase() ||
          t.sourceStream?.toLowerCase() === sourceFilter.toLowerCase()
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const expenseTransactions = transactions
    .filter((t) => t.type === 'expense')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const today = new Date().toISOString().split('T')[0];

  const safeToSpend = Math.max(0, summary.availablePocketCash - summary.totalExpense);
  const spentPercent = summary.availablePocketCash > 0
    ? Math.min(100, Math.round((summary.totalExpense / summary.availablePocketCash) * 100))
    : 65;

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-surface flex flex-col relative antialiased sm:border-x sm:border-[#E5E7EB]">
      {/* Main Tab View Content */}
      <main className="flex-1 flex flex-col relative w-full pt-4 pb-28 bg-surface">
        {/* --- POCKET (MONEY IN) TAB --- */}
        {currentTab === 'pocket' && (
          <div className="flex flex-col w-full px-margin pt-4 gap-4 animate-fadeIn">
            {/* Hero Pocket Overview Card */}
            <div className="w-full bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-[#E5E7EB]">
              <div className="flex items-center justify-between pb-space-sm">
                <div className="flex items-center gap-space-xs">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                    Pocket Status
                  </span>
                </div>
                <div className="inline-flex items-center gap-1 bg-secondary-container/40 px-2.5 py-0.5 rounded-full">
                  <span className="material-symbols-outlined text-secondary text-[14px]">
                    trending_up
                  </span>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold">
                    +৳450 this week
                  </span>
                </div>
              </div>

              {/* Main Metric: Total Received */}
              <div className="mt-space-xs">
                <p className="font-label-md text-label-md text-on-surface-variant font-medium">
                  Total Money Received
                </p>
                <div className="flex items-baseline gap-space-xs mt-0.5">
                  <span className="font-headline-xl-mobile text-headline-xl-mobile text-secondary font-bold tracking-tight">
                    +৳{Math.round(summary.totalInflow).toLocaleString()}
                  </span>
                  <div className="w-6 h-6 rounded-full bg-secondary-container/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-secondary text-[16px]">
                      arrow_outward
                    </span>
                  </div>
                </div>
              </div>

              {/* Secondary Metric Bar */}
              <div className="mt-space-md pt-space-md bg-surface-container-low/60 rounded-xl p-space-md flex items-center justify-between border border-surface-container">
                <div className="flex items-center gap-space-sm min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center text-on-surface shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">
                      account_balance_wallet
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-label-sm text-label-sm text-on-surface-variant truncate font-medium">
                      Current Available Balance
                    </p>
                    <p className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                      ৳{Math.round(summary.availablePocketCash).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenAddMoney}
                  className="flex-shrink-0 px-space-md py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors shadow-sm font-semibold border border-surface-container"
                >
                  + Add
                </button>
              </div>

              {/* Sparkline mini visualization */}
              <div className="mt-space-md pt-space-sm flex items-center justify-between gap-1 h-10 px-1">
                {summary.weeklyInflow.map((day, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-t transition-all ${
                        day.isPeak ? 'bg-secondary' : day.amount > 0 ? 'bg-secondary-container/50' : 'bg-surface-container'
                      }`}
                      style={{ height: `${day.heightPercent}%` }}
                    />
                    <span
                      className={`font-label-sm text-[10px] ${
                        day.isPeak ? 'text-secondary font-bold' : 'text-on-surface-variant'
                      }`}
                    >
                      {day.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Inbound Directory Header */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <h2 className="font-title-sm text-title-sm text-on-surface font-bold">
                  Income & Deposits
                </h2>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  {inboundTransactions.length} inbound transactions
                </p>
              </div>
              <div className="flex gap-1 overflow-x-auto">
                {['All', 'Salary', 'Freelance'].map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setSourceFilter(src)}
                    className={`px-2.5 py-1 rounded-full font-label-sm text-label-sm transition-all ${
                      sourceFilter === src
                        ? 'bg-primary text-on-primary font-bold'
                        : 'bg-surface-container-lowest text-on-surface-variant border border-surface-container'
                    }`}
                  >
                    {src}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Filter (From Date to Date) Beside Nav Bar */}
            {onDateRangeChange && (
              <div className="flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1.5 rounded-xl border border-surface-container text-xs">
                <span className="material-symbols-outlined text-primary text-[15px]">date_range</span>
                <label className="text-[10px] font-bold uppercase text-outline">From</label>
                <input
                  type="date"
                  max={endDate && endDate < today ? endDate : today}
                  value={startDate || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && val > today) return;
                    onDateRangeChange(val, endDate || '');
                  }}
                  className="bg-transparent text-[11px] text-on-surface font-medium outline-none flex-1 min-w-0"
                />
                <span className="text-outline text-xs">→</span>
                <label className="text-[10px] font-bold uppercase text-outline">To</label>
                <input
                  type="date"
                  min={startDate || undefined}
                  max={today}
                  value={endDate || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && val > today) return;
                    onDateRangeChange(startDate || '', val);
                  }}
                  className="bg-transparent text-[11px] text-on-surface font-medium outline-none flex-1 min-w-0"
                />
                {(startDate || endDate) && onResetDateRange && (
                  <button
                    type="button"
                    onClick={onResetDateRange}
                    className="text-[11px] text-secondary font-bold pl-1"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Inbound Transaction Rows */}
            <div className="flex flex-col gap-space-sm pb-10">
              {inboundTransactions.length === 0 ? (
                <div className="bg-surface-container-lowest p-6 rounded-2xl text-center text-outline text-xs border border-[#E5E7EB]">
                  <span className="material-symbols-outlined text-[28px] text-outline block mb-1">search_off</span>
                  No inbound money records recorded yet.
                </div>
              ) : (
                inboundTransactions.map((tx) => {
                const dateObj = new Date(tx.date);
                const dayStr = String(dateObj.getDate()).padStart(2, '0');
                const monthStr = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
                return (
                  <div
                    key={tx.id}
                    onClick={() => onSelectTransaction(tx)}
                    className="w-full bg-surface-container-lowest p-space-md rounded-2xl shadow-sm border border-[#E5E7EB] flex items-center gap-space-md active:bg-surface-container-low transition-colors cursor-pointer"
                  >
                    {/* Date Block */}
                    <div className="w-11 h-12 rounded-xl bg-surface-container-low flex flex-col items-center justify-center flex-shrink-0">
                      <span className="font-title-sm text-title-sm font-bold text-on-surface leading-none">
                        {dayStr}
                      </span>
                      <span className="font-label-sm text-[10px] uppercase font-semibold text-on-surface-variant mt-0.5">
                        {monthStr}
                      </span>
                    </div>

                    {/* Source Icon */}
                    <div className="w-10 h-10 rounded-xl bg-secondary-container/30 flex items-center justify-center flex-shrink-0 text-secondary">
                      <span className="material-symbols-outlined text-[20px]">
                        {tx.brandIcon || 'south_west'}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-space-xs">
                        <span className="font-title-sm text-title-sm text-on-surface font-semibold truncate">
                          {tx.title}
                        </span>
                        <span className="bg-surface-container text-on-surface-variant px-1.5 py-0.5 rounded text-[10px] font-label-sm">
                          {tx.category}
                        </span>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface-variant truncate mt-0.5 text-xs">
                        {tx.notes || tx.channel}
                      </p>
                    </div>

                    {/* Trailing Amount */}
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="font-currency-md text-currency-md text-secondary font-bold">
                        +৳{Math.round(tx.amount).toLocaleString()}
                      </span>
                      <span className="font-label-sm text-[11px] text-secondary/80 font-medium">
                        {tx.status || 'Completed'}
                      </span>
                    </div>
                  </div>
                );
              }))}
            </div>

            {/* Floating Action Button (Add Money) */}
            <div className="fixed bottom-20 right-4 z-40 max-w-[430px]">
              <button
                type="button"
                onClick={onOpenAddMoney}
                aria-label="Add Inbound Money"
                className="w-14 h-14 rounded-full bg-secondary hover:bg-secondary/90 text-on-secondary shadow-lg flex items-center justify-center active:scale-95 transition-transform font-bold"
              >
                <span className="material-symbols-outlined text-[28px]">add</span>
              </button>
            </div>
          </div>
        )}

        {/* --- SPEND (EXPENSES) TAB --- */}
        {currentTab === 'spend' && (
          <div className="flex flex-col w-full px-margin pt-4 gap-4 animate-fadeIn">
            {/* Financial Overview Card */}
            <section className="w-full bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-[#E5E7EB]">
              <div className="grid grid-cols-2 gap-space-md items-start">
                <div className="flex flex-col space-y-space-xs min-w-0">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                    Total spent
                  </span>
                  <div className="font-headline-lg text-headline-lg text-on-surface tracking-tight truncate font-bold">
                    ৳{Math.round(summary.totalExpense).toLocaleString()}
                  </div>
                  <div className="pt-space-xs">
                    <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                      <div
                        className="h-full bg-on-tertiary-container rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${spentPercent}%` }}
                      />
                    </div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant mt-1.5 leading-snug">
                      {spentPercent}% of available funds spent
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end text-right space-y-space-xs min-w-0">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                    Money available
                  </span>
                  <div className="font-headline-md text-headline-md text-secondary font-bold tracking-tight truncate">
                    ৳{Math.round(summary.availablePocketCash).toLocaleString()}
                  </div>
                  <div className="inline-flex items-center gap-1 bg-secondary-container/40 px-2 py-0.5 rounded-full mt-1">
                    <span className="material-symbols-outlined text-[13px] text-on-secondary-container">
                      trending_down
                    </span>
                    <span className="font-label-sm text-label-sm text-on-secondary-container font-semibold">
                      Rem: ৳{Math.round(safeToSpend).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Filter Chips */}
            <div className="flex items-center gap-space-xs overflow-x-auto py-1">
              {['All Spends', 'This Month', 'Recurring'].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setSpendTab(chip)}
                  className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md whitespace-nowrap transition-all ${
                    spendTab === chip
                      ? 'bg-primary text-on-primary font-semibold shadow-sm'
                      : 'bg-surface-container-lowest text-on-surface-variant border border-surface-container'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Date Filter (From Date to Date) Beside Nav Bar */}
            {onDateRangeChange && (
              <div className="flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1.5 rounded-xl border border-surface-container text-xs">
                <span className="material-symbols-outlined text-primary text-[15px]">date_range</span>
                <label className="text-[10px] font-bold uppercase text-outline">From</label>
                <input
                  type="date"
                  max={endDate && endDate < today ? endDate : today}
                  value={startDate || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && val > today) return;
                    onDateRangeChange(val, endDate || '');
                  }}
                  className="bg-transparent text-[11px] text-on-surface font-medium outline-none flex-1 min-w-0"
                />
                <span className="text-outline text-xs">→</span>
                <label className="text-[10px] font-bold uppercase text-outline">To</label>
                <input
                  type="date"
                  min={startDate || undefined}
                  max={today}
                  value={endDate || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && val > today) return;
                    onDateRangeChange(startDate || '', val);
                  }}
                  className="bg-transparent text-[11px] text-on-surface font-medium outline-none flex-1 min-w-0"
                />
                {(startDate || endDate) && onResetDateRange && (
                  <button
                    type="button"
                    onClick={onResetDateRange}
                    className="text-[11px] text-secondary font-bold pl-1"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Recent Expenses List */}
            <div className="flex flex-col gap-space-sm pb-10">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-space-xs">
                  <h2 className="font-title-sm text-title-sm text-on-surface tracking-tight font-bold">
                    Recent Expenses
                  </h2>
                  <span className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded-full font-semibold">
                    {expenseTransactions.length} items
                  </span>
                </div>
              </div>

              {expenseTransactions.length === 0 ? (
                <div className="bg-surface-container-lowest p-6 rounded-2xl text-center text-outline text-xs border border-[#E5E7EB]">
                  <span className="material-symbols-outlined text-[28px] text-outline block mb-1">receipt_long</span>
                  No expense records recorded yet. Tap + to record an expense.
                </div>
              ) : (
                expenseTransactions.map((tx) => {
                const dateObj = new Date(tx.date);
                const dayStr = String(dateObj.getDate()).padStart(2, '0');
                const monthStr = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
                return (
                  <article
                    key={tx.id}
                    onClick={() => onSelectTransaction(tx)}
                    className="w-full bg-surface-container-lowest rounded-xl p-space-md flex items-center gap-space-md shadow-sm border border-[#E5E7EB] active:scale-[0.99] transition-transform cursor-pointer"
                  >
                    <div className="flex flex-col items-center justify-center bg-surface-container w-11 h-11 rounded-lg flex-shrink-0">
                      <span className="font-title-sm text-title-sm leading-none text-on-surface font-bold">
                        {dayStr}
                      </span>
                      <span className="font-label-sm text-label-sm leading-none text-on-surface-variant mt-0.5 uppercase">
                        {monthStr}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-title-sm text-title-sm text-on-surface truncate font-semibold">
                          {tx.title}
                        </h3>
                        <span className="bg-surface-container px-1.5 py-0.5 rounded font-label-sm text-[10px] text-on-surface-variant truncate">
                          {tx.category}
                        </span>
                      </div>
                      <p className="font-label-md text-label-md text-on-surface-variant truncate mt-0.5 text-xs">
                        {tx.notes}
                      </p>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <span className="font-currency-md text-currency-md text-on-tertiary-container font-bold">
                        -৳{Math.round(tx.amount).toLocaleString()}
                      </span>
                    </div>
                  </article>
                );
              }))}
            </div>

            {/* Fixed Cost Checklist Section */}
            <FixedCostsCard
              fixedCosts={fixedCosts && fixedCosts.length > 0 ? fixedCosts : summary.fixedCosts || []}
              onToggle={onToggleFixedCost || (async () => {})}
              onAdd={onAddFixedCost}
              onDelete={onDeleteFixedCost}
              variant="spend"
            />

            {/* Floating Action Button (Add Expense) */}
            <div className="fixed bottom-20 right-4 sm:right-[calc(50%-14rem+1rem)] z-40">
              <button
                type="button"
                onClick={onOpenAddExpense}
                aria-label="Add Expense"
                className="w-14 h-14 rounded-full bg-primary-container text-on-primary shadow-xl flex items-center justify-center active:scale-95 transition-all hover:bg-primary font-bold"
              >
                <span className="material-symbols-outlined text-[28px]">add</span>
              </button>
            </div>
          </div>
        )}

        {/* --- SUMMARY TAB --- */}
        {currentTab === 'summary' && (
          <div className="flex flex-col w-full px-margin pt-4 gap-4 pb-10 animate-fadeIn">
            {/* Top Aggregate Cards */}
            <div className="grid grid-cols-2 gap-space-sm">
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-[#E5E7EB]">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Inflow MTD</span>
                <div className="font-headline-md text-headline-md text-secondary font-bold mt-1">
                  +৳{Math.round(summary.totalInflow).toLocaleString()}
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-[#E5E7EB]">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Spent MTD</span>
                <div className="font-headline-md text-headline-md text-error font-bold mt-1">
                  -৳{Math.round(summary.totalExpense).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Net Balance Card */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-[#E5E7EB]">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                Available Reserve
              </span>
              <div className="font-currency-display text-currency-display text-on-surface font-bold mt-1">
                ৳{Math.round(summary.netRemaining).toLocaleString()}
              </div>
              <p className="font-label-sm text-label-sm text-secondary font-semibold mt-1">
                {summary.retainedPercent}% retained
              </p>
            </div>

            {/* Category Breakdown */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-[#E5E7EB] flex flex-col gap-3">
              <h3 className="font-title-sm text-title-sm text-on-surface font-bold">
                Category Allocations
              </h3>
              {summary.categoryBreakdown.map((c) => (
                <div key={c.category} className="flex flex-col gap-1">
                  <div className="flex justify-between font-label-md text-label-md">
                    <span className="text-on-surface font-semibold">{c.category}</span>
                    <span className="text-on-surface-variant font-medium">
                      ৳{Math.round(c.amount).toLocaleString()} ({c.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${Math.min(100, Math.max(5, c.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Fixed Cost Section Below Category Allocations */}
            <FixedCostsCard
              fixedCosts={fixedCosts && fixedCosts.length > 0 ? fixedCosts : summary.fixedCosts || []}
              onToggle={onToggleFixedCost || (async () => {})}
              variant="summary"
            />
          </div>
        )}
      </main>

      {/* Sticky Bottom Navigation Bar (Spend -> Summary -> Add Money) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-4px_24px_rgba(23,25,29,0.06)] border-t border-[#E5E7EB]">
        <div className="h-16 max-w-md mx-auto px-space-md flex items-center justify-around">
          <Link
            href="/spend"
            onClick={() => setActiveMobileTab('spend')}
            className={`flex flex-col items-center justify-center gap-1 w-20 h-12 rounded-xl transition-all active:scale-95 ${
              currentTab === 'spend' ? 'text-primary font-bold' : 'text-on-surface-variant'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[22px] ${
                currentTab === 'spend' ? 'text-on-tertiary-container font-bold' : ''
              }`}
            >
              credit_card
            </span>
            <span className="font-label-sm text-[11px] tracking-tight">Spend</span>
          </Link>

          <Link
            href="/summary"
            onClick={() => setActiveMobileTab('summary')}
            className={`flex flex-col items-center justify-center gap-1 w-20 h-12 rounded-xl transition-all active:scale-95 ${
              currentTab === 'summary' ? 'text-primary font-bold' : 'text-on-surface-variant'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[22px] ${
                currentTab === 'summary' ? 'text-primary font-bold' : ''
              }`}
            >
              pie_chart
            </span>
            <span className="font-label-sm text-[11px] tracking-tight">Summary</span>
          </Link>

          <Link
            href="/pocket"
            onClick={() => setActiveMobileTab('pocket')}
            className={`flex flex-col items-center justify-center gap-1 w-20 h-12 rounded-xl transition-all active:scale-95 ${
              currentTab === 'pocket' ? 'text-primary font-bold' : 'text-on-surface-variant'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[22px] ${
                currentTab === 'pocket' ? 'text-secondary font-bold' : ''
              }`}
            >
              add_circle
            </span>
            <span className="font-label-sm text-[11px] tracking-tight">Add Money</span>
          </Link>

          <button
            type="button"
            onClick={onOpenSettings}
            className="flex flex-col items-center justify-center gap-1 w-20 h-12 rounded-xl transition-all active:scale-95 text-on-surface-variant hover:text-primary"
          >
            <span className="material-symbols-outlined text-[22px]">settings</span>
            <span className="font-label-sm text-[11px] tracking-tight">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

