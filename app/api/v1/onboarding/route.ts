import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, sanitizeString, sanitizeAmount } from '@/lib/security';
import { completeOnboardingAsync } from '@/lib/auth';
import { signSession, SESSION_COOKIE_NAME } from '@/lib/auth-token';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please register or sign in first.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawName = sanitizeString(body.name, 60);
    const rawOccupation = sanitizeString(body.occupation, 60);
    const monthlyIncome = sanitizeAmount(body.monthlyIncome, 1);
    const lastExpense = sanitizeAmount(body.lastExpense, 0); // Can be 0 if no recent expense
    const salaryDate = body.salaryDate;

    if (!rawName) {
      return NextResponse.json(
        { success: false, error: 'Please enter your full name.' },
        { status: 400 }
      );
    }

    if (!rawOccupation) {
      return NextResponse.json(
        { success: false, error: 'Please enter your occupation / profession.' },
        { status: 400 }
      );
    }

    if (monthlyIncome === null || monthlyIncome <= 0) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid monthly salary/income (greater than 0).' },
        { status: 400 }
      );
    }

    if (lastExpense === null || lastExpense < 0) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid last expense amount (0 or more).' },
        { status: 400 }
      );
    }

    if (!salaryDate || typeof salaryDate !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Please select your salary date.' },
        { status: 400 }
      );
    }

    // Enforce no future salary date
    const today = new Date().toISOString().split('T')[0];
    const cleanSalaryDate = salaryDate.split('T')[0];
    if (cleanSalaryDate > today) {
      return NextResponse.json(
        { success: false, error: 'Future dates are not permitted. Please select today or a past date.' },
        { status: 400 }
      );
    }

    // Complete onboarding and initialize solo ledger in PostgreSQL
    const { user, ledger } = await completeOnboardingAsync(session.userId, {
      name: rawName,
      occupation: rawOccupation,
      monthlyIncome: Math.round(monthlyIncome),
      salaryDate: cleanSalaryDate,
      lastExpense: Math.round(lastExpense),
    });

    // Refresh session cookie with onboardingCompleted = true
    const updatedToken = await signSession({
      userId: user.id,
      email: user.email,
      name: rawName,
      onboardingCompleted: true,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        profile: user.profile,
        ledger,
      },
      message: 'Onboarding complete! Your solo ledger is ready.',
    });

    response.cookies.set(SESSION_COOKIE_NAME, updatedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Onboarding failed' },
      { status: 500 }
    );
  }
}

