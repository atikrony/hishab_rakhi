import path from 'path';
import crypto from 'crypto';
import { DatabaseSchema } from './db';
import {
  getUserLedgersDirectory,
  getUsersFilePath,
  readUsersData,
  writeUsersData,
  readUserLedgerData,
  writeUserLedgerData,
} from './storage';

export interface OnboardingProfile {
  name: string;
  occupation: string;
  monthlyIncome: number;
  salaryDate: string;
  lastExpense: number;
}

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  onboardingCompleted: boolean;
  profile?: OnboardingProfile;
}

export function getAllUsers(): UserRecord[] {
  return readUsersData<UserRecord>();
}

export function saveUsers(users: UserRecord[]): void {
  writeUsersData<UserRecord>(users);
}

export function findUserByEmail(email: string): UserRecord | null {
  const users = getAllUsers();
  const normalized = email.trim().toLowerCase();
  return users.find((u) => u.email.toLowerCase() === normalized) || null;
}

export function findUserById(id: string): UserRecord | null {
  const users = getAllUsers();
  return users.find((u) => u.id === id) || null;
}

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function createUser(email: string, password: string): UserRecord {
  const existing = findUserByEmail(email);
  if (existing) {
    throw new Error('An account with this email already exists. Please log in.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const now = new Date().toISOString();

  const newUser: UserRecord = {
    id: `usr_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`,
    email: email.trim().toLowerCase(),
    passwordHash,
    salt,
    createdAt: now,
    onboardingCompleted: false,
  };

  const users = getAllUsers();
  users.push(newUser);
  saveUsers(users);

  // Initialize a blank solo ledger file for the new user
  const initialLedger = initializeBlankUserLedger(newUser.id, newUser.email);

  // Persist user and create dedicated user table in PostgreSQL
  import('./postgres')
    .then(({ saveUserToPostgres, createDedicatedUserTable }) => {
      saveUserToPostgres(newUser).catch(() => {});
      createDedicatedUserTable(newUser.id, newUser.email, initialLedger).catch(() => {});
    })
    .catch(() => {});

  return newUser;
}

export function verifyUserPassword(email: string, password: string): UserRecord | null {
  const user = findUserByEmail(email);
  if (!user) return null;

  const candidateHash = hashPassword(password, user.salt);
  const bufA = Buffer.from(candidateHash);
  const bufB = Buffer.from(user.passwordHash);

  if (bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)) {
    return user;
  }
  return null;
}

export function updateUserPassword(email: string, newPassword: string): boolean {
  const users = getAllUsers();
  const normalized = email.trim().toLowerCase();
  const index = users.findIndex((u) => u.email.toLowerCase() === normalized);
  if (index === -1) return false;

  const newSalt = crypto.randomBytes(16).toString('hex');
  const newHash = hashPassword(newPassword, newSalt);
  users[index].salt = newSalt;
  users[index].passwordHash = newHash;
  saveUsers(users);

  // Sync to Postgres if configured
  import('./postgres')
    .then(({ saveUserToPostgres }) => {
      saveUserToPostgres(users[index]).catch(() => {});
    })
    .catch(() => {});

  return true;
}

export function findOrCreateGoogleUser(
  email: string,
  name: string,
  avatar?: string
): UserRecord {
  const normalized = email.trim().toLowerCase();
  const existing = findUserByEmail(normalized);
  if (existing) {
    return existing;
  }

  // Create new user with random secure salt & hash
  const randomPassword = crypto.randomBytes(32).toString('hex');
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(randomPassword, salt);
  const now = new Date().toISOString();

  const newUser: UserRecord = {
    id: `usr_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`,
    email: normalized,
    passwordHash,
    salt,
    createdAt: now,
    onboardingCompleted: false,
    profile: {
      name: name || normalized.split('@')[0],
      occupation: '',
      monthlyIncome: 0,
      salaryDate: now.split('T')[0],
      lastExpense: 0,
    },
  };

  const users = getAllUsers();
  users.push(newUser);
  saveUsers(users);

  // Initialize a blank solo ledger file for the new user
  const initialLedger = initializeBlankUserLedger(newUser.id, newUser.email);
  if (avatar) {
    initialLedger.user.avatar = avatar;
    if (name) initialLedger.user.name = name;
    writeUserLedgerData(newUser.id, initialLedger);
  }

  import('./postgres')
    .then(({ saveUserToPostgres, createDedicatedUserTable }) => {
      saveUserToPostgres(newUser).catch(() => {});
      createDedicatedUserTable(newUser.id, newUser.email, initialLedger).catch(() => {});
    })
    .catch(() => {});

  return newUser;
}

export function getUserLedgerPath(userId: string): string {
  const safeId = (userId || '').replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(getUserLedgersDirectory(), `${safeId}.json`);
}

export function initializeBlankUserLedger(userId: string, email: string): DatabaseSchema {
  const template: DatabaseSchema = {
    user: {
      id: userId,
      name: email.split('@')[0],
      email: email,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`,
      plan: 'Solo Ledger',
      currency: 'BDT',
      currencySymbol: '৳',
    },
    wallets: [
      {
        id: 'wal_pocket',
        name: 'Main Pocket (Checking)',
        type: 'bank',
        balance: 0,
        accountNumber: '•••• 1001',
        color: '#16a36a',
      },
      {
        id: 'wal_vault',
        name: 'Reserve Vault',
        type: 'digital',
        balance: 0,
        accountNumber: '•••• 1002',
        color: '#006d44',
      },
      {
        id: 'wal_cash',
        name: 'Cash In Hand',
        type: 'cash',
        balance: 0,
        accountNumber: 'Cash Wallet',
        color: '#f59e0b',
      },
    ],
    transactions: [],
    savingsGoals: [],
    budgets: [
      { id: 'bgt_food', category: 'Food & Dining', monthlyLimit: 5000, spent: 0 },
      { id: 'bgt_bills', category: 'Bills & Utilities', monthlyLimit: 3000, spent: 0 },
      { id: 'bgt_transport', category: 'Transportation', monthlyLimit: 2000, spent: 0 },
    ],
    notifications: [
      {
        id: `notif_${Date.now()}`,
        title: 'Solo Account Created',
        message: 'Welcome to your private solo ledger on Hishab Rakhi.',
        date: new Date().toISOString(),
        read: false,
        type: 'info',
      },
    ],
  };

  writeUserLedgerData<DatabaseSchema>(userId, template);
  return template;
}

export function completeOnboarding(
  userId: string,
  profileData: OnboardingProfile
): { user: UserRecord; ledger: DatabaseSchema } {
  const users = getAllUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) {
    throw new Error('User not found');
  }

  const roundedIncome = Math.round(profileData.monthlyIncome);
  const roundedExpense = Math.round(profileData.lastExpense);

  const cleanProfile: OnboardingProfile = {
    name: profileData.name.trim(),
    occupation: profileData.occupation.trim(),
    monthlyIncome: roundedIncome,
    salaryDate: profileData.salaryDate,
    lastExpense: roundedExpense,
  };

  users[index].profile = cleanProfile;
  users[index].onboardingCompleted = true;
  saveUsers(users);

  // Initialize and populate their isolated solo ledger file
  const filePath = getUserLedgerPath(userId);
  const today = new Date().toISOString();

  // Initial pocket cash balance starts at: monthly income - last expense
  const pocketBalance = Math.max(0, roundedIncome - roundedExpense);

  const transactions = [];

  // Inflow transaction from Monthly Salary
  transactions.push({
    id: `tx_in_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    title: `${cleanProfile.occupation || 'Monthly'} Salary`,
    amount: roundedIncome,
    type: 'income' as const,
    category: 'Salary',
    date: new Date(cleanProfile.salaryDate).toISOString(),
    walletId: 'wal_pocket',
    notes: `Monthly income recorded during onboarding for ${cleanProfile.name}`,
    channel: 'Direct Deposit / Cash Payroll',
    sourceStream: 'Salary',
    status: 'Completed',
    brandIcon: 'payments',
  });

  // Expense transaction from Last Expense (if > 0)
  if (roundedExpense > 0) {
    transactions.push({
      id: `tx_out_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      title: 'Recent Outflow',
      amount: roundedExpense,
      type: 'expense' as const,
      category: 'Food & Dining',
      date: today,
      walletId: 'wal_pocket',
      notes: 'Initial expense recorded during account onboarding',
      status: 'Completed',
      brandIcon: 'receipt_long',
    });
  }

  const ledger: DatabaseSchema = {
    user: {
      id: userId,
      name: cleanProfile.name,
      email: users[index].email,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanProfile.name)}`,
      plan: 'Solo Ledger',
      currency: 'BDT',
      currencySymbol: '৳',
    },
    wallets: [
      {
        id: 'wal_pocket',
        name: 'Main Pocket (Checking)',
        type: 'bank',
        balance: pocketBalance,
        accountNumber: '•••• 1001',
        color: '#16a36a',
      },
      {
        id: 'wal_vault',
        name: 'Reserve Vault',
        type: 'digital',
        balance: 0,
        accountNumber: '•••• 1002',
        color: '#006d44',
      },
      {
        id: 'wal_cash',
        name: 'Cash In Hand',
        type: 'cash',
        balance: 0,
        accountNumber: 'Cash Wallet',
        color: '#f59e0b',
      },
    ],
    transactions,
    savingsGoals: [],
    budgets: [
      {
        id: 'bgt_food',
        category: 'Food & Dining',
        monthlyLimit: Math.round(roundedIncome * 0.3) || 5000,
        spent: roundedExpense,
      },
      {
        id: 'bgt_bills',
        category: 'Bills & Utilities',
        monthlyLimit: Math.round(roundedIncome * 0.2) || 3000,
        spent: 0,
      },
      {
        id: 'bgt_transport',
        category: 'Transportation',
        monthlyLimit: Math.round(roundedIncome * 0.15) || 2000,
        spent: 0,
      },
    ],
    notifications: [
      {
        id: `notif_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        title: 'Solo Ledger Active',
        message: `Welcome ${cleanProfile.name}! Your account is initialized with ৳${roundedIncome.toLocaleString()} monthly salary and ৳${roundedExpense.toLocaleString()} recent expense.`,
        date: today,
        read: false,
        type: 'success',
      },
    ],
  };

  writeUserLedgerData<DatabaseSchema>(userId, ledger);

  // Persist user profile and create dedicated user table in PostgreSQL
  import('./postgres')
    .then(({ saveUserToPostgres, createDedicatedUserTable }) => {
      saveUserToPostgres(users[index]).catch(() => {});
      createDedicatedUserTable(userId, users[index].email, ledger, cleanProfile).catch(() => {});
    })
    .catch(() => {});

  return {
    user: users[index],
    ledger,
  };
}

export async function completeOnboardingAsync(
  userId: string,
  profileData: OnboardingProfile
): Promise<{ user: UserRecord; ledger: DatabaseSchema }> {
  const result = completeOnboarding(userId, profileData);
  try {
    const { createDedicatedUserTable, saveUserToPostgres } = await import('./postgres');
    await saveUserToPostgres(result.user);
    await createDedicatedUserTable(userId, result.user.email, result.ledger, result.user.profile);
  } catch (err: any) {
    console.warn('[Postgres Dedicated User Table Async notice]:', err.message);
  }
  return result;
}

