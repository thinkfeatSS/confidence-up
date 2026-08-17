import type { Metadata } from 'next';
import { site } from '@/content/site';

type PageMeta = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  noIndex?: boolean;
};

export function buildMetadata({
  title,
  description,
  path,
  keywords = [],
  noIndex = false,
}: PageMeta): Metadata {
  const url = `${site.url}${path}`;
  const fullTitle =
    path === '/' ? `${site.name} — ${site.tagline}` : `${title} | ${site.name}`;

  return {
    title: fullTitle,
    description,
    keywords: [
      'confidence building app',
      'public speaking practice',
      'social confidence',
      'AI coach',
      site.name,
      site.company,
      ...keywords,
    ],
    metadataBase: new URL(site.url),
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: site.name,
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
    },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export function jsonLdScript(data: Record<string, unknown> | Record<string, unknown>[]) {
  return {
    __html: JSON.stringify(data),
  };
}
