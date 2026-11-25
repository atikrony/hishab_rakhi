import { Pool, PoolConfig } from 'pg';
import { DatabaseSchema } from './db';
import { OnboardingProfile, UserRecord } from './auth';

/**
 * Hishab Rakhi - PostgreSQL Engine & DBeaver Direct Control Layer
 * 
 * Features:
 * 1. Dedicated separate table per user: `user_${userId}`
 * 2. Single-row storage pattern: `user - data - data`
 * 3. Bi-directional DBeaver synchronization: Edits in DBeaver are immediately visible in the Next.js app.
 * 4. Consolidated master tables: `users` and `user_ledgers`
 * 5. Robust offline / disconnected fallback without crashing the app.
 */

let globalPool: Pool | null = null;
let isSchemaInitialized = false;

export function getPostgresPoolConfig(): PoolConfig {
  const user = process.env.PGUSER || 'postgres';
  const password = process.env.PGPASSWORD || 'postgres';
  const host = process.env.PGHOST || 'localhost';
  const port = process.env.PGPORT || '5432';
  const database = process.env.PGDATABASE || 'hishab_rakhi';

  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.PG_CONNECTION_STRING ||
    `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;

  const isLocal =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');

  return {
    connectionString,
    // Enable SSL for remote providers (Neon, Supabase, Render, Railway, AWS RDS)
    ssl: isLocal
      ? false
      : {
          rejectUnauthorized: false,
        },
    connectionTimeoutMillis: 3500,
    idleTimeoutMillis: 15000,
    max: 10,
  };
}

let lastConnectFailureTime = 0;
const FAILURE_COOLDOWN_MS = 25000; // 25s backoff when PostgreSQL server is offline

export function isPostgresAvailable(): boolean {
  if (!isPostgresConfigured()) return false;
  if (Date.now() - lastConnectFailureTime < FAILURE_COOLDOWN_MS) {
    return false; // Skip attempting until cooldown passes to avoid request latency
  }
  return true;
}

function handlePostgresError(context: string, err: any) {
  lastConnectFailureTime = Date.now();
  if (err?.message) {
    console.warn(`[Postgres ${context}]:`, err.message);
  }
}

export function getPostgresPool(): Pool {
  if (!globalPool) {
    const config = getPostgresPoolConfig();
    globalPool = new Pool(config);

    globalPool.on('error', (err) => {
      handlePostgresError('Pool Error', err);
    });
  }
  return globalPool;
}

export function isPostgresConfigured(): boolean {
  if (process.env.USE_POSTGRES === 'false') return false;

  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT ||
    process.env.VERCEL_ENV
  );

  const connStr =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.PG_CONNECTION_STRING ||
    '';

  if (isServerless) {
    // In serverless (Vercel), only enable if a real remote connection string is provided
    if (!connStr || connStr.includes('localhost') || connStr.includes('127.0.0.1')) {
      return false;
    }
  }

  return Boolean(
    connStr ||
    process.env.PGHOST ||
    process.env.USE_POSTGRES === 'true'
  );
}

/**
 * Sanitizes user ID and actual name into a friendly, valid PostgreSQL table name.
 * e.g., 'usr_1731339891000_abcde', 'Atiqur' -> 'user_atiqur_abcde'
 */
export function getSafeUserTableName(userId: string, nameOrEmail?: string): string {
  const shortId = (userId || '').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toLowerCase();
  if (nameOrEmail) {
    const raw = nameOrEmail.includes('@') ? nameOrEmail.split('@')[0] : nameOrEmail;
    const clean = raw
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_')
      .substring(0, 20);
    if (clean && !clean.startsWith('usr_') && clean !== 'solo_user' && clean !== 'guest') {
      return `user_${clean}_${shortId || 'live'}`;
    }
  }

  const sanitized = (userId || '')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^_+/, '');
  return `user_${sanitized || 'guest'}`;
}

/**
 * Checks connection health to PostgreSQL.
 */
export async function checkPostgresConnection(): Promise<{
  connected: boolean;
  database?: string;
  error?: string;
}> {
  if (!isPostgresAvailable()) {
    return {
      connected: false,
      error: 'PostgreSQL connection offline or cooling down',
    };
  }

  try {
    const pool = getPostgresPool();
    const client = await pool.connect();
    lastConnectFailureTime = 0; // reset on success
    try {
      const res = await client.query('SELECT current_database() as db_name, NOW() as current_time');
      return {
        connected: true,
        database: res.rows[0]?.db_name || 'hishab_rakhi',
      };
    } finally {
      client.release();
    }
  } catch (err: any) {
    handlePostgresError('Connection Health Check', err);
    return {
      connected: false,
      error: err?.message || 'Failed to connect to PostgreSQL',
    };
  }
}

/**
 * Initializes the master tables in PostgreSQL:
 * 1. `users`: Master authentication & account index
 * 2. `user_ledgers`: Master consolidated data view for all users in DBeaver
 */
export async function initPostgresSchema(): Promise<boolean> {
  if (isSchemaInitialized) return true;
  if (!isPostgresAvailable()) return false;

  try {
    const pool = getPostgresPool();
    const client = await pool.connect();
    lastConnectFailureTime = 0; // reset on success

    try {
      await client.query('BEGIN');

      // 1. Master users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(100) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          salt VARCHAR(255) NOT NULL,
          name VARCHAR(255),
          occupation VARCHAR(255),
          monthly_income NUMERIC(15, 0) DEFAULT 0,
          salary_date VARCHAR(50),
          last_expense NUMERIC(15, 0) DEFAULT 0,
          onboarding_completed BOOLEAN DEFAULT FALSE,
          table_name VARCHAR(120),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // 2. Master consolidated user_ledgers table for single-view analysis in DBeaver
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_ledgers (
          user_id VARCHAR(100) PRIMARY KEY,
          email VARCHAR(255),
          name VARCHAR(255),
          occupation VARCHAR(255),
          monthly_income NUMERIC(15, 0) DEFAULT 0,
          salary_date VARCHAR(50),
          last_expense NUMERIC(15, 0) DEFAULT 0,
          balance NUMERIC(15, 0) DEFAULT 0,
          plan VARCHAR(100) DEFAULT 'Solo Ledger',
          currency VARCHAR(20) DEFAULT 'BDT',
          currency_symbol VARCHAR(10) DEFAULT '৳',
          avatar TEXT,
          wallets JSONB DEFAULT '[]'::jsonb,
          transactions JSONB DEFAULT '[]'::jsonb,
          budgets JSONB DEFAULT '[]'::jsonb,
          savings_goals JSONB DEFAULT '[]'::jsonb,
          notifications JSONB DEFAULT '[]'::jsonb,
          data JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      await client.query('COMMIT');
      isSchemaInitialized = true;
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    handlePostgresError('Init Schema Error', err);
    return false;
  }
}

/**
 * Creates a dedicated table for a user in PostgreSQL and inserts the single row containing all user data.
 * Table Name: `user_${userId}`
 */
export async function createDedicatedUserTable(
  userId: string,
  email: string,
  ledger: DatabaseSchema,
  profile?: OnboardingProfile
): Promise<string | null> {
  if (!isPostgresAvailable()) return null;

  try {
    const initialized = await initPostgresSchema();
    if (!initialized) return null;

    const pool = getPostgresPool();
    const client = await pool.connect();
    lastConnectFailureTime = 0;

    const tableName = getSafeUserTableName(userId, profile?.name || ledger.user.name || email);

    try {
      await client.query('BEGIN');

      // Create dedicated separate table for this user
      await client.query(`
        CREATE TABLE IF NOT EXISTS "${tableName}" (
          user_id VARCHAR(100) PRIMARY KEY,
          email VARCHAR(255),
          name VARCHAR(255),
          occupation VARCHAR(255),
          monthly_income NUMERIC(15, 0) DEFAULT 0,
          salary_date VARCHAR(50),
          last_expense NUMERIC(15, 0) DEFAULT 0,
          balance NUMERIC(15, 0) DEFAULT 0,
          plan VARCHAR(100) DEFAULT 'Solo Ledger',
          currency VARCHAR(20) DEFAULT 'BDT',
          currency_symbol VARCHAR(10) DEFAULT '৳',
          avatar TEXT,
          wallets JSONB DEFAULT '[]'::jsonb,
          transactions JSONB DEFAULT '[]'::jsonb,
          budgets JSONB DEFAULT '[]'::jsonb,
          savings_goals JSONB DEFAULT '[]'::jsonb,
          notifications JSONB DEFAULT '[]'::jsonb,
          data JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      const name = profile?.name || ledger.user.name || email.split('@')[0];
      const occupation = profile?.occupation || '';
      const monthlyIncome = Math.round(profile?.monthlyIncome || 0);
      const salaryDate = profile?.salaryDate || '';
      const lastExpense = Math.round(profile?.lastExpense || 0);
      const totalBalance = Math.round(
        ledger.wallets.reduce((acc, w) => acc + (w.balance || 0), 0)
      );

      const walletsJson = JSON.stringify(ledger.wallets || []);
      const txJson = JSON.stringify(ledger.transactions || []);
      const budgetsJson = JSON.stringify(ledger.budgets || []);
      const savingsJson = JSON.stringify(ledger.savingsGoals || []);
      const notifsJson = JSON.stringify(ledger.notifications || []);
      const dataJson = JSON.stringify(ledger);

      // Insert or update the single row in the user's dedicated table
      await client.query(
        `
        INSERT INTO "${tableName}" (
          user_id, email, name, occupation, monthly_income, salary_date, last_expense, balance,
          plan, currency, currency_symbol, avatar, wallets, transactions, budgets, savings_goals,
          notifications, data, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          email = EXCLUDED.email,
          name = EXCLUDED.name,
          occupation = EXCLUDED.occupation,
          monthly_income = EXCLUDED.monthly_income,
          salary_date = EXCLUDED.salary_date,
          last_expense = EXCLUDED.last_expense,
          balance = EXCLUDED.balance,
          plan = EXCLUDED.plan,
          currency = EXCLUDED.currency,
          currency_symbol = EXCLUDED.currency_symbol,
          avatar = EXCLUDED.avatar,
          wallets = EXCLUDED.wallets,
          transactions = EXCLUDED.transactions,
          budgets = EXCLUDED.budgets,
          savings_goals = EXCLUDED.savings_goals,
          notifications = EXCLUDED.notifications,
          data = EXCLUDED.data,
          updated_at = NOW();
        `,
        [
          userId,
          email,
          name,
          occupation,
          monthlyIncome,
          salaryDate,
          lastExpense,
          totalBalance,
          ledger.user.plan || 'Solo Ledger',
          ledger.user.currency || 'BDT',
          ledger.user.currencySymbol || '৳',
          ledger.user.avatar || '',
          walletsJson,
          txJson,
          budgetsJson,
          savingsJson,
          notifsJson,
          dataJson,
        ]
      );

      // Also upsert into consolidated user_ledgers table for multi-user overview
      await client.query(
        `
        INSERT INTO user_ledgers (
          user_id, email, name, occupation, monthly_income, salary_date, last_expense, balance,
          plan, currency, currency_symbol, avatar, wallets, transactions, budgets, savings_goals,
          notifications, data, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          email = EXCLUDED.email,
          name = EXCLUDED.name,
          occupation = EXCLUDED.occupation,
          monthly_income = EXCLUDED.monthly_income,
          salary_date = EXCLUDED.salary_date,
          last_expense = EXCLUDED.last_expense,
          balance = EXCLUDED.balance,
          plan = EXCLUDED.plan,
          currency = EXCLUDED.currency,
          currency_symbol = EXCLUDED.currency_symbol,
          avatar = EXCLUDED.avatar,
          wallets = EXCLUDED.wallets,
          transactions = EXCLUDED.transactions,
          budgets = EXCLUDED.budgets,
          savings_goals = EXCLUDED.savings_goals,
          notifications = EXCLUDED.notifications,
          data = EXCLUDED.data,
          updated_at = NOW();
        `,
        [
          userId,
          email,
          name,
          occupation,
          monthlyIncome,
          salaryDate,
          lastExpense,
          totalBalance,
          ledger.user.plan || 'Solo Ledger',
          ledger.user.currency || 'BDT',
          ledger.user.currencySymbol || '৳',
          ledger.user.avatar || '',
          walletsJson,
          txJson,
          budgetsJson,
          savingsJson,
          notifsJson,
          dataJson,
        ]
      );

      // Update users master index with table_name
      await client.query(
        `
        UPDATE users SET
          table_name = $1,
          name = COALESCE(NULLIF($2, ''), name),
          occupation = COALESCE(NULLIF($3, ''), occupation),
          monthly_income = $4,
          salary_date = COALESCE(NULLIF($5, ''), salary_date),
          last_expense = $6,
          updated_at = NOW()
        WHERE id = $7;
        `,
        [tableName, name, occupation, monthlyIncome, salaryDate, lastExpense, userId]
      );

      await client.query('COMMIT');
      return tableName;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    handlePostgresError(`Table Creation Skipped for ${userId}`, err);
    return null;
  }
}

