'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

interface Row { name: string; total: number; count: number; users: number; share: number; avgTicket: number }
interface UserRow {
  id: string; email: string; name: string; occupation: string; createdAt: string;
  onboardingCompleted: boolean; declaredMonthlyIncome: number; transactionCount: number;
  income: number; expense: number; net: number; savingsRate: number | null; topCategory: string;
  fixedCostCount: number; fixedCostMonthly: number; savingsGoalCount: number; savingsTarget: number;
  savingsSaved: number; walletBalance: number; firstActivity: string; lastActivity: string;
}
interface Research {
  overview: {
    users: number; activeUsers: number; transactions: number; totalIncome: number; totalExpense: number;
    net: number; avgIncomePerActiveUser: number; avgExpensePerActiveUser: number; medianSavingsRate: number;
  };
  categories: Row[];
  incomeSources: Row[];
  monthly: { month: string; income: number; expense: number; activeUsers: number }[];
  weekday: { day: string; expense: number; count: number }[];
  paymentMethods: { name: string; total: number; count: number }[];
  occupations: { name: string; users: number; income: number; expense: number }[];
  savingsBuckets: { label: string; users: number }[];
  users: UserRow[];
  generatedAt: string;
}

const tk = (n: number) => `৳${Math.round(n).toLocaleString()}`;

type SortKey = 'name' | 'transactionCount' | 'income' | 'expense' | 'net' | 'savingsRate' | 'fixedCostMonthly' | 'lastActivity';

/** Single-series horizontal bars: one hue, value label in text ink, hover tooltip via title. */
function BarList({ items, format = tk }: { items: { label: string; value: number; hint?: string }[]; format?: (n: number) => string }) {
  const max = Math.max(1, ...items.map((i) => Math.abs(i.value)));
  if (items.length === 0) return <p className="text-xs text-outline py-4 text-center">No data in this range.</p>;
  return (
    <ul className="flex flex-col gap-2">
      {items.map((i) => (
        <li key={i.label} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-xs" title={`${i.label}: ${format(i.value)}${i.hint ? ` · ${i.hint}` : ''}`}>
          <span className="truncate text-on-surface-variant font-medium">{i.label}</span>
          <span className="h-3 rounded-r bg-surface-container-low overflow-hidden">
            <span className="block h-full rounded-r bg-primary/70 hover:bg-primary transition-colors" style={{ width: `${Math.max(2, (Math.abs(i.value) / max) * 100)}%` }} />
          </span>
          <span className="font-semibold text-on-surface tabular-nums text-right">{format(i.value)}</span>
        </li>
      ))}
    </ul>
  );
}

