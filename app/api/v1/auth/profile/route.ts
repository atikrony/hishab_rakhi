import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/security';
import { findUserById } from '@/lib/auth';
import { getDbAsync, saveDbAsync } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const user = findUserById(session.userId);
    const db = await getDbAsync(session.userId);

    return NextResponse.json({
      success: true,
      data: {
        ...db.user,
        email: user?.email || db.user.email,
        onboardingCompleted: user?.onboardingCompleted ?? true,
        occupation: db.user.occupation || user?.profile?.occupation || '',
        monthlyIncome: db.user.monthlyIncome !== undefined ? db.user.monthlyIncome : user?.profile?.monthlyIncome || 0,
        salaryDate: db.user.salaryDate || user?.profile?.salaryDate || '',
        lastExpense: db.user.lastExpense !== undefined ? db.user.lastExpense : user?.profile?.lastExpense || 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const db = await getDbAsync(session.userId);

    // Whitelist allowed fields to prevent mass assignment
    if (body.name && typeof body.name === 'string') {
      db.user.name = body.name.trim().substring(0, 100);
    }
    if (body.occupation && typeof body.occupation === 'string') {
      db.user.occupation = body.occupation.trim().substring(0, 100);
    }
    if (body.avatar && typeof body.avatar === 'string' && body.avatar.startsWith('https://')) {
      db.user.avatar = body.avatar.trim().substring(0, 500);
    }
    if (body.salaryDate && typeof body.salaryDate === 'string') {
      db.user.salaryDate = body.salaryDate.trim().substring(0, 50);
    }

    await saveDbAsync(db, session.userId);

    return NextResponse.json({
      success: true,
      data: db.user,
      message: 'Profile updated successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