/**
 * Reads user data directly from the user's dedicated table in PostgreSQL.
 * If the user changed any column in DBeaver (e.g. monthly_income, name, wallets, transactions, data),
 * those live DB edits are immediately parsed and returned to the application!
 */
export async function getUserLedgerFromPostgres(userId: string): Promise<DatabaseSchema | null> {
  if (!isPostgresAvailable()) return null;

  try {
    const pool = getPostgresPool();
    const client = await pool.connect();
    lastConnectFailureTime = 0;
    let tableName = getSafeUserTableName(userId);
    try {
      const uRes = await client.query('SELECT table_name, name, email FROM users WHERE id = $1 LIMIT 1', [userId]);
      if (uRes.rows.length > 0) {
        if (uRes.rows[0].table_name) {
          tableName = uRes.rows[0].table_name;
        } else if (uRes.rows[0].name || uRes.rows[0].email) {
          tableName = getSafeUserTableName(userId, uRes.rows[0].name || uRes.rows[0].email);
        }
      }
    } catch (e) {}

    try {
      // 1. Try querying the user's dedicated separate table
      let result = await client.query(
        `SELECT * FROM information_schema.tables WHERE table_name = $1 LIMIT 1`,
        [tableName]
      );

      let row: any = null;

      if (result.rows.length > 0) {
        const queryRes = await client.query(`SELECT * FROM "${tableName}" WHERE user_id = $1 LIMIT 1`, [userId]);
        row = queryRes.rows[0];
      }

      // 2. Fallback to consolidated user_ledgers table if separate table not created yet
      if (!row) {
        const fallbackRes = await client.query(
          `SELECT * FROM user_ledgers WHERE user_id = $1 LIMIT 1`,
          [userId]
        );
        row = fallbackRes.rows[0];
      }

      if (!row) return null;

      // Parse JSONB columns
      const wallets = typeof row.wallets === 'string' ? JSON.parse(row.wallets) : row.wallets || [];
      const transactions = typeof row.transactions === 'string' ? JSON.parse(row.transactions) : row.transactions || [];
      const budgets = typeof row.budgets === 'string' ? JSON.parse(row.budgets) : row.budgets || [];
      const savingsGoals = typeof row.savings_goals === 'string' ? JSON.parse(row.savings_goals) : row.savings_goals || [];
      const notifications = typeof row.notifications === 'string' ? JSON.parse(row.notifications) : row.notifications || [];
      const fullData = typeof row.data === 'string' ? JSON.parse(row.data) : row.data || {};

      // If user directly modified 'data' column in DBeaver, use it as baseline
      const parsedIncome = row.monthly_income !== null && row.monthly_income !== undefined ? Number(row.monthly_income) : fullData?.user?.monthlyIncome || 0;
      const parsedExpense = row.last_expense !== null && row.last_expense !== undefined ? Number(row.last_expense) : fullData?.user?.lastExpense || 0;

      let resolvedName = (row.name && !row.name.toLowerCase().startsWith('usr_') && row.name !== 'Solo User' && row.name !== 'Not set')
        ? row.name
        : (fullData?.user?.name && !fullData.user.name.toLowerCase().startsWith('usr_') && fullData.user.name !== 'Solo User' && fullData.user.name !== 'Not set')
          ? fullData.user.name
          : '';

      if (!resolvedName) {
        const emailVal = row.email || fullData?.user?.email || '';
        const local = (emailVal || '').split('@')[0] || '';
        resolvedName = local
          .replace(/[._-]+/g, ' ')
          .trim()
          .split(' ')
          .filter(Boolean)
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ') || 'User';
      }

      const base: DatabaseSchema = {
        user: {
          id: row.user_id,
          name: resolvedName,
          email: row.email || fullData?.user?.email || '',
          avatar: row.avatar || fullData?.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(resolvedName)}`,
          plan: row.plan || fullData?.user?.plan || 'Solo Ledger',
          currency: row.currency || fullData?.user?.currency || 'BDT',
          currencySymbol: row.currency_symbol || fullData?.user?.currencySymbol || '৳',
          occupation: row.occupation || fullData?.user?.occupation || '',
          monthlyIncome: Math.round(parsedIncome),
          salaryDate: row.salary_date || fullData?.user?.salaryDate || '',
          lastExpense: Math.round(parsedExpense),
          salaryDay: fullData?.user?.salaryDay,
          salaryAutoFrom: fullData?.user?.salaryAutoFrom,
          salaryLastCredited: fullData?.user?.salaryLastCredited,
        },
        wallets: Array.isArray(wallets) && wallets.length > 0 ? wallets : fullData?.wallets || [],
        transactions: Array.isArray(transactions) ? transactions : fullData?.transactions || [],
        budgets: Array.isArray(budgets) ? budgets : fullData?.budgets || [],
        savingsGoals: Array.isArray(savingsGoals) ? savingsGoals : fullData?.savingsGoals || [],
        notifications: Array.isArray(notifications) ? notifications : fullData?.notifications || [],
        fixedCosts: Array.isArray(fullData?.fixedCosts) ? fullData.fixedCosts : [],
      };

      // Note: monthly_income is the salary *setting*; past salary transactions are
      // history and are intentionally not rewritten when it changes.

      // If user modified 'balance' column in DBeaver directly, ensure the pocket wallet balance reflects it
      if (row.balance !== null && row.balance !== undefined && base.wallets.length > 0) {
        const pocket = base.wallets.find((w) => w.id === 'wal_pocket') || base.wallets[0];
        if (pocket) {
          const totalOther = base.wallets
            .filter((w) => w !== pocket)
            .reduce((acc, w) => acc + (w.balance || 0), 0);
          pocket.balance = Math.max(0, Number(row.balance) - totalOther);
        }
      }

      return base;
    } finally {
      client.release();
    }
  } catch (err: any) {
    handlePostgresError(`Read Error for ${userId}`, err);
    return null;
  }
}

/**
 * Saves/upserts user data into both their dedicated table and master ledger table in PostgreSQL.
 * Keeps single-row pattern clean and updated.
 */
export async function saveUserLedgerToPostgres(
  userId: string,
  ledger: DatabaseSchema
): Promise<boolean> {
  if (!isPostgresAvailable()) return false;

  try {
    const pool = getPostgresPool();
    const client = await pool.connect();
    lastConnectFailureTime = 0;
    const tableName = getSafeUserTableName(userId, ledger.user.name || ledger.user.email);

    try {
      await client.query('BEGIN');

      const name = ledger.user.name || '';
      const email = ledger.user.email || '';
      const totalBalance = Math.round(
        ledger.wallets.reduce((acc, w) => acc + (w.balance || 0), 0)
      );

      const walletsJson = JSON.stringify(ledger.wallets || []);
      const txJson = JSON.stringify(ledger.transactions || []);
      const budgetsJson = JSON.stringify(ledger.budgets || []);
      const savingsJson = JSON.stringify(ledger.savingsGoals || []);
      const notifsJson = JSON.stringify(ledger.notifications || []);
      const dataJson = JSON.stringify(ledger);

      // Check if table exists
      const tableCheck = await client.query(
        `SELECT 1 FROM information_schema.tables WHERE table_name = $1 LIMIT 1`,
        [tableName]
      );

      if (tableCheck.rows.length === 0) {
        // Create table if it does not exist yet
        await client.query(`
          CREATE TABLE IF NOT EXISTS "${tableName}" (
            user_id VARCHAR(100) PRIMARY KEY,
            email VARCHAR(255),
            name VARCHAR(255),
            occupation VARCHAR(255),
            monthly_income NUMERIC(15, 0) DEFAULT 0,
            salary_date VARCHAR(50),
            last_expense NUMERIC(15, 0) DEFAULT 0,
            balance NUMERIC(15, 0) DEFAULT 0,
            plan VARCHAR(100) DEFAULT 'Solo Ledger',
            currency VARCHAR(20) DEFAULT 'BDT',
            currency_symbol VARCHAR(10) DEFAULT '৳',
            avatar TEXT,
            wallets JSONB DEFAULT '[]'::jsonb,
            transactions JSONB DEFAULT '[]'::jsonb,
            budgets JSONB DEFAULT '[]'::jsonb,
            savings_goals JSONB DEFAULT '[]'::jsonb,
            notifications JSONB DEFAULT '[]'::jsonb,
            data JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);
      }

      // Upsert into dedicated user table
      await client.query(
        `
        INSERT INTO "${tableName}" (
          user_id, email, name, balance,
          plan, currency, currency_symbol, avatar, wallets, transactions, budgets, savings_goals,
          notifications, data, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          name = EXCLUDED.name,
          balance = EXCLUDED.balance,
          plan = EXCLUDED.plan,
          currency = EXCLUDED.currency,
          currency_symbol = EXCLUDED.currency_symbol,
          avatar = EXCLUDED.avatar,
          wallets = EXCLUDED.wallets,
          transactions = EXCLUDED.transactions,
          budgets = EXCLUDED.budgets,
          savings_goals = EXCLUDED.savings_goals,
          notifications = EXCLUDED.notifications,
          data = EXCLUDED.data,
          updated_at = NOW();
        `,
        [
          userId,
          email,
          name,
          totalBalance,
          ledger.user.plan || 'Solo Ledger',
          ledger.user.currency || 'BDT',
          ledger.user.currencySymbol || '৳',
          ledger.user.avatar || '',
          walletsJson,
          txJson,
          budgetsJson,
          savingsJson,
          notifsJson,
          dataJson,
        ]
      );

      // Also upsert into consolidated user_ledgers table
      await client.query(
        `
        INSERT INTO user_ledgers (
          user_id, email, name, balance,
          plan, currency, currency_symbol, avatar, wallets, transactions, budgets, savings_goals,
          notifications, data, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          name = EXCLUDED.name,
          balance = EXCLUDED.balance,
          plan = EXCLUDED.plan,
          currency = EXCLUDED.currency,
          currency_symbol = EXCLUDED.currency_symbol,
          avatar = EXCLUDED.avatar,
          wallets = EXCLUDED.wallets,
          transactions = EXCLUDED.transactions,
          budgets = EXCLUDED.budgets,
          savings_goals = EXCLUDED.savings_goals,
          notifications = EXCLUDED.notifications,
          data = EXCLUDED.data,
          updated_at = NOW();
        `,
        [
          userId,
          email,
          name,
          totalBalance,
          ledger.user.plan || 'Solo Ledger',
          ledger.user.currency || 'BDT',
          ledger.user.currencySymbol || '৳',
          ledger.user.avatar || '',
          walletsJson,
          txJson,
          budgetsJson,
          savingsJson,
          notifsJson,
          dataJson,
        ]
      );

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    handlePostgresError(`Write Error for ${userId}`, err);
    return false;
  }
}

/**
 * Saves a new user record or updates credentials in the PostgreSQL `users` table.
 */
export async function saveUserToPostgres(user: UserRecord): Promise<boolean> {
  if (!isPostgresAvailable()) return false;

  try {
    const initialized = await initPostgresSchema();
    if (!initialized) return false;

    const pool = getPostgresPool();
    lastConnectFailureTime = 0;
    const tableName = getSafeUserTableName(user.id);

    await pool.query(
      `
      INSERT INTO users (
        id, email, password_hash, salt, name, occupation, monthly_income, salary_date, last_expense, onboarding_completed, table_name, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        salt = EXCLUDED.salt,
        name = COALESCE(NULLIF(EXCLUDED.name, ''), users.name),
        occupation = COALESCE(NULLIF(EXCLUDED.occupation, ''), users.occupation),
        monthly_income = EXCLUDED.monthly_income,
        salary_date = COALESCE(NULLIF(EXCLUDED.salary_date, ''), users.salary_date),
        last_expense = EXCLUDED.last_expense,
        onboarding_completed = EXCLUDED.onboarding_completed,
        table_name = EXCLUDED.table_name,
        updated_at = NOW();
      `,
      [
        user.id,
        user.email,
        user.passwordHash,
        user.salt,
        user.profile?.name || '',
        user.profile?.occupation || '',
        user.profile?.monthlyIncome || 0,
        user.profile?.salaryDate || '',
        user.profile?.lastExpense || 0,
        user.onboardingCompleted,
        tableName,
        user.createdAt || new Date().toISOString(),
      ]
    );
    return true;
  } catch (err: any) {
    handlePostgresError('saveUser Warning', err);
    return false;
  }
}

/**
 * Retrieves a user record by email from PostgreSQL.
 */
export async function findUserByEmailFromPostgres(email: string): Promise<UserRecord | null> {
  if (!isPostgresAvailable()) return null;

  try {
    const pool = getPostgresPool();
    lastConnectFailureTime = 0;
    const res = await pool.query(`SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`, [
      email.trim(),
    ]);

    if (res.rows.length === 0) return null;
    const row = res.rows[0];

    const resolvedName = (row.name && !row.name.toLowerCase().startsWith('usr_') && row.name !== 'Solo User' && row.name !== 'Not set')
      ? row.name
      : (row.email || '').split('@')[0].replace(/[._-]+/g, ' ').trim().split(' ').filter(Boolean).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') || 'User';

    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      salt: row.salt,
      createdAt: row.created_at,
      onboardingCompleted: row.onboarding_completed,
      profile: {
        name: resolvedName,
        occupation: row.occupation || '',
        monthlyIncome: Number(row.monthly_income) || 0,
        salaryDate: row.salary_date || '',
        lastExpense: Number(row.last_expense) || 0,
      },
    };
  } catch (err: any) {
    handlePostgresError('findUser Warning', err);
    return null;
  }
}

