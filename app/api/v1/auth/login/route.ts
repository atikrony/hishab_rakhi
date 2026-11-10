import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email = 'naufal@example.com', password = 'password123' } = body;

    const db = getDb();

    // Generate mock production-grade token
    const mockToken = `hr_live_${Buffer.from(`${db.user.id}:${Date.now()}`).toString('base64')}`;
    const apiKey = `key_sec_${Math.random().toString(36).substring(2, 14)}`;

    return NextResponse.json({
      success: true,
      data: {
        token: mockToken,
        tokenType: 'Bearer',
        expiresIn: 604800, // 7 days in seconds
        apiKey,
        user: db.user,
      },
      message: 'Mobile login authentication successful',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Authentication failed' },
      { status: 500 }
    );
  }
}

