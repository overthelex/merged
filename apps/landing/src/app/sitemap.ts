import type { MetadataRoute } from 'next';
import { getSortedArticles } from '@/lib/articles';

const SITE = 'https://merged.com.ua';

// Emitted with trailing slashes to match our next.config `trailingSlash: true`
// — otherwise Google would see a redirect and treat it as a soft 404 signal.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: 'weekly', priority: 1.0, lastModified: now },
    { url: `${SITE}/blog/`, changeFrequency: 'weekly', priority: 0.9, lastModified: now },
    { url: `${SITE}/privacy/`, changeFrequency: 'yearly', priority: 0.3, lastModified: now },
    { url: `${SITE}/terms/`, changeFrequency: 'yearly', priority: 0.3, lastModified: now },
  ];

  const articles = getSortedArticles().map((a) => ({
    url: `${SITE}/blog/${a.slug}/`,
    lastModified: new Date(a.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...articles];
}
