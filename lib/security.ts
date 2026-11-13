import { NextRequest } from 'next/server';
import { verifySession, SESSION_COOKIE_NAME, SessionPayload } from './auth-token';

/**
 * Hishab Rakhi - Security & Privacy Protection Suite
 * Enforces sanitization, XSS mitigation, rate limiting, and PII masking.
 */

// 1. In-memory Rate Limiter (Sliding Window)
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * Checks if an incoming request exceeds the allowable rate limit.
 * @param ip Client IP address or identifier
 * @param maxRequests Maximum allowed requests per window (default: 60)
 * @param windowMs Window duration in milliseconds (default: 60,000ms / 1 min)
 */
export function checkRateLimit(
  ip: string,
  maxRequests = 60,
  windowMs = 60000
): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1, resetInMs: windowMs };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetInMs: record.resetTime - now };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetInMs: record.resetTime - now,
  };
}

/**
 * Cleans expired rate limit records periodically to prevent memory leaks.
 */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, 300000); // Clean every 5 minutes
}

// 2. Input Sanitization & XSS Defense

/**
 * Sanitizes input text to eliminate XSS vectors, strip dangerous HTML, and prevent payload stuffing.
 */
export function sanitizeString(
  input: unknown,
  maxLength = 150,
  fallback = ''
): string {
  if (typeof input !== 'string') return fallback;

  // 1. Strip script tags, html tags, and javascript pseudo-protocols
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/onload\s*=/gi, '')
    .replace(/onerror\s*=/gi, '')
    .replace(/onclick\s*=/gi, '')
    .trim();

  // 2. Escape HTML entities
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  // 3. Enforce maximum character bound
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Validates and normalizes financial numbers to prevent overflow, negative injections, or NaN.
 * Strictly enforces integer precision for Bangladeshi Taka (no decimals/cents).
 */
export function sanitizeAmount(
  value: unknown,
  min = 1,
  max = 100000000
): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return null;
  }

  // Reject non-positive amounts or numbers outside acceptable bounds
  if (num < min || num > max) {
    return null;
  }

  // Force whole integer precision for BDT (zero decimals / cents)
  return Math.round(num);
}

// 3. PII & Sensitive Financial Data Masking

/**
 * Masks account numbers to display only the last 4 characters.
 */
export function maskAccountNumber(acc: string): string {
  if (!acc) return '•••• 0000';
  const clean = acc.replace(/\s+/g, '');
  if (clean.length <= 4) return `•••• ${clean}`;
  return `•••• ${clean.slice(-4)}`;
}

/**
 * Obfuscates email addresses for privacy (e.g. j***e@domain.com).
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '••••••••';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}*@${domain}`;
  return `${user[0]}${'*'.repeat(user.length - 2)}${user[user.length - 1]}@${domain}`;
}

// 4. API Request Authentication Verification

/**
 * Validates whether an incoming API request possesses valid authorization.
 * Supports verified Bearer token, session cookie, and configured X-API-KEY checks.
 */
export async function verifyApiAuthorization(
  request: NextRequest
): Promise<{ authorized: boolean; reason?: string }> {
  const apiKeyHeader = request.headers.get('x-api-key');
  const validApiKey = process.env.MOBILE_API_KEY;

  if (validApiKey && apiKeyHeader && apiKeyHeader === validApiKey) {
    return { authorized: true };
  }

  const session = await getSessionFromRequest(request);
  if (session) {
    return { authorized: true };
  }

  return { authorized: false, reason: 'Missing or invalid authentication token' };
}

/**
 * Extracts and cryptographically verifies user session from cookie or Authorization header.
 */
export async function getSessionFromRequest(
  request: NextRequest
): Promise<SessionPayload | null> {
  // 1. Check session cookie
  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (cookie) {
    const session = await verifySession(cookie);
    if (session) return session;
  }

  // 2. Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const session = await verifySession(token);
    if (session) return session;
  }

  return null;
}


