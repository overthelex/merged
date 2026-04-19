import Link from 'next/link';
import { CATEGORY_LABEL, getSortedArticles } from '@/lib/articles';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function BlogTeaser() {
  const latest = getSortedArticles().slice(0, 3);
  if (latest.length === 0) return null;

  return (
    <section id="blog" className="border-b border-ink/8 bg-paper-dim">
      <div className="section-inner py-24 sm:py-32">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="label-mono text-ink/50">Блог</p>
            <h2 className="mt-5 font-display text-4xl sm:text-5xl font-semibold leading-[1.08] tracking-tight">
              Есеї про наймо в AI-ері.
            </h2>
            <p className="mt-5 text-[1.0625rem] text-ink/65 leading-[1.75]">
              Практика скринінгу, рубрики LLM-судді, відкриті звіти закритої
              бети, інструкції для рекрутерів і кандидатів — без маркетингу й
              без «book a demo».
            </p>
          </div>

          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 self-start rounded-lg border border-ink/12 bg-surface px-5 py-3 text-sm font-medium text-ink/80 shadow-card transition-all duration-150 hover:border-ink/25 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 sm:self-auto"
          >
            Всі статті
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden
              className="transition-transform duration-150 group-hover:translate-x-0.5"
            >
              <path
                d="M2.5 7h9M7.5 3l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {latest.map((article) => (
            <li key={article.slug}>
              <Link
                href={`/blog/${article.slug}`}
                className="group block h-full rounded-2xl border border-ink/8 bg-surface p-6 shadow-card no-underline text-inherit transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/18 hover:shadow-card-lg"
              >
                <div className="flex items-center gap-2.5">
                  <span className="label-mono px-2 py-0.5 rounded-md bg-accent/10 text-accent-dim border border-accent/20">
                    {CATEGORY_LABEL[article.category]}
                  </span>
                  <span className="font-mono text-xs text-ink/40">
                    {article.readTime}
                  </span>
                </div>

                <h3 className="mt-4 font-display text-xl font-semibold leading-[1.2] tracking-tight text-ink">
                  {article.title}
                </h3>

                <p className="mt-3 text-[0.9375rem] text-ink/65 leading-[1.65] line-clamp-3">
                  {article.punchline}
                </p>

                <div className="mt-5 flex items-center justify-between">
                  <span className="font-mono text-xs text-ink/40">
                    {formatDate(article.publishedAt)}
                  </span>
                  <span className="text-sm font-medium text-ink inline-flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    Читати
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 14 14"
                      fill="none"
                      aria-hidden
                    >
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
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
