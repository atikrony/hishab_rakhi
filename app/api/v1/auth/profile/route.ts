import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/security';
import { findUserByIdAsync, formatEmailToActualName, getAllUsers, saveUsers } from '@/lib/auth';
import { getDbAsync, saveDbAsync } from '@/lib/db';

const MAX_AVATAR_CHARS = 200_000; // ~150 KB image; the client resizes to 256px first
const AVATAR_DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;
const initialsAvatar = (name: string) =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
const isGeneratedAvatar = (url?: string) => !url || url.startsWith('https://api.dicebear.com/');

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
        // Keep an uploaded / Google photo; only regenerate the initials avatar
        if (isGeneratedAvatar(db.user.avatar)) db.user.avatar = initialsAvatar(trimmed);
        nameUpdated = true;
      }
    }
    if (body.occupation && typeof body.occupation === 'string') {
      db.user.occupation = body.occupation.trim().substring(0, 100);
    }
    if (body.removeAvatar === true) {
      db.user.avatar = initialsAvatar(db.user.name || 'User');
    } else if (typeof body.avatar === 'string' && body.avatar) {
      const avatar = body.avatar.trim();
      if (avatar.startsWith('data:')) {
        if (avatar.length > MAX_AVATAR_CHARS || !AVATAR_DATA_URL.test(avatar)) {
          return NextResponse.json(
            { success: false, error: 'Image must be a JPG, PNG or WebP under 150 KB.' },
            { status: 400 }
          );
        }
        db.user.avatar = avatar;
      } else if (avatar.startsWith('https://')) {
        db.user.avatar = avatar.substring(0, 500);
      }
    }
    if (body.salaryDate && typeof body.salaryDate === 'string') {
      db.user.salaryDate = body.salaryDate.trim().substring(0, 50);
    }

    // Salary + payday (drives the automatic monthly salary credit)
    let salaryUpdated = false;
    if (body.monthlyIncome !== undefined || body.salaryDay !== undefined) {
      const oldIncome = Math.round(Number(db.user.monthlyIncome) || 0);
      const oldDay = db.user.salaryDay;
      const income = body.monthlyIncome === undefined ? oldIncome : Number(body.monthlyIncome);
      const day =
        body.salaryDay === undefined ? oldDay : body.salaryDay === null ? undefined : Number(body.salaryDay);

      if (!Number.isInteger(income) || income < 0 || income > 1_000_000_000) {
        return NextResponse.json({ success: false, error: 'Enter a valid salary amount.' }, { status: 400 });
      }
      if (day !== undefined && (!Number.isInteger(day) || day < 1 || day > 31)) {
        return NextResponse.json({ success: false, error: 'Payday must be a day between 1 and 31.' }, { status: 400 });
      }

      const wasActive = oldIncome > 0 && !!oldDay;
      const isActive = income > 0 && !!day;
      // Starting (or moving) the schedule only credits paydays from now on
      if (isActive && (!wasActive || day !== oldDay)) {
        db.user.salaryAutoFrom = new Date().toISOString();
      }
      db.user.monthlyIncome = income;
      db.user.salaryDay = day;
      salaryUpdated = true;
    }

    await saveDbAsync(db, session.userId);

    if (salaryUpdated) {
      try {
        const record = await findUserByIdAsync(session.userId);
        if (record) {
          record.profile = {
            name: record.profile?.name || db.user.name,
            occupation: record.profile?.occupation || '',
            salaryDate: record.profile?.salaryDate || '',
            lastExpense: record.profile?.lastExpense || 0,
            monthlyIncome: db.user.monthlyIncome || 0,
          };
          const users = getAllUsers();
          const uIdx = users.findIndex((u) => u.id === record.id);
          if (uIdx !== -1) users[uIdx] = record;
          else users.push(record);
          saveUsers(users);
          const { saveUserToPostgres } = await import('@/lib/postgres');
          await saveUserToPostgres(record);
        }
      } catch (e) {}
    }

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
