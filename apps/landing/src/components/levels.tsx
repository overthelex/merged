const LEVELS = [
  {
    tag: 'junior',
    tagLabel: 'Junior',
    hook: 'Додай фічу в чистий репо',
    desc: 'Маленький проєкт зі своїми конвенціями. Треба прочитати README, не знести зайвого, написати тест. Cursor справиться — ми відсіюємо тих, хто не справляється з цим.',
    signals: [
      { label: 'Читає інструкції', weight: 30 },
      { label: 'Не ламає існуюче', weight: 40 },
      { label: 'Пише тест', weight: 30 },
    ],
    scoreRange: '2.0–3.5',
    duration: '45 хв',
  },
  {
    tag: 'middle',
    tagLabel: 'Middle',
    hook: 'Відтвори баг і полагодь',
    desc: 'Репо крупніше, задача сформульована розпливчасто: «користувачі скаржаться, що Y працює дивно в кейсі Z». AI не знає, що саме чинити — треба локалізувати причину.',
    signals: [
      { label: 'Декомпозиція', weight: 35 },
      { label: 'Вибір рівня фіксу', weight: 35 },
      { label: 'Обґрунтування в PR', weight: 30 },
    ],
    scoreRange: '3.0–4.5',
    duration: '90 хв',
  },
  {
    tag: 'senior',
    tagLabel: 'Senior',
    hook: 'Legacy з архітектурним боргом',
    desc: 'Задача: «зроби фічу так, щоб через пів року її можна було розширити до W, не переписуючи все». Обовʼязковий design-doc у PR — AI напише код, але не прийме рішень за людину.',
    signals: [
      { label: 'Trade-off-и', weight: 40 },
      { label: 'Розширюваність', weight: 35 },
      { label: 'Якість rationale', weight: 25 },
    ],
    scoreRange: '3.5–5.0',
    duration: '120 хв',
  },
];

export function Levels() {
  return (
    <section id="rivni" className="border-b border-ink/8 bg-ink text-paper">
      <div className="section-inner py-24 sm:py-32">
        {/* Header */}
        <div className="grid gap-10 lg:grid-cols-[1fr_1.8fr] lg:items-end">
          <div>
            <p className="label-mono text-accent">Рівні</p>
            <h2 className="mt-5 font-display text-4xl sm:text-5xl font-semibold leading-[1.08] tracking-tight">
              Задача калібрується під рівень.
            </h2>
          </div>
          <p className="text-paper/65 text-[1.0625rem] leading-[1.75] lg:pb-1">
            Моат продукту — дизайн задач. Ми не боремося з AI. Ми робимо так, щоб
            без розуміння системи AI був просто друкарською машинкою.
            Кожна задача калібрується на живих кандидатах вручну.
          </p>
        </div>

        {/* Level cards */}
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {LEVELS.map((l) => (
            <article
              key={l.tag}
              className="rounded-2xl border border-white/8 bg-ink-soft flex flex-col gap-0 overflow-hidden shadow-inset-top"
            >
              {/* Card header */}
              <div className="px-5 pt-5 pb-4 sm:px-7 sm:pt-7 sm:pb-5">
                <div className="flex items-center justify-between">
                  <span className="label-mono text-accent">{l.tagLabel}</span>
                  <div className="text-right">
                    <span className="tabular font-mono text-xs text-white/40">{l.duration}</span>
                  </div>
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold leading-snug text-paper">
                  {l.hook}
                </h3>
                <p className="mt-3 text-paper/60 text-sm leading-relaxed">
                  {l.desc}
                </p>
              </div>

              {/* Signals */}
              <div className="px-5 py-4 sm:px-7 sm:py-5 border-t border-white/6 mt-auto">
                <p className="label-mono text-white/35 mb-3">Ключові сигнали</p>
                <ul className="space-y-3">
                  {l.signals.map((s) => (
                    <li key={s.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-xs text-paper/70">{s.label}</span>
                        <span className="tabular font-mono text-xs text-white/40">{s.weight}%</span>
                      </div>
                      <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/8">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${s.weight}%`, opacity: 0.7 + s.weight / 200 }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Score range footer */}
              <div className="px-5 py-3.5 sm:px-7 sm:py-4 border-t border-white/6 flex items-center justify-between">
                <span className="label-mono text-white/35">Очікуваний скор</span>
                <span className="tabular font-mono text-sm text-accent font-semibold">
                  {l.scoreRange} / 5.0
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* AI note */}
        <div className="mt-10 rounded-xl border border-white/8 bg-white/3 px-6 py-4 flex items-start gap-4">
          <span className="label-mono text-accent mt-0.5 shrink-0">NOTE</span>
          <p className="text-sm text-paper/60 leading-relaxed">
            AI дозволений і очікується. «Сліпе» Claude-рішення дає 30–40/100:
            тести падуть на edge-кейсах, PR-опис пустий, коміти — один великий блоб.
            Рубрика вимірює розуміння системи, а не факт написання коду.
          </p>
        </div>
      </div>
    </section>
  );
}
