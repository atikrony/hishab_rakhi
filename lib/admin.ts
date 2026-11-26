/**
 * Admin access for the hidden /kotojon research dashboard.
 * Edge-safe (used by middleware): no Node imports.
 *
 * Exactly one account may open it. Everyone else gets a 404.
 */
const ADMIN_EMAIL = 'atiqrony.aiub@gmail.com';

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL;
}
