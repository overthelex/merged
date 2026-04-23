import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { notFound } from 'next/navigation';
import { isLocale } from '@/i18n/routing';
import { localizedAlternates } from '@/i18n/alternates';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'terms' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: {
      canonical: `/${locale}/terms`,
      languages: localizedAlternates((l) => `/${l}/terms`),
    },
  };
}

export default async function TermsPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  return <TermsBody />;
}

function TermsBody() {
  const t = useTranslations('terms');
  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-24 prose prose-neutral break-words">
      <h1>{t('heading')}</h1>
      <p>{t('body1')}</p>
    </article>
  );
}
