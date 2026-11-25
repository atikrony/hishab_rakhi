import type { DatabaseSchema } from './db';

const MAX_CATCH_UP_MONTHS = 24;

const monthKey = (y: number, m: number) => `${y}-${String(m + 1).padStart(2, '0')}`;

/** Payday for a month (UTC). Days past the month's end fall on its last day. */
export function payDateFor(year: number, month: number, day: number): Date {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  // 03:00 UTC = 9:00 in Bangladesh
  return new Date(Date.UTC(year, month, Math.min(day, lastDay), 3, 0, 0));
}

/** Next payday strictly after `from`. */
export function nextPayDate(day: number, from = new Date()): Date {
  let y = from.getUTCFullYear();
  let m = from.getUTCMonth();
  for (let i = 0; i < 3; i++) {
    const d = payDateFor(y, m, day);
    if (d > from) return d;
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }
  return payDateFor(y, m, day);
}

/**
 * Credits any salary paydays that have passed since the schedule was set and
 * haven't been credited yet. Mutates `db`; returns true if anything changed.
 *
 * Idempotent: each month uses a fixed transaction id (sal_YYYY-MM) and the
 * user.salaryLastCredited marker, so repeated or concurrent calls never
 * double-credit, and a salary entry the user deletes is not re-added.
 */
export function applyDueSalary(db: DatabaseSchema, now = new Date()): boolean {
  const user = db.user;
  const amount = Math.round(Number(user?.monthlyIncome) || 0);
  const day = Number(user?.salaryDay) || 0;
  if (!user || amount <= 0 || day < 1 || day > 31 || !user.salaryAutoFrom) return false;

  const from = new Date(user.salaryAutoFrom);
  if (isNaN(from.getTime())) return false;

  let y = from.getUTCFullYear();
  let m = from.getUTCMonth();
  if (user.salaryLastCredited && /^\d{4}-\d{2}$/.test(user.salaryLastCredited)) {
    const [ly, lm] = user.salaryLastCredited.split('-').map(Number);
    // Resume after the last credited month if that's later than the start
    if (ly > y || (ly === y && lm - 1 >= m)) {
      y = ly;
      m = lm; // lm is 1-based, so this is the following month (0-based)
      if (m > 11) {
        m = 0;
        y++;
      }
    }
  }

  let changed = false;
  for (let i = 0; i < MAX_CATCH_UP_MONTHS; i++) {
    const payDate = payDateFor(y, m, day);
    if (payDate > now) break;
    const key = monthKey(y, m);

    if (payDate > from) {
      const id = `sal_${key}`;
      if (!db.transactions.some((t) => t.id === id)) {
        const wallet = db.wallets.find((w) => w.id === 'wal_pocket') || db.wallets[0];
        db.transactions.unshift({
          id,
          title: 'Salary',
          amount,
          type: 'income',
          category: 'Salary',
          date: payDate.toISOString(),
          walletId: wallet?.id || 'wal_pocket',
          notes: 'Added automatically on payday',
          paymentMethod: 'Direct Deposit',
          sourceStream: 'Salary',
          channel: 'Salary',
          status: 'Completed',
          brandIcon: 'corporate_fare',
        });
        if (wallet) wallet.balance += amount;
      }
      user.salaryLastCredited = key;
      changed = true;
    }

    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }
  return changed;
}
