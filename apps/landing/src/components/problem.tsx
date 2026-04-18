export function Problem() {
  return (
    <section id="problema" className="border-b border-ink/10 bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
              Проблема
            </p>
            <h2 className="mt-6 font-display text-4xl sm:text-5xl font-semibold leading-tight">
              Технічні інтервʼю зламані. Всі це знають, але&nbsp;працюють далі.
            </h2>
          </div>
          <div className="space-y-6 text-lg leading-relaxed text-paper/80">
            <p>
              <span className="text-accent">Leetcode-скринінг</span> міряє підготовку
              до leetcode. <span className="text-accent">System design</span> — вміння
              малювати коробочки. <span className="text-accent">Behavioral</span> —
              розказувати STAR-історії. Жодне не показує, як людина працює щодня.
            </p>
            <p>
              А у 2026 навіть ця ілюзія сигналу зникла: Copilot і Cursor закривають
              типову задачу за 10&nbsp;хвилин. Ви не міряєте вже нічого.
            </p>
            <p className="text-paper border-l-2 border-accent pl-5">
              Ваші сеньйори проводять десятки скринінг-дзвінків на місяць і виють
              від того, як цей етап спалює час. А підсумковий сигнал — шум.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
