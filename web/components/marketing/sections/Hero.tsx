import { ArrowRight, Sparkles } from 'lucide-react';
import { site } from '@/content/site';
import { landingContent } from '@/content/pages/landing';
import { ButtonAnchor, ButtonLink } from '@/components/ui/button';
import { AnimatedHeroCard } from '@/components/marketing/interactive/AnimatedHeroCard';

export function Hero() {
  const { hero } = landingContent;

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/20" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-24">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
            <Sparkles className="size-4" />
            By {site.company}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {hero.title}
          </h1>
          <p className="mt-5 text-lg text-muted-foreground sm:text-xl">{hero.subtitle}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonAnchor size="lg" className="h-11 px-6" href={site.appStoreUrl}>
              {hero.primaryCta}
            </ButtonAnchor>
            <ButtonLink size="lg" variant="outline" className="h-11 px-6" href="/about">
              {hero.secondaryCta}
              <ArrowRight className="size-4" />
            </ButtonLink>
          </div>
        </div>

        <AnimatedHeroCard />
      </div>
    </section>
  );
}
