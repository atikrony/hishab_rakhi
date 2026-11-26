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
  /**
   * false = signed up with email/password and has not confirmed the address yet.
   * undefined = account predates email verification (treated as verified).
   */
  emailVerified?: boolean;
  profile?: OnboardingProfile;
}

export function isEmailVerified(user: UserRecord): boolean {
  return user.emailVerified !== false;
}

export function formatEmailToActualName(email: string): string {
  if (!email || !email.includes('@')) return 'Solo User';
  const localPart = email.split('@')[0];
  const clean = localPart.replace(/[\._\-0-9]+/g, ' ').trim();
  if (!clean || clean.toLowerCase().startsWith('usr_')) {
    const rawLocal = email.split('@')[0].replace(/[^a-zA-Z]/g, '');
    return rawLocal ? rawLocal.charAt(0).toUpperCase() + rawLocal.slice(1).toLowerCase() : 'Solo User';
  }
  return clean
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
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

export async function findUserByEmailAsync(email: string): Promise<UserRecord | null> {
  const local = findUserByEmail(email);
  if (local) return local;

  try {
    const { findUserByEmailFromPostgres } = await import('./postgres');
    const pgUser = await findUserByEmailFromPostgres(email);
    if (pgUser) {
      const users = getAllUsers();
      if (!users.some((u) => u.id === pgUser.id)) {
        users.push(pgUser);
        saveUsers(users);
      }
      return pgUser;
    }
  } catch (err) {
    // safe fallback
  }

  return null;
}

export function findUserById(id: string): UserRecord | null {
  const users = getAllUsers();
  return users.find((u) => u.id === id) || null;
}

export async function findUserByIdAsync(id: string): Promise<UserRecord | null> {
  const local = findUserById(id);
  if (local) return local;

  try {
    const { getPostgresPool, isPostgresAvailable } = await import('./postgres');
    if (isPostgresAvailable()) {
      const pool = getPostgresPool();
      const res = await pool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
      if (res.rows.length > 0) {
        const row = res.rows[0];
        const pgUser: UserRecord = {
          id: row.id,
          email: row.email,
          passwordHash: row.password_hash,
          salt: row.salt,
          createdAt: row.created_at,
          onboardingCompleted: row.onboarding_completed,
          emailVerified: typeof row.email_verified === 'boolean' ? row.email_verified : undefined,
          profile: row.name
            ? {
                name: row.name,
                occupation: row.occupation || '',
                monthlyIncome: Number(row.monthly_income) || 0,
                salaryDate: row.salary_date || '',
                lastExpense: Number(row.last_expense) || 0,
              }
            : undefined,
        };
        const users = getAllUsers();
        if (!users.some((u) => u.id === pgUser.id)) {
          users.push(pgUser);
          saveUsers(users);
        }
        return pgUser;
      }
    }
  } catch (err) {
    // safe fallback
  }

  return null;
}

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function createUser(email: string, password: string, name?: string): UserRecord {
  const existing = findUserByEmail(email);
  if (existing) {
    throw new Error('An account with this email already exists. Please log in.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const now = new Date().toISOString();
  const actualName = (name && name.trim()) || formatEmailToActualName(email);

  const newUser: UserRecord = {
    id: `usr_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`,
    email: email.trim().toLowerCase(),
    passwordHash,
    salt,
    createdAt: now,
    onboardingCompleted: false,
    emailVerified: false,
    profile: {
      name: actualName,
      occupation: '',
      monthlyIncome: 0,
      salaryDate: '',
      lastExpense: 0,
    },
  };

  const users = getAllUsers();
  users.push(newUser);
  saveUsers(users);

  // Initialize a blank solo ledger file for the new user with actual name
  const initialLedger = initializeBlankUserLedger(newUser.id, newUser.email, actualName);

  // Persist user and create dedicated user table in PostgreSQL
  import('./postgres')
    .then(({ saveUserToPostgres, createDedicatedUserTable }) => {
      saveUserToPostgres(newUser).catch(() => {});
      createDedicatedUserTable(newUser.id, newUser.email, initialLedger, newUser.profile).catch(() => {});
    })
    .catch(() => {});

  return newUser;
}

export async function createUserAsync(email: string, password: string, name?: string): Promise<UserRecord> {
  const existing = await findUserByEmailAsync(email);
  if (existing) {
    throw new Error('An account with this email already exists. Please log in.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const now = new Date().toISOString();
  const actualName = (name && name.trim()) || formatEmailToActualName(email);

  const newUser: UserRecord = {
    id: `usr_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`,
    email: email.trim().toLowerCase(),
    passwordHash,
    salt,
    createdAt: now,
    onboardingCompleted: false,
    emailVerified: false,
    profile: {
      name: actualName,
      occupation: '',
      monthlyIncome: 0,
      salaryDate: '',
      lastExpense: 0,
    },
  };

  const users = getAllUsers();
  users.push(newUser);
  saveUsers(users);

  // Initialize a blank solo ledger file for the new user with actual name
  const initialLedger = initializeBlankUserLedger(newUser.id, newUser.email, actualName);

  try {
    const { saveUserToPostgres, createDedicatedUserTable } = await import('./postgres');
    await saveUserToPostgres(newUser);
    await createDedicatedUserTable(newUser.id, newUser.email, initialLedger, newUser.profile);
  } catch (err) {
    // safe fallback
  }

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

export async function verifyUserPasswordAsync(email: string, password: string): Promise<UserRecord | null> {
  const user = await findUserByEmailAsync(email);
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

/**
 * Looks the user up in local storage AND Postgres before creating one, so a
 * returning Google user on a fresh serverless instance keeps their account.
 */
export async function findOrCreateGoogleUserAsync(
  email: string,
  name: string,
  avatar?: string
): Promise<UserRecord> {
  const existing = await findUserByEmailAsync(email.trim().toLowerCase());
  if (existing) {
    // Signing in with Google proves ownership of the address
    if (existing.emailVerified === false) {
      return (await markEmailVerifiedAsync(existing.email)) || existing;
    }
    return existing;
  }
  const newUser = findOrCreateGoogleUser(email, name, avatar, false);

  // Await the Postgres write: on serverless hosts the function can be frozen
  // right after the response, so a fire-and-forget save may never finish.
  try {
    const { saveUserToPostgres, createDedicatedUserTable } = await import('./postgres');
    const ledger = initializeBlankUserLedger(newUser.id, newUser.email, newUser.profile?.name);
    if (avatar) ledger.user.avatar = avatar;
    await saveUserToPostgres(newUser);
    await createDedicatedUserTable(newUser.id, newUser.email, ledger, newUser.profile);
  } catch (err) {
    console.error('[Google user Postgres save failed]:', (err as any)?.message);
  }
  return newUser;
}

export function findOrCreateGoogleUser(
  email: string,
  name: string,
  avatar?: string,
  syncPostgres = true
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
    emailVerified: true, // Google has already verified the address
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

  if (syncPostgres) {
    import('./postgres')
      .then(({ saveUserToPostgres, createDedicatedUserTable }) => {
        saveUserToPostgres(newUser).catch(() => {});
        createDedicatedUserTable(newUser.id, newUser.email, initialLedger).catch(() => {});
      })
      .catch(() => {});
  }

  return newUser;
}

export function getUserLedgerPath(userId: string): string {
  const safeId = (userId || '').replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(getUserLedgersDirectory(), `${safeId}.json`);
}

export function initializeBlankUserLedger(userId: string, email: string, name?: string): DatabaseSchema {
  let safeName = name?.trim();
  if (!safeName || safeName.toLowerCase().startsWith('usr_') || safeName === 'Not set' || safeName === 'Solo User') {
    safeName = formatEmailToActualName(email);
  }
  const template: DatabaseSchema = {
    user: {
      id: userId,
      name: safeName,
      email: email,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(safeName)}`,
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
    fixedCosts: [],
  };

  writeUserLedgerData<DatabaseSchema>(userId, template);
  return template;
}

/**
 * Marks the first-run tour as finished (stored in the existing
 * onboarding_completed flag, so it survives across devices).
 */
export async function markTourCompletedAsync(userId: string): Promise<boolean> {
  const user = await findUserByIdAsync(userId);
  if (!user) return false;
  if (user.onboardingCompleted) return true;
  user.onboardingCompleted = true;
  const users = getAllUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx !== -1) users[idx].onboardingCompleted = true;
  else users.push(user);
  saveUsers(users);
  try {
    const { saveUserToPostgres } = await import('./postgres');
    await saveUserToPostgres(user);
  } catch {
    /* file store already updated */
  }
  return true;
}


/** Marks the account's email as confirmed in local storage and Postgres. */
export async function markEmailVerifiedAsync(email: string): Promise<UserRecord | null> {
  const user = await findUserByEmailAsync(email);
  if (!user) return null;
  user.emailVerified = true;

  const users = getAllUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx >= 0) users[idx].emailVerified = true;
  else users.push(user);
  saveUsers(users);

  try {
    const { saveUserToPostgres } = await import('./postgres');
    await saveUserToPostgres(user);
  } catch {
    // Postgres optional
  }
  return user;
}
