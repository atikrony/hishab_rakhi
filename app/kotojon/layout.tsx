import type { Metadata } from 'next';

// Hidden admin page: reachable only by typing the URL. Keep it out of search engines.
export const metadata: Metadata = {
  title: 'Hishab Rakhi',
  robots: { index: false, follow: false, nocache: true },
};

export default function KotojonLayout({ children }: { children: React.ReactNode }) {
  return children;
}
