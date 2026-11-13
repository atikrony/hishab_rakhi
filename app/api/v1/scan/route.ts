import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDbAsync, saveDbAsync } from '@/lib/db';
import { Transaction } from '@/lib/types';
import { getSessionFromRequest, sanitizeString } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const { receiptImage, receiptText, autoAdd = false } = body;

    // Reject oversized image payloads to protect memory against DOS
    if (receiptImage && typeof receiptImage === 'string' && receiptImage.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Receipt image too large. Max allowed size is 5MB.' },
        { status: 413 }
      );
    }

    const cleanReceiptText = sanitizeString(receiptText, 500);

    // Simulate smart OCR & item recognition engine with integer BDT amounts
    const sampleReceipts = [
      {
        merchant: 'North End Coffee Roasters',
        amount: 520,
        category: 'Food & Dining',
        brandIcon: 'local_cafe' as const,
        notes: 'Caramel Macchiato & Cinnamon Roll',
        confidence: 0.98,
      },
      {
        merchant: 'Shwapno Supercenter',
        amount: 2450,
        category: 'Food & Dining',
        brandIcon: 'local_grocery_store' as const,
        notes: 'Household groceries & essentials',
        confidence: 0.95,
      },
      {
        merchant: 'Uber / Pathao Ride',
        amount: 380,
        category: 'Transportation',
        brandIcon: 'commute' as const,
        notes: 'Gulshan to Dhanmondi trip',
        confidence: 0.96,
      },
      {
        merchant: 'Lazz Pharma',
        amount: 850,
        category: 'Health & Meds',
        brandIcon: 'prescriptions' as const,
        notes: 'Prescription medicines & vitamins',
        confidence: 0.94,
      },
    ];

    // Pick receipt based on input or cryptographically secure random selection
    let parsed = sampleReceipts[0];
    if (cleanReceiptText) {
      const lower = cleanReceiptText.toLowerCase();
      if (lower.includes('coffee') || lower.includes('latte') || lower.includes('tea')) {
        parsed = sampleReceipts[0];
      } else if (lower.includes('shwapno') || lower.includes('grocery') || lower.includes('supercenter')) {
        parsed = sampleReceipts[1];
      } else if (lower.includes('uber') || lower.includes('ride') || lower.includes('pathao')) {
        parsed = sampleReceipts[2];
      } else if (lower.includes('pharma') || lower.includes('med') || lower.includes('health')) {
        parsed = sampleReceipts[3];
      }
    } else {
      const idx = crypto.randomInt(0, sampleReceipts.length);
      parsed = sampleReceipts[idx];
    }

    let createdTransaction: Transaction | null = null;

    if (autoAdd) {
      const db = await getDbAsync(session.userId);
      const roundedScanAmount = Math.round(parsed.amount);
      createdTransaction = {
        id: `tx_scan_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        title: parsed.merchant,
        amount: roundedScanAmount,
        type: 'expense',
        category: parsed.category as any,
        date: new Date().toISOString(),
        walletId: db.wallets[0]?.id || 'wal_pocket',
        notes: `Scanned receipt: ${parsed.notes}`,
        brandIcon: parsed.brandIcon,
      };

      if (db.wallets[0]) {
        db.wallets[0].balance -= roundedScanAmount;
      }

      db.transactions.unshift(createdTransaction);
      await saveDbAsync(db, session.userId);
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

