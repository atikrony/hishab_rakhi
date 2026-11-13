'use client';

import React, { useEffect, useState } from 'react';
import { Transaction } from '@/lib/types';

interface AnalyticsViewProps {
  transactions: Transaction[];
  currencySymbol?: string;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  transactions,
  currencySymbol = '৳',
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/analytics')
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setData(res.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [transactions]);

  if (loading || !data) {
    return (
      <div className="py-20 text-center text-[#888] animate-pulse">
        Calculating financial insights...
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    Food: '#fa4563',
    Subscription: '#079be8',
    Salary: '#219b35',
    Freelance: '#10b981',
    Bills: '#f59e0b',
    Shopping: '#8b5cf6',
    Entertainment: '#ec4899',
    Transport: '#6366f1',
    Health: '#14b8a6',
    Other: '#94a3b8',
  };

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      <div>
        <h1 className="text-[22px] font-[650] text-[#17191d]">Financial Analytics</h1>
        <p className="text-[13px] text-[#888]">Cashflow trends and category breakdowns</p>
      </div>

      {/* Highlights Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-[#e9e9ec] rounded-2xl p-4 bg-white shadow-sm">
          <div className="text-[12px] text-[#888] font-medium">Net Savings</div>
          <div className="text-[20px] font-bold text-[#17191d] mt-1">
            {currencySymbol}
            {data.netSavings.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#219b35] font-semibold mt-1">
            Savings Rate: {data.savingsRate}%
          </div>
        </div>

        <div className="border border-[#e9e9ec] rounded-2xl p-4 bg-white shadow-sm">
          <div className="text-[12px] text-[#888] font-medium">Top Category</div>
          <div className="text-[18px] font-bold text-[#17191d] mt-1 truncate">
            {data.topCategory ? data.topCategory.category : 'N/A'}
          </div>
          <div className="text-[11px] text-[#fa4563] font-semibold mt-1">
            {data.topCategory
              ? `${currencySymbol}${data.topCategory.amount} (${data.topCategory.percentage}%)`
              : 'None'}
          </div>
        </div>
      </div>

      {/* Monthly Cashflow Comparison */}
      <div className="border border-[#e9e9ec] rounded-2xl p-4 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold text-[#17191d]">Monthly Inflow vs Outflow</h2>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#079be8]"></span> Income
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#fa4563]"></span> Expense
            </span>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-2 pt-6 pb-2 items-end h-[160px] border-b border-[#f0f0f2]">
          {data.monthlyOverview?.map((m: any, i: number) => {
            const maxVal = 8000;
            const incHeight = Math.min(100, Math.round((m.income / maxVal) * 100));
            const expHeight = Math.min(100, Math.round((m.expense / maxVal) * 100));

            return (
              <div key={i} className="flex flex-col items-center h-full justify-end group">
                <div className="flex items-end gap-1 w-full justify-center h-full">
                  <div
                    style={{ height: `${incHeight}%` }}
                    className="w-3 rounded-t-sm bg-[#079be8] transition-all hover:opacity-80"
                    title={`Income: $${m.income}`}
                  />
                  <div
                    style={{ height: `${expHeight}%` }}
                    className="w-3 rounded-t-sm bg-[#fa4563] transition-all hover:opacity-80"
                    title={`Expense: $${m.expense}`}
                  />
                </div>
                <span className="text-[11px] text-[#888] mt-2 font-medium">{m.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Spending Breakdown */}
      <div className="border border-[#e9e9ec] rounded-2xl p-4 bg-white shadow-sm">
        <h2 className="text-[15px] font-semibold text-[#17191d] mb-4">Spending by Category</h2>

        <div className="space-y-3.5">
          {data.categoryBreakdown?.length === 0 ? (
            <div className="text-center text-sm text-[#888] py-4">No expenses recorded yet.</div>
          ) : (
            data.categoryBreakdown?.map((cat: any) => {
              const color = categoryColors[cat.category] || '#94a3b8';

              return (
                <div key={cat.category}>
                  <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-[#17191d] font-semibold">{cat.category}</span>
                    </span>
                    <span className="text-[#888]">
                      {currencySymbol}
                      {cat.amount.toLocaleString()} ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#f0f0f3] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, cat.percentage)}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

