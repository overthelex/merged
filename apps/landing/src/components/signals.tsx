import { useTranslations } from 'next-intl';

interface SignalItem {
  label: string;
  note: string;
}

// Weights are structural (design-time), not copy — they're not translated.
const AUTO_WEIGHTS = [20, 15, 10];
const LLM_WEIGHTS = [20, 20, 15];

const autoTotal = AUTO_WEIGHTS.reduce((a, b) => a + b, 0);
const llmTotal = LLM_WEIGHTS.reduce((a, b) => a + b, 0);

export function Signals() {
  const t = useTranslations('signals');
  const autoItems = t.raw('items.auto') as SignalItem[];
  const llmItems = t.raw('items.llm') as SignalItem[];

  const autoEnriched = autoItems.map((s, i) => ({
    ...s,
    weight: AUTO_WEIGHTS[i] ?? 0,
    type: 'auto' as const,
  }));
  const llmEnriched = llmItems.map((s, i) => ({
    ...s,
    weight: LLM_WEIGHTS[i] ?? 0,
    type: 'llm' as const,
  }));

  return (
    <section className="border-b border-ink/8">
      <div className="section-inner py-24 sm:py-32">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.15fr] lg:items-start">
          {/* Left — copy */}
          <div className="lg:pt-2">
            <p className="label-mono text-ink/50">{t('eyebrow')}</p>
            <h2 className="mt-5 font-display text-4xl sm:text-5xl font-semibold leading-[1.08] tracking-tight">
              {t('title')}
            </h2>
            <p className="mt-6 text-[1.0625rem] text-ink/65 leading-[1.75]">
              {t('subtitle')}
            </p>

            {/* Split summary */}
            <div className="mt-10 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-ink/8 bg-surface p-5 shadow-card">
                <div className="tabular font-display text-3xl font-semibold text-ink">
                  {autoTotal}%
                </div>
                <div className="mt-1 label-mono text-ink/50">
                  {t('summary.autoLabel')}
                </div>
                <div className="mt-3 h-1 rounded-full bg-ink/8">
                  <div
                    className="h-full rounded-full bg-ink/30"
                    style={{ width: `${autoTotal}%` }}
                  />
                </div>
              </div>
              <div className="rounded-xl border border-accent/20 bg-accent/5 p-5 shadow-card">
                <div className="tabular font-display text-3xl font-semibold text-accent">
                  {llmTotal}%
                </div>
                <div className="mt-1 label-mono text-accent/70">
                  {t('summary.llmLabel')}
                </div>
                <div className="mt-3 h-1 rounded-full bg-accent/15">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${llmTotal}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right — rubric table */}
          <div className="rounded-2xl border border-ink/8 bg-surface shadow-card-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-ink/6">
              <span className="label-mono text-ink/50">{t('rubric.heading')}</span>
              <span className="tabular label-mono text-ink/40">
                {t('rubric.totalLabel')}
              </span>
            </div>

            {/* Auto section */}
            <div>
              <div className="px-4 py-2.5 sm:px-6 sm:py-3 bg-ink/3 border-b border-ink/5">
                <span className="label-mono text-ink/40">
                  {t('rubric.autoSectionLabel')}
                </span>
              </div>
              <ul className="divide-y divide-ink/5">
                {autoEnriched.map((s) => (
                  <SignalRow key={s.label} signal={s} />
                ))}
              </ul>
            </div>

            {/* LLM section */}
            <div className="border-t border-ink/8">
              <div className="px-4 py-2.5 sm:px-6 sm:py-3 bg-accent/5 border-b border-ink/5">
                <span className="label-mono text-accent/70">
                  {t('rubric.llmSectionLabel')}
                </span>
              </div>
              <ul className="divide-y divide-ink/5">
                {llmEnriched.map((s) => (
                  <SignalRow key={s.label} signal={s} />
                ))}
              </ul>
            </div>

            <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-ink/6 bg-ink/2">
              <p className="label-mono text-ink/35">{t('rubric.footnote')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SignalRow({
  signal,
}: {
  signal: { label: string; note: string; weight: number; type: 'auto' | 'llm' };
}) {
  return (
    <li className="px-4 py-3.5 sm:px-6 sm:py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-sm text-ink/80 font-medium">{signal.label}</div>
          <div className="mt-0.5 text-xs text-ink/45 line-clamp-2">{signal.note}</div>
        </div>
        <span className="tabular font-mono text-sm text-ink/50 shrink-0 w-10 text-right">
          {signal.weight}%
        </span>
      </div>
      <div className="mt-2.5 h-[3px] w-full overflow-hidden rounded-full bg-ink/6">
        <div
          className={`h-full rounded-full transition-all ${
            signal.type === 'llm' ? 'bg-accent' : 'bg-ink/35'
          }`}
          style={{ width: `${signal.weight * 4.5}%` }}
        />
      </div>
    </li>
  );
}
