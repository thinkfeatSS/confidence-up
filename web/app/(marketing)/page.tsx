import Script from 'next/script';
import { buildMetadata, jsonLdScript } from '@/lib/seo';
import { site } from '@/content/site';
import { landingContent } from '@/content/pages/landing';
import {
  faqPageSchema,
  organizationSchema,
  softwareApplicationSchema,
  webSiteSchema,
} from '@/lib/schema';
import { Hero } from '@/components/marketing/sections/Hero';
import { StatsStrip } from '@/components/marketing/sections/StatsStrip';
import { DefinitionBlock } from '@/components/marketing/sections/DefinitionBlock';
import { FeatureGrid } from '@/components/marketing/sections/FeatureGrid';
import { HowItWorks } from '@/components/marketing/sections/HowItWorks';
import { AudienceSection } from '@/components/marketing/sections/AudienceSection';
import { FaqSection } from '@/components/marketing/sections/FaqSection';
import { CtaSection } from '@/components/marketing/sections/CtaSection';
import { ScrollReveal } from '@/components/marketing/interactive/ScrollReveal';

export const metadata = buildMetadata({
  title: site.name,
  description: site.description,
  path: '/',
  keywords: ['confidence building app', 'public speaking practice app', 'social skills'],
});

export default function LandingPage() {
  const jsonLd = [
    organizationSchema(),
    webSiteSchema(),
    softwareApplicationSchema(),
    faqPageSchema(landingContent.faqs),
  ];

  return (
    <>
      <Script
        id="landing-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(jsonLd)}
      />
      <Hero />
      <StatsStrip />
      <ScrollReveal>
        <DefinitionBlock />
      </ScrollReveal>
      <ScrollReveal delay={100}>
        <FeatureGrid />
      </ScrollReveal>
      <ScrollReveal delay={100}>
        <HowItWorks />
      </ScrollReveal>
      <ScrollReveal delay={100}>
        <AudienceSection />
      </ScrollReveal>
      <ScrollReveal delay={100}>
        <FaqSection faqs={landingContent.faqs} />
      </ScrollReveal>
      <CtaSection
        secondaryHref="/login"
        secondaryLabel="Log in to view your stats"
      />
    </>
  );
}