/**
 * Retrieves all user records from PostgreSQL.
 */
export async function getAllUsersFromPostgres(): Promise<UserRecord[]> {
  if (!isPostgresAvailable()) return [];

  try {
    const pool = getPostgresPool();
    lastConnectFailureTime = 0;
    const res = await pool.query(`SELECT * FROM users ORDER BY created_at DESC`);
    return res.rows.map((row) => {
      const resolvedName = (row.name && !row.name.toLowerCase().startsWith('usr_') && row.name !== 'Solo User' && row.name !== 'Not set')
        ? row.name
        : (row.email || '').split('@')[0].replace(/[._-]+/g, ' ').trim().split(' ').filter(Boolean).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') || 'User';

      return {
        id: row.id,
        email: row.email,
        passwordHash: row.password_hash,
        salt: row.salt,
        createdAt: row.created_at,
        onboardingCompleted: row.onboarding_completed,
        profile: {
          name: resolvedName,
          occupation: row.occupation || '',
          monthlyIncome: Number(row.monthly_income) || 0,
          salaryDate: row.salary_date || '',
          lastExpense: Number(row.last_expense) || 0,
        },
      };
    });
  } catch (err: any) {
    handlePostgresError('getAllUsers Warning', err);
    return [];
  }
}

/**
 * Retrieves master summary statistics from PostgreSQL.
 */
