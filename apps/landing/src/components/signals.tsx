const SIGNALS = [
  {
    category: 'Автоматичний CI',
    label: 'Тести пройшли',
    weight: 20,
    type: 'auto' as const,
    note: 'Детерміновано, без помилок вибірки',
  },
  {
    category: 'Автоматичний CI',
    label: 'Фокус і розмір диффу',
    weight: 15,
    type: 'auto' as const,
    note: 'Мінімальні зміни, без непотрібних правок',
  },
  {
    category: 'Автоматичний CI',
    label: 'Якість комітів',
    weight: 10,
    type: 'auto' as const,
    note: 'Atomic commits, Conventional Commits',
  },
  {
    category: 'LLM-суддя',
    label: 'Rationale у PR-описі',
    weight: 20,
    type: 'llm' as const,
    note: 'Чи пояснено «чому» а не тільки «що»',
  },
  {
    category: 'LLM-суддя',
    label: 'Декомпозиція задачі',
    weight: 20,
    type: 'llm' as const,
    note: 'Хід думок, кроки вирішення',
  },
  {
    category: 'LLM-суддя',
    label: 'Trade-off-и та архітектура',
    weight: 15,
    type: 'llm' as const,
    note: 'Альтернативи розглянуті, вибір обґрунтований',
  },
];

const autoTotal = SIGNALS.filter((s) => s.type === 'auto').reduce((a, s) => a + s.weight, 0);
const llmTotal = SIGNALS.filter((s) => s.type === 'llm').reduce((a, s) => a + s.weight, 0);

export function Signals() {
  return (
    <section className="border-b border-ink/8">
      <div className="section-inner py-24 sm:py-32">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.15fr] lg:items-start">
          {/* Left — copy */}
          <div className="lg:pt-2">
            <p className="label-mono text-ink/50">Що саме міряємо</p>
            <h2 className="mt-5 font-display text-4xl sm:text-5xl font-semibold leading-[1.08] tracking-tight">
              «Зелений CI» — лише 20% сигналу.
            </h2>
            <p className="mt-6 text-[1.0625rem] text-ink/65 leading-[1.75]">
              Інші 80% — те, що LLM-суддя по структурованій рубриці робить
              краще за людину-інтервʼюера: читає весь PR, описання, історію
              комітів, відповіді на коментарі. Без втоми, без упереджень.
            </p>

            {/* Split summary */}
            <div className="mt-10 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-ink/8 bg-surface p-5 shadow-card">
                <div className="tabular font-display text-3xl font-semibold text-ink">
                  {autoTotal}%
                </div>
                <div className="mt-1 label-mono text-ink/50">Автоматичний CI</div>
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
                <div className="mt-1 label-mono text-accent/70">LLM-суддя</div>
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-ink/6">
              <span className="label-mono text-ink/50">Ваги рубрики</span>
              <span className="tabular label-mono text-ink/40">усього 100%</span>
            </div>

            {/* Auto section */}
            <div>
              <div className="px-6 py-3 bg-ink/3 border-b border-ink/5">
                <span className="label-mono text-ink/40">Автоматичний CI</span>
              </div>
              <ul className="divide-y divide-ink/5">
                {SIGNALS.filter((s) => s.type === 'auto').map((s) => (
                  <SignalRow key={s.label} signal={s} />
                ))}
              </ul>
            </div>

            {/* LLM section */}
            <div className="border-t border-ink/8">
              <div className="px-6 py-3 bg-accent/5 border-b border-ink/5">
                <span className="label-mono text-accent/70">LLM-суддя</span>
              </div>
              <ul className="divide-y divide-ink/5">
                {SIGNALS.filter((s) => s.type === 'llm').map((s) => (
                  <SignalRow key={s.label} signal={s} />
                ))}
              </ul>
            </div>

            <div className="px-6 py-3.5 border-t border-ink/6 bg-ink/2">
              <p className="label-mono text-ink/35">
                * Ваги налаштовуються на рівні template-а задачі
              </p>
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
  signal: (typeof SIGNALS)[number];
}) {
  return (
    <li className="px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-sm text-ink/80 font-medium truncate">{signal.label}</div>
          <div className="mt-0.5 text-xs text-ink/45 truncate">{signal.note}</div>
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
