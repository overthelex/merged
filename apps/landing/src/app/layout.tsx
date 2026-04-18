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
    <html lang="uk" className={`${inter.variable} ${manrope.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
