/**
 * Edge-compatible and Node-compatible Session Token Service (HMAC-SHA256)
 * Uses native Web Crypto API (crypto.subtle) with 0 external dependencies.
 */

export interface SessionPayload {
  userId: string;
  email: string;
  name?: string;
  onboardingCompleted: boolean;
  exp: number; // Unix timestamp in seconds
}

export const SESSION_COOKIE_NAME = 'hr_session';

function getSessionSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length >= 16) {
    return process.env.SESSION_SECRET.trim();
  }
  // Stable HMAC secret shared across all serverless lambda containers and Edge middleware workers
  return 'hishab_rakhi_super_secure_auth_session_secret_2026_prod_vault_token';
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

export async function signSession(
  payload: Omit<SessionPayload, 'exp'>,
  expiresInSeconds = 7 * 24 * 3600 // 7 days
): Promise<string> {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };

  const headerStr = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
  const payloadStr = JSON.stringify(fullPayload);

  const encHeader = base64UrlEncode(enc.encode(headerStr));
  const encPayload = base64UrlEncode(enc.encode(payloadStr));
  const dataToSign = enc.encode(`${encHeader}.${encPayload}`);

    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(getSessionSecret()) as unknown as BufferSource,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

  const sig = await crypto.subtle.sign('HMAC', key, dataToSign as unknown as BufferSource);
  const encSig = base64UrlEncode(new Uint8Array(sig));

  return `${encHeader}.${encPayload}.${encSig}`;
}

export async function verifySession(token?: string | null): Promise<SessionPayload | null> {
  if (!token || typeof token !== 'string') return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;
    const dataToVerify = enc.encode(`${headerB64}.${payloadB64}`);
    const sigBytes = base64UrlDecode(sigB64);

    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(getSessionSecret()) as unknown as BufferSource,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes as unknown as BufferSource,
      dataToVerify as unknown as BufferSource
    );
    if (!isValid) return null;

    const payloadText = dec.decode(base64UrlDecode(payloadB64));
    const payload = JSON.parse(payloadText) as SessionPayload;

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowSeconds) {
      return null; // Expired
    }

    return payload;
  } catch (err) {
    return null;
  }
}

export async function signPasswordResetToken(email: string): Promise<string> {
  const payload = {
    email: email.trim().toLowerCase(),
    type: 'pwd_reset',
    exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes validity
  };
  const headerStr = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
  const payloadStr = JSON.stringify(payload);
  const encHeader = base64UrlEncode(enc.encode(headerStr));
  const encPayload = base64UrlEncode(enc.encode(payloadStr));
  const dataToSign = enc.encode(`${encHeader}.${encPayload}`);

  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(getSessionSecret()) as unknown as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign('HMAC', key, dataToSign as unknown as BufferSource);
  const encSig = base64UrlEncode(new Uint8Array(sig));
  return `${encHeader}.${encPayload}.${encSig}`;
}

export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;
    const dataToVerify = enc.encode(`${headerB64}.${payloadB64}`);
    const sigBytes = base64UrlDecode(sigB64);

    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(getSessionSecret()) as unknown as BufferSource,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes as unknown as BufferSource,
      dataToVerify as unknown as BufferSource
    );
    if (!isValid) return null;

    const payloadText = dec.decode(base64UrlDecode(payloadB64));
    const payload = JSON.parse(payloadText);
    if (payload.type !== 'pwd_reset') return null;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload.email || null;
  } catch (err) {
    return null;
  }
}

/** Signed email-verification token (24h). Bound to the email address. */
export async function signEmailVerifyToken(email: string): Promise<string> {
  const payload = {
    email: email.trim().toLowerCase(),
    type: 'email_verify',
    exp: Math.floor(Date.now() / 1000) + 24 * 3600,
  };
  const encHeader = base64UrlEncode(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const encPayload = base64UrlEncode(enc.encode(JSON.stringify(payload)));
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(getSessionSecret()) as unknown as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    enc.encode(`${encHeader}.${encPayload}`) as unknown as BufferSource
  );
  return `${encHeader}.${encPayload}.${base64UrlEncode(new Uint8Array(sig))}`;
}

/** Returns the verified email address, or null when the token is invalid/expired. */
export async function verifyEmailVerifyToken(token: string): Promise<string | null> {
  if (!token || typeof token !== 'string') return null;
  try {
    const [headerB64, payloadB64, sigB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !sigB64) return null;
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(getSessionSecret()) as unknown as BufferSource,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const ok = await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlDecode(sigB64) as unknown as BufferSource,
      enc.encode(`${headerB64}.${payloadB64}`) as unknown as BufferSource
    );
    if (!ok) return null;
    const payload = JSON.parse(dec.decode(base64UrlDecode(payloadB64)));
    if (payload.type !== 'email_verify') return null;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload.email || null;
  } catch {
    return null;
  }
}
