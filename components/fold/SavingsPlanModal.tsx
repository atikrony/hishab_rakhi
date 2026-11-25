'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { SavingsPlan } from '@/lib/savings-advisor';

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

const BUCKET_STYLE: Record<string, { bar: string; dot: string }> = {
  needs: { bar: 'bg-sky-500', dot: 'bg-sky-500' },
  wants: { bar: 'bg-fuchsia-500', dot: 'bg-fuchsia-500' },
  savings: { bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
};

const TONE: Record<string, string> = {
  good: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
  warn: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
  info: 'text-primary bg-primary/10',
};

export function SavingsPlanModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [plan, setPlan] = useState<SavingsPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [incomeInput, setIncomeInput] = useState('');
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const load = async (income?: string) => {
    setLoading(true);
    setError(null);
    try {
      const q = income && Number(income) > 0 ? `?income=${encodeURIComponent(income)}` : '';
      const res = await fetch(`/api/v1/advisor${q}`, { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not build your plan.');
      setPlan(json.data);
      if (!income && json.data.income > 0) setIncomeInput(String(json.data.income));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIncomeInput('');
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const onIncomeChange = (v: string) => {
    const clean = v.replace(/[^\d]/g, '').slice(0, 10);
    setIncomeInput(clean);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => load(clean), 400);
  };

  const total = plan ? Math.max(plan.income, plan.buckets.reduce((s, b) => s + b.suggested, 0)) : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel max-w-2xl max-h-[90dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
            </span>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Savings plan</h3>
              <p className="text-label-md text-on-surface-variant">
                {plan && plan.monthsAnalyzed > 0
                  ? `Based on ${plan.monthsAnalyzed} month${plan.monthsAnalyzed > 1 ? 's' : ''} of your spending`
                  : 'Based on your income and spending'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full glass-input flex items-center justify-center text-on-surface-variant hover:text-on-surface flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Income */}
        <label className="flex items-center gap-3 p-3 rounded-2xl glass-input mb-5">
          <span className="material-symbols-outlined text-primary">payments</span>
          <span className="text-label-md font-semibold text-on-surface-variant whitespace-nowrap">Monthly income</span>
          <span className="ml-auto flex items-center gap-1">
            <span className="font-bold text-on-surface">৳</span>
            <input
              inputMode="numeric"
              value={incomeInput}
              onChange={(e) => onIncomeChange(e.target.value)}
              placeholder="0"
              className="w-32 bg-transparent text-right font-currency-md text-currency-md font-bold text-on-surface outline-none"
            />
          </span>
        </label>

        {error && <p className="text-error font-semibold text-label-md mb-4">{error}</p>}

        {!plan && loading && <div className="h-64 rounded-2xl bg-surface-container animate-pulse" />}

        {plan && (
          <div className={`flex flex-col gap-5 transition-opacity ${loading ? 'opacity-60' : ''}`}>
            {/* Hero numbers */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-4 hero-gradient text-white shadow-lg">
                <div className="text-label-sm uppercase tracking-wider font-bold text-white/80">Save each month</div>
                <div className="font-currency-display text-currency-display font-extrabold">৳{fmt(plan.suggestedSavings)}</div>
                <div className="text-label-md text-white/85 font-semibold">{plan.savingsRate}% of income</div>
              </div>
              <div className="rounded-2xl p-4 glass-input">
                <div className="text-label-sm uppercase tracking-wider font-bold text-on-surface-variant">Spending now</div>
                <div className="font-currency-display text-currency-display font-extrabold text-on-surface">
                  ৳{fmt(plan.currentSpend)}
                </div>
                <div className={`text-label-md font-semibold ${plan.currentSavings >= 0 ? 'text-secondary' : 'text-error'}`}>
                  {plan.currentSavings >= 0 ? `৳${fmt(plan.currentSavings)} left over` : `৳${fmt(-plan.currentSavings)} over income`}
                </div>
              </div>
            </div>

            {/* Split bar */}
            {plan.income > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex h-3 rounded-full overflow-hidden bg-surface-container">
                  {plan.buckets.map((b) => (
                    <div
                      key={b.key}
                      className={`${BUCKET_STYLE[b.key].bar} bar-grow`}
                      style={{ width: `${total > 0 ? (b.suggested / total) * 100 : 0}%` }}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {plan.buckets.map((b) => (
                    <div key={b.key} className="flex flex-col">
                      <span className="flex items-center gap-1.5 text-label-sm font-bold text-on-surface-variant">
                        <span className={`w-2 h-2 rounded-full ${BUCKET_STYLE[b.key].dot}`} />
                        {b.label} · aim {b.targetPercent}%
                      </span>
                      <span className="text-body-md font-bold text-on-surface tabular-nums">৳{fmt(b.suggested)}</span>
                      <span className="text-label-sm text-on-surface-variant tabular-nums">
                        {plan.income > 0 ? Math.round((b.suggested / plan.income) * 100) : 0}% of income
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            {plan.tips.length > 0 && (
              <ul className="flex flex-col gap-2">
                {plan.tips.map((t, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl glass-input animate-fadeIn"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${TONE[t.tone]}`}>
                      <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                    </span>
                    <span className="text-body-md text-on-surface pt-1">{t.text}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Category plan */}
            {plan.categories.length > 0 && (
              <div>
                <h4 className="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  Monthly budget by category
                </h4>
                <div className="rounded-2xl glass-input divide-y divide-outline-variant/30 overflow-hidden">
                  {plan.categories.map((c) => (
                    <div key={c.category} className="flex items-center gap-3 px-4 py-3">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${BUCKET_STYLE[c.bucket].dot}`} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-body-md font-semibold text-on-surface truncate">{c.category}</span>
                        <span className="block text-label-sm text-on-surface-variant">
                          {c.bucket === 'needs' ? 'Need' : 'Want'} · now ৳{fmt(c.current)}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block text-body-md font-bold text-on-surface tabular-nums">৳{fmt(c.suggested)}</span>
                        {c.change < 0 && (
                          <span className="block text-label-sm font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                            −৳{fmt(-c.change)}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="flex-1 text-body-md font-bold text-on-surface">Savings</span>
                    <span className="text-body-md font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      ৳{fmt(plan.suggestedSavings)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <p className="text-label-sm text-on-surface-variant text-center">
              Suggestions follow the 50/30/20 rule using your own data. They are guidance, not financial advice.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
