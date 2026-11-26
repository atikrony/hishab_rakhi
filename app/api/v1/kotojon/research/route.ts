import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, formatEmailToActualName, UserRecord } from '@/lib/auth';
import { getSessionFromRequest } from '@/lib/security';
import { isAdminEmail } from '@/lib/admin';
import { readUserLedgerData } from '@/lib/storage';
import type { DatabaseSchema } from '@/lib/db';
import type { Transaction } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** Read-only ledger load: Postgres first, then local JSON. Never writes (no salary auto-credit). */
async function readLedger(userId: string): Promise<DatabaseSchema | null> {
  try {
    const { getUserLedgerFromPostgres } = await import('@/lib/postgres');
    const pg = await getUserLedgerFromPostgres(userId);
    if (pg) return pg;
  } catch {
    // Postgres not configured or unreachable
  }
  return readUserLedgerData<DatabaseSchema>(userId);
}

async function loadAllUsers(): Promise<UserRecord[]> {
  const map = new Map<string, UserRecord>();
  getAllUsers().forEach((u) => map.set(u.email.toLowerCase(), u));
  try {
    const { getAllUsersFromPostgres, isPostgresAvailable } = await import('@/lib/postgres');
    if (isPostgresAvailable()) {
      (await getAllUsersFromPostgres()).forEach((u) => map.set(u.email.toLowerCase(), u));
    }
  } catch {
    // JSON users only
  }
  return Array.from(map.values());
}

function displayName(u: UserRecord, ledger: DatabaseSchema | null): string {
  const candidates = [u.profile?.name, ledger?.user?.name];
  for (const n of candidates) {
    const t = n?.trim();
    if (t && !t.toLowerCase().startsWith('usr_') && t !== 'Not set' && t !== 'Solo User') return t;
  }
  return formatEmailToActualName(u.email);
}

