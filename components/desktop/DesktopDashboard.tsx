'use client';

import React from 'react';
import {
  UserProfile,
  Transaction,
  SavingsGoal,
  WalletAccount,
} from '@/lib/types';

interface DesktopDashboardProps {
  user: UserProfile;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  incomeTrend?: number;
  expenseTrend?: number;
  isBalanceVisible: boolean;
  onToggleBalance: () => void;
  currencySymbol?: string;
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  wallets: WalletAccount[];
  onSelectTransaction: (tx: Transaction) => void;
  onDepositGoal: (goal: SavingsGoal) => void;
  onAddTransaction: () => void;
  onTransfer: () => void;
  onViewAllTransactions: () => void;
  onViewAllSavings: () => void;
}

export const DesktopDashboard: React.FC<DesktopDashboardProps> = ({
  user,
  totalBalance,
  monthlyIncome,
  monthlyExpense,
  incomeTrend = 3.1,
  expenseTrend = 4.2,
  isBalanceVisible,
  onToggleBalance,
  currencySymbol = '$',
  transactions,
  savingsGoals,
  wallets,
  onSelectTransaction,
  onDepositGoal,
  onAddTransaction,
  onTransfer,
  onViewAllTransactions,
  onViewAllSavings,
}) => {
  const netSavings = Math.max(0, monthlyIncome - monthlyExpense);
  const savingsRate =
    monthlyIncome > 0 ? ((netSavings / monthlyIncome) * 100).toFixed(1) : '0';

  const formatMoney = (val: number) => {
    return `${currencySymbol}${val.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Monthly Overview for Chart
  const monthlyData = [
    { month: 'Jan', income: 6400, expense: 4200 },
    { month: 'Feb', income: 6800, expense: 4500 },
    { month: 'Mar', income: 7200, expense: 4900 },
    { month: 'Apr', income: 6900, expense: 4600 },
    { month: 'May', income: 7300, expense: 5200 },
    { month: 'Jun', income: monthlyIncome || 7129.91, expense: monthlyExpense || 5129.91 },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Welcome Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#17191d] tracking-tight">
            Financial Executive Dashboard
          </h1>
          <p className="text-xs text-[#888] mt-0.5">
            Real-time balance, cashflow analytics, and savings progress for {user.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onTransfer}
            className="px-3.5 py-2 rounded-xl border border-[#e2e2e6] bg-white text-xs font-semibold text-[#17191d] hover:bg-[#f8f9fa] transition-colors"
          >
            ⇄ Account Transfer
          </button>
          <button
            onClick={onAddTransaction}
            className="px-4 py-2 rounded-xl bg-[#079be8] text-white text-xs font-bold hover:bg-[#0689cf] shadow-sm shadow-[#079be8]/20 transition-all"
          >
            + New Transaction
          </button>
        </div>
      </div>

      {/* Row 1: KPI Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Balance Card */}
        <div className="bg-white rounded-2xl border border-[#e9e9ec] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#888]">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Total Net Balance</span>
            <button
              onClick={onToggleBalance}
              className="text-[#666] hover:text-[#079be8] transition-colors p-1"
              title={isBalanceVisible ? 'Hide balance' : 'Show balance'}
            >
              {isBalanceVisible ? (
                <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none stroke-[2]">
                  <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="2.5" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none stroke-[2]">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <line x1="2" y1="2" x2="22" y2="22" />
                </svg>
              )}
            </button>
          </div>

          <div className="my-2">
            <div className="text-2xl font-bold tracking-tight text-[#17191d]">
              {isBalanceVisible ? formatMoney(totalBalance) : '••••••••'}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#f0f0f2] text-[#888]">
            <span>Across {wallets.length} active wallets</span>
            <span className="text-emerald-600 font-semibold">Active</span>
          </div>
        </div>

        {/* Monthly Income Card */}
        <div className="bg-white rounded-2xl border border-[#e9e9ec] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#888]">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Monthly Inflow</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-[#fa4563]">
              <svg viewBox="0 0 24 24" className="w-3 h-3 stroke-current fill-none stroke-[2.5]">
                <path d="M19 5 5 19M5 9v10h10" />
              </svg>
              {incomeTrend}%
            </span>
          </div>

          <div className="my-2">
            <div className="text-2xl font-bold tracking-tight text-[#17191d]">
              {isBalanceVisible ? formatMoney(monthlyIncome) : '••••••'}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#f0f0f2] text-[#888]">
            <span>Primary: Salary & Adsense</span>
            <span className="text-[#219b35] font-semibold">+Inflow</span>
          </div>
        </div>

        {/* Monthly Expense Card */}
        <div className="bg-white rounded-2xl border border-[#e9e9ec] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#888]">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Monthly Outflow</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#219b35]">
              <svg viewBox="0 0 24 24" className="w-3 h-3 stroke-current fill-none stroke-[2.5]">
                <path d="m5 19 14-14M9 5h10v10" />
              </svg>
              {expenseTrend}%
            </span>
          </div>

          <div className="my-2">
            <div className="text-2xl font-bold tracking-tight text-[#17191d]">
              {isBalanceVisible ? formatMoney(monthlyExpense) : '••••••'}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#f0f0f2] text-[#888]">
            <span>Top: Food & Subscriptions</span>
            <span className="text-[#fa4563] font-semibold">-Outflow</span>
          </div>
        </div>

        {/* Net Savings & Rate Card */}
        <div className="bg-white rounded-2xl border border-[#e9e9ec] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#888]">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Savings Rate</span>
            <span className="text-xs font-bold text-[#079be8] bg-blue-50 px-2 py-0.5 rounded-full">
              {savingsRate}%
            </span>
          </div>

          <div className="my-2">
            <div className="text-2xl font-bold tracking-tight text-emerald-600">
              +{currencySymbol}{netSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="h-1.5 w-full bg-[#f0f0f3] rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Number(savingsRate))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Row 2: Charts & Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 8 Cols (Cashflow Chart + Full Transactions Table) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Cashflow Chart */}
          <div className="bg-white rounded-2xl border border-[#e9e9ec] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-[#17191d]">Cash Flow Performance</h2>
                <p className="text-xs text-[#888]">Monthly Inflow vs Outflow comparisons</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-[#079be8]"></span> Inflow (Income)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-[#fa4563]"></span> Outflow (Expense)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-4 pt-8 pb-3 items-end h-[190px] border-b border-[#f0f0f2]">
              {monthlyData.map((m, idx) => {
                const max = 8000;
                const incPct = Math.min(100, Math.round((m.income / max) * 100));
                const expPct = Math.min(100, Math.round((m.expense / max) * 100));

                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group">
                    <div className="flex items-end gap-1.5 w-full justify-center h-full">
                      <div
                        style={{ height: `${incPct}%` }}
                        className="w-4 rounded-t-md bg-[#079be8] group-hover:opacity-85 transition-all shadow-xs"
                        title={`Inflow: $${m.income}`}
                      />
                      <div
                        style={{ height: `${expPct}%` }}
                        className="w-4 rounded-t-md bg-[#fa4563] group-hover:opacity-85 transition-all shadow-xs"
                        title={`Outflow: $${m.expense}`}
                      />
                    </div>
                    <span className="text-xs text-[#888] font-medium mt-2">{m.month}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-3 text-xs text-[#888]">
              <span>Last 6 months cash flow average: +$6,950/mo</span>
              <span className="font-semibold text-[#079be8]">Healthy Liquidity</span>
            </div>
          </div>

          {/* Transactions Ledger Table */}
          <div className="bg-white rounded-2xl border border-[#e9e9ec] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-[#17191d]">Recent Transactions Ledger</h2>
                <p className="text-xs text-[#888]">Showing latest verified financial activity</p>
              </div>
              <button
                onClick={onViewAllTransactions}
                className="text-xs font-semibold text-[#079be8] hover:underline"
              >
                View Full Ledger &rarr;
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#ededf0] text-[#888] uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Payee / Merchant</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f4f5f7]">
                  {transactions.slice(0, 6).map((tx) => (
                    <tr
                      key={tx.id}
                      onClick={() => onSelectTransaction(tx)}
                      className="hover:bg-[#fafafa] transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-3">
                        <div className="font-semibold text-sm text-[#17191d] group-hover:text-[#079be8] transition-colors">
                          {tx.title}
                        </div>
                        {tx.notes && (
                          <div className="text-[11px] text-[#aaa] truncate max-w-xs">{tx.notes}</div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 rounded-full bg-[#f4f5f7] text-[#555] font-medium text-[11px]">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#777]">
                        {new Date(tx.date).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-3 capitalize">
                        <span
                          className={`font-semibold ${
                            tx.type === 'income' ? 'text-[#219b35]' : 'text-[#fa4563]'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`font-bold text-sm ${
                            tx.type === 'income' ? 'text-[#219b35]' : 'text-[#fa4563]'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '-'}
                          {currencySymbol}
                          {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTransaction(tx);
                          }}
                          className="text-[#888] hover:text-[#079be8] p-1"
                        >
                          Details &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: 4 Cols (Savings Goals, Wallets & Cards, Budgets) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active Savings Goals Card */}
          <div className="bg-white rounded-2xl border border-[#e9e9ec] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-[#17191d]">Savings Goals</h2>
              <button
                onClick={onViewAllSavings}
                className="text-xs font-semibold text-[#079be8] hover:underline"
              >
                See all ({savingsGoals.length})
              </button>
            </div>

            <div className="space-y-4">
              {savingsGoals.slice(0, 2).map((goal) => {
                const percent = Math.min(
                  100,
                  Math.round((goal.currentAmount / goal.targetAmount) * 100)
                );
                return (
                  <div
                    key={goal.id}
                    className="p-3.5 rounded-xl border border-[#ededf0] hover:border-[#079be8] transition-all bg-[#fafafa]"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-[#17191d]">
                      <span>{goal.title}</span>
                      <span className="text-[#079be8]">{percent}%</span>
                    </div>

                    <div className="text-xs text-[#888] mt-1">
                      {currencySymbol}
                      {goal.currentAmount.toLocaleString()} / {currencySymbol}
                      {goal.targetAmount.toLocaleString()}
                    </div>

                    <div className="h-2 w-full bg-[#e5e7eb] rounded-full overflow-hidden my-2">
                      <div
                        className="h-full bg-[#079fe9] rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#888]">
                      <span className="truncate max-w-[170px]">{goal.note}</span>
                      <button
                        onClick={() => onDepositGoal(goal)}
                        className="text-xs font-bold text-[#079be8] hover:underline"
                      >
                        + Deposit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Linked Wallets & Cards */}
          <div className="bg-white rounded-2xl border border-[#e9e9ec] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-[#17191d]">Linked Accounts</h2>
              <button
                onClick={onTransfer}
                className="text-xs font-semibold text-[#079be8] hover:underline"
              >
                Transfer Funds
              </button>
            </div>

            <div className="space-y-2.5">
              {wallets.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-[#ededf0] hover:bg-[#fafafa] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs"
                      style={{ backgroundColor: w.color || '#079be8' }}
                    >
                      {w.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#17191d]">{w.name}</div>
                      <div className="text-[11px] text-[#888]">{w.accountNumber || 'Primary'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-[#17191d]">
                      {currencySymbol}
                      {w.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-[#aaa] capitalize">{w.type}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
