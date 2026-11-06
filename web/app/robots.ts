import type { MetadataRoute } from 'next';
import { site } from '@/content/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/my-dashboard',
        '/dashboard',
        '/users',
        '/challenges',
        '/missions',
        '/badges',
        '/fear-categories',
        '/announcements',
        '/feedback',
        '/support-tickets',
        '/audit-logs',
        '/app-versions',
      ],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
