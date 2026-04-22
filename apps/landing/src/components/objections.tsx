import { useTranslations } from 'next-intl';

interface ObjectionItem {
  tag: string;
  q: string;
  a: string;
}

export function Objections() {
  const t = useTranslations('objections');
  const items = t.raw('items') as ObjectionItem[];

  return (
    <section className="border-b border-ink/8">
      <div className="mx-auto max-w-3xl px-6 py-24 sm:py-32">
        <p className="label-mono text-ink/50">{t('eyebrow')}</p>
        <h2 className="mt-5 font-display text-4xl sm:text-5xl font-semibold leading-[1.08] tracking-tight">
          {t('title')}
        </h2>

        <dl className="mt-14 space-y-0">
          {items.map((item, i) => (
            <div
              key={item.q}
              className="group border-t border-ink/8 py-8 grid gap-4 md:grid-cols-[2rem_1fr] last:border-b"
            >
              {/* Number */}
              <div className="flex items-start gap-3 md:block">
                <span className="tabular font-mono text-sm text-ink/25 md:pt-0.5">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {/* Tag — visible only on mobile beside number */}
                <span className="md:hidden inline-flex items-center rounded-md border border-ink/10 px-2 py-0.5 label-mono text-ink/45">
                  {item.tag}
                </span>
              </div>

              <div>
                {/* Tag — desktop above question */}
                <span className="hidden md:inline-flex items-center rounded-md border border-ink/10 bg-paper-dim px-2 py-0.5 label-mono text-ink/45 mb-3">
                  {item.tag}
                </span>
                <dt className="font-display text-xl font-semibold text-ink leading-snug">
                  {item.q}
                </dt>
                <dd className="mt-3 text-[0.9375rem] text-ink/65 leading-[1.75]">
                  {item.a}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
