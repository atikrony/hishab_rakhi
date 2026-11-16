import fs from 'fs';
import path from 'path';
import os from 'os';

export function isServerlessEnvironment(): boolean {
  return Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT ||
    process.env.VERCEL_ENV ||
    (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
  );
}

/**
 * Returns the writable data storage directory.
 * On Vercel / AWS Lambda, process.cwd() is read-only (/var/task).
 * The only writable directory is os.tmpdir() (/tmp).
 */
export function getDataStorageDirectory(): string {
  if (process.env.DATA_STORAGE_DIR) {
    return path.resolve(process.env.DATA_STORAGE_DIR);
  }
  if (isServerlessEnvironment()) {
    return path.join(os.tmpdir(), 'hishab_rakhi_data');
  }
  return path.join(process.cwd(), 'data');
}

export function getUserLedgersDirectory(): string {
  return path.join(getDataStorageDirectory(), 'users');
}

export function getUsersFilePath(): string {
  return path.join(getDataStorageDirectory(), 'users.json');
}

export function safeEnsureDirectory(dirPath: string): boolean {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return true;
  } catch (err: any) {
    console.warn(`[Storage] Directory creation skipped/failed for ${dirPath}:`, err?.message || err);
    return false;
  }
}

export function safeWriteJson(filePath: string, data: any): boolean {
  try {
    const dir = path.dirname(filePath);
    safeEnsureDirectory(dir);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err: any) {
    console.warn(`[Storage] File write skipped/failed for ${filePath}:`, err?.message || err);
    return false;
  }
}

export function safeReadJson<T>(primaryPath: string, fallbackBundledRelativePath?: string): T | null {
  // 1. Try reading from primary path (writable storage)
  try {
    if (fs.existsSync(primaryPath)) {
      const raw = fs.readFileSync(primaryPath, 'utf-8');
      return JSON.parse(raw) as T;
    }
  } catch (err: any) {
    console.warn(`[Storage] Failed reading primary JSON at ${primaryPath}:`, err?.message || err);
  }

  // 2. Try reading from bundled repository path (e.g. process.cwd()/data/...)
  if (fallbackBundledRelativePath) {
    try {
      const bundledPath = path.join(process.cwd(), fallbackBundledRelativePath);
      if (bundledPath !== primaryPath && fs.existsSync(bundledPath)) {
        const raw = fs.readFileSync(bundledPath, 'utf-8');
        return JSON.parse(raw) as T;
      }
    } catch (err: any) {
      console.warn(`[Storage] Failed reading bundled JSON at ${fallbackBundledRelativePath}:`, err?.message || err);
    }
  }

  return null;
}

// Global in-memory storage to survive warm lambda invocations and provide
// zero-500 fallback when filesystem writes are prohibited or ephemeral.
interface MemoryStore {
  users?: any[];
  ledgers: Map<string, any>;
  db?: any;
}

const globalStore = globalThis as unknown as { __HR_MEMORY_STORE__?: MemoryStore };
if (!globalStore.__HR_MEMORY_STORE__) {
  globalStore.__HR_MEMORY_STORE__ = {
    users: undefined,
    ledgers: new Map<string, any>(),
    db: undefined,
  };
}

export function getMemoryStore(): MemoryStore {
  if (!globalStore.__HR_MEMORY_STORE__) {
    globalStore.__HR_MEMORY_STORE__ = {
      users: undefined,
      ledgers: new Map<string, any>(),
      db: undefined,
    };
  }
  return globalStore.__HR_MEMORY_STORE__;
}

export function readUsersData<T>(): T[] {
  const store = getMemoryStore();
  if (Array.isArray(store.users) && store.users.length > 0) {
    return store.users as T[];
  }

  const fileUsers = safeReadJson<T[]>(getUsersFilePath(), path.join('data', 'users.json'));
  if (Array.isArray(fileUsers)) {
    store.users = fileUsers;
    return fileUsers;
  }

  if (!store.users) {
    store.users = [];
  }
  return store.users as T[];
}

export function writeUsersData<T>(users: T[]): void {
  const store = getMemoryStore();
  store.users = users;
  safeWriteJson(getUsersFilePath(), users);
}

export function readUserLedgerData<T>(userId: string): T | null {
  const store = getMemoryStore();
  if (store.ledgers.has(userId)) {
    return store.ledgers.get(userId) as T;
  }

  const safeId = (userId || '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const primaryPath = path.join(getUserLedgersDirectory(), `${safeId}.json`);
  const fallbackPath = path.join('data', 'users', `${safeId}.json`);

  const diskLedger = safeReadJson<T>(primaryPath, fallbackPath);
  if (diskLedger) {
    store.ledgers.set(userId, diskLedger);
    return diskLedger;
  }

  return null;
}

export function writeUserLedgerData<T>(userId: string, ledger: T): void {
  const store = getMemoryStore();
  store.ledgers.set(userId, ledger);

  const safeId = (userId || '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filePath = path.join(getUserLedgersDirectory(), `${safeId}.json`);
  safeWriteJson(filePath, ledger);
}

