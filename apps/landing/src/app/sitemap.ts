import type { MetadataRoute } from 'next';
import { getSortedArticles } from '@/lib/articles';
import { locales } from '@/i18n/routing';

// Required by Next 16 when the app uses `output: 'export'` — otherwise the
// metadata route is treated as potentially dynamic and the build refuses.
export const dynamic = 'force-static';

const SITE = 'https://merged.com.ua';

// Emitted with trailing slashes to match our next.config `trailingSlash: true`
// — otherwise Google would see a redirect and treat it as a soft 404 signal.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const sortedArticles = getSortedArticles();

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    entries.push(
      { url: `${SITE}/${locale}/`, changeFrequency: 'weekly', priority: 1.0, lastModified: now },
      { url: `${SITE}/${locale}/blog/`, changeFrequency: 'weekly', priority: 0.9, lastModified: now },
      { url: `${SITE}/${locale}/privacy/`, changeFrequency: 'yearly', priority: 0.3, lastModified: now },
      { url: `${SITE}/${locale}/terms/`, changeFrequency: 'yearly', priority: 0.3, lastModified: now },
    );

    for (const article of sortedArticles) {
      entries.push({
        url: `${SITE}/${locale}/blog/${article.slug}/`,
        lastModified: new Date(article.publishedAt),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
  }

  return entries;
}
