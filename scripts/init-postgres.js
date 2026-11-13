const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables manually if dotenv is not installed
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  'postgresql://postgres:postgres@localhost:5432/hishab_rakhi';

const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

console.log('------------------------------------------------------------');
console.log('⚡ Hishab Rakhi - PostgreSQL & DBeaver Direct Setup Tool');
console.log('------------------------------------------------------------');
console.log(`📡 Connecting to: ${connectionString.replace(/:[^:@]+@/, ':****@')}`);

const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
});

function getSafeTableName(userId) {
  const sanitized = userId.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^_+/, '');
  return `user_${sanitized}`;
}

async function main() {
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL server!');

    const dbRes = await client.query('SELECT current_database() as db_name, version() as pg_version');
    console.log(`📦 Active Database: ${dbRes.rows[0].db_name}`);
    console.log(`🔧 PostgreSQL Version: ${dbRes.rows[0].pg_version.split(',')[0]}`);

    console.log('\n🔨 Initializing master tables...');

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
    console.log('   ✓ Table `users` verified/created.');

    // 2. Master consolidated user_ledgers table
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
    console.log('   ✓ Table `user_ledgers` verified/created.');

    // 3. Migrate existing local users into dedicated tables
    const dataDir = path.join(__dirname, '..', 'data');
    const usersJsonPath = path.join(dataDir, 'users.json');
    const userLedgersDir = path.join(dataDir, 'users');

    let migratedCount = 0;

    if (fs.existsSync(usersJsonPath)) {
      const users = JSON.parse(fs.readFileSync(usersJsonPath, 'utf-8'));
      console.log(`\n📂 Found ${users.length} existing local user(s) to migrate into separate tables...`);

      for (const u of users) {
        const tableName = getSafeTableName(u.id);

        // Load user ledger data
        let ledger = null;
        const ledgerFile = path.join(userLedgersDir, `${u.id}.json`);
        if (fs.existsSync(ledgerFile)) {
          ledger = JSON.parse(fs.readFileSync(ledgerFile, 'utf-8'));
        }

        const name = u.profile?.name || ledger?.user?.name || u.email.split('@')[0];
        const occupation = u.profile?.occupation || '';
        const monthlyIncome = Math.round(u.profile?.monthlyIncome || 0);
        const salaryDate = u.profile?.salaryDate || '';
        const lastExpense = Math.round(u.profile?.lastExpense || 0);
        const totalBalance = ledger?.wallets?.reduce((acc, w) => acc + (w.balance || 0), 0) || 0;

        const walletsJson = JSON.stringify(ledger?.wallets || []);
        const txJson = JSON.stringify(ledger?.transactions || []);
        const budgetsJson = JSON.stringify(ledger?.budgets || []);
        const savingsJson = JSON.stringify(ledger?.savingsGoals || []);
        const notifsJson = JSON.stringify(ledger?.notifications || []);
        const dataJson = JSON.stringify(ledger || {});

        // Create dedicated table for this user
        await client.query(`
          CREATE TABLE IF NOT EXISTS ${tableName} (
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

        // Upsert single row into user's dedicated table
        await client.query(`
          INSERT INTO ${tableName} (
            user_id, email, name, occupation, monthly_income, salary_date, last_expense, balance,
            plan, currency, currency_symbol, avatar, wallets, transactions, budgets, savings_goals,
            notifications, data, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())
          ON CONFLICT (user_id) DO UPDATE SET
            name = EXCLUDED.name,
            occupation = EXCLUDED.occupation,
            monthly_income = EXCLUDED.monthly_income,
            salary_date = EXCLUDED.salary_date,
            last_expense = EXCLUDED.last_expense,
            balance = EXCLUDED.balance,
            wallets = EXCLUDED.wallets,
            transactions = EXCLUDED.transactions,
            budgets = EXCLUDED.budgets,
            savings_goals = EXCLUDED.savings_goals,
            notifications = EXCLUDED.notifications,
            data = EXCLUDED.data,
            updated_at = NOW();
        `, [
          u.id,
          u.email,
          name,
          occupation,
          monthlyIncome,
          salaryDate,
          lastExpense,
          totalBalance,
          ledger?.user?.plan || 'Solo Ledger',
          ledger?.user?.currency || 'BDT',
          ledger?.user?.currencySymbol || '৳',
          ledger?.user?.avatar || '',
          walletsJson,
          txJson,
          budgetsJson,
          savingsJson,
          notifsJson,
          dataJson
        ]);

        // Upsert into master users
        await client.query(`
          INSERT INTO users (
            id, email, password_hash, salt, name, occupation, monthly_income, salary_date, last_expense, onboarding_completed, table_name, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            occupation = EXCLUDED.occupation,
            monthly_income = EXCLUDED.monthly_income,
            salary_date = EXCLUDED.salary_date,
            last_expense = EXCLUDED.last_expense,
            onboarding_completed = EXCLUDED.onboarding_completed,
            table_name = EXCLUDED.table_name,
            updated_at = NOW();
        `, [
          u.id,
          u.email,
          u.passwordHash,
          u.salt,
          name,
          occupation,
          monthlyIncome,
          salaryDate,
          lastExpense,
          u.onboardingCompleted,
          tableName,
          u.createdAt || new Date().toISOString()
        ]);

        // Upsert into user_ledgers
        await client.query(`
          INSERT INTO user_ledgers (
            user_id, email, name, occupation, monthly_income, salary_date, last_expense, balance,
            plan, currency, currency_symbol, avatar, wallets, transactions, budgets, savings_goals,
            notifications, data, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())
          ON CONFLICT (user_id) DO UPDATE SET
            name = EXCLUDED.name,
            occupation = EXCLUDED.occupation,
            monthly_income = EXCLUDED.monthly_income,
            salary_date = EXCLUDED.salary_date,
            last_expense = EXCLUDED.last_expense,
            balance = EXCLUDED.balance,
            wallets = EXCLUDED.wallets,
            transactions = EXCLUDED.transactions,
            budgets = EXCLUDED.budgets,
            savings_goals = EXCLUDED.savings_goals,
            notifications = EXCLUDED.notifications,
            data = EXCLUDED.data,
            updated_at = NOW();
        `, [
          u.id,
          u.email,
          name,
          occupation,
          monthlyIncome,
          salaryDate,
          lastExpense,
          totalBalance,
          ledger?.user?.plan || 'Solo Ledger',
          ledger?.user?.currency || 'BDT',
          ledger?.user?.currencySymbol || '৳',
          ledger?.user?.avatar || '',
          walletsJson,
          txJson,
          budgetsJson,
          savingsJson,
          notifsJson,
          dataJson
        ]);

        console.log(`   ✓ Created dedicated table \`${tableName}\` for ${u.email} (single row initialized).`);
        migratedCount++;
      }
    }

    console.log(`\n🎉 Setup completed successfully! Migrated ${migratedCount} user(s).`);
    console.log('\n------------------------------------------------------------');
    console.log('🔍 HOW TO VIEW & CONTROL DATA IN DBEAVER:');
    console.log('------------------------------------------------------------');
    console.log('1. Open DBeaver -> Click "New Database Connection" (Plug icon).');
    console.log('2. Select "PostgreSQL".');
    console.log('3. Enter Connection details:');
    console.log('     Host:     localhost');
    console.log('     Port:     5432');
    console.log('     Database: hishab_rakhi');
    console.log('     Username: postgres');
    console.log('     Password: your_password');
    console.log('4. Click "Test Connection" -> Then click "Finish".');
    console.log('5. Under Databases -> hishab_rakhi -> Schemas -> public -> Tables:');
    console.log('     - `users` (Master accounts table)');
    console.log('     - `user_ledgers` (Consolidated master table)');
    console.log('     - `user_<your_user_id>` (Your dedicated user table!)');
    console.log('6. Double-click your table -> Switch to the "Data" tab.');
    console.log('7. Direct Control:');
    console.log('     Double-click any cell (e.g. monthly_income, name, wallets, transactions).');
    console.log('     Change the value, click "Save / Commit" (Ctrl+S).');
    console.log('     Refresh Hishab Rakhi in your browser: The app immediately reads your new values!');
    console.log('------------------------------------------------------------\n');

  } catch (err) {
    console.error('❌ Connection or setup error:', err.message || err.code || String(err));
    console.log('\n💡 Tip: If PostgreSQL server is not started locally, ensure the service is running or check your credentials in .env.');
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

main();
