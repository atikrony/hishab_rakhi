import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, resetDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    return NextResponse.json({
      success: true,
      data: db,
      meta: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Export failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, importedData } = body;

    if (action === 'reset') {
      const resetData = resetDb();
      return NextResponse.json({
        success: true,
        data: resetData,
        message: 'Database reset to prototype initial state successfully',
      });
    }

    if (action === 'import' && importedData) {
      saveDb(importedData);
      return NextResponse.json({
        success: true,
        message: 'Data imported successfully',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Expected "reset" or "import"' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Data operation failed' },
      { status: 500 }
    );
  }
}

