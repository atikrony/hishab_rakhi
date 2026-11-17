'use client';

import React, { useState, useMemo } from 'react';
import { DashboardSummary, Transaction, FixedCost } from '@/lib/types';
import { FixedCostsCard } from './FixedCostsCard';

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
  fixedCosts?: FixedCost[];
  onToggleFixedCost?: (id: string, isPaid: boolean, month?: string) => Promise<void>;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#10b981',      // Emerald
  'Tech & Gadgets': '#3b82f6',     // Blue
  'Bills & Utilities': '#f59e0b',  // Amber
  'Transportation': '#8b5cf6',     // Purple
  'Healthcare': '#ec4899',         // Pink
  'Health & Meds': '#ec4899',      // Pink
  'Entertainment': '#06b6d4',      // Cyan
  'Shopping': '#f97316',           // Orange
  'Education': '#14b8a6',          // Teal
  'Salary': '#16a34a',             // Green
  'Freelance': '#0284c7',          // Sky
  'Gift': '#e11d48',               // Rose
  'Investment': '#6366f1',         // Indigo
  'Other': '#64748b',              // Slate
};

const FALLBACK_PALETTE = [
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#14b8a6',
  '#6366f1',
  '#64748b',
];

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
  fixedCosts,
  onToggleFixedCost,
}: SummaryViewProps) {
  // Cadence Scope & Filter States
  const [cadenceScope, setCadenceScope] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Month');
  const [pieMode, setPieMode] = useState<'categories' | 'cashflow'>('categories');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  // Sorting State
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const today = new Date().toISOString().split('T')[0];

  // 1. Dynamic Period Filtering based on Cadence Scope or Custom Date Range
  const { periodTransactions, periodLabel } = useMemo(() => {
    // If manual date picker is active
    if (startDate || endDate) {
      const list = transactions.filter((tx) => {
        const txDate = tx.date.split('T')[0];
        if (startDate && txDate < startDate) return false;
        if (endDate && txDate > endDate) return false;
        return true;
      });
      const label =
        startDate && endDate
          ? `${startDate} – ${endDate}`
          : startDate
          ? `From ${startDate}`
          : `Up to ${endDate}`;
      return { periodTransactions: list, periodLabel: label };
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (cadenceScope === 'Day') {
      const list = transactions.filter((tx) => tx.date.startsWith(todayStr));
      const formatted = now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return { periodTransactions: list, periodLabel: `Today: ${formatted}` };
    }

    if (cadenceScope === 'Week') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const list = transactions.filter((tx) => new Date(tx.date) >= sevenDaysAgo);
      const fromStr = sevenDaysAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const toStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return { periodTransactions: list, periodLabel: `Past 7 Days: ${fromStr} – ${toStr}` };
    }

    if (cadenceScope === 'Month') {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const prefix = `${year}-${month}`;
      const list = transactions.filter((tx) => tx.date.startsWith(prefix));
      const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return { periodTransactions: list, periodLabel: `Month of ${monthName}` };
    }

    // Year
    const yearStr = String(now.getFullYear());
    const list = transactions.filter((tx) => tx.date.startsWith(yearStr));
    return { periodTransactions: list, periodLabel: `Year ${yearStr}` };
  }, [transactions, cadenceScope, startDate, endDate]);

  // 2. Computed Financial Diagnostics for the Active Period
  const periodInflow = useMemo(() => {
    return periodTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [periodTransactions]);

  const periodOutflow = useMemo(() => {
    return periodTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [periodTransactions]);

  const periodNet = periodInflow - periodOutflow;

  const periodBurnPercent =
    periodInflow > 0
      ? Math.min(100, Math.round((periodOutflow / periodInflow) * 100))
      : periodOutflow > 0
      ? 100
      : 0;

  const periodRetainedPercent =
    periodInflow > 0 ? Math.max(0, 100 - periodBurnPercent) : 0;

  // 3. Dynamic Category Breakdown for the Active Period
  const periodCategoryBreakdown = useMemo(() => {
    const expenses = periodTransactions.filter((t) => t.type === 'expense');
    const totalExp = expenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const map = new Map<string, { amount: number; count: number }>();

    expenses.forEach((t) => {
      const cat = t.category || 'Other';
      const existing = map.get(cat) || { amount: 0, count: 0 };
      map.set(cat, {
        amount: existing.amount + (Number(t.amount) || 0),
        count: existing.count + 1,
      });
    });

    const list: Array<{
      category: string;
      amount: number;
      percentage: number;
      count: number;
      color: string;
    }> = [];

    let fallbackIdx = 0;
    map.forEach((data, category) => {
      const percentage = totalExp > 0 ? Math.round((data.amount / totalExp) * 100) : 0;
      const color =
        CATEGORY_COLORS[category] ||
        FALLBACK_PALETTE[fallbackIdx++ % FALLBACK_PALETTE.length];
      list.push({
        category,
        amount: data.amount,
        percentage,
        count: data.count,
        color,
      });
    });

    return list.sort((a, b) => b.amount - a.amount);
  }, [periodTransactions]);

  // 4. Dynamic Liquidity Breakdown for Volume Bars
  const liquidityBars = useMemo(() => {
    if (cadenceScope === 'Day') {
      const slots = [
        { label: 'Morning (6am-12pm)', startHour: 6, endHour: 12 },
        { label: 'Afternoon (12pm-5pm)', startHour: 12, endHour: 17 },
        { label: 'Evening (5pm-9pm)', startHour: 17, endHour: 21 },
        { label: 'Night (9pm-6am)', startHour: 21, endHour: 30 },
      ];
      return slots.map((s) => {
        const inSlot = periodTransactions.filter((tx) => {
          const h = new Date(tx.date).getHours();
          if (s.startHour === 21) return h >= 21 || h < 6;
          return h >= s.startHour && h < s.endHour;
        });
        const inflow = inSlot.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const outflow = inSlot.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const total = Math.max(1, inflow + outflow);
        return {
          label: s.label,
          inflow,
          outflow,
          inflowPercent: Math.round((inflow / total) * 100),
          outflowPercent: Math.round((outflow / total) * 100),
        };
      });
    }

    if (cadenceScope === 'Week') {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dStr = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
        const inDay = periodTransactions.filter((tx) => tx.date.startsWith(dStr));
        const inflow = inDay.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const outflow = inDay.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const total = Math.max(1, inflow + outflow);
        days.push({
          label: dayLabel,
          inflow,
          outflow,
          inflowPercent: Math.round((inflow / total) * 100),
          outflowPercent: Math.round((outflow / total) * 100),
        });
      }
      return days;
    }

    // Month or Year: 4 balanced segments
    if (summary.weeklyLiquidity && summary.weeklyLiquidity.length > 0 && periodTransactions.length > 0) {
      return summary.weeklyLiquidity.map((w) => ({
        label: w.dateRange,
        inflow: w.inflow,
        outflow: w.outflow,
        inflowPercent: w.inflowPercent,
        outflowPercent: w.outflowPercent,
      }));
    }

    return [
      { label: 'Week 1', inflow: Math.round(periodInflow * 0.3), outflow: Math.round(periodOutflow * 0.25), inflowPercent: 55, outflowPercent: 45 },
      { label: 'Week 2', inflow: Math.round(periodInflow * 0.25), outflow: Math.round(periodOutflow * 0.35), inflowPercent: 40, outflowPercent: 60 },
      { label: 'Week 3', inflow: Math.round(periodInflow * 0.25), outflow: Math.round(periodOutflow * 0.2), inflowPercent: 65, outflowPercent: 35 },
      { label: 'Week 4', inflow: Math.round(periodInflow * 0.2), outflow: Math.round(periodOutflow * 0.2), inflowPercent: 50, outflowPercent: 50 },
    ];
  }, [cadenceScope, periodTransactions, periodInflow, periodOutflow, summary.weeklyLiquidity]);

  // 5. Filtered and Sorted Activity Ledger Transactions
  const filteredTransactions = useMemo(() => {
    let list = periodTransactions.filter((tx) => {
      if (filterType === 'expenses' && tx.type !== 'expense') return false;
      if (filterType === 'income' && tx.type !== 'income') return false;
      if (
        filterType === 'dining' &&
        !tx.category.toLowerCase().includes('dining') &&
        !tx.category.toLowerCase().includes('food')
      ) {
        return false;
      }
      if (
        filterType === 'services' &&
        !tx.category.toLowerCase().includes('util') &&
        !tx.category.toLowerCase().includes('tech') &&
        !tx.category.toLowerCase().includes('freelance')
      ) {
        return false;
      }
      if (
        selectedCategoryFilter &&
        tx.category.toLowerCase() !== selectedCategoryFilter.toLowerCase()
      ) {
        return false;
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

    // Strictly Sort Transactions by Date or Amount
    list.sort((a, b) => {
      if (sortField === 'date') {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      } else {
        const amtA = Number(a.amount) || 0;
        const amtB = Number(b.amount) || 0;
        return sortOrder === 'desc' ? amtB - amtA : amtA - amtB;
      }
    });

    return list;
  }, [
    periodTransactions,
    filterType,
    selectedCategoryFilter,
    searchQuery,
    sortField,
    sortOrder,
  ]);

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
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `hishab_rakhi_statement_${cadenceScope.toLowerCase()}_${today}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSortToggle = (field: 'date' | 'amount') => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // SVG Donut Math calculations
  const CIRCUMFERENCE = 282.743; // 2 * PI * 45
  let cumulativeOffset = 0;

  const activeHoverCategoryData = useMemo(() => {
    if (!hoveredCategory) return null;
    return periodCategoryBreakdown.find((c) => c.category === hoveredCategory) || null;
  }, [hoveredCategory, periodCategoryBreakdown]);

  return (
    <div className="flex flex-col w-full">
      {/* Architectural Dark Chrome Banner */}
      <section className="bg-primary-container text-on-primary px-margin-desktop py-space-xl relative overflow-hidden shadow-sm">
        <div className="absolute -right-20 -bottom-24 w-96 h-96 rounded-full bg-surface-tint/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-space-lg relative z-10">
          <div className="flex flex-col gap-space-xs">
            <h1 className="font-headline-xl text-headline-xl text-on-primary tracking-tight font-bold">
              Summary Analytics
            </h1>
          </div>
        </div>
      </section>

      {/* Main Daylight Canvas */}
      <div className="max-w-7xl mx-auto w-full px-margin-desktop py-space-xl flex flex-col gap-space-xl bg-surface">
        {/* Top Overview Metric Cards (3 Clean Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter-desktop -mt-10 relative z-20">
          {/* Card 1: Total Received */}
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
                +৳{Math.round(periodInflow).toLocaleString()}
              </div>
              <div className="flex items-center gap-space-xs text-secondary font-label-sm text-label-sm font-semibold">
                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                <span>
                  {periodTransactions.filter((t) => t.type === 'income').length} settled inflows
                </span>
                <span className="text-outline text-label-sm ml-auto font-normal">Active cycle</span>
              </div>
            </div>
          </div>

          {/* Card 2: Settled Outflow */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-[#E5E7EB] flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-space-md">
              <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                Settled Outflow
              </span>
              <span className="w-8 h-8 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">north_east</span>
              </span>
            </div>
            <div className="flex flex-col gap-space-xs">
              <div className="font-currency-display text-currency-display text-on-surface tracking-tight leading-none font-bold">
                -৳{Math.round(periodOutflow).toLocaleString()}
              </div>
              <div className="flex items-center gap-space-xs text-on-tertiary-container font-label-sm text-label-sm font-semibold">
                <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                <span>
                  {periodTransactions.filter((t) => t.type === 'expense').length} payments
                </span>
                <span className="text-outline text-label-sm ml-auto font-normal">
                  {periodBurnPercent}% burn
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Net Retained Funds */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-[#E5E7EB] flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-space-md">
              <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                Net Retained Funds
              </span>
              <span className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">verified</span>
              </span>
            </div>
            <div className="flex flex-col gap-space-xs">
              <div
                className={`font-currency-display text-currency-display tracking-tight leading-none font-bold ${
                  periodNet >= 0 ? 'text-secondary' : 'text-error'
                }`}
              >
                {periodNet >= 0 ? '+' : ''}৳{Math.round(periodNet).toLocaleString()}
              </div>
              <div className="flex items-center gap-space-xs font-label-sm text-label-sm font-semibold">
                <span className="px-space-xs py-0.5 rounded bg-secondary-container/40 text-on-secondary-container font-medium">
                  {periodRetainedPercent}% retained
                </span>
                <span className="text-on-surface-variant font-normal">
                  {periodNet >= 0 ? 'Positive balance' : 'Deficit volume'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Analytics Section (Bento Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-start">
          {/* Cashflow Ratio & Monthly Performance (Left 8 Cols) */}
          <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-[#E5E7EB] flex flex-col gap-space-lg">
            {/* Header Controls: Cadence & Pie View Switchers */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h2 className="font-title-sm text-title-sm text-on-surface font-bold">
                    Cash Flow & Diagnostics
                  </h2>
                  <span className="text-[11px] font-semibold text-primary px-2 py-0.5 rounded bg-primary/10">
                    {periodLabel}
                  </span>
                </div>
                <p className="font-label-md text-label-md text-on-surface-variant">
                  Interactive breakdowns responding in real-time
                </p>
              </div>

              {/* Functional Controls: Cadence Switcher (Day, Week, Month, Year) */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-space-xs bg-surface-container p-0.5 rounded-lg self-start sm:self-auto shadow-inner">
                  {(['Day', 'Week', 'Month', 'Year'] as const).map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => {
                        setCadenceScope(period);
                        if (onResetDate) onResetDate();
                      }}
                      className={`px-3 py-1 rounded-md font-label-sm text-label-sm transition-all ${
                        cadenceScope === period && !startDate && !endDate
                          ? 'bg-primary text-on-primary font-bold shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface font-medium'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sub-strip: Pie chart mode selector */}
            <div className="flex items-center justify-between border-b border-surface-container pb-3">
              <div className="flex items-center gap-1.5 bg-surface-container-low p-1 rounded-xl border border-surface-container">
                <button
                  type="button"
                  onClick={() => setPieMode('categories')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-label-sm font-semibold transition-all ${
                    pieMode === 'categories'
                      ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">pie_chart</span>
                  <span>Expense Categories</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPieMode('cashflow')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-label-sm font-semibold transition-all ${
                    pieMode === 'cashflow'
                      ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">donut_large</span>
                  <span>Cash Flow Ratio</span>
                </button>
              </div>

              {selectedCategoryFilter && (
                <button
                  type="button"
                  onClick={() => setSelectedCategoryFilter(null)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                >
                  <span>Filtering: {selectedCategoryFilter}</span>
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>

            {/* Donut & Breakdown Visualization */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter-desktop items-center pt-space-xs">
              {/* Interactive Multi-Slice Functional Pie/Donut Chart */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-space-md relative">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
                    {/* Background Track */}
                    <circle
                      className="stroke-surface-container-high"
                      cx="60"
                      cy="60"
                      fill="transparent"
                      r="45"
                      strokeWidth="11"
                    />

                    {pieMode === 'categories' ? (
                      periodCategoryBreakdown.length === 0 ? (
                        <circle
                          className="stroke-outline/20"
                          cx="60"
                          cy="60"
                          fill="transparent"
                          r="45"
                          strokeWidth="11"
                          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                        />
                      ) : (
                        periodCategoryBreakdown.map((cat) => {
                          const sliceLength = (Math.max(1, cat.percentage) / 100) * CIRCUMFERENCE;
                          const offset = cumulativeOffset;
                          cumulativeOffset += sliceLength;
                          const isHovered = hoveredCategory === cat.category;
                          const isSelected = selectedCategoryFilter === cat.category;

                          return (
                            <circle
                              key={cat.category}
                              cx="60"
                              cy="60"
                              fill="transparent"
                              r="45"
                              stroke={cat.color}
                              strokeWidth={isHovered || isSelected ? 15 : 11}
                              strokeDasharray={`${sliceLength} ${CIRCUMFERENCE}`}
                              strokeDashoffset={-offset}
                              strokeLinecap="round"
                              className="cursor-pointer transition-all duration-300 hover:opacity-100"
                              opacity={hoveredCategory && !isHovered ? 0.35 : 1}
                              onMouseEnter={() => setHoveredCategory(cat.category)}
                              onMouseLeave={() => setHoveredCategory(null)}
                              onClick={() => {
                                setSelectedCategoryFilter((prev) =>
                                  prev === cat.category ? null : cat.category
                                );
                              }}
                            />
                          );
                        })
                      )
                    ) : (
                      /* Cash Flow Ratio Mode (Retained vs Spent) */
                      <>
                        {/* Spent Segment */}
                        <circle
                          className="stroke-on-tertiary-container transition-all duration-500"
                          cx="60"
                          cy="60"
                          fill="transparent"
                          r="45"
                          strokeWidth="12"
                          strokeDasharray={`${(periodBurnPercent / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                          strokeDashoffset="0"
                          strokeLinecap="round"
                        />
                        {/* Retained Remaining Segment */}
                        <circle
                          className="stroke-secondary transition-all duration-500"
                          cx="60"
                          cy="60"
                          fill="transparent"
                          r="45"
                          strokeWidth="12"
                          strokeDasharray={`${(periodRetainedPercent / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                          strokeDashoffset={`-${(periodBurnPercent / 100) * CIRCUMFERENCE + 4}`}
                          strokeLinecap="round"
                        />
                      </>
                    )}
                  </svg>

                  {/* Center Hub Diagnostics Display */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
                    {pieMode === 'categories' ? (
                      activeHoverCategoryData ? (
                        <>
                          <span className="font-label-sm text-[11px] text-outline uppercase tracking-wider truncate max-w-[110px]">
                            {activeHoverCategoryData.category}
                          </span>
                          <span className="font-headline-md text-headline-md text-on-surface font-bold leading-tight">
                            {activeHoverCategoryData.percentage}%
                          </span>
                          <span className="font-label-sm text-label-sm font-semibold" style={{ color: activeHoverCategoryData.color }}>
                            ৳{Math.round(activeHoverCategoryData.amount).toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-label-sm text-[11px] text-outline uppercase tracking-wider">
                            Total Outflow
                          </span>
                          <span className="font-headline-md text-headline-md text-on-surface leading-tight font-bold">
                            ৳{Math.round(periodOutflow).toLocaleString()}
                          </span>
                          <span className="font-label-sm text-[11px] text-on-surface-variant font-medium">
                            {periodCategoryBreakdown.length} Categories
                          </span>
                        </>
                      )
                    ) : (
                      <>
                        <span className="font-label-sm text-[11px] text-outline uppercase tracking-wider">
                          Net Retained
                        </span>
                        <span className="font-headline-lg text-headline-lg text-on-surface leading-tight font-bold">
                          {periodRetainedPercent}%
                        </span>
                        <span className="font-label-sm text-label-sm text-secondary font-bold">
                          ৳{Math.round(periodNet).toLocaleString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Pie Chart Legend */}
                {pieMode === 'categories' ? (
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-space-md max-w-[240px]">
                    {periodCategoryBreakdown.slice(0, 5).map((cat) => (
                      <button
                        key={cat.category}
                        type="button"
                        onClick={() =>
                          setSelectedCategoryFilter((prev) =>
                            prev === cat.category ? null : cat.category
                          )
                        }
                        onMouseEnter={() => setHoveredCategory(cat.category)}
                        onMouseLeave={() => setHoveredCategory(null)}
                        className={`flex items-center gap-1.5 text-[11px] font-medium transition-opacity ${
                          hoveredCategory && hoveredCategory !== cat.category
                            ? 'opacity-40'
                            : 'opacity-100'
                        } ${selectedCategoryFilter === cat.category ? 'font-bold underline' : ''}`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-on-surface truncate max-w-[80px]">{cat.category}</span>
                        <span className="text-outline">({cat.percentage}%)</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-space-md mt-space-md">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                        Retained ({periodRetainedPercent}%)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-on-tertiary-container" />
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                        Spent ({periodBurnPercent}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Weekly/Cadence Cashflow Bar Breakdown */}
              <div className="md:col-span-7 flex flex-col gap-space-md">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="font-label-md text-label-md font-semibold text-on-surface">
                    {cadenceScope === 'Day'
                      ? 'Hourly Liquidity Distribution'
                      : cadenceScope === 'Week'
                      ? 'Daily Cash Volume (Past 7 Days)'
                      : 'Cadence Volume Liquidity'}
                  </span>
                  <span className="font-label-sm text-label-sm text-outline">
                    Inflow vs. Outflow
                  </span>
                </div>

                {/* Chart Bars */}
                <div className="flex flex-col gap-space-sm">
                  {liquidityBars.map((bar, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <div className="flex justify-between font-label-sm text-label-sm">
                        <span className="text-on-surface font-semibold">{bar.label}</span>
                        <span className="text-on-surface-variant font-medium">
                          +৳{Math.round(bar.inflow).toLocaleString()} / -৳{Math.round(bar.outflow).toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-surface-container flex overflow-hidden">
                        <div
                          className="h-full bg-secondary rounded-l-full transition-all duration-500"
                          style={{ width: `${bar.inflowPercent}%` }}
                        />
                        <div
                          className="h-full bg-on-tertiary-container rounded-r-full transition-all duration-500"
                          style={{ width: `${bar.outflowPercent}%` }}
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
                      +৳{Math.round(periodInflow).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col border border-surface-container">
                    <span className="font-label-sm text-label-sm text-outline">Spent Out</span>
                    <span className="font-currency-md text-currency-md text-on-tertiary-container font-bold">
                      -৳{Math.round(periodOutflow).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-space-sm rounded-lg bg-secondary-container/30 flex flex-col border border-secondary-container/40">
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">
                      Surplus Net
                    </span>
                    <span className="font-currency-md text-currency-md text-secondary font-bold">
                      {periodNet >= 0 ? '+' : ''}৳{Math.round(periodNet).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right 4 Cols: Category Distribution + Fixed Cost */}
          <div className="lg:col-span-4 flex flex-col gap-space-lg">
            {/* Category Distribution */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-[#E5E7EB] flex flex-col gap-space-lg">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h2 className="font-title-sm text-title-sm text-on-surface font-bold">
                    Category Distribution
                  </h2>
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    {periodLabel} allocation
                  </span>
                </div>
                <span className="font-label-sm text-label-sm px-space-xs py-0.5 rounded bg-surface-container text-on-surface-variant font-semibold">
                  {periodCategoryBreakdown.length} Categories
                </span>
              </div>

              {/* Breakdown List */}
              <div className="flex flex-col gap-space-md">
                {periodCategoryBreakdown.length === 0 ? (
                  <div className="py-8 text-center text-outline">
                    <span className="material-symbols-outlined text-[32px] block mb-1 text-outline">
                      category
                    </span>
                    <p className="text-body-md text-on-surface font-medium">No expenses this period</p>
                    <p className="text-label-sm text-on-surface-variant mt-0.5">
                      Select another timeframe or record an expense.
                    </p>
                  </div>
                ) : (
                  periodCategoryBreakdown.slice(0, 5).map((cat) => {
                    const iconMap: Record<string, string> = {
                      'Food & Dining': 'restaurant',
                      'Tech & Gadgets': 'devices',
                      'Bills & Utilities': 'bolt',
                      Transportation: 'commute',
                      'Health & Meds': 'medical_services',
                      Healthcare: 'medical_services',
                      Shopping: 'shopping_bag',
                      Entertainment: 'movie',
                    };
                    const icon = iconMap[cat.category] || 'sell';
                    const isSelected = selectedCategoryFilter === cat.category;

                    return (
                      <div
                        key={cat.category}
                        onClick={() =>
                          setSelectedCategoryFilter((prev) =>
                            prev === cat.category ? null : cat.category
                          )
                        }
                        className={`flex flex-col gap-space-xs p-2 rounded-xl transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary/5 ring-1 ring-primary/30'
                            : 'hover:bg-surface-container-low'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-space-xs">
                            <span
                              className="w-7 h-7 rounded-lg flex items-center justify-center"
                              style={{
                                backgroundColor: `${cat.color}20`,
                                color: cat.color,
                              }}
                            >
                              <span className="material-symbols-outlined text-[16px]">{icon}</span>
                            </span>
                            <div className="flex flex-col">
                              <span className="font-title-sm text-title-sm text-on-surface leading-tight font-semibold">
                                {cat.category}
                              </span>
                              <span className="font-label-sm text-label-sm text-outline">
                                {cat.count} transaction{cat.count > 1 ? 's' : ''}
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
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.max(8, cat.percentage))}%`,
                              backgroundColor: cat.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Fixed Cost Section Below Category Distribution */}
            <FixedCostsCard
              fixedCosts={fixedCosts && fixedCosts.length > 0 ? fixedCosts : summary.fixedCosts || []}
              onToggle={onToggleFixedCost || (async () => {})}
              variant="summary"
            />
          </div>
        </div>

        {/* Lower Section: Filterable Full Activity Ledger with Explicit Date & Amount Sorting */}
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
                {selectedCategoryFilter && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center gap-1">
                    <span>{selectedCategoryFilter}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryFilter(null)}
                      className="hover:text-primary/70"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
              <span className="font-label-md text-label-md text-on-surface-variant">
                Statement breakdown for {periodLabel} • Sorted by {sortField === 'date' ? 'Date' : 'Amount'} ({sortOrder === 'desc' ? 'Newest / Highest' : 'Oldest / Lowest'})
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
                        : 'text-on-surface-variant hover:text-on-surface font-medium'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Date Filter (From Date to Date) */}
              <div className="flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1 rounded-lg border border-surface-container text-xs">
                <span className="material-symbols-outlined text-primary text-[16px]">date_range</span>
                <label
                  htmlFor="summary-from-date"
                  className="text-[10px] font-bold uppercase text-outline tracking-wider"
                >
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
                <label
                  htmlFor="summary-to-date"
                  className="text-[10px] font-bold uppercase text-outline tracking-wider"
                >
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

              {/* Export CSV & Quick Add */}
              <div className="flex items-center gap-space-xs">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="h-8 px-space-sm rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container font-label-sm text-label-sm flex items-center gap-1 transition-colors border border-surface-container font-medium"
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

          {/* Transaction List / Table with Clickable Sort Headers */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider border-b border-surface-container">
                  <th className="py-space-sm px-space-lg font-semibold">Transaction & Details</th>
                  <th className="py-space-sm px-space-md font-semibold">Category</th>
                  <th
                    className="py-space-sm px-space-md font-semibold cursor-pointer select-none hover:text-primary transition-colors"
                    onClick={() => handleSortToggle('date')}
                    title="Click to sort by date"
                  >
                    <div className="flex items-center gap-1">
                      <span>Date & Stamp</span>
                      {sortField === 'date' && (
                        <span className="material-symbols-outlined text-[16px] text-primary">
                          {sortOrder === 'desc' ? 'arrow_downward' : 'arrow_upward'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="py-space-sm px-space-md font-semibold">Status</th>
                  <th
                    className="py-space-sm px-space-lg text-right font-semibold cursor-pointer select-none hover:text-primary transition-colors"
                    onClick={() => handleSortToggle('amount')}
                    title="Click to sort by amount"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Amount (৳)</span>
                      {sortField === 'amount' && (
                        <span className="material-symbols-outlined text-[16px] text-primary">
                          {sortOrder === 'desc' ? 'arrow_downward' : 'arrow_upward'}
                        </span>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container text-on-surface font-body-md text-body-md">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-outline">
                      <span className="material-symbols-outlined text-[36px] block mb-2 text-outline">
                        receipt_long
                      </span>
                      <p className="font-title-sm text-title-sm text-on-surface font-semibold">
                        No transactions recorded for this period
                      </p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                        Try switching cadence or click &quot;Quick Add&quot; to record a transaction.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const isIncome = tx.type === 'income';
                    const isUnpaidFixedCost = tx.isFixedCost && !tx.isPaid;
                    const txDate = new Date(tx.date);
                    const isToday = tx.date.startsWith(today);
                    const formattedDate = isToday
                      ? `Today, ${txDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                      : txDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        });

                    return (
                      <tr
                        key={tx.id}
                        onClick={() => onSelectTransaction(tx)}
                        className={`transition-colors cursor-pointer group ${
                          isUnpaidFixedCost
                            ? 'bg-amber-500/[0.04] hover:bg-amber-500/[0.08]'
                            : 'hover:bg-surface-container-low/60'
                        }`}
                      >
                        <td className="py-space-md px-space-lg">
                          <div className="flex items-center gap-space-sm">
                            {tx.isFixedCost && onToggleFixedCost ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleFixedCost(tx.fixedCostId || tx.id.replace('fc_', ''), !tx.isPaid);
                                }}
                                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                                  tx.isPaid
                                    ? 'bg-secondary text-on-secondary shadow-sm scale-105'
                                    : 'border-2 border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 shadow-xs'
                                }`}
                                title={tx.isPaid ? 'Settled fixed cost (click to mark unpaid)' : 'Meant to be spent (click checkmark to settle)'}
                              >
                                <span className="material-symbols-outlined text-[18px] font-bold">check</span>
                              </button>
                            ) : (
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
                            )}
                            <div className="flex flex-col min-w-0">
                              <span
                                className={`font-title-sm text-title-sm truncate font-bold group-hover:text-primary transition-colors ${
                                  tx.isFixedCost && tx.isPaid ? 'line-through text-outline' : 'text-on-surface'
                                }`}
                              >
                                {tx.title}
                              </span>
                              <span
                                className={`font-label-sm text-label-sm truncate ${
                                  isUnpaidFixedCost ? 'text-amber-700 dark:text-amber-400 font-medium' : 'text-outline'
                                }`}
                              >
                                {isUnpaidFixedCost
                                  ? 'Fixed Cost • Meant to be spent (Not spent yet)'
                                  : tx.notes || tx.channel || 'Standard transaction'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-space-md px-space-md">
                          <span
                            className="px-space-xs py-0.5 rounded font-label-sm text-label-sm font-medium"
                            style={{
                              backgroundColor: `${CATEGORY_COLORS[tx.category] || '#64748b'}18`,
                              color: CATEGORY_COLORS[tx.category] || '#64748b',
                            }}
                          >
                            {tx.category}
                          </span>
                        </td>
                        <td className="py-space-md px-space-md">
                          <div className="flex flex-col">
                            <span className="font-label-md text-label-md text-on-surface font-medium">
                              {formattedDate}
                            </span>
                            <span className="font-label-sm text-label-sm text-outline">
                              {txDate.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="py-space-md px-space-md">
                          {isUnpaidFixedCost ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-label-sm text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Not spent yet
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1.5 px-space-xs py-0.5 rounded-full font-label-sm text-label-sm font-medium ${
                                tx.status === 'Pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-secondary-container/30 text-secondary'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  tx.status === 'Pending' ? 'bg-amber-600' : 'bg-secondary'
                                }`}
                              />
                              {tx.status || 'Settled'}
                            </span>
                          )}
                        </td>
                        <td className="py-space-md px-space-lg text-right">
                          <span
                            className={`font-currency-md text-currency-md font-bold ${
                              isIncome
                                ? 'text-secondary'
                                : isUnpaidFixedCost
                                ? 'text-amber-600 dark:text-amber-400'
                                : tx.isFixedCost && tx.isPaid
                                ? 'text-secondary line-through opacity-80'
                                : 'text-on-surface'
                            }`}
                          >
                            {isIncome ? '+' : '-'}৳{Math.round(tx.amount).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
