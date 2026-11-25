/**
 * Older records were saved HTML-escaped (e.g. "Food &amp; Dining"). React
 * escapes text when rendering, so stored text should be plain. This undoes
 * the old escaping for display/calculation.
 */
const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#x27;': "'",
  '&#39;': "'",
};

export function decodeEntities<T>(value: T): T {
  if (typeof value !== 'string' || !value.includes('&')) return value;
  // Repeat to undo double-escaping like "&amp;amp;"
  let out: string = value;
  for (let i = 0; i < 3 && /&(amp|lt|gt|quot|#x27|#39);/.test(out); i++) {
    out = out.replace(/&(amp|lt|gt|quot|#x27|#39);/g, (m) => ENTITIES[m] ?? m);
  }
  return out as unknown as T;
}

/** Decodes the user-entered text fields of a transaction-like object. */
export function decodeRecordText<T extends { title?: string; category?: string; notes?: string }>(r: T): T {
  return {
    ...r,
    title: decodeEntities(r.title),
    category: decodeEntities(r.category),
    notes: decodeEntities(r.notes),
  };
}