export async function getPostgresMasterStats(): Promise<{
  connected: boolean;
  database?: string;
  userCount: number;
  ledgerCount: number;
  tables: string[];
  totalTransactions: number;
  totalFixedCosts: number;
  totalInflow: number;
  totalExpense: number;
}> {
  if (!isPostgresAvailable()) {
    return {
      connected: false,
      userCount: 0,
      ledgerCount: 0,
      tables: [],
      totalTransactions: 0,
      totalFixedCosts: 0,
      totalInflow: 0,
      totalExpense: 0,
    };
  }

  try {
    const pool = getPostgresPool();
    const client = await pool.connect();
    lastConnectFailureTime = 0;

    try {
      const dbRes = await client.query('SELECT current_database() as db_name');
      const dbName = dbRes.rows[0]?.db_name || 'hishab_rakhi';

      const userCountRes = await client.query('SELECT COUNT(*)::int as count FROM users');
      const userCount = userCountRes.rows[0]?.count || 0;

      const ledgerCountRes = await client.query(
        `SELECT COUNT(*)::int as count FROM information_schema.tables WHERE table_name = 'user_ledgers'`
      );
      let ledgerCount = 0;
      let totalTransactions = 0;
      let totalFixedCosts = 0;
      let totalInflow = 0;
      let totalExpense = 0;

      if (ledgerCountRes.rows[0]?.count > 0) {
        const ledgersRes = await client.query('SELECT raw_json FROM user_ledgers');
        ledgerCount = ledgersRes.rows.length;
        for (const row of ledgersRes.rows) {
          try {
            const raw = typeof row.raw_json === 'string' ? JSON.parse(row.raw_json) : row.raw_json;
            if (raw) {
              if (Array.isArray(raw.transactions)) {
                totalTransactions += raw.transactions.length;
                raw.transactions.forEach((tx: any) => {
                  if (tx.type === 'income') totalInflow += Number(tx.amount) || 0;
                  if (tx.type === 'expense') totalExpense += Number(tx.amount) || 0;
                });
              }
              if (Array.isArray(raw.fixedCosts)) {
                totalFixedCosts += raw.fixedCosts.length;
              }
            }
          } catch (e) {}
        }
      }

      const tablesRes = await client.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
      );
      const tables = tablesRes.rows.map((r: any) => r.table_name);

      return {
        connected: true,
        database: dbName,
        userCount,
        ledgerCount,
        tables,
        totalTransactions,
        totalFixedCosts,
        totalInflow,
        totalExpense,
      };
    } finally {
      client.release();
    }
  } catch (err: any) {
    handlePostgresError('getPostgresMasterStats', err);
    return {
      connected: false,
      userCount: 0,
      ledgerCount: 0,
      tables: [],
      totalTransactions: 0,
      totalFixedCosts: 0,
      totalInflow: 0,
      totalExpense: 0,
    };
  }
}
