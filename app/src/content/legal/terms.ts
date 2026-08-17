import type { LegalSection } from './privacy';

export const termsContent = {
  title: 'Terms & Conditions',
  lastUpdated: 'June 25, 2026',
  intro:
    'These Terms & Conditions ("Terms") govern your use of the ConfidenceUp mobile application and related services provided by ThinkFeat. By using ConfidenceUp, you agree to these Terms.',
  sections: [
    {
      id: 'acceptance',
      title: '1. Acceptance of terms',
      paragraphs: [
        'By creating an account or using ConfidenceUp, you agree to be bound by these Terms and our Privacy Policy. If you do not agree, do not use the service.',
      ],
    },
    {
      id: 'eligibility',
      title: '2. Eligibility & account responsibilities',
      paragraphs: [
        'You must be at least 13 years old to use ConfidenceUp. You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Notify us immediately of unauthorized access.',
      ],
    },
    {
      id: 'service',
      title: '3. Description of service',
      paragraphs: [
        'ConfidenceUp provides gamified confidence-building tools including daily missions, challenges, AI-powered speaking practice, fear exposure tracking, progress analytics, badges, and a private journal. Features may change over time as we improve the product.',
      ],
    },
    {
      id: 'acceptable-use',
      title: '4. Acceptable use',
      paragraphs: ['You agree not to:'],
      list: [
        'Use the service for any unlawful purpose.',
        'Harass, abuse, or harm others through the platform.',
        'Upload malicious code or attempt to disrupt the service.',
        'Reverse engineer or scrape the app except as permitted by law.',
        'Create multiple accounts to abuse gamification systems.',
      ],
    },
    {
      id: 'user-content',
      title: '5. User content',
      paragraphs: [
        'You retain ownership of content you create (journal entries, speech transcripts). By using ConfidenceUp, you grant ThinkFeat a limited license to store, process, and display your content solely to provide and improve the service. We do not claim ownership of your personal reflections or practice sessions.',
      ],
    },
    {
      id: 'gamification',
      title: '6. Gamification disclaimer',
      paragraphs: [
        'XP points, levels, badges, and streaks are motivational tools designed to encourage consistent practice. They do not represent professional certifications, employment qualifications, or clinical outcomes.',
      ],
    },
    {
      id: 'ai-disclaimer',
      title: '7. AI coach disclaimer',
      paragraphs: [
        'Atlas, the AI coach, provides automated feedback on speaking practice. It is not a licensed therapist, counselor, or medical professional. ConfidenceUp does not provide medical, psychological, or therapeutic advice. Seek professional help for serious anxiety or mental health conditions.',
      ],
    },
    {
      id: 'intellectual-property',
      title: '8. Intellectual property',
      paragraphs: [
        'ThinkFeat owns all rights in the ConfidenceUp app, including software, design, branding, and content we create. You may not copy, modify, or distribute our intellectual property without written permission.',
      ],
    },
    {
      id: 'payments',
      title: '9. Subscriptions & payments',
      paragraphs: [
        'ConfidenceUp is currently free to use. If we introduce paid features or subscriptions in the future, we will update these Terms and provide clear pricing before you are charged. Refund policies will be stated at the time of purchase.',
      ],
    },
    {
      id: 'termination',
      title: '10. Termination & account deletion',
      paragraphs: [
        'You may delete your account at any time through the app. We may suspend or terminate accounts that violate these Terms. Upon termination, your right to use the service ceases, subject to our Privacy Policy regarding data retention.',
      ],
    },
    {
      id: 'liability',
      title: '11. Limitation of liability',
      paragraphs: [
        'To the maximum extent permitted by law, ThinkFeat shall not be liable for indirect, incidental, special, or consequential damages arising from your use of ConfidenceUp. Our total liability shall not exceed the amount you paid us in the twelve months preceding the claim, or zero if you use the free tier.',
      ],
    },
    {
      id: 'governing-law',
      title: '12. Governing law & disputes',
      paragraphs: [
        'These Terms are governed by the laws of the jurisdiction in which ThinkFeat operates. Any disputes shall be resolved through good-faith negotiation first, then through the courts of competent jurisdiction. Update this section with your specific jurisdiction before public launch.',
      ],
    },
    {
      id: 'changes',
      title: '13. Changes to terms',
      paragraphs: [
        'We may modify these Terms at any time. Material changes will be communicated via the app or email. Continued use after changes constitutes acceptance of the updated Terms.',
      ],
    },
    {
      id: 'contact',
      title: '14. Contact',
      paragraphs: [
        'Questions about these Terms? Contact ThinkFeat at info@thinkfeat.com.',
      ],
    },
  ] as LegalSection[],
};
