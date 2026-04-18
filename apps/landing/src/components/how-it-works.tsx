const STEPS = [
  {
    n: '01',
    title: 'Рекрутер призначає задачу',
    body: 'З банку — під рівень кандидата (джун / мідл / сеньйор) і стек. Без дзвінка, без whiteboard.',
    meta: '30 секунд',
  },
  {
    n: '02',
    title: 'Кандидат робить pull request',
    body: 'Отримує приватний репо з реальним контекстом. AI дозволений — задачі спроєктовані так, що він необхідний, але недостатній.',
    meta: '45–120 хв',
  },
  {
    n: '03',
    title: 'Система оцінює автоматично',
    body: 'CI-тести, фокус диффу, якість комітів, відповіді на авто-ревʼю. Плюс рубрика LLM-судді — декомпозиція, trade-off-и, архітектура.',
    meta: '~2 хв після submit',
  },
  {
    n: '04',
    title: 'Рекрутер бачить ранжований звіт',
    body: 'Бали по рубриці, посилання на PR, сильні й слабкі сторони. Далі — лише фінальне інтервʼю з командою на культурний фіт.',
    meta: 'миттєво',
  },
];

export function HowItWorks() {
  return (
    <section id="yak-tse-pratsuye" className="border-b border-ink/10">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink/60">
            Як це працює
          </p>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl font-semibold leading-tight">
            Чотири кроки. Без&nbsp;години&nbsp;інженерного&nbsp;часу.
          </h2>
        </div>

        <ol className="mt-16 grid gap-px bg-ink/10 md:grid-cols-2 overflow-hidden rounded-2xl border border-ink/10">
          {STEPS.map((s) => (
            <li
              key={s.n}
              className="bg-paper p-8 sm:p-10 flex flex-col gap-4 transition hover:bg-white"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-ink/50">{s.n}</span>
                <span className="font-mono text-xs text-accent bg-accent-soft/60 rounded-full px-2 py-0.5">
                  {s.meta}
                </span>
              </div>
              <h3 className="font-display text-2xl font-semibold">{s.title}</h3>
              <p className="text-ink/75 leading-relaxed">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
