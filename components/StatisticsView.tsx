'use client';

import React, { useEffect, useState } from 'react';
import { BudgetLimit } from '@/lib/types';

interface StatisticsViewProps {
  currencySymbol?: string;
  onRefreshTrigger?: number;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({
  currencySymbol = '$',
  onRefreshTrigger,
}) => {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [targetCategory, setTargetCategory] = useState('Food');
  const [newLimit, setNewLimit] = useState(500);

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
  }, [onRefreshTrigger]);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/v1/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: targetCategory, monthlyLimit: Number(newLimit) }),
      });
      setIsEditing(false);
      fetchBudgets();
    } catch (e) {
      console.error(e);
    }
  };

  const totalBudgeted = budgets.reduce((acc, b) => acc + b.monthlyLimit, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent, 0);
  const overallPercent = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-[650] text-[#17191d]">Monthly Budgets</h1>
          <p className="text-[13px] text-[#888]">Track spending limits per category</p>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="text-[13px] font-semibold text-[#079be8] bg-[#f0f8ff] px-3 py-1.5 rounded-full hover:bg-[#e0f1fe] transition-colors"
        >
          + Set Limit
        </button>
      </div>

      {/* Overall Budget Status */}
      <div className="border border-[#e9e9ec] rounded-2xl p-4 bg-white shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[13px] font-medium text-[#888]">Total Monthly Budget</span>
          <span
            className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${
              overallPercent > 90
                ? 'bg-red-50 text-red-600'
                : overallPercent > 70
                ? 'bg-amber-50 text-amber-600'
                : 'bg-green-50 text-green-600'
            }`}
          >
            {overallPercent}% Used
          </span>
        </div>

        <div className="text-[24px] font-bold text-[#17191d]">
          {currencySymbol}
          {totalSpent.toLocaleString()}{' '}
          <span className="text-[15px] font-normal text-[#888]">
            / {currencySymbol}
            {totalBudgeted.toLocaleString()}
          </span>
        </div>

        <div className="h-2.5 w-full bg-[#f0f0f3] rounded-full overflow-hidden mt-3">
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

      {/* Categories Budgets */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-6 text-sm text-[#888]">Loading budgets...</div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-6 text-sm text-[#888]">No category limits set yet.</div>
        ) : (
          budgets.map((b) => {
            const isExceeded = b.spent > b.monthlyLimit;
            const isNear = b.percentage >= 75 && !isExceeded;

            return (
              <div
                key={b.id || b.category}
                className="border border-[#e9e9ec] rounded-2xl p-4 bg-white shadow-sm"
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="font-semibold text-[15px] text-[#17191d]">{b.category}</div>
                  <div
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isExceeded
                        ? 'bg-red-100 text-[#fa4563]'
                        : isNear
                        ? 'bg-amber-100 text-[#d97706]'
                        : 'bg-emerald-100 text-[#219b35]'
                    }`}
                  >
                    {isExceeded ? 'Exceeded' : `${b.percentage}%`}
                  </div>
                </div>

                <div className="text-[13px] text-[#888] flex justify-between items-center mb-2">
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

                <div className="text-[11px] text-[#888] mt-2 flex justify-between">
                  <span>Remaining: {currencySymbol}{b.remaining.toLocaleString()}</span>
                  <button
                    onClick={() => {
                      setTargetCategory(b.category);
                      setNewLimit(b.monthlyLimit);
                      setIsEditing(true);
                    }}
                    className="text-[#079be8] font-medium hover:underline"
                  >
                    Adjust Limit
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Budget Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-slide-up">
            <h3 className="text-lg font-bold text-[#17191d] mb-4">Set Category Budget</h3>
            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#888]">Category</label>
                <select
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value)}
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
                <label className="text-xs font-semibold text-[#888]">Monthly Limit ({currencySymbol})</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newLimit}
                  onChange={(e) => setNewLimit(Number(e.target.value))}
                  className="w-full mt-1 p-2.5 rounded-xl border border-[#e2e2e6] text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
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

