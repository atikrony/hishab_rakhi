'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { DashboardSummary, Transaction, UserProfile, FixedCost } from '@/lib/types';

interface LedgerContextType {
  summary: DashboardSummary | null;
  activeSummary: DashboardSummary | null;
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  fixedCosts: FixedCost[];
  loading: boolean;
  user: UserProfile;
  startDate: string;
  endDate: string;
  setDateRange: (start: string, end: string) => void;
  resetDateRange: () => void;
  fetchData: () => Promise<void>;
  handleAddInflow: (data: {
    title: string;
    amount: number;
    category: string;
    date: string;
    walletId: string;
    notes?: string;
    sourceStream?: string;
  }) => Promise<void>;
  handleAddExpense: (data: {
    title: string;
    amount: number;
    category: string;
    date: string;
    walletId: string;
    notes?: string;
    paymentMethod?: string;
  }) => Promise<void>;
  handleAddFixedCost: (data: {
    title: string;
    amount: number;
    category: string;
    dueDay?: number;
    notes?: string;
  }) => Promise<void>;
  handleToggleFixedCost: (id: string, isPaid: boolean, month?: string) => Promise<void>;
  handleDeleteFixedCost: (id: string) => Promise<void>;
  handleDeleteTransaction: (id: string) => Promise<void>;
  handleUpdateTransaction: (id: string, updates: Partial<Transaction>) => Promise<boolean>;
  handleResetDb: () => Promise<void>;
  handleLogout: () => Promise<void>;
  selectedTx: Transaction | null;
  setSelectedTx: (tx: Transaction | null) => void;
  isInflowModalOpen: boolean;
  setIsInflowModalOpen: (open: boolean) => void;
  isExpenseModalOpen: boolean;
  setIsExpenseModalOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  /** null until the viewport has been measured on the client */
  isMobileDeviceView: boolean | null;
  setIsMobileDeviceView: (val: boolean) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const LedgerContext = createContext<LedgerContextType | null>(null);

export function LedgerProvider({ children }: { children: React.ReactNode }) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [loading, setLoading] = useState(true);

