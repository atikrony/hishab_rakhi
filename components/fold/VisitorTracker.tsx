'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function VisitorTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === lastTrackedPath.current) return;
    lastTrackedPath.current = pathname;

    // Skip tracking visits to the analytics dashboard itself
    if (pathname.startsWith('/kotojon') || pathname.startsWith('/api')) return;

    try {
      fetch('/api/v1/kotojon/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: pathname }),
        keepalive: true,
      }).catch(() => {
        // Safe silent fail
      });
    } catch {
      // Safe silent fail
    }
  }, [pathname]);

  return null;
}

