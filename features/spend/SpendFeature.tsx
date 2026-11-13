'use client';

import React from 'react';
import { useLedger } from '@/features/ledger/LedgerContext';
import { SpendView } from '@/components/fold/SpendView';
import { MobileAppView } from '@/components/fold/MobileAppView';

export function SpendFeature() {
  const {
    activeSummary,
    summary,
    filteredTransactions,
    transactions,
    handleAddExpense,
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
        activeTab="spend"
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
    <SpendView
      summary={currentSummary}
      transactions={filteredTransactions}
      searchQuery=""
      onAddExpense={handleAddExpense}
      onOpenAddModal={() => setIsExpenseModalOpen(true)}
      onSelectTransaction={(tx) => setSelectedTx(tx)}
      startDate={startDate}
      endDate={endDate}
      onDateRangeChange={setDateRange}
      onResetDate={resetDateRange}
    />
  );
}

