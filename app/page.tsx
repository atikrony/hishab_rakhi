'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UserProfile,
  Transaction,
  SavingsGoal,
  WalletAccount,
  NotificationItem,
  DashboardSummary,
} from '@/lib/types';
import { TopBar } from '@/components/TopBar';
import { BalanceCard } from '@/components/BalanceCard';
import { ActionButtons } from '@/components/ActionButtons';
import { SavingsSection } from '@/components/SavingsSection';
import { RecentActivitySection } from '@/components/RecentActivitySection';
import { FloatingScanButton } from '@/components/FloatingScanButton';
import { BottomNav, NavTab } from '@/components/BottomNav';
import { WalletView } from '@/components/WalletView';
import { AnalyticsView } from '@/components/AnalyticsView';
import { StatisticsView } from '@/components/StatisticsView';
import { ProfileView } from '@/components/ProfileView';
import { Toast } from '@/components/Toast';

// Modals
import { AddTransactionModal } from '@/components/modals/AddTransactionModal';
import { AddSavingsModal } from '@/components/modals/AddSavingsModal';
import { ScanReceiptModal } from '@/components/modals/ScanReceiptModal';
import { NotificationsModal } from '@/components/modals/NotificationsModal';
import { CalendarModal } from '@/components/modals/CalendarModal';
import { SeeAllTransactionsModal } from '@/components/modals/SeeAllTransactionsModal';
import { SeeAllSavingsModal } from '@/components/modals/SeeAllSavingsModal';
import { TransactionDetailModal } from '@/components/modals/TransactionDetailModal';
import { TransferFundsModal } from '@/components/modals/TransferFundsModal';
import { DepositGoalModal } from '@/components/modals/DepositGoalModal';
import { AddWalletModal } from '@/components/modals/AddWalletModal';

