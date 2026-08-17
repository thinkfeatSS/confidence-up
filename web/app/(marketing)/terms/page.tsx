import { buildMetadata } from '@/lib/seo';
import { termsContent } from '@/content/pages/terms';
import { PageHero } from '@/components/marketing/sections/PageHero';
import { LegalPageContent } from '@/components/marketing/LegalPageContent';

export const metadata = buildMetadata({
  title: 'Terms & Conditions',
  description:
    'Terms and conditions for using the ConfidenceUp mobile app and related services provided by ThinkFeat.',
  path: '/terms',
  keywords: ['terms of service', 'ConfidenceUp terms', 'user agreement'],
});

export default function TermsPage() {
  return (
    <>
      <PageHero
        title={termsContent.title}
        subtitle="Please read these terms carefully before using ConfidenceUp."
      />
      <LegalPageContent
        title={termsContent.title}
        lastUpdated={termsContent.lastUpdated}
        intro={termsContent.intro}
        sections={termsContent.sections}
      />
    </>
  );
}
