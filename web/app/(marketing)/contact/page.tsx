import Script from 'next/script';
import { buildMetadata, jsonLdScript } from '@/lib/seo';
import { contactContent } from '@/content/pages/contact';
import { faqPageSchema } from '@/lib/schema';
import { PageHero } from '@/components/marketing/sections/PageHero';
import { ContactForm } from '@/components/marketing/ContactForm';
import { FaqSection } from '@/components/marketing/sections/FaqSection';

export const metadata = buildMetadata({
  title: 'Contact',
  description:
    'Contact the ConfidenceUp team at ThinkFeat. Email info@thinkfeat.com or use our contact form for support, partnerships, and press inquiries.',
  path: '/contact',
  keywords: ['contact ConfidenceUp', 'ThinkFeat support', 'app help'],
});

export default function ContactPage() {
  const { hero, faqs } = contactContent;

  return (
    <>
      <Script
        id="contact-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(faqPageSchema(faqs))}
      />
      <PageHero title={hero.title} subtitle={hero.subtitle} />
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <ContactForm />
        </div>
      </section>
      <FaqSection
        title="Contact FAQ"
        subtitle="Common questions about reaching our team."
        faqs={faqs}
      />
    </>
  );
}
