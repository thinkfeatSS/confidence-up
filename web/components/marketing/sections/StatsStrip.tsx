'use client';

import { landingContent } from '@/content/pages/landing';
import { CountUp } from '@/components/marketing/interactive/CountUp';

export function StatsStrip() {
  return (
    <section className="border-b border-border bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6 lg:px-8">
        {landingContent.stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border/60 bg-card p-5 text-center transition-transform hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-lg font-semibold text-foreground sm:text-xl">
              {stat.value.match(/\d/) ? <CountUp value={stat.value} /> : stat.value}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
