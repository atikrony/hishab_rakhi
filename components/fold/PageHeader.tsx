import React from 'react';

/**
 * Shared desktop page header. Every page uses this so the dark banner has the
 * same fixed height everywhere; page metrics go in the canvas below it
 * (cards with `-mt-10` overlap the bottom edge of the banner).
 */
export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <section className="bg-primary-container text-on-primary px-margin-desktop h-40 pb-10 relative overflow-hidden shadow-sm flex items-center flex-shrink-0">
      <div className="absolute -right-20 -bottom-24 w-96 h-96 rounded-full bg-surface-tint/10 blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto w-full relative z-10">
        <h1 className="font-headline-xl text-headline-xl text-on-primary tracking-tight font-bold">
          {title}
        </h1>
        {subtitle && (
          <p className="font-body-md text-body-md text-on-primary-container mt-1">{subtitle}</p>
        )}
      </div>
    </section>
  );
}
