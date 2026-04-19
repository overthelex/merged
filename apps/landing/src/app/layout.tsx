import type { Metadata, Viewport } from 'next';
import { Inter, Manrope, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-display',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://merged.com.ua'),
  title: {
    default: 'merged — технічний скринінг без співбесід',
    template: '%s · merged',
  },
  description:
    'Замість leetcode-інтервʼю — калібрована задача в реальному репо. Кандидат робить PR, ми оцінюємо автоматично по рубриці. AI дозволений — задачі спроєктовані так, що він необхідний, але недостатній.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'uk_UA',
    url: 'https://merged.com.ua',
    siteName: 'merged',
  },
  robots: { index: true, follow: true },
};

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'merged',
  url: 'https://merged.com.ua',
  logo: 'https://merged.com.ua/brand/logo-ink-128.png',
  sameAs: [] as string[],
  email: 'request@merged.com.ua',
  areaServed: 'UA',
};

const siteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'merged',
  url: 'https://merged.com.ua',
  inLanguage: 'uk-UA',
  publisher: { '@type': 'Organization', name: 'merged' },
};

export const viewport: Viewport = {
  themeColor: '#0b0f17',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={`${inter.variable} ${manrope.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen antialiased">
        {children}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
      </body>
    </html>
  );
}
