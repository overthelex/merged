import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const SITE = 'https://merged.com.ua';

// Previously Cloudflare's generated robots.txt was served (content-signals
// boilerplate, no Sitemap directive). We own this now.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