export default function HomePage() {
  // Main Data States
  const [user, setUser] = useState<UserProfile>({
    id: 'usr_naufal_01',
    name: 'Naufal',
    email: 'naufal@example.com',
    avatar:
      'data:image/jpeg;base64,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',
    currency: 'USD',
    currencySymbol: '$',
  });

  const [totalBalance, setTotalBalance] = useState(12129.91);
  const [monthlyIncome, setMonthlyIncome] = useState(7129.91);
  const [monthlyExpense, setMonthlyExpense] = useState(5129.91);
  const [incomeTrend, setIncomeTrend] = useState(3.1);
  const [expenseTrend, setExpenseTrend] = useState(4.2);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [wallets, setWallets] = useState<WalletAccount[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<NavTab>('Home');
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [selectedDateText, setSelectedDateText] = useState('Tue 3 Jun, 2025');
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(false);

  // Modals
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isAddSavingOpen, setIsAddSavingOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isSeeAllTxOpen, setIsSeeAllTxOpen] = useState(false);
  const [isSeeAllSavingsOpen, setIsSeeAllSavingsOpen] = useState(false);
  const [selectedTxDetail, setSelectedTxDetail] = useState<Transaction | null>(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false);
  const [depositTargetGoal, setDepositTargetGoal] = useState<SavingsGoal | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTimer, setToastTimer] = useState<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimer) clearTimeout(toastTimer);
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 2200);
    setToastTimer(timer);
  };

  // Fetch initial dashboard from API
  const refreshData = async () => {
    try {
      const res = await fetch('/api/v1/dashboard');
      const json = await res.json();
      if (json.success && json.data) {
        const d: DashboardSummary = json.data;
        setUser(d.user);
        setTotalBalance(d.totalBalance);
        setMonthlyIncome(d.monthlyIncome);
        setMonthlyExpense(d.monthlyExpense);
        setIncomeTrend(d.incomeTrend);
        setExpenseTrend(d.expenseTrend);
        setSavingsGoals(d.savingsGoals);
        setTransactions(d.recentTransactions);
        setWallets(d.wallets);
      }

      const notifRes = await fetch('/api/v1/notifications');
      const notifJson = await notifRes.json();
      if (notifJson.success) {
        setNotifications(notifJson.data);
      }
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Handlers
  const handleToggleBalance = () => {
    setIsBalanceVisible((prev) => !prev);
  };

  const handleNavClick = (tab: NavTab) => {
    setActiveTab(tab);
    if (tab !== 'Home') {
      showToast(`${tab} selected`);
    }
  };

  const handleCreateTransaction = async (newTxData: any) => {
    const res = await fetch('/api/v1/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTxData),
    });
    const json = await res.json();
    if (json.success) {
      showToast(`Transaction added: ${json.data.title}`);
      refreshData();
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const res = await fetch(`/api/v1/transactions/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      showToast('Transaction deleted');
      refreshData();
    }
  };

  const handleCreateSavingsGoal = async (newGoalData: any) => {
    const res = await fetch('/api/v1/savings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGoalData),
    });
    const json = await res.json();
    if (json.success) {
      showToast(`Savings goal created: ${json.data.title}`);
      refreshData();
    }
  };

  const handleDeleteSavingsGoal = async (id: string) => {
    const res = await fetch(`/api/v1/savings/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      showToast('Savings goal removed');
      refreshData();
    }
  };

  const handleUpdateProfile = async (updated: Partial<UserProfile>) => {
    const res = await fetch('/api/v1/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    const json = await res.json();
    if (json.success) {
      setUser(json.data);
    }
  };

  const handleResetData = async () => {
    const res = await fetch('/api/v1/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset' }),
    });
    const json = await res.json();
    if (json.success) {
      showToast('Database reset to original prototype data');
      refreshData();
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex flex-col justify-between">
      {/* Desktop Top Control Bar */}
      <div className="hidden sm:flex items-center justify-between px-6 py-2.5 bg-white border-b border-[#e9e9ec] shadow-sm text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-[#17191d] flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#079be8]"></span>
            Hishab Rakhi
          </span>
          <span className="text-[#888]">Fintech Wallet & Expense Engine</span>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#f4f5f7] p-1 rounded-xl">
            <button
              onClick={() => setIsDesktopExpanded(false)}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                !isDesktopExpanded ? 'bg-white text-[#079be8] shadow-sm' : 'text-[#666]'
              }`}
            >
              📱 Mobile App View
            </button>
            <button
              onClick={() => setIsDesktopExpanded(true)}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                isDesktopExpanded ? 'bg-white text-[#079be8] shadow-sm' : 'text-[#666]'
              }`}
            >
              💻 Responsive Wide View
            </button>
          </div>

          <Link
            href="/api-docs"
            className="px-3 py-1.5 rounded-xl border border-[#079be8]/40 bg-[#f0f8ff] text-[#079be8] font-bold hover:bg-[#e0f1fe] transition-colors"
          >
            ⚡ Mobile API Hub &rarr;
          </Link>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex justify-center items-start sm:py-6 sm:px-4">
        <main
          className={`w-full bg-white relative transition-all duration-300 ${
            isDesktopExpanded
              ? 'max-w-4xl rounded-[28px] p-6 pb-[110px] shadow-[0_0_35px_rgba(16,24,40,0.06)] min-h-[85vh]'
              : 'max-w-[430px] min-h-screen sm:min-h-[calc(100vh-48px)] sm:rounded-[28px] p-[12px_6px_105px] shadow-[0_0_35px_#1018280a] overflow-hidden'
          }`}
        >
          {/* Common Topbar */}
          <TopBar
            user={user}
            notifications={notifications}
            selectedDateText={selectedDateText}
            onOpenNotifications={() => setIsNotifOpen(true)}
            onOpenCalendar={() => setIsCalendarOpen(true)}
            onOpenProfile={() => setActiveTab('Profile')}
          />

          {/* Tab 1: Home Dashboard */}
          {activeTab === 'Home' && (
            <div className="animate-fade-in space-y-4">
              <BalanceCard
                totalBalance={totalBalance}
                monthlyIncome={monthlyIncome}
                monthlyExpense={monthlyExpense}
                incomeTrend={incomeTrend}
                expenseTrend={expenseTrend}
                currencySymbol={user.currencySymbol || '$'}
                isBalanceVisible={isBalanceVisible}
                onToggleBalance={handleToggleBalance}
                onOpenAnalytics={() => setActiveTab('Analytics')}
              />

              <ActionButtons
                onAddTransaction={() => setIsAddTxOpen(true)}
                onAddSaving={() => setIsAddSavingOpen(true)}
              />

              <SavingsSection
                goals={savingsGoals}
                currencySymbol={user.currencySymbol || '$'}
                onSeeAll={() => setIsSeeAllSavingsOpen(true)}
                onDeposit={(g) => setDepositTargetGoal(g)}
              />

              <RecentActivitySection
                transactions={transactions}
                currencySymbol={user.currencySymbol || '$'}
                onSeeAll={() => setIsSeeAllTxOpen(true)}
                onSelectTransaction={(tx) => setSelectedTxDetail(tx)}
              />
            </div>
          )}

          {/* Tab 2: Wallet */}
          {activeTab === 'Wallet' && (
            <WalletView
              wallets={wallets}
              currencySymbol={user.currencySymbol || '$'}
              onAddWallet={() => setIsAddWalletOpen(true)}
              onTransfer={() => setIsTransferOpen(true)}
            />
          )}

          {/* Tab 3: Analytics */}
          {activeTab === 'Analytics' && (
            <AnalyticsView
              transactions={transactions}
              currencySymbol={user.currencySymbol || '$'}
            />
          )}

          {/* Tab 4: Statistics */}
          {activeTab === 'Statistics' && (
            <StatisticsView currencySymbol={user.currencySymbol || '$'} />
          )}

          {/* Tab 5: Profile */}
          {activeTab === 'Profile' && (
            <ProfileView
              user={user}
              transactions={transactions}
              onUpdateProfile={handleUpdateProfile}
              onResetData={handleResetData}
              onToast={showToast}
            />
          )}

          {/* Floating Scan Button (shown on Home tab or across tabs) */}
          <FloatingScanButton
            onScanClick={() => {
              showToast('Scan feature selected');
              setIsScanOpen(true);
            }}
          />

          {/* Floating Bottom Nav */}
          <BottomNav activeTab={activeTab} onTabChange={handleNavClick} />

          {/* Toast Notification */}
          <Toast message={toastMessage} />
        </main>
      </div>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddTxOpen}
        wallets={wallets}
        currencySymbol={user.currencySymbol || '$'}
        onClose={() => setIsAddTxOpen(false)}
        onSubmit={handleCreateTransaction}
      />

      <AddSavingsModal
        isOpen={isAddSavingOpen}
        currencySymbol={user.currencySymbol || '$'}
        onClose={() => setIsAddSavingOpen(false)}
        onSubmit={handleCreateSavingsGoal}
      />

      <ScanReceiptModal
        isOpen={isScanOpen}
        currencySymbol={user.currencySymbol || '$'}
        onClose={() => setIsScanOpen(false)}
        onTransactionAdded={(tx) => refreshData()}
        onToast={showToast}
      />

      <NotificationsModal
        isOpen={isNotifOpen}
        notifications={notifications}
        onClose={() => setIsNotifOpen(false)}
        onMarkAllRead={async () => {
          await fetch('/api/v1/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'mark_all_read' }),
          });
          refreshData();
          showToast('All notifications marked as read');
        }}
        onClearAll={async () => {
          await fetch('/api/v1/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'clear_all' }),
          });
          refreshData();
          showToast('Notifications cleared');
        }}
      />

      <CalendarModal
        isOpen={isCalendarOpen}
        selectedDate={selectedDateText}
        onClose={() => setIsCalendarOpen(false)}
        onSelectDate={(newDate) => {
          setSelectedDateText(newDate);
          showToast(`Filtered date: ${newDate}`);
        }}
      />

      <SeeAllTransactionsModal
        isOpen={isSeeAllTxOpen}
        transactions={transactions}
        currencySymbol={user.currencySymbol || '$'}
        onClose={() => setIsSeeAllTxOpen(false)}
        onSelectTransaction={(tx) => setSelectedTxDetail(tx)}
      />

      <SeeAllSavingsModal
        isOpen={isSeeAllSavingsOpen}
        goals={savingsGoals}
        currencySymbol={user.currencySymbol || '$'}
        onClose={() => setIsSeeAllSavingsOpen(false)}
        onAddNewGoal={() => setIsAddSavingOpen(true)}
        onDeposit={(g) => setDepositTargetGoal(g)}
        onDeleteGoal={handleDeleteSavingsGoal}
      />

      <TransactionDetailModal
        transaction={selectedTxDetail}
        currencySymbol={user.currencySymbol || '$'}
        onClose={() => setSelectedTxDetail(null)}
        onDelete={handleDeleteTransaction}
      />

      <TransferFundsModal
        isOpen={isTransferOpen}
        wallets={wallets}
        currencySymbol={user.currencySymbol || '$'}
        onClose={() => setIsTransferOpen(false)}
        onTransferSuccess={refreshData}
        onToast={showToast}
      />

      <DepositGoalModal
        goal={depositTargetGoal}
        wallets={wallets}
        currencySymbol={user.currencySymbol || '$'}
        onClose={() => setDepositTargetGoal(null)}
        onDepositSuccess={refreshData}
        onToast={showToast}
      />

      <AddWalletModal
        isOpen={isAddWalletOpen}
        currencySymbol={user.currencySymbol || '$'}
        onClose={() => setIsAddWalletOpen(false)}
        onSuccess={refreshData}
        onToast={showToast}
      />
    </div>
  );
}
