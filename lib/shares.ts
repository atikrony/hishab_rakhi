import path from 'path';
import crypto from 'crypto';
import { getDataStorageDirectory, safeReadJson, safeWriteJson } from './storage';

export type ShareAccess = 'restricted' | 'anyone';

export interface ShareLink {
  token: string;
  ownerId: string;
  /** Month being shared, "YYYY-MM" */
  month: string;
  /** restricted: only `emails` (signed in) can open it. anyone: anyone with the link. */
  access: ShareAccess;
  emails: string[];
  createdAt: string;
}

export const MAX_SHARE_EMAILS = 20;
export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmails(input: unknown): string[] | null {
  if (!Array.isArray(input)) return null;
  const out = new Set<string>();
  for (const raw of input) {
    if (typeof raw !== 'string') return null;
    const e = raw.trim().toLowerCase();
    if (!e) continue;
    if (e.length > 254 || !EMAIL_RE.test(e)) return null;
    out.add(e);
  }
  if (out.size > MAX_SHARE_EMAILS) return null;
  return [...out];
}

export function newShareToken(): string {
  return crypto.randomBytes(18).toString('base64url'); // 24 chars, unguessable
}

// ---------------------------------------------------------------------------
// Postgres backend (used when configured), file + memory fallback otherwise
// ---------------------------------------------------------------------------

let pgTableReady = false;

async function getPg() {
  try {
    const pg = await import('./postgres');
    if (!pg.isPostgresAvailable()) return null;
    const pool = pg.getPostgresPool();
    if (!pgTableReady) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS share_links (
          token VARCHAR(64) PRIMARY KEY,
          owner_id VARCHAR(100) NOT NULL,
          month VARCHAR(7) NOT NULL,
          access VARCHAR(16) NOT NULL DEFAULT 'restricted',
          emails JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS share_links_owner_idx ON share_links (owner_id);
      `);
      pgTableReady = true;
    }
    return pool;
  } catch (err: any) {
    console.warn('[Shares] Postgres unavailable, using local store:', err?.message);
    return null;
  }
}

const rowToShare = (r: any): ShareLink => ({
  token: r.token,
  ownerId: r.owner_id,
  month: r.month,
  access: r.access === 'anyone' ? 'anyone' : 'restricted',
  emails: Array.isArray(r.emails) ? r.emails : [],
  createdAt: new Date(r.created_at).toISOString(),
});

const memory = globalThis as unknown as { __HR_SHARES__?: ShareLink[] };
const shareFile = () => path.join(getDataStorageDirectory(), 'share_links.json');

function readLocal(): ShareLink[] {
  if (!memory.__HR_SHARES__) {
    memory.__HR_SHARES__ = safeReadJson<ShareLink[]>(shareFile()) || [];
  }
  return memory.__HR_SHARES__;
}

function writeLocal(list: ShareLink[]) {
  memory.__HR_SHARES__ = list;
  safeWriteJson(shareFile(), list);
}

// ---------------------------------------------------------------------------

export async function listSharesForOwner(ownerId: string): Promise<ShareLink[]> {
  const pool = await getPg();
  if (pool) {
    const res = await pool.query(
      'SELECT * FROM share_links WHERE owner_id = $1 ORDER BY created_at DESC',
      [ownerId]
    );
    return res.rows.map(rowToShare);
  }
  return readLocal()
    .filter((s) => s.ownerId === ownerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getShare(token: string): Promise<ShareLink | null> {
  if (!token || token.length > 64) return null;
  const pool = await getPg();
  if (pool) {
    const res = await pool.query('SELECT * FROM share_links WHERE token = $1 LIMIT 1', [token]);
    return res.rows[0] ? rowToShare(res.rows[0]) : null;
  }
  return readLocal().find((s) => s.token === token) || null;
}

export async function createShare(
  ownerId: string,
  month: string,
  access: ShareAccess,
  emails: string[]
): Promise<ShareLink> {
  const share: ShareLink = {
    token: newShareToken(),
    ownerId,
    month,
    access,
    emails,
    createdAt: new Date().toISOString(),
  };
  const pool = await getPg();
  if (pool) {
    await pool.query(
      'INSERT INTO share_links (token, owner_id, month, access, emails, created_at) VALUES ($1, $2, $3, $4, $5::jsonb, $6)',
      [share.token, ownerId, month, access, JSON.stringify(emails), share.createdAt]
    );
  } else {
    writeLocal([...readLocal(), share]);
  }
  return share;
}

/** Updates a share the caller owns. Returns null if not found / not owner. */
export async function updateShare(
  token: string,
  ownerId: string,
  patch: { access?: ShareAccess; emails?: string[] }
): Promise<ShareLink | null> {
  const current = await getShare(token);
  if (!current || current.ownerId !== ownerId) return null;
  const next: ShareLink = {
    ...current,
    access: patch.access ?? current.access,
    emails: patch.emails ?? current.emails,
  };
  const pool = await getPg();
  if (pool) {
    await pool.query(
      'UPDATE share_links SET access = $1, emails = $2::jsonb WHERE token = $3 AND owner_id = $4',
      [next.access, JSON.stringify(next.emails), token, ownerId]
    );
  } else {
    writeLocal(readLocal().map((s) => (s.token === token ? next : s)));
  }
  return next;
}

export async function deleteShare(token: string, ownerId: string): Promise<boolean> {
  const pool = await getPg();
  if (pool) {
    const res = await pool.query('DELETE FROM share_links WHERE token = $1 AND owner_id = $2', [
      token,
      ownerId,
    ]);
    return (res.rowCount || 0) > 0;
  }
  const list = readLocal();
  const kept = list.filter((s) => !(s.token === token && s.ownerId === ownerId));
  writeLocal(kept);
  return kept.length !== list.length;
}
