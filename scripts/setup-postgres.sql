-- ==============================================================================
-- Hishab Rakhi - PostgreSQL Schema & DBeaver Initialization Script
-- ==============================================================================
-- Run this in DBeaver (or via psql) to initialize your database structure.
--
-- Features:
-- 1. `users`: Master user account & authentication table.
-- 2. `user_ledgers`: Consolidated single-view table of all user ledgers.
-- 3. Dedicated user table pattern: `user_${userId}` with single row storage.
-- 4. Direct DBeaver control: Edit cells directly in DBeaver and click Save/Commit;
--    changes are immediately loaded by Hishab Rakhi!
-- ==============================================================================

-- Step 1: Create Database (run if not already created)
-- CREATE DATABASE hishab_rakhi;

-- Step 2: Master users table
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

-- Step 3: Consolidated user_ledgers table (all users in one view for DBeaver)
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

-- Step 4: Sample user dedicated table (auto-created when each user registers/onboards)
-- Table Name: user_usr_sample
CREATE TABLE IF NOT EXISTS user_usr_sample (
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

-- ==============================================================================
-- Useful Queries for DBeaver:
-- ==============================================================================
-- 1. List all users and their dedicated tables:
--    SELECT id, email, name, occupation, monthly_income, table_name FROM users;
--
-- 2. Inspect single user row:
--    SELECT * FROM user_ledgers;
--
-- 3. Inspect a specific user's dedicated table:
--    SELECT * FROM user_usr_sample;
--
-- 4. Update monthly salary directly from DB:
--    UPDATE user_usr_sample SET monthly_income = 120000 WHERE user_id = 'usr_sample';
-- ==============================================================================

