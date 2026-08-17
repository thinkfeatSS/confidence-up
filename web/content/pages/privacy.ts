export type LegalSection = {
  id: string;
  title: string;
  summary?: string;
  paragraphs: string[];
  list?: string[];
};

export const privacyContent = {
  title: 'Privacy Policy',
  lastUpdated: 'June 25, 2026',
  intro:
    'This Privacy Policy explains how ThinkFeat ("we", "us", "our") collects, uses, and protects your information when you use the ConfidenceUp mobile app and related services.',
  sections: [
    {
      id: 'introduction',
      title: '1. Introduction & data controller',
      summary: 'ThinkFeat is the data controller for ConfidenceUp.',
      paragraphs: [
        'ThinkFeat operates ConfidenceUp and is responsible for your personal data. For privacy-related requests, contact us at info@thinkfeat.com.',
      ],
    },
    {
      id: 'information-we-collect',
      title: '2. Information we collect',
      summary: 'We collect information you provide and data generated through app use.',
      paragraphs: ['We may collect the following categories of information:'],
      list: [
        'Account information: name, email address, password (hashed), and profile details.',
        'Onboarding data: fears, goals, daily time commitment, and confidence preferences.',
        'Speech sessions: transcripts, scores, filler word counts, and practice metadata.',
        'Journal entries: titles, body text, mood ratings, and timestamps.',
        'Gamification data: XP, levels, badges, streaks, mission and challenge completion.',
        'Device information: push notification tokens (FCM), device type, and app version.',
        'Usage analytics: feature usage, session duration, and crash diagnostics.',
        'Support communications: messages you send through contact or support forms.',
      ],
    },
    {
      id: 'how-we-use',
      title: '3. How we use your information',
      summary: 'We use data to provide, improve, and secure the service.',
      paragraphs: ['We use your information to:'],
      list: [
        'Create and manage your account.',
        'Deliver missions, challenges, AI coaching, and progress tracking.',
        'Send verification emails, password resets, and optional notifications.',
        'Improve app features and fix bugs.',
        'Respond to support requests.',
        'Protect against fraud, abuse, and security threats.',
      ],
    },
    {
      id: 'legal-bases',
      title: '4. Legal bases for processing',
      summary: 'We process data based on contract, legitimate interest, and consent.',
      paragraphs: [
        'We process your data to perform our contract with you (providing the app), based on legitimate interests (improving security and features), and with your consent where required (e.g., marketing communications or optional analytics).',
      ],
    },
    {
      id: 'data-sharing',
      title: '5. Data sharing',
      summary: 'We do not sell your personal data.',
      paragraphs: ['We may share data with trusted service providers who help us operate ConfidenceUp:'],
      list: [
        'Cloud hosting and database providers.',
        'Email delivery services (transactional emails).',
        'Firebase Cloud Messaging (push notifications).',
        'Analytics and crash reporting tools.',
        'These providers process data only on our instructions. We do not sell, rent, or trade your personal information to third parties for marketing purposes.',
      ],
    },
    {
      id: 'retention',
      title: '6. Data retention & deletion',
      summary: 'You can request account deletion from the app.',
      paragraphs: [
        'We retain your data for as long as your account is active. When you request account deletion through the app, we schedule removal within 30 days unless law requires longer retention. Backups may persist for a limited period before being purged.',
      ],
    },
    {
      id: 'your-rights',
      title: '7. Your rights',
      summary: 'You may access, correct, or delete your data.',
      paragraphs: ['Depending on your location, you may have the right to:'],
      list: [
        'Access a copy of your personal data.',
        'Correct inaccurate information.',
        'Request deletion of your data.',
        'Export your data in a portable format.',
        'Object to or restrict certain processing.',
        'Withdraw consent where processing is consent-based.',
        'To exercise these rights, email info@thinkfeat.com. We will respond within 30 days.',
      ],
    },
    {
      id: 'children',
      title: "8. Children's privacy",
      summary: 'ConfidenceUp is not intended for children under 13.',
      paragraphs: [
        'ConfidenceUp is not directed at children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe a child has provided us data, contact us and we will delete it promptly.',
      ],
    },
    {
      id: 'international',
      title: '9. International transfers',
      summary: 'Your data may be processed in countries other than your own.',
      paragraphs: [
        'Your information may be transferred to and processed in countries where our service providers operate. We take appropriate safeguards to protect your data in accordance with this policy.',
      ],
    },
    {
      id: 'cookies',
      title: '10. Cookies & tracking',
      summary: 'The admin website uses cookies; the mobile app uses device identifiers.',
      paragraphs: [
        'The ConfidenceUp admin website may use essential cookies for authentication. The mobile app uses device tokens for push notifications and local storage for session data. You can disable notifications in your device settings.',
      ],
    },
    {
      id: 'changes',
      title: '11. Changes to this policy',
      summary: 'We will update this page when our practices change.',
      paragraphs: [
        'We may update this Privacy Policy from time to time. We will post the revised policy on this page with an updated "Last updated" date. Continued use of ConfidenceUp after changes constitutes acceptance.',
      ],
    },
    {
      id: 'contact',
      title: '12. Contact us',
      summary: 'Reach us for privacy questions.',
      paragraphs: [
        'For privacy-related inquiries, contact ThinkFeat at info@thinkfeat.com.',
      ],
    },
  ] as LegalSection[],
};
