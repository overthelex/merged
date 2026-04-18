const FAQ = [
  {
    q: 'А якщо кандидат просто дасть задачу Claude-у?',
    a: 'Нехай дає. Задачі спроєктовані так, що «сліпе» AI-рішення набирає 30–40 балів зі 100: тести впадуть на edge-кейсах, PR-опис буде порожній, коміти — один великий, відповіді на авто-ревʼю — загальні. Ми міряємо не «написав код», а «зрозумів систему».',
    tag: 'AI-стійкість',
  },
  {
    q: 'Задачі ж утечуть в інтернет і в тренувальні дані моделей.',
    a: 'Кожна задача параметризується: один template — десятки варіантів з різними seed-ами, іменами, акцентами у вимогах. Публічне рішення однієї конкретної версії не пройде іншу. Плюс — опція приватних задач на вашому коді для enterprise-плану.',
    tag: 'Безпека',
  },
  {
    q: 'Сеньйор не робитиме тригодинну домашку.',
    a: 'Згодні. Для senior-ів — формат парної сесії 45 хвилин: шарить екран, вирішує разом з AI, система пише телеметрію (скільки думав, що гуглив, скільки переписував). Це вписується в календар і міряє більше, ніж класичне інтервʼю.',
    tag: 'Формат',
  },
  {
    q: 'Це не замінить фінальне інтервʼю з командою?',
    a: 'Ми не прибираємо інтервʼю. Ми прибираємо етап, де ви витрачаєте 40 інженерних годин на відсів людей, які просто не вміють програмувати. Культурний фіт і «чи хочу працювати 5 років» — це залишається живою зустріччю.',
    tag: 'Процес',
  },
  {
    q: 'Чим це краще за HackerRank / CodeSignal / Codility?',
    a: 'Вони міряють leetcode у 2026 році. Ми міряємо реальну роботу: PR у реальний репо з реальним контекстом, оцінка по рубриці LLM-суддею. Інша категорія продукту — work-sample assessment для AI-ери.',
    tag: 'Конкуренти',
  },
];

export function Objections() {
  return (
    <section className="border-b border-ink/8">
      <div className="mx-auto max-w-3xl px-6 py-24 sm:py-32">
        <p className="label-mono text-ink/50">Чесно про заперечення</p>
        <h2 className="mt-5 font-display text-4xl sm:text-5xl font-semibold leading-[1.08] tracking-tight">
          Пʼять речей, які ви подумаєте прямо зараз.
        </h2>

        <dl className="mt-14 space-y-0">
          {FAQ.map((item, i) => (
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
