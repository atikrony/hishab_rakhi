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
import { ShareModal } from '@/components/fold/ShareModal';
import { SavingsPlanModal } from '@/components/fold/SavingsPlanModal';
import { ProductTour } from '@/features/tour/ProductTour';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const safePath = pathname || '';
  const isAuthOrOnboarding =
    safePath.startsWith('/auth') || safePath.startsWith('/share');

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
    isShareOpen,
    setIsShareOpen,
    isSavingsPlanOpen,
    setIsSavingsPlanOpen,
    selectedTx,
    setSelectedTx,
    toastMessage,
    handleAddInflow,
    handleAddExpense,
    handleDeleteTransaction,
    handleUpdateTransaction,
    handleLogout,
  } = useLedger();

  // Auth and public share pages render without the app frame
  if (isAuthOrOnboarding) {
    return <>{children}</>;
  }

  if ((loading && !summary) || isMobileDeviceView === null) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center text-on-surface">
        <div className="w-14 h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-bold text-xl shadow-xl animate-float">
          HR
        </div>
        <div className="mt-4 font-headline-md text-headline-md font-bold tracking-tight">Hishab Rakhi</div>
        <div className="mt-3 w-28 h-1 rounded-full bg-surface-container overflow-hidden">
          <div className="h-full w-1/2 rounded-full bg-primary animate-loading-bar" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col antialiased">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div role="status" aria-live="polite" className="fixed z-[60] left-4 right-4 top-[calc(1rem+env(safe-area-inset-top))] mx-auto max-w-sm lg:left-auto lg:right-6 lg:top-6 lg:mx-0 bg-primary-container text-on-primary px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-popIn">
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

      <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />
      <ProductTour />
      <SavingsPlanModal isOpen={isSavingsPlanOpen} onClose={() => setIsSavingsPlanOpen(false)} />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        onLogout={handleLogout}
        databaseMode={summary?.databaseMode}
        databaseFile={summary?.databaseFile}
      />
    </div>
  );
}

