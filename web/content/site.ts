export const site = {
  name: 'Truefluent AI',
  company: 'ThinkFeat',
  tagline: 'Voice & Speech Intelligence with Real-World Confidence.',
  description:
    'Truefluent AI is a speech intelligence and vocal confidence-building platform by ThinkFeat that turns personal growth into a daily practice with Whisper AI coaching, missions, challenges, and measurable progress.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://speakupmic.vercel.app',
  email: 'info@testitan.com',
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
    { href: '/delete-account', label: 'Delete Account' },
  ],
} as const;
