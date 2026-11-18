import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/security';
import { findUserByIdAsync, formatEmailToActualName, getAllUsers, saveUsers } from '@/lib/auth';
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

    const user = await findUserByIdAsync(session.userId);
    const db = await getDbAsync(session.userId);

    let cleanName = db.user.name;
    if (
      !cleanName ||
      cleanName.toLowerCase().startsWith('usr_') ||
      cleanName === 'Not set' ||
      cleanName === 'Solo User'
    ) {
      cleanName =
        (user?.profile?.name && !user.profile.name.toLowerCase().startsWith('usr_'))
          ? user.profile.name
          : formatEmailToActualName(user?.email || db.user.email || '');
      db.user.name = cleanName;
      db.user.avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...db.user,
        name: cleanName,
        email: user?.email || db.user.email,
        onboardingCompleted: user ? user.onboardingCompleted : (session.onboardingCompleted ?? false),
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
    let nameUpdated = false;
    if (body.name && typeof body.name === 'string') {
      const trimmed = body.name.trim().substring(0, 100);
      if (trimmed && !trimmed.toLowerCase().startsWith('usr_')) {
        db.user.name = trimmed;
        db.user.avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(trimmed)}`;
        nameUpdated = true;
      }
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

    // Sync updated name to user registry
    if (nameUpdated) {
      try {
        const users = getAllUsers();
        const uIdx = users.findIndex((u) => u.id === session.userId);
        if (uIdx !== -1 && users[uIdx].profile) {
          users[uIdx].profile!.name = db.user.name;
          saveUsers(users);
        }
      } catch (e) {}
    }

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
