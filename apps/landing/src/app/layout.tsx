import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://merged.legal.org.ua'),
  title: {
    default: 'merged — технічний скринінг без співбесід',
    template: '%s · merged',
  },
  description:
    'Замість leetcode-інтервʼю — калібрована задача в реальному репо. Кандидат робить PR, ми оцінюємо автоматично по рубриці. AI дозволений — задачі спроєктовані так, що він необхідний, але недостатній.',
  openGraph: {
    type: 'website',
    locale: 'uk_UA',
    url: 'https://merged.legal.org.ua',
    siteName: 'merged',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#0b0f17',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
