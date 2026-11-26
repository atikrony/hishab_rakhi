'use client';

import React, { useState } from 'react';
import { DashboardSummary, Transaction } from '@/lib/types';

interface PocketViewProps {
  summary: DashboardSummary;
  transactions: Transaction[];
  searchQuery: string;
  onAddInflow: (data: {
    title: string;
    amount: number;
    category: string;
    date: string;
    walletId: string;
    notes?: string;
    sourceStream?: string;
  }) => Promise<void>;
  onOpenAddModal: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  startDate?: string;
  endDate?: string;
  onDateRangeChange?: (start: string, end: string) => void;
  onResetDate?: () => void;
}

export function PocketView({
  summary,
  transactions,
  searchQuery,
  onAddInflow,
  onOpenAddModal,
  onSelectTransaction,
  startDate,
  endDate,
  onDateRangeChange,
  onResetDate,
}: PocketViewProps) {
  // Quick Inflow Form State
  const [quickAmount, setQuickAmount] = useState('500');
  const targetAccount = 'wal_pocket';
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedSource, setSelectedSource] = useState('Salary');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter State
  const [selectedSourceFilter, setSelectedSourceFilter] = useState('All');
  const [selectedDateScope, setSelectedDateScope] = useState('Last 30 Days');

  const today = new Date().toISOString().split('T')[0];

  // Filter Inbound transactions
  const inboundTransactions = transactions.filter((tx) => {
    if (tx.type !== 'income') return false;
    if (selectedSourceFilter !== 'All') {
      const matchCat = tx.category.toLowerCase() === selectedSourceFilter.toLowerCase();
      const matchSrc = tx.sourceStream?.toLowerCase() === selectedSourceFilter.toLowerCase();
      if (!matchCat && !matchSrc) return false;
    }
    if (selectedDateScope === 'This Month') {
      const now = new Date();
      const yr = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      if (!tx.date.startsWith(`${yr}-${mo}`)) return false;
    } else if (selectedDateScope === 'Last 30 Days') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      if (new Date(tx.date) < thirtyDaysAgo) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = tx.title.toLowerCase().includes(q);
      const matchNotes = tx.notes?.toLowerCase().includes(q);
      const matchCat = tx.category.toLowerCase().includes(q);
      if (!matchTitle && !matchNotes && !matchCat) return false;
    }
    return true;
  });

  // Sort inbound transactions by date descending (newest first)
  inboundTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(quickAmount);
    if (isNaN(num) || num <= 0) return;

    if (effectiveDate > today) {
      alert('Future dates are not permitted. Please select today or a past date.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddInflow({
        title: `${selectedSource} Payment`,
        amount: num,
        category: selectedSource,
        date: new Date(effectiveDate).toISOString(),
        walletId: targetAccount,
        sourceStream: selectedSource,
      });
      setQuickAmount('500');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (inboundTransactions.length === 0) return;
    const headers = ['ID', 'Title', 'Amount', 'Source', 'Date', 'Channel', 'Status', 'Notes'];
    const rows = inboundTransactions.map((tx) => [
      tx.id,
      `"${tx.title.replace(/"/g, '""')}"`,
      Math.round(tx.amount).toString(),
      `"${tx.category}"`,
      `"${new Date(tx.date).toLocaleDateString()}"`,
      `"${(tx.channel || '').replace(/"/g, '""')}"`,
      `"${tx.status || 'Completed'}"`,
      `"${(tx.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `behishebi_inbound_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for source colors
  const getSourceColor = (idx: number) => {
    const palette = ['bg-primary', 'bg-secondary', 'bg-outline', 'bg-outline-variant'];
    return palette[idx % palette.length];
  };

  const getSourceTextColor = (idx: number) => {
    const palette = ['text-primary', 'text-secondary', 'text-outline', 'text-outline-variant'];
    return palette[idx % palette.length];
  };

  return (
    <div className="flex flex-col w-full">
      {/* Inverted High-Contrast Obsidian Chrome Header Zone */}
      <section className="bg-primary-container text-on-primary px-margin-desktop py-space-xl relative overflow-hidden h-[238px]">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-20 w-80 h-80 rounded-full bg-surface-tint/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-space-lg">
          <h1 className="font-headline-xl text-headline-xl text-on-primary tracking-tight font-bold">
            Add Money
          </h1>

          {/* High-Impact 4-Metric Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-space-md">
            {/* Card 1: Total Received */}
            <div className="bg-surface-container-highest/10 rounded-xl p-space-lg backdrop-blur-md flex flex-col justify-between group hover:bg-surface-container-highest/15 transition-all border border-white/5">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-outline-variant">
                  Total received
                </span>
                <div className="w-8 h-8 rounded-lg bg-secondary/20 text-secondary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                </div>
              </div>
              <div className="mt-space-md">
                <div className="font-currency-display text-currency-display text-on-primary tracking-tight font-bold">
                  +৳{Math.round(summary.totalInflow).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Card 2: Current Pocket Balance */}
            <div className="bg-surface-container-highest/10 rounded-xl p-space-lg backdrop-blur-md flex flex-col justify-between group hover:bg-surface-container-highest/15 transition-all border border-white/5">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-outline-variant">
                  Available balance
                </span>
                <div className="w-8 h-8 rounded-lg bg-surface-container-highest/20 text-surface-bright flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                </div>
              </div>
              <div className="mt-space-md">
                <div className="font-currency-display text-currency-display text-on-primary tracking-tight font-bold">
                  ৳{Math.round(summary.availablePocketCash).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Card 3: Active Inflow Sources */}
            <div className="bg-surface-container-highest/10 rounded-xl p-space-lg backdrop-blur-md flex flex-col justify-between group hover:bg-surface-container-highest/15 transition-all border border-white/5">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-outline-variant">
                  Sources
                </span>
                <div className="w-8 h-8 rounded-lg bg-surface-container-highest/20 text-surface-bright flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">hub</span>
                </div>
              </div>
              <div className="mt-space-md">
                <div className="flex items-baseline gap-2">
                  <span className="font-currency-display text-currency-display text-on-primary tracking-tight font-bold">
                    {summary.activeChannelsCount}
                  </span>
                  <span className="font-label-md text-label-md text-outline-variant">
                    active
                  </span>
                </div>
              </div>
            </div>

            {/* Card 4: Savings Conversion Rate */}
            <div className="bg-surface-container-highest/10 rounded-xl p-space-lg backdrop-blur-md flex flex-col justify-between group hover:bg-surface-container-highest/15 transition-all border border-white/5">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-outline-variant">
                  Savings rate
                </span>
                <div className="w-8 h-8 rounded-lg bg-secondary/20 text-secondary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">pie_chart</span>
                </div>
              </div>
              <div className="mt-space-md">
                <div className="font-currency-display text-currency-display text-secondary-fixed tracking-tight font-bold">
                  {summary.savingsVelocity}%
                </div>
                <div className="w-full bg-surface-container-highest/30 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-secondary-fixed h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(5, summary.savingsVelocity))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Multi-Column Interactive Daylight Canvas */}
      <div className="px-margin-desktop py-space-xl flex flex-col gap-space-xl bg-surface">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-start">
          {/* LEFT ASYMMETRIC COLUMN: Analytics, Velocity & Source Mix (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-space-lg">
            {/* Inbound Allocation Donut & Legend */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-hairline flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
                    Sources
                  </h3>
                </div>
                <button
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container"
                  title="Sources overview"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                </button>
              </div>

              <div className="flex items-center gap-space-lg">
                {/* Conic Donut SVG */}
                <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle
                      className="text-surface-container-high"
                      cx="18"
                      cy="18"
                      fill="none"
                      r="15.915"
                      stroke="currentColor"
                      strokeWidth="4.5"
                    />
                    {/* Circle 1: Salary 60% */}
                    <circle
                      className="text-primary"
                      cx="18"
                      cy="18"
                      fill="none"
                      r="15.915"
                      stroke="currentColor"
                      strokeDasharray="60 40"
                      strokeDashoffset="0"
                      strokeWidth="4.5"
                    />
                    {/* Circle 2: Freelance 30% */}
                    <circle
                      className="text-secondary"
                      cx="18"
                      cy="18"
                      fill="none"
                      r="15.915"
                      stroke="currentColor"
                      strokeDasharray="30 70"
                      strokeDashoffset="-60"
                      strokeWidth="4.5"
                    />
                    {/* Circle 3: Investment 6% */}
                    <circle
                      className="text-outline"
                      cx="18"
                      cy="18"
                      fill="none"
                      r="15.915"
                      stroke="currentColor"
                      strokeDasharray="6 94"
                      strokeDashoffset="-90"
                      strokeWidth="4.5"
                    />
                    {/* Circle 4: Gift 4% */}
                    <circle
                      className="text-outline-variant"
                      cx="18"
                      cy="18"
                      fill="none"
                      r="15.915"
                      stroke="currentColor"
                      strokeDasharray="4 96"
                      strokeDashoffset="-96"
                      strokeWidth="4.5"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="font-label-sm text-label-sm text-outline">Total</span>
                    <span className="font-title-sm text-title-sm text-on-surface font-bold">
                      ৳{summary.totalInflow >= 10000 ? `${Math.round(summary.totalInflow / 1000)}k` : Math.round(summary.totalInflow).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Allocation Breakout Items */}
                <div className="flex-1 flex flex-col gap-space-xs">
                  {summary.sourceBreakdown.map((src, idx) => (
                    <div
                      key={src.source}
                      className="flex items-center justify-between text-body-md font-body-md py-1 border-b border-surface-container-low last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${getSourceColor(idx)}`} />
                        <span className="text-on-surface font-medium">{src.source}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-on-surface font-title-sm text-title-sm font-semibold">
                          {src.percentage}%
                        </span>
                        <span className="text-outline font-label-sm text-label-sm">
                          (৳{Math.round(src.amount).toLocaleString()})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Inflow Intake (Express Form) */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-hairline flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
                    Quick Add
                  </h3>
                </div>
              </div>

              <form onSubmit={handleQuickSubmit} className="flex flex-col gap-space-md">
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-medium">
                    Amount
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 font-title-sm text-title-sm text-outline font-bold">
                      ৳
                    </span>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={quickAmount}
                      onChange={(e) => setQuickAmount(e.target.value)}
                      required
                      placeholder="0"
                      className="w-full h-11 pl-8 pr-3 rounded-lg bg-surface-container-low text-on-surface font-currency-md text-currency-md outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-primary"
                    />
                  </div>
                  {/* Quick-fill pills */}
                  <div className="flex gap-2 mt-2">
                    {['100', '500', '1000'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setQuickAmount(preset)}
                        className="px-2.5 py-1 rounded bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors border border-surface-container font-semibold"
                      >
                        +৳{parseInt(preset, 10).toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-medium">
                      Source
                    </label>
                    <input
                      type="text"
                      required
                      value={selectedSource}
                      onChange={(e) => setSelectedSource(e.target.value)}
                      placeholder="e.g. Salary, Freelance, Gift"
                      className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md outline-none border border-surface-container focus:border-primary placeholder:text-on-surface-variant/40"
                    />
                  </div>
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-medium">
                      Date
                    </label>
                    <input
                      type="date"
                      max={today}
                      value={effectiveDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val > today) return;
                        setEffectiveDate(val);
                      }}
                      className="w-full h-10 px-2 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md outline-none border border-surface-container focus:border-primary"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-space-xs h-11 w-full rounded-lg bg-primary text-on-primary font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-primary-container shadow-sm transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  <span>{isSubmitting ? 'Adding…' : 'Add Money'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: Ledger Directory & Inbound Transactions (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-space-lg">
            {/* Filter Toolbar & Directory Header */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-hairline flex flex-col gap-space-md">
              <div className="flex flex-wrap items-center justify-between gap-space-md">
                <div>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">
                    Income
                  </h2>
                </div>
                <div className="flex items-center gap-space-sm">
                  <button
                    onClick={handleExportCSV}
                    className="h-9 px-space-md rounded-lg bg-surface-container-low text-on-surface font-label-md text-label-md flex items-center gap-space-xs hover:bg-surface-container-high transition-colors border border-surface-container"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">file_download</span>
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={onOpenAddModal}
                    data-tour="add-money-btn"
                    className="h-9 px-space-md rounded-lg bg-primary text-on-primary font-label-md text-label-md flex items-center gap-space-xs hover:bg-primary-container transition-colors shadow-sm"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    <span>+ Add Income</span>
                  </button>
                </div>
              </div>

              {/* Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs">
                {/* Segment Filter Chips */}
                <div className="flex items-center gap-space-xs overflow-x-auto pb-1 max-w-full">
                  {['All', 'Salary', 'Freelance', 'Investment', 'Gift'].map((src) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setSelectedSourceFilter(src)}
                      className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md whitespace-nowrap transition-all ${
                        selectedSourceFilter === src
                          ? 'bg-primary text-on-primary shadow-sm font-semibold'
                          : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      {src === 'All' ? `All Sources (${inboundTransactions.length})` : src}
                    </button>
                  ))}
                </div>

                {/* Date Filter (From Date to Date) Beside the Nav Bar */}
                <div className="flex flex-wrap items-center gap-1.5 bg-surface-container-low px-2.5 py-1.5 rounded-lg border border-surface-container text-xs">
                  <span className="material-symbols-outlined text-primary text-[16px]">date_range</span>
                  <label htmlFor="pocket-from-date" className="text-[10px] font-bold uppercase text-outline tracking-wider">
                    From
                  </label>
                  <input
                    id="pocket-from-date"
                    type="date"
                    max={endDate && endDate < today ? endDate : today}
                    value={startDate || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && val > today) return;
                      onDateRangeChange?.(val, endDate || '');
                    }}
                    className="bg-transparent text-xs text-on-surface font-medium outline-none cursor-pointer"
                  />
                  <span className="text-outline text-xs">→</span>
                  <label htmlFor="pocket-to-date" className="text-[10px] font-bold uppercase text-outline tracking-wider">
                    To
                  </label>
                  <input
                    id="pocket-to-date"
                    type="date"
                    min={startDate || undefined}
                    max={today}
                    value={endDate || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && val > today) return;
                      onDateRangeChange?.(startDate || '', val);
                    }}
                    className="bg-transparent text-xs text-on-surface font-medium outline-none cursor-pointer"
                  />
                  {(startDate || endDate) && onResetDate && (
                    <button
                      type="button"
                      onClick={onResetDate}
                      className="ml-1 px-1.5 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-[11px] font-semibold flex items-center gap-0.5 transition-colors"
                      title="Clear date filter"
                    >
                      <span className="material-symbols-outlined text-[13px]">close</span>
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Inbound Transaction Stream Cards */}
            <div className="flex flex-col gap-space-sm">
              {inboundTransactions.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-xl p-space-xl text-center shadow-sm border border-hairline">
                  <span className="material-symbols-outlined text-[36px] text-outline">search_off</span>
                  <p className="font-title-sm text-title-sm text-on-surface mt-2 font-semibold">
                    No income found
                  </p>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                    Try adjusting your search or source filters.
                  </p>
                </div>
              ) : (
                inboundTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => onSelectTransaction(tx)}
                    className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex items-center justify-between group border border-hairline cursor-pointer"
                  >
                    <div className="flex items-center gap-space-md min-w-0">
                      <div className="w-11 h-11 rounded-lg bg-secondary-container/40 text-on-secondary-container flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-[22px]">
                          {tx.brandIcon || 'south_west'}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-title-sm text-title-sm text-on-surface truncate font-bold">
                            {tx.title}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">
                            {tx.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-space-xs text-outline font-label-md text-label-md mt-0.5">
                          <span className="truncate">{tx.channel || tx.notes || 'Inbound wire'}</span>
                          <span>•</span>
                          <span className="text-on-surface-variant flex-shrink-0">
                            {new Date(tx.date).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-space-lg flex-shrink-0 pl-3">
                      <div className="text-right">
                        <div className="font-currency-md text-currency-md text-secondary tracking-tight font-bold">
                          +৳{Math.round(tx.amount).toLocaleString()}
                        </div>
                        <div className="flex items-center justify-end gap-1 text-secondary font-label-sm text-label-sm font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                          <span>{tx.status || 'Completed'}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTransaction(tx);
                        }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:bg-surface-container-low hover:text-on-surface transition-colors"
                        title="View receipt"
                      >
                        <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Ledger Footer Summary */}
            <div className="bg-surface-container-low rounded-xl p-space-md flex items-center justify-end border border-surface-container text-on-surface-variant font-label-sm text-label-sm">
              <button
                onClick={handleExportCSV}
                className="hover:text-on-surface flex items-center gap-1 font-semibold transition-colors"
                type="button"
              >
                <span>Export CSV</span>
                <span className="material-symbols-outlined text-[16px]">file_download</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

