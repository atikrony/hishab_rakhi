'use client';

import React from 'react';
import { useLedger } from '@/features/ledger/LedgerContext';
import { SummaryView } from '@/components/fold/SummaryView';
import { MobileAppView } from '@/components/fold/MobileAppView';

export function SummaryFeature() {
  const {
    activeSummary,
    summary,
    filteredTransactions,
    transactions,
    fixedCosts,
    handleToggleFixedCost,
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
        activeTab="summary"
        fixedCosts={fixedCosts}
        onToggleFixedCost={handleToggleFixedCost}
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
    <SummaryView
      summary={currentSummary}
      transactions={filteredTransactions}
      fixedCosts={fixedCosts}
      onToggleFixedCost={handleToggleFixedCost}
      searchQuery=""
      onOpenAddModal={() => setIsInflowModalOpen(true)}
      onSelectTransaction={(tx) => setSelectedTx(tx)}
      startDate={startDate}
      endDate={endDate}
      onDateRangeChange={setDateRange}
      onResetDate={resetDateRange}
    />
  );
}

