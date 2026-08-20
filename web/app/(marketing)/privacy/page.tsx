import { buildMetadata } from '@/lib/seo';
import { privacyContent } from '@/content/pages/privacy';
import { PageHero } from '@/components/marketing/sections/PageHero';
import { LegalPageContent } from '@/components/marketing/LegalPageContent';

export const metadata = buildMetadata({
  title: 'Privacy Policy',
  description:
    'Read how SpeakUpMic by ThinkFeat collects, uses, and protects your personal data across the mobile app and related services.',
  path: '/privacy',
  keywords: ['privacy policy', 'data protection', 'SpeakUpMic privacy'],
});

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        title={privacyContent.title}
        subtitle="How we collect, use, and protect your information."
      />
      <LegalPageContent
        title={privacyContent.title}
        lastUpdated={privacyContent.lastUpdated}
        intro={privacyContent.intro}
        sections={privacyContent.sections}
      />
    </>
  );
}
