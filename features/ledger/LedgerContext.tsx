'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { DashboardSummary, Transaction, UserProfile } from '@/lib/types';

interface LedgerContextType {
  summary: DashboardSummary | null;
  activeSummary: DashboardSummary | null;
  transactions: Transaction[];
  filteredTransactions: Transaction[];
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
  isMobileDeviceView: boolean;
  setIsMobileDeviceView: (val: boolean) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const LedgerContext = createContext<LedgerContextType | null>(null);

export function LedgerProvider({ children }: { children: React.ReactNode }) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
  const [isMobileDeviceView, setIsMobileDeviceView] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3500);
  }, []);

  const setDateRange = useCallback((start: string, end: string) => {
    const today = new Date().toISOString().split('T')[0];
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
      const [dashRes, txRes] = await Promise.all([
        fetch('/api/v1/dashboard', { cache: 'no-store' }),
        fetch('/api/v1/transactions?limit=100', { cache: 'no-store' }),
      ]);

      if (dashRes.ok) {
        const dashJson = await dashRes.json();
        if (dashJson.success && dashJson.data) {
          setSummary(dashJson.data);
        }
      }

      if (txRes.ok) {
        const txJson = await txRes.json();
        if (txJson.success && txJson.data) {
          setTransactions(txJson.data);
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

  // Viewport resize detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobileDeviceView(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filtered transactions based on date range
  const filteredTransactions = useMemo(() => {
    if (!startDate && !endDate) return transactions;
    return transactions.filter((tx) => {
      const txDate = tx.date.split('T')[0];
      if (startDate && txDate < startDate) return false;
      if (endDate && txDate > endDate) return false;
      return true;
    });
  }, [transactions, startDate, endDate]);

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

  const defaultUser: UserProfile = summary?.user || {
    id: 'usr_atiqur_01',
    name: 'Atiqur',
    email: 'atiqur@hishabrakhi.com',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAGbe-PGr5FQv2oeTce8zWB0Rhh8gLQWtLLOSGRW2FKp1bwXwnCcWU0lR4hMV1MdQAaBamQvkWdPLbeuAnN8DD4HJCgzggnnEgNT5GyNl0LO7KqelGlysdZnh2Wa4FHMx4Inu5VyOMi4blUPrrWF20O4qENbQag0AkgsI7Pdqj3uY6cmXxnX5n3StoThWFweCLXBa5-clEAH9HP9JYdRKIjuRmcA9OwnNSCUYgg6S0m',
    plan: 'Premium Plan',
    currency: 'BDT',
    currencySymbol: '৳',
  };

  return (
    <LedgerContext.Provider
      value={{
        summary,
        activeSummary,
        transactions,
        filteredTransactions,
        loading,
        user: defaultUser,
        startDate,
        endDate,
        setDateRange,
        resetDateRange,
        fetchData,
        handleAddInflow,
        handleAddExpense,
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

