'use client';

import React, { useEffect, useState } from 'react';
import { SavingsGoal } from '@/lib/types';

interface DesktopBudgetsViewProps {
  savingsGoals: SavingsGoal[];
  currencySymbol?: string;
  onDepositGoal: (goal: SavingsGoal) => void;
  onAddSaving: () => void;
  onDeleteGoal: (id: string) => void;
}

export const DesktopBudgetsView: React.FC<DesktopBudgetsViewProps> = ({
  savingsGoals,
  currencySymbol = '$',
  onDepositGoal,
  onAddSaving,
  onDeleteGoal,
}) => {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [targetCat, setTargetCat] = useState('Food');
  const [limitVal, setLimitVal] = useState(500);

  const fetchBudgets = () => {
    fetch('/api/v1/budgets')
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setBudgets(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/v1/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: targetCat, monthlyLimit: Number(limitVal) }),
      });
      setIsEditingBudget(false);
      fetchBudgets();
    } catch (e) {
      console.error(e);
    }
  };

  const totalBudgeted = budgets.reduce((acc, b) => acc + b.monthlyLimit, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent, 0);
  const overallPercent = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#17191d]">Budgets & Savings Goals</h1>
          <p className="text-xs text-[#888]">
            Enforce category spending caps and track milestone targets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditingBudget(true)}
            className="px-4 py-2 rounded-xl border border-[#e2e2e6] bg-white text-xs font-semibold text-[#17191d] hover:bg-[#fafafa]"
          >
            + Set Category Budget
          </button>
          <button
            onClick={onAddSaving}
            className="px-4 py-2 rounded-xl bg-[#079be8] text-white text-xs font-bold hover:bg-[#0689cf] shadow-sm"
          >
            + New Savings Target
          </button>
        </div>
      </div>

      {/* Top Banner: Total Monthly Budget Health */}
      <div className="bg-white rounded-2xl border border-[#e9e9ec] p-6 shadow-xs">
        <div className="flex justify-between items-center mb-2">
          <div>
            <span className="text-xs text-[#888] uppercase font-bold tracking-wider">
              Total Monthly Spending Limit
            </span>
            <div className="text-2xl font-bold text-[#17191d] mt-1">
              {currencySymbol}
              {totalSpent.toLocaleString()}{' '}
              <span className="text-base font-normal text-[#888]">
                / {currencySymbol}
                {totalBudgeted.toLocaleString()}
              </span>
            </div>
          </div>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              overallPercent > 90
                ? 'bg-red-50 text-[#fa4563]'
                : overallPercent > 70
                ? 'bg-amber-50 text-amber-600'
                : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            {overallPercent}% Used
          </span>
        </div>

        <div className="h-2.5 w-full bg-[#f0f0f3] rounded-full overflow-hidden mt-4">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              overallPercent > 90
                ? 'bg-[#fa4563]'
                : overallPercent > 70
                ? 'bg-[#f59e0b]'
                : 'bg-[#219b35]'
            }`}
            style={{ width: `${Math.min(100, overallPercent)}%` }}
          />
        </div>
      </div>

      {/* Grid: Category Budgets (Left 6 Cols) & Savings Targets (Right 6 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Budget Limits */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#17191d]">Category Budgets</h2>
            <button
              onClick={() => setIsEditingBudget(true)}
              className="text-xs font-semibold text-[#079be8] hover:underline"
            >
              + Adjust Limits
            </button>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-xs text-[#888]">Loading budgets...</div>
            ) : budgets.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#888]">No category limits set yet.</div>
            ) : (
              budgets.map((b) => {
                const isExceeded = b.spent > b.monthlyLimit;
                const isNear = b.percentage >= 75 && !isExceeded;

                return (
                  <div
                    key={b.id || b.category}
                    className="bg-white rounded-2xl border border-[#e9e9ec] p-4 shadow-xs"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm text-[#17191d]">{b.category}</span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isExceeded
                            ? 'bg-red-100 text-[#fa4563]'
                            : isNear
                            ? 'bg-amber-100 text-[#d97706]'
                            : 'bg-emerald-100 text-[#219b35]'
                        }`}
                      >
                        {isExceeded ? 'Exceeded' : `${b.percentage}%`}
                      </span>
                    </div>

                    <div className="text-xs text-[#888] flex justify-between items-center mb-2">
                      <span>
                        Spent: {currencySymbol}
                        {b.spent.toLocaleString()}
                      </span>
                      <span>
                        Limit: {currencySymbol}
                        {b.monthlyLimit.toLocaleString()}
                      </span>
                    </div>

                    <div className="h-2 w-full bg-[#f0f0f3] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isExceeded ? 'bg-[#fa4563]' : isNear ? 'bg-[#f59e0b]' : 'bg-[#079be8]'
                        }`}
                        style={{ width: `${Math.min(100, b.percentage)}%` }}
                      />
                    </div>

                    <div className="text-[11px] text-[#888] mt-2 flex justify-between items-center">
                      <span>Remaining: {currencySymbol}{b.remaining.toLocaleString()}</span>
                      <button
                        onClick={() => {
                          setTargetCat(b.category);
                          setLimitVal(b.monthlyLimit);
                          setIsEditingBudget(true);
                        }}
                        className="text-[#079be8] hover:underline font-medium"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Savings Goals */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#17191d]">Active Savings Goals</h2>
            <button
              onClick={onAddSaving}
              className="text-xs font-semibold text-[#079be8] hover:underline"
            >
              + New Target
            </button>
          </div>

          <div className="space-y-3">
            {savingsGoals.map((g) => {
              const percent = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));

              return (
                <div
                  key={g.id}
                  className="bg-white rounded-2xl border border-[#e9e9ec] p-5 shadow-xs hover:border-[#079be8] transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-base text-[#17191d]">{g.title}</h3>
                      <span className="text-xs text-[#888]">{g.category || 'General Goal'}</span>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#079be8]">
                      {percent}%
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-[#17191d] mt-2">
                    {currencySymbol}
                    {g.currentAmount.toLocaleString()}{' '}
                    <span className="text-xs font-normal text-[#888]">
                      / {currencySymbol}
                      {g.targetAmount.toLocaleString()}
                    </span>
                  </div>

                  <div className="h-2.5 w-full bg-[#f0f0f3] rounded-full overflow-hidden my-2.5">
                    <div
                      className="h-full bg-[#079fe9] rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs text-[#888] pt-1">
                    <span className="truncate max-w-[220px]">{g.note}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (confirm(`Delete savings goal "${g.title}"?`)) {
                            onDeleteGoal(g.id);
                          }
                        }}
                        className="text-[#fa4563] hover:underline"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => onDepositGoal(g)}
                        className="font-bold text-[#079be8] bg-[#f0f8ff] px-3 py-1 rounded-full hover:bg-[#e0f1fe] transition-colors"
                      >
                        + Add Funds
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit Budget Modal */}
      {isEditingBudget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-slide-up">
            <h3 className="text-lg font-bold text-[#17191d] mb-4">Set Category Monthly Limit</h3>
            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#888]">Category</label>
                <select
                  value={targetCat}
                  onChange={(e) => setTargetCat(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-[#e2e2e6] text-sm bg-white"
                >
                  <option value="Food">Food & Dining</option>
                  <option value="Subscription">Subscriptions</option>
                  <option value="Bills">Bills & Utilities</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Transport">Transport</option>
                  <option value="Health">Health & Fitness</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#888]">
                  Monthly Limit ({currencySymbol})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={limitVal}
                  onChange={(e) => setLimitVal(Number(e.target.value))}
                  className="w-full mt-1 p-2.5 rounded-xl border border-[#e2e2e6] text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingBudget(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#e2e2e6] text-sm font-semibold text-[#666]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#079be8] text-white text-sm font-semibold"
                >
                  Save Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