function csvCell(v: unknown): string {
  const s = v === undefined || v === null ? '' : String(v);
  // Quote everything; neutralise spreadsheet formula injection
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || !isAdminEmail(session.email)) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  try {
    const params = request.nextUrl.searchParams;
    const from = params.get('from') || ''; // YYYY-MM-DD
    const to = params.get('to') || '';
    const onlyUser = params.get('userId') || '';
    const format = params.get('format') || 'json';

    const users = (await loadAllUsers()).filter((u) => !onlyUser || u.id === onlyUser);
    const ledgers = await Promise.all(users.map((u) => readLedger(u.id)));

    const inRange = (tx: Transaction) => {
      const d = (tx.date || '').slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    };

    // ---- CSV export of every transaction ----
    if (format === 'csv') {
      const header = ['user_id', 'user_email', 'user_name', 'occupation', 'date', 'type', 'amount', 'category', 'title', 'payment_method', 'channel', 'is_fixed_cost', 'notes'];
      const rows: string[] = [header.join(',')];
      users.forEach((u, i) => {
        const ledger = ledgers[i];
        const name = displayName(u, ledger);
        (ledger?.transactions || []).filter(inRange).forEach((tx) => {
          rows.push(
            [u.id, u.email, name, u.profile?.occupation || '', tx.date, tx.type, tx.amount, tx.category, tx.title, tx.paymentMethod, tx.channel, tx.isFixedCost ? 'yes' : 'no', tx.notes]
              .map(csvCell)
              .join(',')
          );
        });
      });
      return new NextResponse('﻿' + rows.join('\r\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="hishab-transactions-${new Date().toISOString().slice(0, 10)}.csv"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    // ---- Aggregates ----
    const categories = new Map<string, { total: number; count: number; users: Set<string> }>();
    const sources = new Map<string, { total: number; count: number; users: Set<string> }>();
    const months = new Map<string, { income: number; expense: number; users: Set<string> }>();
    const weekday = WEEKDAYS.map((day) => ({ day, expense: 0, count: 0 }));
    const methods = new Map<string, { total: number; count: number }>();
    const occupations = new Map<string, { users: number; income: number; expense: number }>();

    let totalIncome = 0;
    let totalExpense = 0;
    let txCount = 0;

    const perUser = users.map((u, i) => {
      const ledger = ledgers[i];
      const txs = (ledger?.transactions || []).filter(inRange);
      let income = 0;
      let expense = 0;
      const userCats = new Map<string, number>();
      let first = '';
      let last = '';

      for (const tx of txs) {
        const amt = Number(tx.amount) || 0;
        const d = (tx.date || '').slice(0, 10);
        if (d) {
          if (!first || d < first) first = d;
          if (!last || d > last) last = d;
        }
        const month = d.slice(0, 7);
        if (month) {
          if (!months.has(month)) months.set(month, { income: 0, expense: 0, users: new Set() });
          months.get(month)!.users.add(u.id);
        }
        if (tx.type === 'income') {
          income += amt;
          const key = tx.category || 'Other';
          if (!sources.has(key)) sources.set(key, { total: 0, count: 0, users: new Set() });
          const s = sources.get(key)!;
          s.total += amt;
          s.count++;
          s.users.add(u.id);
          if (month) months.get(month)!.income += amt;
        } else if (tx.type === 'expense') {
          expense += amt;
          const key = tx.category || 'Other';
          if (!categories.has(key)) categories.set(key, { total: 0, count: 0, users: new Set() });
          const c = categories.get(key)!;
          c.total += amt;
          c.count++;
          c.users.add(u.id);
          userCats.set(key, (userCats.get(key) || 0) + amt);
          if (month) months.get(month)!.expense += amt;
          const wd = new Date(tx.date).getDay();
          if (!Number.isNaN(wd)) {
            weekday[wd].expense += amt;
            weekday[wd].count++;
          }
          const m = tx.paymentMethod || tx.channel || 'Unspecified';
          if (!methods.has(m)) methods.set(m, { total: 0, count: 0 });
          methods.get(m)!.total += amt;
          methods.get(m)!.count++;
        }
      }

      totalIncome += income;
      totalExpense += expense;
      txCount += txs.length;

      const occ = u.profile?.occupation?.trim() || 'Not set';
      if (!occupations.has(occ)) occupations.set(occ, { users: 0, income: 0, expense: 0 });
      const o = occupations.get(occ)!;
      o.users++;
      o.income += income;
      o.expense += expense;

      const topCategory = [...userCats.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
      const fixedCosts = ledger?.fixedCosts || [];
      const goals = ledger?.savingsGoals || [];
      const walletBalance = (ledger?.wallets || []).reduce((s, w) => s + (Number(w.balance) || 0), 0);

      return {
        id: u.id,
        email: u.email,
        name: displayName(u, ledger),
        occupation: occ,
        createdAt: u.createdAt,
        onboardingCompleted: u.onboardingCompleted,
        declaredMonthlyIncome: u.profile?.monthlyIncome || ledger?.user?.monthlyIncome || 0,
        transactionCount: txs.length,
        income,
        expense,
        net: income - expense,
        savingsRate: income > 0 ? Math.round(((income - expense) / income) * 100) : null,
        topCategory,
        fixedCostCount: fixedCosts.length,
        fixedCostMonthly: fixedCosts.reduce((s, f) => s + (Number(f.amount) || 0), 0),
        savingsGoalCount: goals.length,
        savingsTarget: goals.reduce((s, g) => s + (Number(g.targetAmount) || 0), 0),
        savingsSaved: goals.reduce((s, g) => s + (Number(g.currentAmount) || 0), 0),
        walletBalance,
        firstActivity: first,
        lastActivity: last,
      };
    });

    const activeUsers = perUser.filter((u) => u.transactionCount > 0);
    const rates = activeUsers.map((u) => u.savingsRate).filter((r): r is number => r !== null);
    const median = (arr: number[]) => {
      if (!arr.length) return 0;
      const s = [...arr].sort((a, b) => a - b);
      const m = Math.floor(s.length / 2);
      return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
    };

    const savingsBuckets = [
      { label: 'Overspent (< 0%)', test: (r: number) => r < 0 },
      { label: '0–10%', test: (r: number) => r >= 0 && r < 10 },
      { label: '10–25%', test: (r: number) => r >= 10 && r < 25 },
      { label: '25–50%', test: (r: number) => r >= 25 && r < 50 },
      { label: '50%+', test: (r: number) => r >= 50 },
    ].map((b) => ({ label: b.label, users: rates.filter(b.test).length }));

    const toList = (m: Map<string, { total: number; count: number; users: Set<string> }>, base: number) =>
      [...m.entries()]
        .map(([name, v]) => ({
          name,
          total: v.total,
          count: v.count,
          users: v.users.size,
          share: base > 0 ? Math.round((v.total / base) * 1000) / 10 : 0,
          avgTicket: v.count ? Math.round(v.total / v.count) : 0,
        }))
        .sort((a, b) => b.total - a.total);

    return NextResponse.json({
      success: true,
      data: {
        filters: { from, to, userId: onlyUser },
        overview: {
          users: users.length,
          activeUsers: activeUsers.length,
          transactions: txCount,
          totalIncome,
          totalExpense,
          net: totalIncome - totalExpense,
          avgIncomePerActiveUser: activeUsers.length ? Math.round(totalIncome / activeUsers.length) : 0,
          avgExpensePerActiveUser: activeUsers.length ? Math.round(totalExpense / activeUsers.length) : 0,
          medianSavingsRate: Math.round(median(rates)),
        },
        categories: toList(categories, totalExpense),
        incomeSources: toList(sources, totalIncome),
        monthly: [...months.entries()]
          .map(([month, v]) => ({ month, income: v.income, expense: v.expense, activeUsers: v.users.size }))
          .sort((a, b) => a.month.localeCompare(b.month)),
        weekday,
        paymentMethods: [...methods.entries()]
          .map(([name, v]) => ({ name, total: v.total, count: v.count }))
          .sort((a, b) => b.total - a.total),
        occupations: [...occupations.entries()]
          .map(([name, v]) => ({ name, ...v }))
          .sort((a, b) => b.users - a.users),
        savingsBuckets,
        users: perUser.sort((a, b) => b.expense - a.expense),
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to build research data' },
      { status: 500 }
    );
  }
}
