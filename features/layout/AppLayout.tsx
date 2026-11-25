'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useLedger } from '@/features/ledger/LedgerContext';
import { HishabSidebar } from './HishabSidebar';
import { MobileTopBar } from './MobileTopBar';
import { AddInflowModal } from '@/components/fold/AddInflowModal';
import { AddExpenseModal } from '@/components/fold/AddExpenseModal';
import { TransactionDetailModal } from '@/components/fold/TransactionDetailModal';
import { SettingsModal } from '@/components/fold/SettingsModal';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const safePath = pathname || '';
  const isAuthOrOnboarding = safePath.startsWith('/auth') || safePath.startsWith('/onboarding');

  const {
    summary,
    loading,
    user,
    isMobileDeviceView,
    isInflowModalOpen,
    setIsInflowModalOpen,
    isExpenseModalOpen,
    setIsExpenseModalOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    selectedTx,
    setSelectedTx,
    toastMessage,
    handleAddInflow,
    handleAddExpense,
    handleDeleteTransaction,
    handleUpdateTransaction,
    handleResetDb,
    handleLogout,
  } = useLedger();

  // If on auth or onboarding page, render children directly without app frame
  if (isAuthOrOnboarding) {
    return <>{children}</>;
  }

  if ((loading && !summary) || isMobileDeviceView === null) {
    return (
      <div className="min-h-[100dvh] bg-primary-container flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center font-bold text-xl shadow-xl animate-pulse">
          HR
        </div>
        <div className="mt-4 font-headline-md text-headline-md font-bold tracking-tight">
          Hishab Rakhi
        </div>
        <div className="font-label-md text-label-md text-white/60 mt-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-ping" />
          <span>Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col antialiased">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div role="status" aria-live="polite" className="fixed z-50 left-4 right-4 top-[calc(1rem+env(safe-area-inset-top))] mx-auto max-w-sm lg:left-auto lg:right-6 lg:top-6 lg:mx-0 bg-primary-container text-on-primary px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-secondary/30 animate-fadeIn">
          <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse" />
          <span className="font-label-md text-label-md font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* AUTOMATIC RESPONSIVE LAYOUT */}
      {isMobileDeviceView ? (
        /* Mobile Layout: Full-width responsive phone canvas */
        <div className="w-full min-h-screen bg-surface flex flex-col">
          <MobileTopBar />
          {children}
        </div>
      ) : (
        /* Desktop Layout: Persistent sidebar with widescreen canvas */
        <div className="flex w-full min-h-screen bg-surface">
          <HishabSidebar />
          <div className="ml-64 w-[calc(100%-16rem)] flex-1 min-w-0 min-h-screen flex flex-col bg-surface">
            <main className="relative bg-surface min-h-screen flex-1">
              {children}
            </main>
          </div>
        </div>
      )}

      {/* Inflow Money Modal */}
      <AddInflowModal
        isOpen={isInflowModalOpen}
        onClose={() => setIsInflowModalOpen(false)}
        onSubmit={handleAddInflow}
      />

      {/* Expense Modal */}
      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSubmit={handleAddExpense}
      />

      {/* Transaction Inspection Receipt Modal */}
      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
        onDelete={handleDeleteTransaction}
        onUpdate={handleUpdateTransaction}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        onResetDb={handleResetDb}
        onLogout={handleLogout}
        databaseMode={summary?.databaseMode}
        databaseFile={summary?.databaseFile}
      />
    </div>
  );
}

