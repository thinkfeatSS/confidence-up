import { site } from '@/content/site';
import { landingContent } from '@/content/pages/landing';
import { ButtonAnchor, ButtonLink } from '@/components/ui/button';

type CtaSectionProps = {
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  buttonHref?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function CtaSection({
  title = landingContent.cta.title,
  subtitle = landingContent.cta.subtitle,
  buttonLabel = landingContent.cta.button,
  buttonHref = site.appStoreUrl,
  secondaryHref,
  secondaryLabel,
}: CtaSectionProps) {
  return (
    <section className="bg-gradient-to-br from-primary/10 via-background to-accent/20">
      <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{subtitle}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonAnchor size="lg" className="h-11 px-6" href={buttonHref}>
            {buttonLabel}
          </ButtonAnchor>
          {secondaryHref && secondaryLabel && (
            <ButtonLink
              size="lg"
              variant="outline"
              className="h-11 px-6"
              href={secondaryHref}
            >
              {secondaryLabel}
            </ButtonLink>
          )}
        </div>
      </div>
    </section>
  );
}
