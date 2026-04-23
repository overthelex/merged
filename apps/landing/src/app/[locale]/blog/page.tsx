import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import AttractorBanner from '@/components/attractor-banner';
import { Footer } from '@/components/footer';
import { SiteHeader } from '@/components/site-header';
import { Link } from '@/i18n/navigation';
import { CATEGORY_LABEL, getSortedArticles } from '@/lib/articles';
import { isLocale, type Locale } from '@/i18n/routing';
import { localizedAlternates } from '@/i18n/alternates';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const DATE_LOCALE: Record<Locale, string> = {
  uk: 'uk-UA',
  fr: 'fr-FR',
  en: 'en-US',
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'blogIndex' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: {
      canonical: `/${locale}/blog`,
      languages: localizedAlternates((l) => `/${l}/blog`),
    },
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: `https://merged.com.ua/${locale}/blog`,
      type: 'website',
    },
  };
}

function formatDate(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(DATE_LOCALE[locale], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default async function BlogIndexPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  return <BlogIndexBody locale={locale} />;
}

function BlogIndexBody({ locale }: { locale: Locale }) {
  const t = useTranslations('blogIndex');
  const sorted = getSortedArticles();
  const [featured, ...rest] = sorted;

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <SiteHeader
        rightSlot={
          <Link
            href="/#zayavka"
            className="inline-flex items-center gap-1.5 font-mono text-sm text-ink/55 transition-colors duration-150 hover:text-ink"
          >
            {t('headerCta')}
            <span aria-hidden>→</span>
          </Link>
        }
      />

      {/* Hero */}
      <section className="border-b border-ink/8">
        <div className="section-inner pt-16 pb-20 sm:pt-24 sm:pb-28">
          <p className="label-mono text-ink/50">{t('eyebrow')}</p>
          <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.04] tracking-[-0.02em] text-ink max-w-3xl">
            {t('titlePart1')}
            <span className="relative inline-block">
              <span className="relative z-10">{t('titlePart2')}</span>
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-1.5 h-[0.32em] bg-accent/30 -z-0 rounded-sm"
              />
            </span>
            {t('titlePart3')}
          </h1>
          <p className="mt-6 max-w-2xl text-[1.0625rem] text-ink/65 leading-[1.75]">
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* Featured */}
      {featured && (
        <section className="section-inner pt-14 sm:pt-20">
          <article className="group relative transition-transform duration-300 ease-out-expo hover:-translate-y-0.5">
            <Link
              href={`/blog/${featured.slug}`}
              className="block no-underline text-inherit rounded-2xl border border-ink/8 bg-surface overflow-hidden shadow-card transition-all duration-300 group-hover:shadow-card-lg group-hover:border-ink/15"
            >
              <div className="relative w-full h-64 sm:h-80 overflow-hidden">
                <AttractorBanner seed={featured.slug} className="absolute inset-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-paper/70 via-paper/20 to-transparent pointer-events-none" />
                <div className="absolute inset-0 flex items-end p-6 sm:p-10 pointer-events-none">
                  <div>
                    <span className="inline-block label-mono px-2.5 py-1 rounded-md bg-accent/95 text-ink border border-accent mb-4">
                      {CATEGORY_LABEL[featured.category]}
                    </span>
                    <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-ink leading-[1.1] tracking-tight max-w-3xl">
                      {featured.title}
                    </h2>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-10">
                <div className="flex items-center gap-3 mb-4 label-mono text-ink/45">
                  <span>{featured.readTime}</span>
                  <span className="h-1 w-1 rounded-full bg-ink/20" />
                  <span>{formatDate(featured.publishedAt, locale)}</span>
                </div>
                <p className="text-[1.0625rem] text-ink/70 leading-[1.75] max-w-3xl">
                  {featured.punchline}
                </p>
                <div className="mt-6 flex items-center gap-2 flex-wrap">
                  {featured.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-mono text-xs px-2 py-1 rounded-md bg-paper-dim text-ink/55 border border-ink/6"
                    >
                      #{tag}
                    </span>
                  ))}
                  <div className="flex-1" />
                  <span className="text-sm font-medium text-ink inline-flex items-center gap-1.5 transition-transform duration-200 group-hover:translate-x-0.5">
                    {t('readCta')}
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path
                        d="M2.5 7h9M7.5 3l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          </article>
        </section>
      )}

      {/* Rest */}
      {rest.length > 0 && (
        <section className="section-inner py-14 sm:py-20">
          <div className="grid gap-6 sm:grid-cols-2">
            {rest.map((article) => (
              <article
                key={article.slug}
                className="group relative transition-transform duration-300 ease-out-expo hover:-translate-y-0.5"
              >
                <Link
                  href={`/blog/${article.slug}`}
                  className="block h-full no-underline text-inherit rounded-2xl border border-ink/8 bg-surface overflow-hidden shadow-card transition-all duration-300 group-hover:shadow-card-lg group-hover:border-ink/15"
                >
                  <div className="relative w-full h-48 sm:h-52 overflow-hidden">
                    <AttractorBanner seed={article.slug} className="absolute inset-0" />
                    <div className="absolute inset-0 bg-gradient-to-t from-paper/75 via-paper/25 to-transparent pointer-events-none" />
                    <div className="absolute inset-0 flex items-end p-5 pointer-events-none">
                      <h2 className="font-display text-lg sm:text-xl font-semibold text-ink leading-[1.2] tracking-tight">
                        {article.title}
                      </h2>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center gap-2.5 mb-3">
                      <span className="label-mono px-2 py-0.5 rounded-md bg-accent/10 text-accent-dim border border-accent/20">
                        {CATEGORY_LABEL[article.category]}
                      </span>
                      <span className="font-mono text-xs text-ink/45">
                        {article.readTime}
                      </span>
                      <span className="font-mono text-xs text-ink/45">
                        {formatDate(article.publishedAt, locale)}
                      </span>
                    </div>
                    <p className="text-[0.9375rem] text-ink/65 leading-[1.7] line-clamp-3">
                      {article.punchline}
                    </p>
                    <div className="mt-5 flex items-center gap-2 flex-wrap">
                      {article.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-paper-dim text-ink/50 border border-ink/6"
                        >
                          #{tag}
                        </span>
                      ))}
                      <div className="flex-1" />
                      <span className="text-sm font-medium text-ink inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {t('readCta')}
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
                          <path
                            d="M2.5 7h9M7.5 3l4 4-4 4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
