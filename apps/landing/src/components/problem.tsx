import { useTranslations } from 'next-intl';

interface Row {
  method: string;
  measures: string;
  signal: string;
  cost: string;
}

export function Problem() {
  const t = useTranslations('problem');
  const rows = t.raw('rows') as Row[];
  const signalLevels = t.raw('signalLevels') as Record<string, string>;
  // Last row is the highlight (merged PR-скринінг).
  const highlightMethod = rows[rows.length - 1]?.method;

  return (
    <section id="problema" className="border-b border-ink/8 bg-ink text-paper">
      <div className="section-inner py-24 sm:py-32">
        {/* Header */}
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <p className="label-mono text-accent">{t('eyebrow')}</p>
            <h2 className="mt-5 font-display text-4xl sm:text-5xl font-semibold leading-[1.08] tracking-tight">
              {t('title')}
            </h2>
          </div>
          <div className="space-y-5 text-[1.0625rem] leading-[1.75] text-paper/70">
            <p>
              {t('body1Prefix')}
              <span className="text-paper font-medium">{t('body1LeetcodeTerm')}</span>
              {t('body1LeetcodeSuffix')}
              <span className="text-paper font-medium">{t('body1SystemDesignTerm')}</span>
              {t('body1SystemDesignSuffix')}
              <span className="text-paper font-medium">{t('body1BehavioralTerm')}</span>
              {t('body1BehavioralSuffix')}
            </p>
            <p className="border-l-2 border-accent pl-5 text-paper/85">{t('body2')}</p>
          </div>
        </div>

        {/* Comparison table */}
        <div className="mt-16 overflow-hidden rounded-xl border border-white/8">
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-sm" role="table">
              <thead>
                <tr className="border-b border-white/8 bg-white/4">
                  <th className="px-5 py-3.5 text-left text-white/45 font-normal label-mono">
                    {t('tableHeaders.method')}
                  </th>
                  <th className="px-5 py-3.5 text-left text-white/45 font-normal label-mono hidden sm:table-cell">
                    {t('tableHeaders.measures')}
                  </th>
                  <th className="px-5 py-3.5 text-left text-white/45 font-normal label-mono hidden md:table-cell">
                    {t('tableHeaders.signal')}
                  </th>
                  <th className="px-5 py-3.5 text-right text-white/45 font-normal label-mono">
                    {t('tableHeaders.cost')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {rows.map((row) => {
                  const highlight = row.method === highlightMethod;
                  return (
                    <tr
                      key={row.method}
                      className={
                        highlight
                          ? 'bg-accent/8'
                          : 'hover:bg-white/3 transition-colors duration-100'
                      }
                    >
                      <td className="px-5 py-4 text-left">
                        <span
                          className={
                            highlight ? 'text-accent font-semibold' : 'text-paper/80'
                          }
                        >
                          {row.method}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-paper/55 hidden sm:table-cell">
                        {row.measures}
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <SignalPill level={row.signal} signalLevels={signalLevels} />
                      </td>
                      <td className="px-5 py-4 text-right tabular">
                        <span
                          className={
                            highlight ? 'text-accent font-semibold' : 'text-paper/60'
                          }
                        >
                          {row.cost}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom callout */}
        <p className="mt-8 label-mono text-white/35 text-center">{t('footnote')}</p>
      </div>
    </section>
  );
}

function SignalPill({
  level,
  signalLevels,
}: {
  level: string;
  signalLevels: Record<string, string>;
}) {
  // Match by value to determine semantic level (low/medium/high).
  let semantic: 'low' | 'medium' | 'high' | undefined;
  if (level === signalLevels.low) semantic = 'low';
  else if (level === signalLevels.medium) semantic = 'medium';
  else if (level === signalLevels.high) semantic = 'high';

  const cls =
    semantic === 'low'
      ? 'text-red-400/80'
      : semantic === 'medium'
        ? 'text-yellow-400/80'
        : semantic === 'high'
          ? 'text-accent'
          : 'text-paper/60';

  return <span className={`tabular ${cls}`}>{level}</span>;
}
