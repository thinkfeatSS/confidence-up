import Link from 'next/link';
import Script from 'next/script';
import { buildMetadata, jsonLdScript } from '@/lib/seo';
import { aboutContent } from '@/content/pages/about';
import { organizationSchema } from '@/lib/schema';
import { PageHero } from '@/components/marketing/sections/PageHero';
import { CtaSection } from '@/components/marketing/sections/CtaSection';

export const metadata = buildMetadata({
  title: 'About SpeakUpMic',
  description:
    'Learn how ThinkFeat built SpeakUpMic to make confidence trainable through daily missions, AI coaching, and measurable progress.',
  path: '/about',
  keywords: ['ThinkFeat', 'speech practice', 'confidence app mission', 'about SpeakUpMic'],
});

export default function AboutPage() {
  const { hero, story, values, differentiators, product, company } = aboutContent;

  return (
    <>
      <Script
        id="about-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(organizationSchema())}
      />
      <PageHero title={hero.title} subtitle={hero.subtitle} />

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-foreground">{story.title}</h2>
            {story.paragraphs.map((paragraph) => (
              <p
                key={paragraph.slice(0, 50)}
                className="mt-4 text-base leading-relaxed text-muted-foreground"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground">Mission & values</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {values.map((value) => (
              <div key={value.title} className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-semibold text-foreground">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-foreground">{differentiators.title}</h2>
            <ul className="mt-6 list-disc space-y-3 pl-5 text-muted-foreground">
              {differentiators.items.map((item) => (
                <li key={item.slice(0, 40)} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-foreground">{product.title}</h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {product.description}
            </p>
            <Link href="/" className="mt-4 inline-block text-primary hover:underline">
              Explore features on the homepage →
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-foreground">{company.title}</h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {company.description}
            </p>
          </div>
        </div>
      </section>

      <CtaSection
        title="Ready to build your confidence?"
        subtitle="Download SpeakUpMic or get in touch with our team."
        buttonLabel="Get the App"
        secondaryHref="/contact"
        secondaryLabel="Contact us"
      />
    </>
  );
}
