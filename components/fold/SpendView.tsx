'use client';

import React, { useState } from 'react';
import { DashboardSummary, Transaction, FixedCost } from '@/lib/types';
import { FixedCostsCard } from './FixedCostsCard';

interface SpendViewProps {
  summary: DashboardSummary;
  transactions: Transaction[];
  searchQuery: string;
  onAddExpense: (data: {
    title: string;
    amount: number;
    category: string;
    date: string;
    walletId: string;
    notes?: string;
  }) => Promise<void>;
  onOpenAddModal: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  startDate?: string;
  endDate?: string;
  onDateRangeChange?: (start: string, end: string) => void;
  onResetDate?: () => void;
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

export function SpendView({
  summary,
  transactions,
  searchQuery,
  onAddExpense,
  onOpenAddModal,
  onSelectTransaction,
  startDate,
  endDate,
  onDateRangeChange,
  onResetDate,
  fixedCosts,
  onAddFixedCost,
  onToggleFixedCost,
  onDeleteFixedCost,
}: SpendViewProps) {
  // Quick Expense Form State
  const [quickAmount, setQuickAmount] = useState('45');
  const [merchantTitle, setMerchantTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Food & Dining');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters & Sorting State
  const [selectedTab, setSelectedTab] = useState<'all' | 'month' | 'recurring' | 'cat'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<'newest' | 'highest' | 'lowest'>('newest');
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [showEditCatModal, setShowEditCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Default initial categories
  const defaultCategories = [
    'Food & Dining',
    'Tech & Gadgets',
    'Bills & Utilities',
    'Transportation',
    'Health & Meds',
    'Entertainment',
    'Shopping',
  ];

  // Managed categories list with local persistence
  const [categoryList, setCategoryList] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('hr_managed_categories');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return defaultCategories;
  });

  const allCategories = categoryList;

  const handleCreateCategory = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!categoryList.includes(trimmed)) {
      const next = [...categoryList, trimmed];
      setCategoryList(next);
      if (typeof window !== 'undefined') {
        localStorage.setItem('hr_managed_categories', JSON.stringify(next));
      }
      setSelectedCategory(trimmed);
    }
    setNewCatName('');
  };

  const handleRemoveCategory = (catToRemove: string) => {
    if (categoryList.length <= 1) {
      alert('You must have at least one category.');
      return;
    }
    const next = categoryList.filter((c) => c !== catToRemove);
    setCategoryList(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hr_managed_categories', JSON.stringify(next));
    }
    if (selectedCategory === catToRemove) {
      setSelectedCategory(next[0] || 'Other');
    }
    if (filterCategory === catToRemove) {
      setFilterCategory('all');
    }
  };

  const handleResetCategories = () => {
    setCategoryList(defaultCategories);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hr_managed_categories', JSON.stringify(defaultCategories));
    }
    setSelectedCategory(defaultCategories[0]);
  };

  const today = new Date().toISOString().split('T')[0];

  const categoryDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryMenuOpen(false);
      }
    }
    if (isCategoryMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isCategoryMenuOpen]);

  // Filter Outflows
  let expenseList = transactions.filter((tx) => {
    if (tx.type !== 'expense') return false;
    if (selectedTab === 'month') {
      const now = new Date();
      const yr = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      if (!tx.date.startsWith(`${yr}-${mo}`)) return false;
    } else if (selectedTab === 'recurring') {
      const recurringKeywords = ['subscription', 'fiber', 'internet', 'grid', 'pass', 'infra', 'monthly', 'bill', 'rent', 'wifi'];
      const text = `${tx.title} ${tx.notes || ''}`.toLowerCase();
      if (!recurringKeywords.some((k) => text.includes(k))) return false;
    } else if (selectedTab === 'cat') {
      if (filterCategory !== 'all' && tx.category.toLowerCase() !== filterCategory.toLowerCase()) {
        return false;
      }
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

  // Sort
  if (selectedSort === 'newest') {
    expenseList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } else if (selectedSort === 'highest') {
    expenseList.sort((a, b) => b.amount - a.amount);
  } else if (selectedSort === 'lowest') {
    expenseList.sort((a, b) => a.amount - b.amount);
  }

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(quickAmount);
    if (isNaN(num) || num <= 0 || !merchantTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddExpense({
        title: merchantTitle.trim(),
        amount: num,
        category: selectedCategory,
        date: new Date().toISOString(),
        walletId: 'wal_pocket',
      });
      setQuickAmount('25');
      setMerchantTitle('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (expenseList.length === 0) return;
    const headers = ['ID', 'Title', 'Amount', 'Category', 'Date', 'Status', 'Notes'];
    const rows = expenseList.map((tx) => [
      tx.id,
      `"${tx.title.replace(/"/g, '""')}"`,
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
    link.setAttribute('download', `behishebi_expense_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const safeToSpend = Math.max(0, summary.availablePocketCash - summary.totalExpense);
  const spentPercent = summary.availablePocketCash > 0
    ? Math.min(100, Math.round((summary.totalExpense / summary.availablePocketCash) * 100))
    : 65;

  return (
    <div className="flex flex-col w-full">
      {/* Top Dark Obsidian Header Chrome Split */}
      <div className="w-full bg-primary-container text-on-primary px-margin-desktop py-space-xl relative overflow-hidden h-[238px]">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-surface-tint/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-32 rounded-full bg-secondary-container/10 blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col gap-space-lg relative z-10">
          {/* Title Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-md">
              <div>
                <h1 className="font-headline-xl text-headline-xl text-on-primary tracking-tight font-bold">
                  Spend
                </h1>
              </div>
            </div>
          </div>

          {/* High-Impact Financial Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
            {/* Spent Metric */}
            <div className="bg-surface-container-lowest/5 rounded-xl p-space-lg backdrop-blur-sm flex flex-col justify-between border border-white/5">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-outline-variant">
                  Total spent
                </span>
                <span className="material-symbols-outlined text-outline-variant text-[20px]">
                  arrow_outward
                </span>
              </div>
              <div className="mt-space-md mb-space-sm">
                <span className="font-currency-display text-currency-display text-on-primary leading-none font-bold">
                  ৳{Math.round(summary.totalExpense).toLocaleString()}
                </span>
                <p className="font-label-md text-label-md text-on-primary-container mt-1">
                  {spentPercent}% of available funds spent
                </p>
              </div>
              <div className="w-full bg-surface-container-lowest/10 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-secondary-container h-full rounded-full transition-all duration-700"
                  style={{ width: `${spentPercent}%` }}
                />
              </div>
            </div>

            {/* Available Remaining */}
            <div className="bg-surface-container-lowest/5 rounded-xl p-space-lg backdrop-blur-sm flex flex-col justify-between border border-white/5">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-outline-variant">
                  Safe to spend
                </span>
                <span className="material-symbols-outlined text-secondary-fixed text-[20px]">
                  account_balance_wallet
                </span>
              </div>
              <div className="mt-space-md mb-space-sm">
                <span className="font-currency-display text-currency-display text-on-primary leading-none font-bold">
                  ৳{Math.round(safeToSpend).toLocaleString()}
                </span>
                <p className="font-label-md text-label-md text-secondary-fixed mt-1">
                  Available: ৳{Math.round(summary.availablePocketCash).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Daylight Canvas Area */}
      <div className="w-full px-margin-desktop py-space-xl max-w-7xl mx-auto flex flex-col gap-space-md bg-surface">
        {/* Category Spend Mosaic Bar */}
        <div className="flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-title-sm text-title-sm text-on-surface font-bold">
                Categories
              </h2>
            </div>
            {summary.categoryBreakdown[0] && (
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold truncate min-w-0 ml-4">
                Top: {summary.categoryBreakdown[0].category} ({summary.categoryBreakdown[0].percentage}%)
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-space-md">
            {summary.categoryBreakdown.slice(0, 5).map((cat) => {
              const iconMap: Record<string, string> = {
                'Food & Dining': 'restaurant',
                'Tech & Gadgets': 'devices',
                'Bills & Utilities': 'bolt',
                Transportation: 'directions_car',
                'Health & Meds': 'medical_services',
              };
              const icon = iconMap[cat.category] || 'receipt_long';
              return (
                <div
                  key={cat.category}
                  className="min-w-0 bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-hairline hover:shadow transition-shadow flex flex-col justify-between"
                  title={`${cat.category}: ৳${Math.round(cat.amount).toLocaleString()} (${cat.percentage}%)`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface">
                      <span className="material-symbols-outlined text-[18px]">{icon}</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                      {cat.percentage}%
                    </span>
                  </div>
                  <div className="mt-space-md min-w-0">
                    <span className="font-currency-md text-currency-md text-on-surface block leading-tight font-bold truncate tabular-nums">
                      ৳{Math.round(cat.amount).toLocaleString()}
                    </span>
                    <span className="font-label-md text-label-md text-on-surface-variant truncate block mt-0.5">
                      {cat.category}
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-high h-1 rounded-full mt-space-sm overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(8, cat.percentage * 1.5))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content Layout: 8-Column Ledger & 4-Column Quick Entry Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
          {/* Left 8 Cols: Expense Ledger Section */}
          <div className="lg:col-span-8 flex flex-col gap-space-md">
            {/* Controls & Filters Strip: Aligned All Spends, This Month, Recurring, Categories with Date Selector & Sort */}
            <div className="relative z-30 bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-hairline flex flex-wrap items-center justify-between gap-3">
              {/* Filter Pills & Categories Aligned */}
              <div className="flex items-center flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedTab('all')}
                  className={`h-9 px-3.5 rounded-lg font-label-md text-label-md whitespace-nowrap transition-colors flex items-center ${
                    selectedTab === 'all'
                      ? 'bg-primary text-on-primary font-semibold shadow-sm'
                      : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  All Spends
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTab('month')}
                  className={`h-9 px-3.5 rounded-lg font-label-md text-label-md whitespace-nowrap transition-colors flex items-center ${
                    selectedTab === 'month'
                      ? 'bg-primary text-on-primary font-semibold shadow-sm'
                      : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTab('recurring')}
                  className={`h-9 px-3.5 rounded-lg font-label-md text-label-md whitespace-nowrap transition-colors flex items-center ${
                    selectedTab === 'recurring'
                      ? 'bg-primary text-on-primary font-semibold shadow-sm'
                      : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  Recurring
                </button>

                {/* Categories Dropdown with + Add Category at bottom */}
                <div className="relative inline-block" ref={categoryDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsCategoryMenuOpen((prev) => !prev)}
                    className={`h-9 px-3 rounded-lg font-label-md text-label-md whitespace-nowrap transition-colors flex items-center gap-1 border ${
                      selectedTab === 'cat'
                        ? 'bg-primary text-on-primary border-primary font-semibold shadow-sm'
                        : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface border-surface-container hover:bg-surface-container'
                    }`}
                  >
                    <span>{selectedTab === 'cat' && filterCategory !== 'all' ? filterCategory : 'Categories'}</span>
                    <span className="material-symbols-outlined text-[16px]">
                      {isCategoryMenuOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
                    </span>
                  </button>

                  {isCategoryMenuOpen && (
                    <div className="absolute left-0 top-full mt-1.5 w-60 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-container py-1.5 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-outline flex items-center justify-between">
                        <span>Filter by Category</span>
                        <button
                          type="button"
                          onClick={() => setIsCategoryMenuOpen(false)}
                          className="text-on-surface-variant hover:text-on-surface"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setFilterCategory('all');
                          setSelectedTab('cat');
                          setIsCategoryMenuOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-surface-container-low transition-colors ${
                          selectedTab === 'cat' && filterCategory === 'all'
                            ? 'font-bold text-primary bg-primary/10'
                            : 'text-on-surface'
                        }`}
                      >
                        <span>All Categories</span>
                        {selectedTab === 'cat' && filterCategory === 'all' && (
                          <span className="material-symbols-outlined text-[16px] text-primary">check</span>
                        )}
                      </button>

                      <div className="max-h-52 overflow-y-auto divide-y divide-surface-container/30 my-1">
                        {allCategories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setFilterCategory(cat);
                              setSelectedTab('cat');
                              setIsCategoryMenuOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-surface-container-low transition-colors ${
                              selectedTab === 'cat' && filterCategory === cat
                                ? 'font-bold text-primary bg-primary/10'
                                : 'text-on-surface'
                            }`}
                          >
                            <span className="truncate">{cat}</span>
                            {selectedTab === 'cat' && filterCategory === cat && (
                              <span className="material-symbols-outlined text-[16px] text-primary">check</span>
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Edit Categories button at the bottom of the category list */}
                      <div className="border-t border-surface-container pt-1.5 px-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCategoryMenuOpen(false);
                            setShowEditCatModal(true);
                          }}
                          className="w-full px-2.5 py-2 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-dashed border-primary/40 hover:border-primary"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                          <span>Edit Categories...</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Date Filter & Sort Selector Aligned on the Same Bar */}
              <div className="flex items-center flex-wrap gap-2">
                {/* Date Filter (From Date to Date) */}
                <div className="h-9 flex items-center gap-1.5 bg-surface-container-low px-2.5 rounded-lg border border-surface-container text-xs">
                  <span className="material-symbols-outlined text-primary text-[16px]">date_range</span>
                  <label htmlFor="spend-from-date" className="text-[10px] font-bold uppercase text-outline tracking-wider">
                    From
                  </label>
                  <input
                    id="spend-from-date"
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
                  <label htmlFor="spend-to-date" className="text-[10px] font-bold uppercase text-outline tracking-wider">
                    To
                  </label>
                  <input
                    id="spend-to-date"
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

                {/* Sort Selector */}
                <div className="h-9 flex items-center gap-1 bg-surface-container-low px-2.5 rounded-lg border border-surface-container text-on-surface-variant">
                  <span className="text-[11px] font-medium text-outline">Sort:</span>
                  <select
                    value={selectedSort}
                    onChange={(e: any) => setSelectedSort(e.target.value)}
                    className="text-xs text-on-surface font-semibold bg-transparent cursor-pointer outline-none"
                  >
                    <option value="newest">Newest</option>
                    <option value="highest">Highest</option>
                    <option value="lowest">Lowest</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Ledger List Card */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-hairline overflow-hidden flex flex-col">
              {/* Section Subheader */}
              <div className="px-space-lg py-space-md bg-surface-container-low/50 flex items-center justify-between border-b border-surface-container">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Transactions
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                  {expenseList.length} items
                </span>
              </div>

              {/* Ledger Table Rows */}
              <div className="divide-y divide-surface-container">
                {expenseList.length === 0 ? (
                  <div className="p-space-xl text-center">
                    <span className="material-symbols-outlined text-[36px] text-outline">
                      receipt_long
                    </span>
                    <p className="font-title-sm text-title-sm text-on-surface mt-2 font-semibold">
                      No expenses found
                    </p>
                  </div>
                ) : (
                  expenseList.map((tx) => {
                    const isUnpaidFixedCost = tx.isFixedCost && !tx.isPaid;

                  return (
                    <div
                      key={tx.id}
                      onClick={() => onSelectTransaction(tx)}
                      className={`px-space-lg py-space-md flex items-center justify-between transition-all group cursor-pointer border-l-4 ${
                        isUnpaidFixedCost
                          ? 'border-l-amber-500 bg-amber-500/[0.04] hover:bg-amber-500/[0.08]'
                          : 'border-l-transparent hover:bg-surface-container-low/40'
                      }`}
                    >
                      <div className="flex items-center gap-space-md min-w-0">
                        {tx.isFixedCost && onToggleFixedCost ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFixedCost(tx.fixedCostId || tx.id.replace('fc_', ''), !tx.isPaid);
                            }}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                              tx.isPaid
                                ? 'bg-secondary text-on-secondary shadow-sm scale-105'
                                : 'border-2 border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 shadow-xs'
                            }`}
                            title={tx.isPaid ? 'Settled fixed cost (click to mark unpaid)' : 'Meant to be spent (click checkmark to settle)'}
                          >
                            <span className="material-symbols-outlined text-[20px] font-bold">check</span>
                          </button>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-on-surface flex-shrink-0 group-hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined text-[20px]">
                              {tx.brandIcon || 'receipt_long'}
                            </span>
                          </div>
                        )}

                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-space-sm flex-wrap">
                            <span
                              className={`font-title-sm text-title-sm truncate font-bold ${
                                tx.isFixedCost && tx.isPaid ? 'line-through text-outline' : 'text-on-surface'
                              }`}
                            >
                              {tx.title}
                            </span>
                            <span className="hidden sm:inline-block font-label-sm text-label-sm bg-surface-container px-space-xs rounded text-on-surface-variant">
                              {tx.category}
                            </span>
                            {isUnpaidFixedCost ? (
                              <span className="font-label-sm text-[11px] bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-xs">
                                <span className="material-symbols-outlined text-[13px] animate-pulse">schedule</span>
                                <span>Planned • Not spent yet</span>
                              </span>
                            ) : tx.isFixedCost ? (
                              <span className="font-label-sm text-[11px] bg-secondary/15 text-secondary border border-secondary/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px]">check_circle</span>
                                <span>Settled Fixed Cost</span>
                              </span>
                            ) : (
                              tx.title.toLowerCase().includes('bill') && (
                                <span
                                  className="material-symbols-outlined text-[14px] text-secondary"
                                  title="Auto-debit recurring"
                                >
                                  sync
                                </span>
                              )
                            )}
                          </div>
                          <span
                            className={`font-body-md text-body-md truncate ${
                              isUnpaidFixedCost
                                ? 'text-amber-700 dark:text-amber-400 font-medium'
                                : 'text-on-surface-variant'
                            }`}
                          >
                            {isUnpaidFixedCost
                              ? 'Fixed Cost • Meant to be spent (Tap checkmark to settle)'
                              : tx.notes || `${tx.category} • Settled transaction`}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end flex-shrink-0 pl-space-md">
                        <span
                          className={`font-currency-md text-currency-md font-bold ${
                            isUnpaidFixedCost
                              ? 'text-amber-600 dark:text-amber-400'
                              : tx.isFixedCost && tx.isPaid
                              ? 'text-secondary line-through opacity-80'
                              : 'text-error'
                          }`}
                        >
                          -৳{Math.round(tx.amount).toLocaleString()}
                        </span>
                        {isUnpaidFixedCost ? (
                          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded mt-0.5">
                            Not Spent Yet
                          </span>
                        ) : (
                          <span className="font-label-sm text-label-sm text-on-surface-variant">
                            {new Date(tx.date).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                            })}
                            ,{' '}
                            {new Date(tx.date).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }))}
              </div>

              {/* Bottom Ledger Pagination Footer */}
              <div className="px-space-lg py-space-sm bg-surface-container-low/30 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm border-t border-surface-container">
                <span>Showing all {expenseList.length} recorded expenses</span>
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

          {/* Right 4 Cols: Quick Expense Creation Panel */}
          <div className="lg:col-span-4 flex flex-col gap-space-md sticky top-20">
            <div data-tour="add-expense-btn" className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-hairline flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-title-sm text-title-sm text-on-surface font-bold">
                    Add Expense
                  </h3>
                </div>
                <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface">
                  <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                </div>
              </div>

              <form onSubmit={handleQuickSubmit} className="flex flex-col gap-space-md">
                {/* Amount Input & Quick-fill Pill Selector */}
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                    Amount
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-space-md font-headline-md text-headline-md text-on-surface font-bold">
                      ৳
                    </span>
                    <input
                      type="number"
                      step="1"
                      value={quickAmount}
                      onChange={(e) => setQuickAmount(e.target.value)}
                      required
                      placeholder="0"
                      className="w-full bg-surface-container-low rounded-lg pl-8 pr-space-md py-space-sm font-headline-md text-headline-md text-on-surface outline-none border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-left font-bold"
                    />
                  </div>
                  {/* Quick Amount Chips */}
                  <div className="grid grid-cols-4 gap-space-xs mt-space-xs">
                    {['10', '25', '50', '100'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setQuickAmount(val)}
                        className={`py-1 px-space-xs font-label-md text-label-md rounded text-center transition-colors border border-surface-container ${
                          quickAmount === val
                            ? 'bg-surface-container text-on-surface font-bold'
                            : 'bg-surface-container-low hover:bg-surface-container text-on-surface font-medium'
                        }`}
                      >
                        ৳{val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Expense Name / Merchant */}
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                    Title / Merchant
                  </label>
                  <input
                    type="text"
                    required
                    value={merchantTitle}
                    onChange={(e) => setMerchantTitle(e.target.value)}
                    placeholder="e.g. Groceries, Shopping, Coffee"
                    className="w-full bg-surface-container-low rounded-lg px-space-md py-space-sm font-body-md text-body-md text-on-surface outline-none border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Category Selector Dropdown with Edit Categories Option */}
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        if (e.target.value === '__edit_categories__') {
                          setShowEditCatModal(true);
                        } else {
                          setSelectedCategory(e.target.value);
                        }
                      }}
                      className="w-full bg-surface-container-low rounded-lg px-space-md py-space-sm font-body-md text-body-md text-on-surface outline-none border border-transparent focus:border-primary appearance-none cursor-pointer focus:ring-2 focus:ring-primary/20"
                    >
                      {allCategories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="__edit_categories__" className="text-primary font-bold">
                        ✏️ Edit Categories...
                      </option>
                    </select>
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute right-space-md top-1/2 -translate-y-1/2 pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 bg-primary text-on-primary rounded-lg font-title-sm text-title-sm flex items-center justify-center gap-space-xs shadow hover:bg-primary-container transition-all active:scale-[0.99] disabled:opacity-50 mt-space-xs font-semibold"
                >
                  <span className="material-symbols-outlined text-[20px]">add_circle</span>
                  <span>{isSubmitting ? 'Recording Expense...' : '+ Record Expense'}</span>
                </button>
              </form>
            </div>

            {/* Fixed Cost Section with Checkmarks */}
            <FixedCostsCard
              fixedCosts={fixedCosts && fixedCosts.length > 0 ? fixedCosts : summary.fixedCosts || []}
              onToggle={onToggleFixedCost || (async () => {})}
              onAdd={onAddFixedCost}
              onDelete={onDeleteFixedCost}
              variant="spend"
            />
          </div>
        </div>

        {/* Edit / Manage Categories Dialog Modal */}
        {showEditCatModal && (
          <div className="modal-overlay">
            <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-6 shadow-2xl border border-surface-container flex flex-col gap-4 max-h-[85vh]">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">category</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-on-surface">Manage Categories</h3>
                    <p className="text-xs text-outline">Add new categories or delete existing ones</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditCatModal(false);
                    setNewCatName('');
                  }}
                  className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Add New Category Section */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Add New Category
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Subscriptions, Groceries, Gym"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newCatName.trim()) handleCreateCategory(newCatName);
                      }
                    }}
                    className="flex-1 bg-surface-container-low rounded-lg px-3 py-2 text-sm text-on-surface outline-none border border-surface-container focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    disabled={!newCatName.trim()}
                    onClick={() => handleCreateCategory(newCatName)}
                    className="h-9 px-4 rounded-lg bg-primary text-xs font-semibold text-on-primary hover:bg-primary-container transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Existing Categories List */}
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Active Categories ({allCategories.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleResetCategories}
                    className="text-[11px] font-medium text-outline hover:text-primary transition-colors underline"
                  >
                    Reset Defaults
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-surface-container/50 border border-surface-container rounded-xl bg-surface-container-low/40 p-1">
                  {allCategories.map((cat) => (
                    <div
                      key={cat}
                      className="flex items-center justify-between px-3 py-2.5 hover:bg-surface-container-low rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-primary">label</span>
                        <span className="text-xs font-medium text-on-surface">{cat}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(cat)}
                        title={`Delete ${cat}`}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-outline hover:text-error hover:bg-error/10 transition-colors opacity-80 group-hover:opacity-100"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end pt-2 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditCatModal(false);
                    setNewCatName('');
                  }}
                  className="px-5 py-2 rounded-lg bg-primary text-xs font-bold text-on-primary hover:bg-primary-container transition-colors shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

