const LEVELS = [
  {
    tag: 'junior',
    hook: 'Додай фічу в чистий репо',
    desc: 'Маленький проєкт зі своїми конвенціями. Треба прочитати README, не знести зайвого, написати тест. Cursor справиться — ми відсіваємо тих, хто не справляється з цим.',
    signals: ['Читає інструкції', 'Не ламає існуюче', 'Пише тест'],
  },
  {
    tag: 'middle',
    hook: 'Відтвори баг і полагодь',
    desc: 'Репо крупніше, задача сформульована розпливчасто: «користувачі скаржаться, що Y працює дивно в кейсі Z». AI не знає, що саме чинити — треба локалізувати причину.',
    signals: ['Декомпозиція', 'Вибір рівня фіксу', 'Обґрунтування в PR'],
  },
  {
    tag: 'senior',
    hook: 'Реальний legacy з архітектурним боргом',
    desc: 'Задача: «зроби фічу так, щоб через пів року її можна було розширити до W, не переписуючи все». Обовʼязковий design-doc у PR — AI напише код, але не прийме рішень за людину.',
    signals: ['Trade-off-и', 'Розширюваність', 'Якість rationale'],
  },
];

export function Levels() {
  return (
    <section id="rivni" className="border-b border-ink/10 bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
              Рівні
            </p>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl font-semibold leading-tight">
              Задача калібрується під рівень. AI необхідний — але недостатній.
            </h2>
          </div>
          <p className="text-paper/70 text-lg leading-relaxed">
            Моат продукту — дизайн задач. Ми не боремося з&nbsp;AI. Ми робимо так, щоб
            без розуміння системи AI був просто друкарською машинкою. Це ручна робота:
            кожна задача калібрується на живих кандидатах.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {LEVELS.map((l) => (
            <article
              key={l.tag}
              className="rounded-2xl border border-white/10 bg-ink-soft p-8 flex flex-col gap-5"
            >
              <span className="font-mono text-xs uppercase tracking-widest text-accent">
                {l.tag}
              </span>
              <h3 className="font-display text-2xl font-semibold leading-snug">
                {l.hook}
              </h3>
              <p className="text-paper/70 leading-relaxed">{l.desc}</p>
              <ul className="mt-auto pt-4 border-t border-white/10 space-y-1.5 font-mono text-sm text-paper/60">
                {l.signals.map((s) => (
                  <li key={s}>→ {s}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
