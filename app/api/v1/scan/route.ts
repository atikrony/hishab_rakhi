import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { Transaction } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { receiptImage, receiptText, autoAdd = false } = body;

    // Simulate smart OCR & item recognition engine
    const sampleReceipts = [
      {
        merchant: 'Starbucks Coffee',
        amount: 4.85,
        category: 'Food',
        brandIcon: 'coffee' as const,
        notes: 'Caramel Macchiato & Croissant',
        confidence: 0.98,
      },
      {
        merchant: 'Target Supercenter',
        amount: 42.6,
        category: 'Shopping',
        brandIcon: 'shopping' as const,
        notes: 'Household essentials & snacks',
        confidence: 0.95,
      },
      {
        merchant: 'Uber Ride',
        amount: 18.25,
        category: 'Transport',
        brandIcon: 'default' as const,
        notes: 'Downtown to Office trip',
        confidence: 0.96,
      },
      {
        merchant: 'Pharmacy & Wellness',
        amount: 22.4,
        category: 'Health',
        brandIcon: 'default' as const,
        notes: 'Vitamins and prescriptions',
        confidence: 0.94,
      },
    ];

    // Pick receipt based on input or randomize
    let parsed = sampleReceipts[0];
    if (receiptText) {
      const lower = receiptText.toLowerCase();
      if (lower.includes('coffee') || lower.includes('latte') || lower.includes('starbucks')) {
        parsed = sampleReceipts[0];
      } else if (lower.includes('target') || lower.includes('grocery') || lower.includes('market')) {
        parsed = sampleReceipts[1];
      } else if (lower.includes('uber') || lower.includes('ride') || lower.includes('taxi')) {
        parsed = sampleReceipts[2];
      }
    } else {
      parsed = sampleReceipts[Math.floor(Math.random() * sampleReceipts.length)];
    }

    let createdTransaction: Transaction | null = null;

    if (autoAdd) {
      const db = getDb();
      createdTransaction = {
        id: `tx_scan_${Date.now()}`,
        title: parsed.merchant,
        amount: parsed.amount,
        type: 'expense',
        category: parsed.category as any,
        date: new Date().toISOString(),
        walletId: db.wallets[0]?.id || 'wal_main',
        notes: `Scanned receipt: ${parsed.notes}`,
        brandIcon: parsed.brandIcon,
      };

      if (db.wallets[0]) {
        db.wallets[0].balance -= parsed.amount;
      }

      db.transactions.unshift(createdTransaction);
      saveDb(db);
    }

    return NextResponse.json({
      success: true,
      data: {
        receipt: {
          ...parsed,
          scannedAt: new Date().toISOString(),
        },
        transaction: createdTransaction,
      },
      message: 'Receipt parsed successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to scan receipt' },
      { status: 500 }
    );
  }
}

