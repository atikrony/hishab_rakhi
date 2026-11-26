/**
 * Names the app generates when it doesn't know the real one. They must never
 * win over a real name (e.g. from Google), and are repaired when seen.
 *
 * "Usr E…" comes from formatting a stand-in address built from the internal
 * user id (usr_<time>_<hex>@user.behishebi.com), so any "usr" prefix counts.
 */
export function isPlaceholderName(name?: string | null): boolean {
  const n = (name || '').trim().toLowerCase();
  return (
    !n ||
    n === 'usr' ||
    n.startsWith('usr_') ||
    n.startsWith('usr ') ||
    n === 'solo user' ||
    n === 'not set' ||
    n === 'user' ||
    n === 'guest'
  );
}

/** Stand-in address built from the user id — never a real email. */
export function isPlaceholderEmail(email?: string | null): boolean {
  const e = (email || '').trim().toLowerCase();
  return !e || e.endsWith('@user.behishebi.com');
}

/** True for the auto-generated initials picture (safe to replace). */
export function isGeneratedAvatar(url?: string | null): boolean {
  return !url || url.startsWith('https://api.dicebear.com/');
}

export function initialsAvatar(name: string): string {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
}
