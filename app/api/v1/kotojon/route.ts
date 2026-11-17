import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getAllUsers } from '@/lib/auth';
import { getVisitorAnalytics } from '@/lib/visitor';
import { getUserLedgersDirectory, safeReadJson } from '@/lib/storage';
import { DatabaseSchema } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // 1. Registered Users
    const users = getAllUsers();
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.onboardingCompleted).length;

    // 2. Count Transactions and Fixed Costs across ledgers
    let totalTransactions = 0;
    let totalFixedCosts = 0;
    let totalInflowVolume = 0;
    let totalExpenseVolume = 0;

    const ledgersDir = getUserLedgersDirectory();
    if (fs.existsSync(ledgersDir)) {
      try {
        const files = fs.readdirSync(ledgersDir);
        for (const f of files) {
          if (f.endsWith('.json')) {
            const ledger = safeReadJson<DatabaseSchema>(path.join(ledgersDir, f));
            if (ledger) {
              if (Array.isArray(ledger.transactions)) {
                totalTransactions += ledger.transactions.length;
                ledger.transactions.forEach((tx) => {
                  if (tx.type === 'income') totalInflowVolume += Number(tx.amount) || 0;
                  if (tx.type === 'expense') totalExpenseVolume += Number(tx.amount) || 0;
                });
              }
              if (Array.isArray(ledger.fixedCosts)) {
                totalFixedCosts += ledger.fixedCosts.length;
              }
            }
          }
        }
      } catch (err) {
        console.warn('[Kotojon] Error reading user ledgers directory:', err);
      }
    }

    // 3. Visitor Analytics
    const visitorData = getVisitorAnalytics();

    // 4. User roster details (sorted newest first, password/salt omitted)
    const userRoster = [...users]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((u) => ({
        id: u.id,
        email: u.email,
        createdAt: u.createdAt,
        onboardingCompleted: u.onboardingCompleted,
        name: u.profile?.name || 'Not set',
        occupation: u.profile?.occupation || 'Not set',
        monthlyIncome: u.profile?.monthlyIncome || 0,
        salaryDate: u.profile?.salaryDate || '',
      }));

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        onboardingPending: Math.max(0, totalUsers - activeUsers),
        totalVisits: visitorData.totalVisits || 0,
        uniqueVisitors: visitorData.uniqueVisitors || 0,
        todayVisits: visitorData.todayVisits || 0,
        totalTransactions,
        totalFixedCosts,
        totalInflowVolume,
        totalExpenseVolume,
        dailyHistory: visitorData.history || [],
        recentVisits: visitorData.recentVisits || [],
        userRoster,
        meta: {
          generatedAt: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'production',
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to retrieve stats',
      },
      { status: 500 }
    );
  }
}

