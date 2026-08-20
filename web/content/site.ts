export const site = {
  name: 'SpeakUpMic',
  company: 'ThinkFeat',
  tagline: 'Build real-world confidence, one challenge at a time.',
  description:
    'SpeakUpMic is a mobile speech and confidence-building app by ThinkFeat that turns personal growth into a daily RPG with AI coaching, missions, challenges, and measurable progress.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://speakupmic.vercel.app',
  email: 'info@thinkfeat.com',
  responseTime: 'We respond within 2 business days.',
  appStoreUrl: '#',
  playStoreUrl: '#',
  social: {
    twitter: 'https://twitter.com/thinkfeat',
    linkedin: 'https://linkedin.com/company/thinkfeat',
  },
} as const;

export const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
] as const;

export const footerLinks = {
  product: [
    { href: '/', label: 'Features' },
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact' },
  ],
  legal: [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms & Conditions' },
  ],
} as const;
