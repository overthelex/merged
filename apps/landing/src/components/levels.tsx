import { useTranslations } from 'next-intl';

interface LevelSignal {
  label: string;
  weight: string;
}

interface LevelEntry {
  tagLabel: string;
  hook: string;
  desc: string;
  duration: string;
  scoreRange: string;
  signals: LevelSignal[];
}

export function Levels() {
  const t = useTranslations('levels');
  const entries = t.raw('levels') as LevelEntry[];

  return (
    <section id="rivni" className="border-b border-ink/8 bg-ink text-paper">
      <div className="section-inner py-24 sm:py-32">
        {/* Header */}
        <div className="grid gap-10 lg:grid-cols-[1fr_1.8fr] lg:items-end">
          <div>
            <p className="label-mono text-accent">{t('eyebrow')}</p>
            <h2 className="mt-5 font-display text-4xl sm:text-5xl font-semibold leading-[1.08] tracking-tight">
              {t('title')}
            </h2>
          </div>
          <p className="text-paper/65 text-[1.0625rem] leading-[1.75] lg:pb-1">
            {t('subtitle')}
          </p>
        </div>

        {/* Level cards */}
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {entries.map((l) => (
            <article
              key={l.tagLabel}
              className="rounded-2xl border border-white/8 bg-ink-soft flex flex-col gap-0 overflow-hidden shadow-inset-top"
            >
              {/* Card header */}
              <div className="px-5 pt-5 pb-4 sm:px-7 sm:pt-7 sm:pb-5">
                <div className="flex items-center justify-between">
                  <span className="label-mono text-accent">{l.tagLabel}</span>
                  <div className="text-right">
                    <span className="tabular font-mono text-xs text-white/40">
                      {l.duration}
                    </span>
                  </div>
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold leading-snug text-paper">
                  {l.hook}
                </h3>
                <p className="mt-3 text-paper/60 text-sm leading-relaxed">{l.desc}</p>
              </div>

              {/* Signals */}
              <div className="px-5 py-4 sm:px-7 sm:py-5 border-t border-white/6 mt-auto">
                <p className="label-mono text-white/35 mb-3">{t('signalsHeading')}</p>
                <ul className="space-y-3">
                  {l.signals.map((s) => {
                    const weight = Number(s.weight);
                    return (
                      <li key={s.label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-xs text-paper/70">
                            {s.label}
                          </span>
                          <span className="tabular font-mono text-xs text-white/40">
                            {s.weight}%
                          </span>
                        </div>
                        <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/8">
                          <div
                            className="h-full rounded-full bg-accent"
                            style={{ width: `${weight}%`, opacity: 0.7 + weight / 200 }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Score range footer */}
              <div className="px-5 py-3.5 sm:px-7 sm:py-4 border-t border-white/6 flex items-center justify-between">
                <span className="label-mono text-white/35">{t('scoreLabel')}</span>
                <span className="tabular font-mono text-sm text-accent font-semibold">
                  {l.scoreRange}
                  {t('scoreSuffix')}
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* AI note */}
        <div className="mt-10 rounded-xl border border-white/8 bg-white/3 px-6 py-4 flex items-start gap-4">
          <span className="label-mono text-accent mt-0.5 shrink-0">{t('noteLabel')}</span>
          <p className="text-sm text-paper/60 leading-relaxed">{t('note')}</p>
        </div>
      </div>
    </section>
  );
}
