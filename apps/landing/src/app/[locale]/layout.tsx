import type { Metadata, Viewport } from 'next';
import { Inter, Manrope, JetBrains_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, isLocale, type Locale } from '@/i18n/routing';
import { localizedAlternates } from '@/i18n/alternates';

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

const OG_LOCALE: Record<Locale, string> = {
  uk: 'uk_UA',
  fr: 'fr_FR',
  en: 'en_US',
};

const HTML_LANG: Record<Locale, string> = {
  uk: 'uk',
  fr: 'fr',
  en: 'en',
};

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    metadataBase: new URL('https://merged.com.ua'),
    title: {
      default: t('title'),
      template: t('titleTemplate', { page: '%s' }),
    },
    description: t('description'),
    alternates: {
      canonical: `/${locale}`,
      languages: localizedAlternates((l) => `/${l}`),
    },
    openGraph: {
      type: 'website',
      locale: OG_LOCALE[locale],
      url: `https://merged.com.ua/${locale}`,
      siteName: t('siteName'),
    },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: '#0b0f17',
  width: 'device-width',
  initialScale: 1,
};

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  setRequestLocale(locale);

  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: 'metadata' });

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: t('organizationName'),
    url: 'https://merged.com.ua',
    logo: 'https://merged.com.ua/brand/logo-ink-128.png',
    sameAs: [] as string[],
    email: 'request@merged.com.ua',
    areaServed: 'UA',
  };

  const siteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: t('siteName'),
    url: 'https://merged.com.ua',
    inLanguage: HTML_LANG[locale],
    publisher: { '@type': 'Organization', name: t('organizationName') },
  };

  return (
    <html
      lang={HTML_LANG[locale]}
      className={`${inter.variable} ${manrope.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
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
