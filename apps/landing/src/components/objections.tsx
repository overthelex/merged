const FAQ = [
  {
    q: 'А якщо кандидат просто дасть задачу Claude-у?',
    a: 'Нехай дає. Задачі спроєктовані так, що «сліпе» AI-рішення набирає 30–40 балів зі 100: тести впадуть на edge-кейсах, PR-опис буде порожній, коміти — один великий, відповіді на авто-ревʼю — загальні. Ми міряємо не «написав код», а «зрозумів систему».',
  },
  {
    q: 'Задачі ж утечуть в інтернет і в тренувальні дані моделей.',
    a: 'Кожна задача параметризується: один template — десятки варіантів з різними seed-ами, іменами, акцентами у вимогах. Публічне рішення однієї конкретної версії не пройде іншу. Плюс — опція приватних задач на вашому коді для enterprise-плану.',
  },
  {
    q: 'Сеньйор не робитиме тригодинну домашку.',
    a: 'Згодні. Для senior-ів — формат парної сесії 45 хвилин: шарить екран, вирішує разом з AI, система пише телеметрію (скільки думав, що гуглив, скільки переписував). Це вписується в календар і міряє більше, ніж класичне інтервʼю.',
  },
  {
    q: 'Це не замінить фінальне інтервʼю з командою?',
    a: 'Ми не прибираємо інтервʼю. Ми прибираємо етап, де ви витрачаєте 40 інженерних годин на відсів людей, які просто не вміють програмувати. Культурний фіт і «чи хочу працювати 5 років» — це залишається живою зустріччю.',
  },
  {
    q: 'Чим це краще за HackerRank / CodeSignal / Codility?',
    a: 'Вони міряють leetcode у 2026 році. Ми міряємо реальну роботу: PR у реальний репо з реальним контекстом, оцінка по рубриці LLM-суддею. Інша категорія продукту — work-sample assessment для AI-ери.',
  },
];

export function Objections() {
  return (
    <section className="border-b border-ink/10">
      <div className="mx-auto max-w-4xl px-6 py-24 sm:py-32">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink/60">
          Чесно про заперечення
        </p>
        <h2 className="mt-4 font-display text-4xl sm:text-5xl font-semibold leading-tight">
          П&apos;ять речей, які&nbsp;ви&nbsp;подумаєте&nbsp;прямо&nbsp;зараз.
        </h2>

        <dl className="mt-14 divide-y divide-ink/10 border-t border-b border-ink/10">
          {FAQ.map((item, i) => (
            <div key={item.q} className="grid gap-4 py-8 md:grid-cols-[auto_1fr_auto]">
              <dt className="font-mono text-sm text-ink/40 md:pr-6 md:text-right md:w-12">
                {String(i + 1).padStart(2, '0')}
              </dt>
              <div>
                <dt className="font-display text-xl font-semibold">{item.q}</dt>
                <dd className="mt-3 text-ink/75 leading-relaxed">{item.a}</dd>
              </div>
              <span className="hidden md:block font-mono text-xs text-accent pt-1">·</span>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