function Card({ title, subtitle, children, className = '' }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-surface-container-lowest rounded-2xl p-5 border border-surface-container shadow-xs flex flex-col gap-4 ${className}`}>
      <div>
        <h3 className="text-sm font-bold text-on-surface">{title}</h3>
        {subtitle && <p className="text-xs text-on-surface-variant">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function ResearchPanel() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [userId, setUserId] = useState('');
  const [data, setData] = useState<Research | null>(null);
  const [allUsers, setAllUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('expense');
  const [sortDesc, setSortDesc] = useState(true);
  const [userSearch, setUserSearch] = useState('');

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (from) p.set('from', from);
    if (to) p.set('to', to);
    if (userId) p.set('userId', userId);
    return p.toString();
  }, [from, to, userId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/kotojon/research?${query}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setError(null);
        if (!userId) setAllUsers(json.data.users.map((u: UserRow) => ({ id: u.id, name: u.name, email: u.email })));
      } else setError(json.error || 'Failed to load research data');
    } catch {
      setError('Network error loading research data');
    } finally {
      setLoading(false);
    }
  }, [query, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const sortedUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    const list = (data?.users || []).filter(
      (u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.occupation.toLowerCase().includes(q)
    );
    return [...list].sort((a, b) => {
      const av = a[sortKey] ?? -Infinity;
      const bv = b[sortKey] ?? -Infinity;
      const cmp = typeof av === 'string' ? String(av).localeCompare(String(bv)) : (av as number) - (bv as number);
      return sortDesc ? -cmp : cmp;
    });
  }, [data, sortKey, sortDesc, userSearch]);

  const sortBy = (k: SortKey) => {
    if (k === sortKey) setSortDesc(!sortDesc);
    else {
      setSortKey(k);
      setSortDesc(true);
    }
  };

  const o = data?.overview;
  const maxMonth = Math.max(1, ...(data?.monthly || []).flatMap((m) => [m.income, m.expense]));

  const Th = ({ k, children, right }: { k: SortKey; children: React.ReactNode; right?: boolean }) => (
    <th className={`py-3 px-3 ${right ? 'text-right' : ''}`}>
      <button type="button" onClick={() => sortBy(k)} className="uppercase tracking-wider font-bold hover:text-on-surface inline-flex items-center gap-0.5">
        {children}
        {sortKey === k && <span className="material-symbols-outlined text-[12px]">{sortDesc ? 'arrow_downward' : 'arrow_upward'}</span>}
      </button>
    </th>
  );

  return (
    <section className="flex flex-col gap-5">
      {/* Header + filters in one row */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-3 border-b border-surface-container">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">science</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-on-surface">User Data Research</h2>
            <p className="text-xs text-on-surface-variant">Spending, income and saving behaviour across every user ledger</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <label className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-surface-container-low border border-surface-container">
            <span className="text-[10px] font-bold uppercase text-outline">From</span>
            <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="bg-transparent outline-none text-on-surface" />
          </label>
          <label className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-surface-container-low border border-surface-container">
            <span className="text-[10px] font-bold uppercase text-outline">To</span>
            <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="bg-transparent outline-none text-on-surface" />
          </label>
          <select value={userId} onChange={(e) => setUserId(e.target.value)} className="h-9 px-3 rounded-xl bg-surface-container-low border border-surface-container text-on-surface outline-none max-w-[14rem]">
            <option value="">All users</option>
            {allUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </select>
          {(from || to || userId) && (
            <button type="button" onClick={() => { setFrom(''); setTo(''); setUserId(''); }} className="h-9 px-3 rounded-xl text-secondary font-bold hover:bg-surface-container-low">
              Clear
            </button>
          )}
          <a href={`/api/v1/kotojon/research?${query}${query ? '&' : ''}format=csv`} className="h-9 px-4 rounded-xl bg-primary text-on-primary font-bold flex items-center gap-1.5 hover:bg-primary-container shadow-sm">
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export CSV
          </a>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-error-container/20 border border-error/30 text-error text-xs font-semibold">{error}</div>
      )}

      {/* Overview stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: 'Active users', value: o ? `${o.activeUsers} / ${o.users}` : '…' },
          { label: 'Transactions', value: o ? o.transactions.toLocaleString() : '…' },
          { label: 'Total income', value: o ? tk(o.totalIncome) : '…' },
          { label: 'Total spent', value: o ? tk(o.totalExpense) : '…' },
          { label: 'Avg spend / active user', value: o ? tk(o.avgExpensePerActiveUser) : '…' },
          { label: 'Median savings rate', value: o ? `${o.medianSavingsRate}%` : '…' },
        ].map((t) => (
          <div key={t.label} className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-outline">{t.label}</div>
            <div className={`mt-2 text-xl font-extrabold text-on-surface tracking-tight tabular-nums ${loading ? 'opacity-50' : ''}`}>{t.value}</div>
          </div>
        ))}
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
        <Card title="Spending by category" subtitle="Total spent across users (hover for share and user count)">
          <BarList items={(data?.categories || []).slice(0, 10).map((c) => ({ label: c.name, value: c.total, hint: `${c.share}% of spend · ${c.users} users · avg ${tk(c.avgTicket)}` }))} />
        </Card>

        <Card title="Income sources" subtitle="Total received by source">
          <BarList items={(data?.incomeSources || []).slice(0, 10).map((c) => ({ label: c.name, value: c.total, hint: `${c.share}% of income · ${c.users} users` }))} />
        </Card>

        <Card title="Monthly income vs spending" subtitle="Each month, all users combined" className="lg:col-span-2">
          {(data?.monthly || []).length === 0 ? (
            <p className="text-xs text-outline py-4 text-center">No data in this range.</p>
          ) : (
            <>
              <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-secondary" />Income</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-primary" />Spent</span>
              </div>
              <div className="flex items-end gap-3 h-48 overflow-x-auto border-b border-surface-container pb-1">
                {data!.monthly.map((m) => (
                  <div key={m.month} className="flex-1 min-w-[44px] h-full flex flex-col justify-end items-center gap-1" title={`${m.month}: income ${tk(m.income)}, spent ${tk(m.expense)}, ${m.activeUsers} active users`}>
                    <div className="w-full flex-1 flex items-end justify-center gap-[2px]">
                      <div className="w-1/3 max-w-[14px] rounded-t bg-secondary" style={{ height: `${(m.income / maxMonth) * 100}%` }} />
                      <div className="w-1/3 max-w-[14px] rounded-t bg-primary" style={{ height: `${(m.expense / maxMonth) * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-on-surface-variant font-medium">{m.month.slice(2)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card title="Spending by weekday" subtitle="When people spend most">
          <BarList items={(data?.weekday || []).map((w) => ({ label: w.day, value: w.expense, hint: `${w.count} payments` }))} />
        </Card>

        <Card title="Savings rate distribution" subtitle="Users with income in range, by share of income kept">
          <BarList items={(data?.savingsBuckets || []).map((b) => ({ label: b.label, value: b.users }))} format={(n) => `${n} users`} />
        </Card>

        <Card title="Payment methods" subtitle="Spending by method / channel">
          <BarList items={(data?.paymentMethods || []).slice(0, 8).map((m) => ({ label: m.name, value: m.total, hint: `${m.count} payments` }))} />
        </Card>

        <Card title="Occupations" subtitle="Users and average spend by occupation">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold text-left">
                  <th className="py-2">Occupation</th>
                  <th className="py-2 text-right">Users</th>
                  <th className="py-2 text-right">Avg income</th>
                  <th className="py-2 text-right">Avg spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {(data?.occupations || []).map((oc) => (
                  <tr key={oc.name}>
                    <td className="py-2 text-on-surface font-medium">{oc.name}</td>
                    <td className="py-2 text-right tabular-nums">{oc.users}</td>
                    <td className="py-2 text-right tabular-nums">{tk(oc.income / oc.users)}</td>
                    <td className="py-2 text-right tabular-nums">{tk(oc.expense / oc.users)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Per-user research table */}
      <Card title="Per-user breakdown" subtitle="Click a column to sort. Filters above apply.">
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined text-[18px] text-outline absolute left-3 top-1/2 -translate-y-1/2">search</span>
          <input type="text" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Filter by name, email, occupation…" className="w-full h-9 pl-9 pr-3 rounded-xl bg-surface-container-low text-xs text-on-surface outline-none border border-surface-container focus:border-primary" />
        </div>
        <div className="overflow-x-auto border border-surface-container rounded-xl">
          <table className="w-full text-left text-xs text-on-surface border-collapse">
            <thead>
              <tr className="bg-surface-container-low/60 border-b border-surface-container text-on-surface-variant text-[10px]">
                <Th k="name">User</Th>
                <Th k="transactionCount" right>Txns</Th>
                <Th k="income" right>Income</Th>
                <Th k="expense" right>Spent</Th>
                <Th k="net" right>Net</Th>
                <Th k="savingsRate" right>Saved %</Th>
                <th className="py-3 px-3 uppercase tracking-wider font-bold">Top category</th>
                <Th k="fixedCostMonthly" right>Fixed / mo</Th>
                <th className="py-3 px-3 text-right uppercase tracking-wider font-bold">Goals</th>
                <Th k="lastActivity">Last active</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container font-medium">
              {sortedUsers.length === 0 ? (
                <tr><td colSpan={10} className="py-8 text-center text-outline">No users match.</td></tr>
              ) : (
                sortedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-container-low/40">
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold truncate">{u.name}</span>
                        <span className="text-[11px] text-outline truncate">{u.email} · {u.occupation}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{u.transactionCount}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{tk(u.income)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{tk(u.expense)}</td>
                    <td className={`py-2.5 px-3 text-right tabular-nums font-bold ${u.net < 0 ? 'text-error' : 'text-secondary'}`}>{tk(u.net)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{u.savingsRate === null ? '—' : `${u.savingsRate}%`}</td>
                    <td className="py-2.5 px-3 text-on-surface-variant">{u.topCategory || '—'}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{u.fixedCostCount ? `${tk(u.fixedCostMonthly)} (${u.fixedCostCount})` : '—'}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{u.savingsGoalCount ? `${tk(u.savingsSaved)} / ${tk(u.savingsTarget)}` : '—'}</td>
                    <td className="py-2.5 px-3 text-on-surface-variant">{u.lastActivity || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
