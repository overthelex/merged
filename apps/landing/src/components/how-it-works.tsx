const STEPS = [
  {
    n: '01',
    title: 'Рекрутер призначає задачу',
    body: 'З банку — під рівень кандидата (джун / мідл / сеньйор) і стек. Без дзвінка, без whiteboard. 30 секунд у панелі.',
    meta: '30 сек',
    metaLabel: 'на налаштування',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
        <rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M6 3V1.5M12 3V1.5M2 7h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    n: '02',
    title: 'Кандидат робить pull request',
    body: 'Отримує приватний репо з реальним контекстом. AI дозволений — задачі спроєктовані так, що він необхідний, але недостатній.',
    meta: '45–120 хв',
    metaLabel: 'час кандидата',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
        <circle cx="4.5" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="4.5" cy="13.5" r="2" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="13.5" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M4.5 6.5v5M6.5 4.5h3.5a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    n: '03',
    title: 'Система оцінює автоматично',
    body: 'CI-тести, фокус диффу, якість комітів, відповіді на авто-ревʼю. LLM-суддя читає весь PR по структурованій рубриці.',
    meta: '~2 хв',
    metaLabel: 'після submit',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
        <path d="M3 9l4 4 8-8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    n: '04',
    title: 'Рекрутер бачить ранжований звіт',
    body: 'Бали по рубриці, посилання на PR, сильні й слабкі сторони. Далі — лише фінальне інтервʼю з командою на культурний фіт.',
    meta: 'миттєво',
    metaLabel: 'доступний звіт',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
        <path d="M3 14l4-4 3 3 5-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="1.5" y="1.5" width="15" height="15" rx="2" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="yak-tse-pratsuye" className="border-b border-ink/8 bg-paper-DEFAULT">
      <div className="section-inner py-24 sm:py-32">
        {/* Header */}
        <div className="max-w-2xl">
          <p className="label-mono text-ink/50">Як це працює</p>
          <h2 className="mt-5 font-display text-4xl sm:text-5xl font-semibold leading-[1.08] tracking-tight">
            Чотири кроки. Нуль годин інженерного&nbsp;часу.
          </h2>
        </div>

        {/* Steps grid */}
        <ol className="mt-16 grid gap-px bg-ink/8 md:grid-cols-2 overflow-hidden rounded-2xl border border-ink/8 shadow-card">
          {STEPS.map((s, i) => (
            <li
              key={s.n}
              className="group bg-paper hover:bg-surface transition-colors duration-150 p-8 sm:p-10 flex flex-col gap-5"
            >
              {/* Top row: number + time badge */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-ink/6 text-ink/60 transition-colors duration-150 group-hover:bg-ink/10"
                    aria-hidden
                  >
                    {s.icon}
                  </span>
                  <span className="label-mono text-ink/40">{s.n}</span>
                </div>
                <div className="text-right">
                  <div className="tabular font-mono text-sm font-semibold text-accent">
                    {s.meta}
                  </div>
                  <div className="label-mono text-ink/40 mt-0.5">{s.metaLabel}</div>
                </div>
              </div>

              {/* Content */}
              <div>
                <h3 className="font-display text-xl font-semibold leading-snug text-ink">
                  {s.title}
                </h3>
                <p className="mt-3 text-ink/65 leading-relaxed text-[0.9375rem]">
                  {s.body}
                </p>
              </div>

              {/* Step indicator */}
              <div className="mt-auto flex items-center gap-2 pt-4 border-t border-ink/6" aria-hidden>
                {STEPS.map((_, j) => (
                  <div
                    key={j}
                    className={`h-0.5 flex-1 rounded-full transition-colors duration-150 ${
                      j === i ? 'bg-accent' : j < i ? 'bg-ink/20' : 'bg-ink/8'
                    }`}
                  />
                ))}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
