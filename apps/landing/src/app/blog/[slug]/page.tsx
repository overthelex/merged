import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { ArticleShare } from '@/components/article-share';
import AttractorBanner from '@/components/attractor-banner';
import { Footer } from '@/components/footer';
import { SiteHeader } from '@/components/site-header';
import { articles, CATEGORY_LABEL, getArticle } from '@/lib/articles';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: 'Статтю не знайдено' };

  const url = `https://merged.com.ua/blog/${article.slug}`;
  return {
    title: article.title,
    description: article.punchline,
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description: article.punchline,
      url,
      type: 'article',
      publishedTime: article.publishedAt,
      tags: article.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.punchline,
    },
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const url = `https://merged.com.ua/blog/${article.slug}`;
  // Strip leading H1 — we render the title in the banner.
  const body = article.content.replace(/^#\s+.+\n+/, '');

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <SiteHeader
        rightSlot={
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 font-mono text-sm text-ink/55 transition-colors duration-150 hover:text-ink"
          >
            <span aria-hidden>←</span>
            Усі статті
          </Link>
        }
      />

      {/* Banner + title */}
      <div className="section-inner max-w-3xl mt-8">
        <div className="relative h-52 sm:h-72 w-full overflow-hidden rounded-2xl shadow-card-md">
          <AttractorBanner seed={article.slug} className="absolute inset-0" animate />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/40 to-transparent pointer-events-none" />
          <div className="absolute inset-0 flex items-end p-6 sm:p-8 pointer-events-none">
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-paper leading-[1.1] tracking-tight drop-shadow-lg">
              {article.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="section-inner max-w-3xl mt-6 flex items-center gap-3 flex-wrap">
        <span className="label-mono px-2 py-0.5 rounded-md bg-accent/10 text-accent-dim border border-accent/20">
          {CATEGORY_LABEL[article.category]}
        </span>
        <span className="font-mono text-xs text-ink/45">{article.readTime}</span>
        <span className="h-1 w-1 rounded-full bg-ink/20" />
        <span className="font-mono text-xs text-ink/45">
          {formatDate(article.publishedAt)}
        </span>
      </div>

      {/* Content */}
      <article
        className="section-inner max-w-3xl py-10 sm:py-14 prose prose-neutral prose-lg
          prose-headings:font-display prose-headings:tracking-tight prose-headings:text-ink
          prose-h2:mt-12 prose-h2:mb-5 prose-h2:text-[1.75rem] prose-h2:font-semibold
          prose-h3:mt-9 prose-h3:mb-3 prose-h3:text-[1.25rem] prose-h3:font-semibold
          prose-p:text-ink/75 prose-p:leading-[1.8]
          prose-li:text-ink/75 prose-li:leading-[1.7]
          prose-strong:text-ink prose-strong:font-semibold
          prose-a:text-ink prose-a:font-medium prose-a:underline prose-a:decoration-accent prose-a:decoration-2 prose-a:underline-offset-4 hover:prose-a:bg-accent/10
          prose-blockquote:border-l-accent prose-blockquote:bg-accent/5 prose-blockquote:not-italic prose-blockquote:text-ink/80 prose-blockquote:rounded-r-md prose-blockquote:py-1 prose-blockquote:px-4
          prose-code:bg-ink/8 prose-code:text-ink prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-sm prose-code:text-[0.875em] prose-code:font-mono prose-code:font-normal prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-ink prose-pre:text-paper prose-pre:rounded-lg prose-pre:border prose-pre:border-ink/12 prose-pre:shadow-card
          [&_pre_code]:bg-transparent [&_pre_code]:text-paper/90 [&_pre_code]:p-0
          prose-table:text-sm
          prose-th:bg-paper-dim prose-th:text-ink prose-th:font-semibold prose-th:px-4 prose-th:py-2.5 prose-th:border-ink/8
          prose-td:text-ink/75 prose-td:px-4 prose-td:py-2.5 prose-td:border-ink/6
          prose-hr:border-ink/10"
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
      </article>

      {/* Tags */}
      <div className="section-inner max-w-3xl">
        <div className="flex flex-wrap gap-2 pb-8 border-t border-ink/8 pt-6">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="font-mono text-xs px-2.5 py-1 rounded-md bg-paper-dim text-ink/60 border border-ink/8 hover:border-ink/20 hover:text-ink transition-colors duration-200"
            >
              #{tag}
            </span>
          ))}
        </div>

        <ArticleShare title={article.title} punchline={article.punchline} url={url} />

        {/* CTA */}
        <Link
          href="/#zayavka"
          className="mt-6 block rounded-2xl border border-ink/10 bg-ink text-paper p-6 sm:p-7 no-underline shadow-card-md transition-all duration-200 hover:shadow-card-lg hover:border-ink/25 group"
        >
          <p className="label-mono text-accent mb-2">Спробувати merged</p>
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="font-display text-xl sm:text-2xl font-semibold text-paper leading-tight">
                Технічний скринінг без співбесід
              </p>
              <p className="mt-2 text-sm text-paper/65 leading-relaxed max-w-md">
                Калібрована задача, автоматична рубрика, звіт за ~2 хвилини.
                Закрита бета, Q2 2026.
              </p>
            </div>
            <svg
              width="28"
              height="28"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden
              className="shrink-0 mt-1 text-accent transition-transform duration-200 group-hover:translate-x-1"
            >
              <path
                d="M2.5 7h9M7.5 3l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </Link>
      </div>

      <div className="flex-1" />
      <Footer />
    </div>
  );
}
