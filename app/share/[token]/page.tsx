'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { MonthReceipt } from '@/lib/month-report';

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; receipt: MonthReceipt }
  | { kind: 'error'; code: 'sign_in' | 'no_access' | 'not_found' | 'other'; message: string };

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

export default function SharedReceiptPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token || '';
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let alive = true;
    fetch(`/api/v1/share/view/${encodeURIComponent(token)}`, { cache: 'no-store' })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!alive) return;
        if (res.ok && json.success) setState({ kind: 'ok', receipt: json.data });
        else
          setState({
            kind: 'error',
            code: ['sign_in', 'no_access', 'not_found'].includes(json.code) ? json.code : 'other',
            message: json.error || 'Something went wrong.',
          });
      })
      .catch(() => alive && setState({ kind: 'error', code: 'other', message: 'Network error. Please retry.' }));
    return () => {
      alive = false;
    };
  }, [token]);

  const next = `/share/${token}`;

  return (
    <div className="min-h-[100dvh] flex flex-col items-center px-4 py-8 sm:py-14">
      <div className="w-full max-w-lg flex items-center justify-between mb-5 print:hidden">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold text-sm">
            HR
          </span>
          <span className="font-title-sm text-title-sm font-bold text-on-surface">Hishab Rakhi</span>
        </Link>
      </div>

      {state.kind === 'loading' && (
        <div className="w-full max-w-lg receipt animate-pulse h-96" aria-busy="true" />
      )}

      {state.kind === 'error' && (
        <div className="w-full max-w-md glass-card rounded-3xl p-8 text-center flex flex-col items-center gap-3 animate-popIn">
          <span className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[28px]">
              {state.code === 'sign_in' ? 'lock' : state.code === 'no_access' ? 'block' : 'link_off'}
            </span>
          </span>
          <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
            {state.code === 'sign_in'
              ? 'Sign in to view'
              : state.code === 'no_access'
              ? 'No access'
              : 'Link unavailable'}
          </h1>
          <p className="text-body-md text-on-surface-variant">{state.message}</p>
          {state.code === 'sign_in' && (
            <div className="w-full flex flex-col gap-2 mt-2">
              <a href={`/api/v1/auth/google?next=${encodeURIComponent(next)}`} className="btn-gradient h-11">
                Continue with Google
              </a>
              <Link
                href={`/auth/login?next=${encodeURIComponent(next)}`}
                className="h-11 rounded-xl glass-input flex items-center justify-center font-semibold text-on-surface"
              >
                Sign in with email
              </Link>
            </div>
          )}
        </div>
      )}

      {state.kind === 'ok' && <Receipt r={state.receipt} />}
    </div>
  );
}

function Receipt({ r }: { r: MonthReceipt }) {
  const sym = r.currencySymbol;
  return (
    <article className="w-full max-w-lg receipt animate-popIn">
      {/* Header */}
      <header className="flex flex-col items-center text-center px-6 pt-8 pb-6">
        {r.ownerAvatar && (
          <img src={r.ownerAvatar} alt="" className="w-14 h-14 rounded-full object-cover ring-4 ring-white/50 shadow-lg" />
        )}
        <p className="mt-3 text-label-md text-on-surface-variant">
          <span className="font-bold text-on-surface">{r.ownerName}</span> shared their spending
        </p>
        <h1 className="mt-1 font-headline-md text-headline-md font-bold text-on-surface">{r.monthLabel}</h1>
        <div className="mt-4 text-label-sm uppercase tracking-widest text-outline font-bold">Total spent</div>
        <div className="font-currency-display text-currency-display font-extrabold text-gradient">
          {sym}
          {fmt(r.total)}
        </div>
        <div className="text-label-sm text-on-surface-variant mt-1">
          {r.count} {r.count === 1 ? 'expense' : 'expenses'}
        </div>
      </header>

      <div className="receipt-divider" />

      {/* Categories */}
      {r.categories.length > 0 && (
        <section className="px-6 py-5 flex flex-col gap-3">
          {r.categories.map((c) => (
            <div key={c.category} className="flex flex-col gap-1">
              <div className="flex justify-between text-label-md">
                <span className="font-semibold text-on-surface">{c.category}</span>
                <span className="text-on-surface-variant tabular-nums">
                  {sym}
                  {fmt(c.amount)} · {c.percent}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-container overflow-hidden">
                <div className="h-full rounded-full bg-primary bar-grow" style={{ width: `${Math.max(3, c.percent)}%` }} />
              </div>
            </div>
          ))}
        </section>
      )}

      <div className="receipt-divider" />

      {/* Line items */}
      <section className="px-6 py-4">
        {r.items.length === 0 ? (
          <p className="text-center text-body-md text-on-surface-variant py-6">No expenses this month.</p>
        ) : (
          <ul className="divide-y divide-outline-variant/30">
            {r.items.map((i, idx) => (
              <li key={idx} className="py-2.5 flex items-center gap-3">
                <span className="w-11 text-center text-label-sm font-bold text-on-surface-variant tabular-nums flex-shrink-0">
                  {new Date(i.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-body-md font-semibold text-on-surface truncate">{i.title}</span>
                  <span className="block text-label-sm text-on-surface-variant truncate">
                    {i.category}
                    {i.recurring ? ' · monthly' : ''}
                  </span>
                </span>
                <span className="text-body-md font-bold text-on-surface tabular-nums">
                  {sym}
                  {fmt(i.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="receipt-divider" />

      <footer className="px-6 py-5 flex items-center justify-between text-label-sm text-on-surface-variant">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">visibility</span>
          View only
        </span>
        <button type="button" onClick={() => window.print()} className="flex items-center gap-1 font-bold text-primary print:hidden">
          <span className="material-symbols-outlined text-[16px]">print</span>
          Print
        </button>
      </footer>
    </article>
  );
}