  // Date Range filter states
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modals state
  const [isInflowModalOpen, setIsInflowModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Device view preview
  // null until measured on the client, so phones never flash the desktop layout
  const [isMobileDeviceView, setIsMobileDeviceView] = useState<boolean | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3500);
  }, []);

  const setDateRange = useCallback((start: string, end: string) => {
    const n = new Date();
    const today = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
    let safeStart = start;
    let safeEnd = end;
    if (safeStart && safeStart > today) safeStart = today;
    if (safeEnd && safeEnd > today) safeEnd = today;
    if (safeStart && safeEnd && safeStart > safeEnd) {
      safeEnd = safeStart;
    }
    setStartDate(safeStart);
    setEndDate(safeEnd);
  }, []);

  const resetDateRange = useCallback(() => {
    setStartDate('');
    setEndDate('');
  }, []);

  // Fetch live database records
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashRes, txRes, fcRes] = await Promise.all([
        fetch('/api/v1/dashboard', { cache: 'no-store' }),
        fetch('/api/v1/transactions?limit=100', { cache: 'no-store' }),
        fetch('/api/v1/fixed-costs', { cache: 'no-store' }),
      ]);

      if (dashRes.status === 401 || txRes.status === 401) {
        // Unauthenticated or expired session
        setLoading(false);
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
          window.location.href = '/auth/login';
        }
        return;
      }

      if (dashRes.ok) {
        const dashJson = await dashRes.json();
        if (dashJson.success && dashJson.data) {
          setSummary(dashJson.data);
          if (dashJson.data.fixedCosts && Array.isArray(dashJson.data.fixedCosts)) {
            setFixedCosts(dashJson.data.fixedCosts);
          }
        }
      }

      if (txRes.ok) {
        const txJson = await txRes.json();
        if (txJson.success && txJson.data) {
          const sorted = [...txJson.data].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setTransactions(sorted);
        }
      }

      if (fcRes.ok) {
        const fcJson = await fcRes.json();
        if (fcJson.success && fcJson.data?.items) {
          setFixedCosts(fcJson.data.items);
        } else if (fcJson.success && Array.isArray(fcJson.data)) {
          setFixedCosts(fcJson.data);
        }
      }
    } catch (err) {
      console.error('Failed to load database data:', err);
      showToast('Error syncing with database');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const pathname = usePathname();
  const safePath = pathname || '';
  const isAuthOrOnboarding = safePath.startsWith('/auth') || safePath.startsWith('/onboarding');

  useEffect(() => {
    if (isAuthOrOnboarding) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [fetchData, isAuthOrOnboarding]);

  // Viewport breakpoint detection (fires only when crossing 1024px, not on every resize)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023.98px)');
    const update = () => setIsMobileDeviceView(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Synthesize fixed cost expenses for the active monthly cycle
  const currentMonthKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const fixedCostTransactions: Transaction[] = useMemo(() => {
    return fixedCosts.map((fc) => {
      const isPaid = (fc.paidMonths || []).includes(currentMonthKey);
      const day = fc.dueDay ? String(Math.min(28, fc.dueDay)).padStart(2, '0') : '01';
      const dateStr = `${currentMonthKey}-${day}T09:00:00Z`;
      return {
        id: `fc_${fc.id}`,
        fixedCostId: fc.id,
        isFixedCost: true,
        isPaid,
        title: fc.title,
        amount: Number(fc.amount) || 0,
        type: 'expense' as const,
        category: fc.category || 'Bills & Utilities',
        date: fc.createdAt && fc.createdAt.startsWith(currentMonthKey) ? fc.createdAt : dateStr,
        status: isPaid ? 'Settled' : 'Pending',
        brandIcon: 'event_repeat',
        notes: isPaid ? 'Monthly Fixed Cost • Paid' : 'Monthly Fixed Cost • Planned (Not spent yet)',
      };
    });
  }, [fixedCosts, currentMonthKey]);

  // Combined transactions including active monthly cycle fixed costs
  const combinedTransactions = useMemo(() => {
    return [...fixedCostTransactions, ...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [fixedCostTransactions, transactions]);

  // Filtered transactions based on date range, guaranteed sorted by date descending
  const filteredTransactions = useMemo(() => {
    let list = combinedTransactions;
    if (startDate || endDate) {
      list = combinedTransactions.filter((tx) => {
        const txDate = tx.date.split('T')[0];
        if (startDate && txDate < startDate) return false;
        if (endDate && txDate > endDate) return false;
        return true;
      });
    }
    return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [combinedTransactions, startDate, endDate]);

  // Recalibrated summary based on filtered transactions
  const effectiveSummary = useMemo(() => {
    if (!summary) return null;
    if (!startDate && !endDate) return summary;

    const totalInflow = filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netRemaining = totalInflow - totalExpense;
    const retainedPercent =
      totalInflow > 0 ? Math.max(0, Math.round((netRemaining / totalInflow) * 100)) : 0;
    const activeChannels = new Set(
      filteredTransactions
        .filter((t) => t.type === 'income')
        .map((t) => t.category || t.sourceStream || 'Other')
    ).size;

    const catMap: Record<string, { amount: number; count: number }> = {};
    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        if (!catMap[t.category]) catMap[t.category] = { amount: 0, count: 0 };
        catMap[t.category].amount += t.amount;
        catMap[t.category].count += 1;
      });

    const categoryBreakdown = Object.entries(catMap).map(([category, info]) => ({
      category,
      amount: info.amount,
      percentage: totalExpense > 0 ? Math.round((info.amount / totalExpense) * 100) : 0,
      count: info.count,
    }));

    return {
      ...summary,
      totalInflow,
      totalExpense,
      netRemaining,
      retainedPercent,
      activeChannelsCount: activeChannels,
      categoryBreakdown:
        categoryBreakdown.length > 0 ? categoryBreakdown : summary.categoryBreakdown,
      recentTransactions: filteredTransactions.slice(0, 15),
    };
  }, [summary, filteredTransactions, startDate, endDate]);

  const activeSummary = effectiveSummary || summary;

  // Add Inflow
  const handleAddInflow = async (data: {
    title: string;
    amount: number;
    category: string;
    date: string;
    walletId: string;
    notes?: string;
    sourceStream?: string;
  }) => {
    try {
      const res = await fetch('/api/v1/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          type: 'income',
          status: 'Completed',
          channel: data.notes || `${data.category} Wire Clearance`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`+৳${Math.round(data.amount).toLocaleString()} inbound wire recorded`);
        await fetchData();
      } else {
        showToast(json.error || 'Failed to save income');
      }
    } catch (err) {
      showToast('Network error saving income');
    }
  };

  // Add Expense
  const handleAddExpense = async (data: {
    title: string;
    amount: number;
    category: string;
    date: string;
    walletId: string;
    notes?: string;
    paymentMethod?: string;
  }) => {
    try {
      const res = await fetch('/api/v1/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          type: 'expense',
          status: 'Completed',
          paymentMethod: data.paymentMethod || 'Apple Pay',
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`-৳${Math.round(data.amount).toLocaleString()} debited from pocket`);
        await fetchData();
      } else {
        showToast(json.error || 'Failed to record expense');
      }
    } catch (err) {
      showToast('Network error saving expense');
    }
  };

  // Delete Transaction
  const handleDeleteTransaction = async (id: string) => {
    try {
      if (id.startsWith('fc_')) {
        const fcId = id.replace('fc_', '');
        await handleDeleteFixedCost(fcId);
        return;
      }
      const res = await fetch(`/api/v1/transactions/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        showToast('Transaction removed from ledger');
        await fetchData();
      } else {
        showToast(json.error || 'Failed to delete');
      }
    } catch (err) {
      showToast('Network error deleting record');
    }
  };

  // Update Transaction
  const handleUpdateTransaction = async (
    id: string,
    updates: Partial<Transaction>
  ): Promise<boolean> => {
    try {
      if (id.startsWith('fc_')) {
        const fcId = id.replace('fc_', '');
        const res = await fetch(`/api/v1/fixed-costs/${fcId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        const json = await res.json();
        if (json.success) {
          showToast('Fixed cost updated');
          await fetchData();
          return true;
        }
        showToast(json.error || 'Failed to update fixed cost');
        return false;
      }
      const res = await fetch(`/api/v1/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Expense updated successfully');
        await fetchData();
        if (selectedTx && selectedTx.id === id) {
          setSelectedTx(json.data);
        }
        return true;
      } else {
        showToast(json.error || 'Failed to update expense');
        return false;
      }
    } catch (err) {
      showToast('Network error updating expense');
      return false;
    }
  };

  // Fixed Costs Handlers
  const handleAddFixedCost = async (data: {
    title: string;
    amount: number;
    category: string;
    dueDay?: number;
    notes?: string;
  }) => {
    try {
      const res = await fetch('/api/v1/fixed-costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Fixed cost "${data.title}" added`);
        await fetchData();
      } else {
        showToast(json.error || 'Failed to add fixed cost');
      }
    } catch (err) {
      showToast('Network error adding fixed cost');
    }
  };

  const handleToggleFixedCost = async (id: string, isPaid: boolean, month?: string) => {
    try {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const targetMonth = month || currentMonth;

      // Optimistic state update
      setFixedCosts((prev) =>
        prev.map((fc) => {
          if (fc.id !== id) return fc;
          const months = new Set(fc.paidMonths || []);
          if (isPaid) {
            months.add(targetMonth);
          } else {
            months.delete(targetMonth);
          }
          return { ...fc, paidMonths: Array.from(months) };
        })
      );

      const res = await fetch(`/api/v1/fixed-costs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaid, month: targetMonth }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(isPaid ? 'Marked as settled this month' : 'Marked as pending');
        await fetchData();
      } else {
        showToast(json.error || 'Failed to update fixed cost');
        await fetchData();
      }
    } catch (err) {
      showToast('Network error updating fixed cost status');
      await fetchData();
    }
  };

  const handleDeleteFixedCost = async (id: string) => {
    try {
      setFixedCosts((prev) => prev.filter((fc) => fc.id !== id));
      const res = await fetch(`/api/v1/fixed-costs/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        showToast('Fixed cost removed');
        await fetchData();
      } else {
        showToast(json.error || 'Failed to delete fixed cost');
        await fetchData();
      }
    } catch (err) {
      showToast('Network error deleting fixed cost');
      await fetchData();
    }
  };

  // Reset Database
  const handleResetDb = async () => {
    try {
      const res = await fetch('/api/v1/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      if (res.ok) {
        showToast('Database reset to clean state');
        await fetchData();
      }
    } catch (err) {
      showToast('Error resetting database');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/auth/login';
    }
  };

  const rawUser = summary?.user;
  const resolvedName = useMemo(() => {
    if (!rawUser) return 'Account Holder';
    if (rawUser.name && !rawUser.name.toLowerCase().startsWith('usr_') && rawUser.name !== 'Solo User' && rawUser.name !== 'Not set') {
      return rawUser.name;
    }
    if (rawUser.email) {
      const prefix = rawUser.email.split('@')[0] || '';
      return prefix
        .replace(/[._-]+/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ') || prefix;
    }
    return 'Account Holder';
  }, [rawUser]);

  const defaultUser: UserProfile = {
    id: rawUser?.id || '',
    name: resolvedName,
    email: rawUser?.email || '',
    avatar: rawUser?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(resolvedName)}`,
    plan: rawUser?.plan || 'Solo Ledger',
    currency: rawUser?.currency || 'BDT',
    currencySymbol: rawUser?.currencySymbol || '৳',
    occupation: rawUser?.occupation,
    monthlyIncome: rawUser?.monthlyIncome,
    salaryDate: rawUser?.salaryDate,
    lastExpense: rawUser?.lastExpense,
  };

  return (
    <LedgerContext.Provider
      value={{
        summary,
        activeSummary,
        transactions: combinedTransactions,
        filteredTransactions,
        fixedCosts,
        loading,
        user: defaultUser,
        startDate,
        endDate,
        setDateRange,
        resetDateRange,
        fetchData,
        handleAddInflow,
        handleAddExpense,
        handleAddFixedCost,
        handleToggleFixedCost,
        handleDeleteFixedCost,
        handleDeleteTransaction,
        handleUpdateTransaction,
        handleResetDb,
        handleLogout,
        selectedTx,
        setSelectedTx,
        isInflowModalOpen,
        setIsInflowModalOpen,
        isExpenseModalOpen,
        setIsExpenseModalOpen,
        isSettingsOpen,
        setIsSettingsOpen,
        isMobileDeviceView,
        setIsMobileDeviceView,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </LedgerContext.Provider>
  );
}

export function useLedger() {
  const context = useContext(LedgerContext);
  if (!context) {
    throw new Error('useLedger must be used within a LedgerProvider');
  }
  return context;
}

