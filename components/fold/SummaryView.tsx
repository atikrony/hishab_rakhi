'use client';

import React, { useState } from 'react';
import { DashboardSummary, Transaction } from '@/lib/types';

interface SummaryViewProps {
  summary: DashboardSummary;
  transactions: Transaction[];
  searchQuery: string;
  onOpenAddModal: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  startDate?: string;
  endDate?: string;
  onDateRangeChange?: (start: string, end: string) => void;
  onResetDate?: () => void;
}

export function SummaryView({
  summary,
  transactions,
  searchQuery,
  onOpenAddModal,
  onSelectTransaction,
  startDate,
  endDate,
  onDateRangeChange,
  onResetDate,
}: SummaryViewProps) {
  const [filterType, setFilterType] = useState<string>('all');
  const [cadenceScope, setCadenceScope] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Month');

  const today = new Date().toISOString().split('T')[0];

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    if (filterType === 'expenses' && tx.type !== 'expense') return false;
    if (filterType === 'income' && tx.type !== 'income') return false;
    if (filterType === 'dining' && !tx.category.toLowerCase().includes('dining') && !tx.category.toLowerCase().includes('food')) {
      return false;
    }
    if (filterType === 'services' && !tx.category.toLowerCase().includes('util') && !tx.category.toLowerCase().includes('tech') && !tx.category.toLowerCase().includes('freelance')) {
      return false;
    }
    if (cadenceScope === 'Day') {
      const today = new Date().toISOString().split('T')[0];
      if (!tx.date.startsWith(today)) return false;
    } else if (cadenceScope === 'Week') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (new Date(tx.date) < sevenDaysAgo) return false;
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

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ['ID', 'Title', 'Type', 'Amount', 'Category', 'Date', 'Status', 'Notes'];
    const rows = filteredTransactions.map((tx) => [
      tx.id,
      `"${tx.title.replace(/"/g, '""')}"`,
      tx.type,
      Math.round(tx.amount).toString(),
      `"${tx.category}"`,
      `"${new Date(tx.date).toLocaleDateString()}"`,
      `"${tx.status || 'Completed'}"`,
      `"${(tx.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hishab_rakhi_statement_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const burnPercent = summary.totalInflow > 0
    ? Math.min(100, Math.round((summary.totalExpense / summary.totalInflow) * 100))
    : 26;
  const retainedPercent = Math.max(0, 100 - burnPercent);

  // KaTeX/Math safe text for top dining note
  const topCat = summary.categoryBreakdown[0];

  return (
    <div className="flex flex-col w-full">
      {/* Architectural Dark Chrome Banner */}
      <section className="bg-primary-container text-on-primary px-margin-desktop py-space-xl relative overflow-hidden shadow-sm">
        <div className="absolute -right-20 -bottom-24 w-96 h-96 rounded-full bg-surface-tint/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-space-lg relative z-10">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="inline-block w-2 h-2 rounded-full bg-secondary-fixed animate-pulse" />
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary-fixed font-semibold">
                Live Financial Diagnostics
              </span>
            </div>
            <div className="flex items-baseline gap-space-md">
              <h1 className="font-headline-xl text-headline-xl text-on-primary tracking-tight font-bold">
                Summary Analytics
              </h1>
              <span className="font-label-md text-label-md text-outline-variant">
                Cycle: Oct 01 – Nov 10, 2024
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-primary-container max-w-xl">
              Real-time cashflow intelligence. Aggregating multi-source inflows against settled expenses with live ledger analytics.
            </p>
          </div>

          <div className="flex items-center gap-space-sm self-start md:self-auto bg-surface-container-highest/20 p-space-xs rounded-xl backdrop-blur-md border border-white/5">
            <button
              className="px-space-md py-space-xs rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm transition-all font-semibold"
              type="button"
            >
              Monthly Ledger
            </button>
            <button
              className="px-space-md py-space-xs rounded-lg text-on-primary/80 font-label-md text-label-md hover:text-on-primary transition-colors"
              type="button"
            >
              Tax Forecast
            </button>
            <button
              className="px-space-md py-space-xs rounded-lg text-on-primary/80 font-label-md text-label-md hover:text-on-primary transition-colors"
              type="button"
            >
              Audit Trail
            </button>
          </div>
        </div>
      </section>

      {/* Main Daylight Canvas */}
      <div className="max-w-7xl mx-auto w-full px-margin-desktop py-space-xl flex flex-col gap-space-xl bg-surface">
        {/* Top Overview Metric Cards (Floating Dual-Tone Row) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter-desktop -mt-10 relative z-20">
          {/* Total Received */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-[#E5E7EB] flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-space-md">
              <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                Total Received
              </span>
              <span className="w-8 h-8 rounded-lg bg-secondary-container/30 text-on-secondary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">south_west</span>
              </span>
            </div>
            <div className="flex flex-col gap-space-xs">
              <div className="font-currency-display text-currency-display text-on-surface tracking-tight leading-none font-bold">
                +৳{Math.round(summary.totalInflow).toLocaleString()}
              </div>
              <div className="flex items-center gap-space-xs text-secondary font-label-sm text-label-sm font-semibold">
                <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                <span>+৳450 this week</span>
                <span className="text-outline text-label-sm ml-auto font-normal">Salary + Yield</span>
              </div>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-[#E5E7EB] flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-space-md">
              <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                Total Expenses
              </span>
              <span className="w-8 h-8 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">north_east</span>
              </span>
            </div>
            <div className="flex flex-col gap-space-xs">
              <div className="font-currency-display text-currency-display text-on-surface tracking-tight leading-none font-bold">
                ৳{Math.round(summary.totalExpense).toLocaleString()}
              </div>
              <div className="flex items-center gap-space-xs text-on-tertiary-container font-label-sm text-label-sm font-semibold">
                <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                <span>{transactions.filter((t) => t.type === 'expense').length} settled</span>
                <span className="text-outline text-label-sm ml-auto font-normal">{burnPercent}% burn</span>
              </div>
            </div>
          </div>

          {/* Net Remaining / Cash Available */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-[#E5E7EB] flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-space-md">
              <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                Net Remaining
              </span>
              <span className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">verified</span>
              </span>
            </div>
            <div className="flex flex-col gap-space-xs">
              <div className="font-currency-display text-currency-display text-secondary tracking-tight leading-none font-bold">
                ৳{Math.round(summary.netRemaining).toLocaleString()}
              </div>
              <div className="flex items-center gap-space-xs font-label-sm text-label-sm font-semibold">
                <span className="px-space-xs py-0.5 rounded bg-secondary-container/40 text-on-secondary-container font-medium">
                  {retainedPercent}% retained
                </span>
                <span className="text-on-surface-variant font-normal">Healthy reserve</span>
              </div>
            </div>
          </div>

          {/* Available Cash Pocket */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-[#E5E7EB] flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-space-md">
              <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                Available Pocket Cash
              </span>
              <span className="w-8 h-8 rounded-lg bg-surface-container-high text-on-surface-variant flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              </span>
            </div>
            <div className="flex flex-col gap-space-xs">
              <div className="font-currency-display text-currency-display text-on-surface tracking-tight leading-none font-bold">
                ৳{Math.round(summary.availablePocketCash).toLocaleString()}
              </div>
              <div className="flex items-center gap-space-xs font-label-sm text-label-sm font-semibold">
                <span className="inline-flex items-center gap-1.5 px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface-variant font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  Main Pocket
                </span>
                <span className="text-outline ml-auto font-normal">Ready to Spend</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Analytics Section (Bento Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-start">
          {/* Cashflow Ratio & Monthly Performance (Left 8 Cols) */}
          <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-[#E5E7EB] flex flex-col gap-space-lg">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
              <div className="flex flex-col">
                <h2 className="font-title-sm text-title-sm text-on-surface font-bold">
                  Cashflow Dynamics & Retention
                </h2>
                <p className="font-label-md text-label-md text-on-surface-variant">
                  Realized inflow versus authorized outflows over active cycle
                </p>
              </div>
              <div className="flex items-center gap-space-xs bg-surface-container p-0.5 rounded-lg self-start sm:self-auto">
                {(['Day', 'Week', 'Month', 'Year'] as const).map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setCadenceScope(period)}
                    className={`px-space-sm py-1 rounded font-label-sm text-label-sm transition-all ${
                      cadenceScope === period
                        ? 'bg-primary text-on-primary font-bold shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {/* Metric Highlight Badge */}
            <div className="flex items-center justify-between p-space-md bg-secondary-container/20 rounded-xl border border-secondary-container/30">
              <div className="flex items-center gap-space-sm">
                <span
                  className="material-symbols-outlined text-secondary text-[22px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  shield_with_heart
                </span>
                <div className="flex flex-col">
                  <span className="font-title-sm text-title-sm text-on-surface font-bold">
                    Spending within owned funds
                  </span>
                  <span className="font-label-sm text-label-sm text-on-secondary-container font-medium">
                    No outstanding lines of credit drawn this period
                  </span>
                </div>
              </div>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold px-space-sm py-1 bg-surface-container-lowest rounded-lg shadow-sm border border-secondary/20">
                Optimal Grade
              </span>
            </div>

            {/* Donut & Breakdown Visualization */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter-desktop items-center pt-space-xs">
              {/* Donut Graphic Chart */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-space-md relative">
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
                    <circle
                      className="stroke-surface-container-high"
                      cx="60"
                      cy="60"
                      fill="transparent"
                      r="48"
                      strokeWidth="12"
                    />
                    {/* Spent Segment */}
                    <circle
                      className="stroke-on-tertiary-container"
                      cx="60"
                      cy="60"
                      fill="transparent"
                      r="48"
                      strokeDasharray={`${(burnPercent / 100) * 301.5} 301.5`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                      strokeWidth="12"
                    />
                    {/* Retained Remaining Segment */}
                    <circle
                      className="stroke-secondary"
                      cx="60"
                      cy="60"
                      fill="transparent"
                      r="48"
                      strokeDasharray={`${(retainedPercent / 100) * 301.5} 301.5`}
                      strokeDashoffset={`-${(burnPercent / 100) * 301.5 + 5}`}
                      strokeLinecap="round"
                      strokeWidth="12"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                      Available
                    </span>
                    <span className="font-headline-lg text-headline-lg text-on-surface leading-tight font-bold">
                      {retainedPercent}%
                    </span>
                    <span className="font-label-sm text-label-sm text-secondary font-bold">
                      ৳{Math.round(summary.netRemaining).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-space-md mt-space-md">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                      Retained
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-on-tertiary-container" />
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                      Disbursed ({burnPercent}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Weekly Cashflow Bar Breakdown */}
              <div className="md:col-span-7 flex flex-col gap-space-md">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="font-label-md text-label-md font-semibold">
                    Weekly Volume Liquidity
                  </span>
                  <span className="font-label-sm text-label-sm text-outline">
                    Inflow vs. Outflow
                  </span>
                </div>

                {/* Chart Bars */}
                <div className="flex flex-col gap-space-sm">
                  {summary.weeklyLiquidity.map((week, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <div className="flex justify-between font-label-sm text-label-sm">
                        <span className="text-on-surface font-semibold">{week.dateRange}</span>
                        <span className="text-on-surface-variant font-medium">
                          +৳{Math.round(week.inflow).toLocaleString()} / -৳{Math.round(week.outflow).toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-surface-container flex overflow-hidden">
                        <div
                          className="h-full bg-secondary rounded-l-full"
                          style={{ width: `${week.inflowPercent}%` }}
                        />
                        <div
                          className="h-full bg-on-tertiary-container rounded-r-full"
                          style={{ width: `${week.outflowPercent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Inflow vs Outflow Pill Indicators */}
                <div className="grid grid-cols-3 gap-space-sm pt-space-xs">
                  <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col border border-surface-container">
                    <span className="font-label-sm text-label-sm text-outline">Gross Inflow</span>
                    <span className="font-currency-md text-currency-md text-on-surface font-bold">
                      +৳{Math.round(summary.totalInflow).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col border border-surface-container">
                    <span className="font-label-sm text-label-sm text-outline">Spent Out</span>
                    <span className="font-currency-md text-currency-md text-on-tertiary-container font-bold">
                      -৳{Math.round(summary.totalExpense).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-space-sm rounded-lg bg-secondary-container/30 flex flex-col border border-secondary-container/40">
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">
                      Surplus Net
                    </span>
                    <span className="font-currency-md text-currency-md text-secondary font-bold">
                      +৳{Math.round(summary.netRemaining).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category Distribution (Right 4 Cols) */}
          <div className="lg:col-span-4 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-[#E5E7EB] flex flex-col gap-space-lg">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h2 className="font-title-sm text-title-sm text-on-surface font-bold">
                  Category Distribution
                </h2>
                <span className="font-label-md text-label-md text-on-surface-variant">
                  Expense allocation profile
                </span>
              </div>
              <span className="font-label-sm text-label-sm px-space-xs py-0.5 rounded bg-surface-container text-on-surface-variant font-semibold">
                {summary.categoryBreakdown.length} Categories
              </span>
            </div>

            {/* Breakdown List */}
            <div className="flex flex-col gap-space-md">
              {summary.categoryBreakdown.slice(0, 4).map((cat) => {
                const iconMap: Record<string, string> = {
                  'Food & Dining': 'restaurant',
                  'Tech & Gadgets': 'devices',
                  'Bills & Utilities': 'bolt',
                  Transportation: 'commute',
                  'Health & Meds': 'medical_services',
                };
                const icon = iconMap[cat.category] || 'shopping_bag';
                return (
                  <div key={cat.category} className="flex flex-col gap-space-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-space-xs">
                        <span className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-on-surface">
                          <span className="material-symbols-outlined text-[16px]">{icon}</span>
                        </span>
                        <div className="flex flex-col">
                          <span className="font-title-sm text-title-sm text-on-surface leading-tight font-semibold">
                            {cat.category}
                          </span>
                          <span className="font-label-sm text-label-sm text-outline">
                            {cat.count} recorded transaction{cat.count > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-currency-md text-currency-md text-on-surface font-bold">
                          ৳{Math.round(cat.amount).toLocaleString()}
                        </div>
                        <div className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                          {cat.percentage}%
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(8, cat.percentage))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Budget Advice Snippet */}
            <div className="mt-auto p-space-md rounded-xl bg-surface-container-low flex items-start gap-space-sm border border-surface-container">
              <span className="material-symbols-outlined text-outline text-[20px] shrink-0 mt-0.5">
                tips_and_updates
              </span>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md font-bold text-on-surface">
                  Pacing Strategy
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant leading-relaxed">
                  {topCat
                    ? `${topCat.category} is tracking at ${topCat.percentage}% of expense volume. Shifting ৳40 to emergency pool preserves high liquid ratio.`
                    : 'All expense allocations are tracking well within verified monthly benchmarks.'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Section: Filterable Full Monthly Activity Ledger */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-[#E5E7EB] overflow-hidden flex flex-col">
          {/* Ledger Header Controls */}
          <div className="p-space-lg flex flex-col md:flex-row md:items-center justify-between gap-space-md border-b border-surface-container">
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs">
                <h2 className="font-title-sm text-title-sm text-on-surface font-bold">
                  Activity Ledger
                </h2>
                <span className="px-space-xs py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold">
                  {filteredTransactions.length} Records
                </span>
              </div>
              <span className="font-label-md text-label-md text-on-surface-variant">
                Complete statement breakdown for November
              </span>
            </div>

            {/* Interactive Filters & Actions */}
            <div className="flex flex-wrap items-center gap-space-sm">
              {/* Filter Tabs (Nav Bar) */}
              <div className="flex items-center gap-1 bg-surface-container p-0.5 rounded-lg">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'expenses', label: 'Expenses' },
                  { id: 'income', label: 'Income' },
                  { id: 'dining', label: 'Dining' },
                  { id: 'services', label: 'Services' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterType(tab.id)}
                    className={`px-space-sm py-1 rounded-md font-label-sm text-label-sm transition-all ${
                      filterType === tab.id
                        ? 'bg-primary text-on-primary font-bold shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Date Filter (From Date to Date) Beside the Nav Bar */}
              <div className="flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1 rounded-lg border border-surface-container text-xs">
                <span className="material-symbols-outlined text-primary text-[16px]">date_range</span>
                <label htmlFor="summary-from-date" className="text-[10px] font-bold uppercase text-outline tracking-wider">
                  From
                </label>
                <input
                  id="summary-from-date"
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
                <label htmlFor="summary-to-date" className="text-[10px] font-bold uppercase text-outline tracking-wider">
                  To
                </label>
                <input
                  id="summary-to-date"
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

              {/* Actions */}
              <div className="flex items-center gap-space-xs">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="h-8 px-space-sm rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container font-label-sm text-label-sm flex items-center gap-1 transition-colors border border-surface-container"
                >
                  <span className="material-symbols-outlined text-[16px]">file_download</span>
                  <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenAddModal}
                  className="h-8 px-space-sm rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-sm text-label-sm flex items-center gap-1 transition-colors shadow-sm font-semibold"
                >
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  <span>Quick Add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Transaction List / Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider border-b border-surface-container">
                  <th className="py-space-sm px-space-lg font-semibold">Transaction & Details</th>
                  <th className="py-space-sm px-space-md font-semibold">Category</th>
                  <th className="py-space-sm px-space-md font-semibold">Date & Stamp</th>
                  <th className="py-space-sm px-space-md font-semibold">Status</th>
                  <th className="py-space-sm px-space-lg text-right font-semibold">Amount (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container text-on-surface font-body-md text-body-md">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-outline">
                      <span className="material-symbols-outlined text-[36px] block mb-2 text-outline">receipt_long</span>
                      <p className="font-title-sm text-title-sm text-on-surface font-semibold">No transactions recorded yet</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">Click &quot;Quick Add&quot; to record your first real transaction.</p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  return (
                    <tr
                      key={tx.id}
                      onClick={() => onSelectTransaction(tx)}
                      className="hover:bg-surface-container-low/60 transition-colors cursor-pointer"
                    >
                      <td className="py-space-md px-space-lg">
                        <div className="flex items-center gap-space-sm">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                              isIncome
                                ? 'bg-secondary-container/40 text-on-secondary-container'
                                : 'bg-surface-container text-on-surface-variant'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {tx.brandIcon || (isIncome ? 'account_balance' : 'receipt_long')}
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-title-sm text-title-sm text-on-surface truncate font-bold">
                              {tx.title}
                            </span>
                            <span className="font-label-sm text-label-sm text-outline truncate">
                              {tx.notes || tx.channel || 'Standard transaction'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-space-md px-space-md">
                        <span className="px-space-xs py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface font-medium">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-space-md px-space-md">
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md text-on-surface font-semibold">
                            {new Date(tx.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: '2-digit',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="font-label-sm text-label-sm text-outline">
                            {new Date(tx.date).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="py-space-md px-space-md">
                        <span
                          className={`inline-flex items-center gap-1 font-label-sm text-label-sm font-semibold ${
                            isIncome ? 'text-secondary' : 'text-on-surface-variant'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isIncome ? 'bg-secondary' : 'bg-outline'
                            }`}
                          />
                          {tx.status || 'Completed'}
                        </span>
                      </td>
                      <td className="py-space-md px-space-lg text-right">
                        <span
                          className={`font-currency-md text-currency-md font-bold ${
                            isIncome ? 'text-secondary' : 'text-on-tertiary-container'
                          }`}
                        >
                          {isIncome ? '+' : '-'}৳
                          {Math.round(tx.amount).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

