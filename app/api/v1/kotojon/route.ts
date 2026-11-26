import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getAllUsers } from '@/lib/auth';
import { getVisitorAnalytics } from '@/lib/visitor';
import { getUserLedgersDirectory, getDataStorageDirectory, safeReadJson } from '@/lib/storage';
import { DatabaseSchema, getActiveDbConfig } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/security';
import { isAdminEmail } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || !isAdminEmail(session.email)) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  try {
    // 1. Gather Users from JSON Storage
    const jsonUsers = getAllUsers();

    // 2. Gather Users & Stats from PostgreSQL (if available/configured)
    let pgUsers: any[] = [];
    let pgStats: any = {
      connected: false,
      userCount: 0,
      ledgerCount: 0,
      tables: [],
      totalTransactions: 0,
      totalFixedCosts: 0,
      totalInflow: 0,
      totalExpense: 0,
    };

    try {
      const { getAllUsersFromPostgres, getPostgresMasterStats } = await import('@/lib/postgres');
      pgStats = await getPostgresMasterStats();
      if (pgStats.connected) {
        pgUsers = await getAllUsersFromPostgres();
      }
    } catch (err) {
      // Safe fallback when postgres driver or service is not running
    }

    // Merge users without duplicates (keyed by lowercase email)
    const usersMap = new Map<string, any>();
    jsonUsers.forEach((u) => usersMap.set(u.email.toLowerCase(), u));
    pgUsers.forEach((u) => usersMap.set(u.email.toLowerCase(), u));
    const mergedUsers = Array.from(usersMap.values());

    const totalUsers = mergedUsers.length;
    const activeUsers = mergedUsers.filter((u) => u.onboardingCompleted).length;

    // 3. Count Transactions and Fixed Costs across ledgers
    let totalTransactions = pgStats.totalTransactions || 0;
    let totalFixedCosts = pgStats.totalFixedCosts || 0;
    let totalInflowVolume = pgStats.totalInflow || 0;
    let totalExpenseVolume = pgStats.totalExpense || 0;
    let ledgerFilesCount = pgStats.ledgerCount || 0;

    const ledgersDir = getUserLedgersDirectory();
    if (fs.existsSync(ledgersDir)) {
      try {
        const files = fs.readdirSync(ledgersDir);
        for (const f of files) {
          if (f.endsWith('.json')) {
            ledgerFilesCount++;
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

    // If no user ledgers found, also inspect active base database (hishab_real.json / hishab_dummy.json)
    const dbConfig = getActiveDbConfig();
    const activeDiskDb = safeReadJson<DatabaseSchema>(dbConfig.filePath);
    if (activeDiskDb) {
      if (Array.isArray(activeDiskDb.transactions) && totalTransactions === 0) {
        totalTransactions += activeDiskDb.transactions.length;
        activeDiskDb.transactions.forEach((tx) => {
          if (tx.type === 'income') totalInflowVolume += Number(tx.amount) || 0;
          if (tx.type === 'expense') totalExpenseVolume += Number(tx.amount) || 0;
        });
      }
      if (Array.isArray(activeDiskDb.fixedCosts) && totalFixedCosts === 0) {
        totalFixedCosts += activeDiskDb.fixedCosts.length;
      }
    }

    // 4. Visitor Analytics
    const visitorData = getVisitorAnalytics();

    // 5. User roster details (sorted newest first, password/salt omitted)
    const { formatEmailToActualName } = await import('@/lib/auth');
    const userRoster = [...mergedUsers]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((u) => {
        let actualName = u.profile?.name?.trim();
        if (!actualName || actualName.toLowerCase().startsWith('usr_') || actualName === 'Not set' || actualName === 'Solo User') {
          actualName = formatEmailToActualName(u.email);
        }
        return {
          id: u.id,
          email: u.email,
          createdAt: u.createdAt,
          onboardingCompleted: u.onboardingCompleted,
          name: actualName,
          occupation: u.profile?.occupation || 'Not set',
          monthlyIncome: u.profile?.monthlyIncome || 0,
          salaryDate: u.profile?.salaryDate || '',
        };
      });

    // 6. Comprehensive Database Information
    const databaseInfo = {
      engine: pgStats.connected ? 'PostgreSQL' : 'Local JSON File Database',
      isPostgresConnected: Boolean(pgStats.connected),
      databaseName: pgStats.connected ? pgStats.database : dbConfig.fileName,
      databaseMode: dbConfig.mode, // 'dummy' | 'real'
      databaseFilePath: dbConfig.filePath,
      storageDirectory: getDataStorageDirectory(),
      connectionStatus: pgStats.connected
        ? `Connected to ${pgStats.database}`
        : `Active (${dbConfig.mode.toUpperCase()} MODE)`,
      tables:
        pgStats.connected && pgStats.tables.length > 0
          ? pgStats.tables
          : ['users', 'user_ledgers', 'wallets', 'transactions', 'fixed_costs', 'budgets', 'visitors'],
      userCount: totalUsers,
      ledgerCount: Math.max(ledgerFilesCount, pgStats.ledgerCount),
      transactionCount: totalTransactions,
      fixedCostCount: totalFixedCosts,
      inflowVolume: totalInflowVolume,
      expenseVolume: totalExpenseVolume,
      netVolume: totalInflowVolume - totalExpenseVolume,
      serverTime: new Date().toISOString(),
    };

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
        databaseInfo,
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
