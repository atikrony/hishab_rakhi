'use client';

import React from 'react';
import { useLedger } from '@/features/ledger/LedgerContext';
import { PocketView } from '@/components/fold/PocketView';
import { MobileAppView } from '@/components/fold/MobileAppView';

export function PocketFeature() {
  const {
    activeSummary,
    summary,
    filteredTransactions,
    transactions,
    handleAddInflow,
    setIsInflowModalOpen,
    setIsExpenseModalOpen,
    setIsSettingsOpen,
    setSelectedTx,
    startDate,
    endDate,
    setDateRange,
    resetDateRange,
    isMobileDeviceView,
  } = useLedger();

  const currentSummary = activeSummary || summary;

  if (!currentSummary) return null;

  if (isMobileDeviceView) {
    return (
      <MobileAppView
        summary={currentSummary}
        transactions={filteredTransactions}
        activeTab="pocket"
        onOpenAddMoney={() => setIsInflowModalOpen(true)}
        onOpenAddExpense={() => setIsExpenseModalOpen(true)}
        onSelectTransaction={(tx) => setSelectedTx(tx)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={setDateRange}
        onResetDateRange={resetDateRange}
        totalTransactionsCount={transactions.length}
      />
    );
  }

  return (
    <PocketView
      summary={currentSummary}
      transactions={filteredTransactions}
      searchQuery=""
      onAddInflow={handleAddInflow}
      onOpenAddModal={() => setIsInflowModalOpen(true)}
      onSelectTransaction={(tx) => setSelectedTx(tx)}
      startDate={startDate}
      endDate={endDate}
      onDateRangeChange={setDateRange}
      onResetDate={resetDateRange}
    />
  );
}

