import type { MetadataRoute } from 'next';
import { site } from '@/content/site';

const routes = ['', '/about', '/contact', '/privacy', '/terms'] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((path) => ({
    url: `${site.url}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : 0.8,
  }));
}
