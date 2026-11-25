/**
 * Only allow same-site relative paths (e.g. "/share/abc") as post-login
 * destinations, so a crafted ?next= can't bounce users to another site.
 */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || typeof next !== 'string') return null;
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return null;
  if (next.length > 300) return null;
  if (/[\r\n]/.test(next)) return null;
  return next;
}
