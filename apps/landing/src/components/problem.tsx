const WASTE = [
  {
    method: 'Leetcode-скринінг',
    measures: 'Підготовку до leetcode',
    signal: 'Низький',
    cost: '2–4 год/кандидат',
  },
  {
    method: 'System design інтервʼю',
    measures: 'Вміння малювати діаграми',
    signal: 'Середній',
    cost: '1–2 год/кандидат',
  },
  {
    method: 'Behavioral (STAR)',
    measures: 'Навичку розповідати',
    signal: 'Низький',
    cost: '1 год/кандидат',
  },
  {
    method: 'merged PR-скринінг',
    measures: 'Реальну роботу в репо',
    signal: 'Високий',
    cost: '~2 хв автоматично',
    highlight: true,
  },
];

export function Problem() {
  return (
    <section id="problema" className="border-b border-ink/8 bg-ink text-paper">
      <div className="section-inner py-24 sm:py-32">
        {/* Header */}
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <p className="label-mono text-accent">Проблема</p>
            <h2 className="mt-5 font-display text-4xl sm:text-5xl font-semibold leading-[1.08] tracking-tight">
              Технічні інтервʼю зламані. Всі це знають, але працюють далі.
            </h2>
          </div>
          <div className="space-y-5 text-[1.0625rem] leading-[1.75] text-paper/70">
            <p>
              <span className="text-paper font-medium">Leetcode</span> міряє підготовку до leetcode.{' '}
              <span className="text-paper font-medium">System design</span> — вміння малювати коробочки.{' '}
              <span className="text-paper font-medium">Behavioral</span> — навичку розповідати STAR-історії.
              Жодне не показує, як людина працює щодня.
            </p>
            <p className="border-l-2 border-accent pl-5 text-paper/85">
              А у 2026 навіть ця ілюзія сигналу зникла: Copilot і Cursor закривають типову задачу за 10&nbsp;хвилин.
              Ваші сеньйори проводять десятки скринінг-дзвінків на місяць і виють від того, як цей етап спалює час.
            </p>
          </div>
        </div>

        {/* Comparison table */}
        <div className="mt-16 overflow-hidden rounded-xl border border-white/8">
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-sm" role="table">
              <thead>
                <tr className="border-b border-white/8 bg-white/4">
                  <th className="px-5 py-3.5 text-left text-white/45 font-normal label-mono">
                    Метод
                  </th>
                  <th className="px-5 py-3.5 text-left text-white/45 font-normal label-mono hidden sm:table-cell">
                    Що вимірює
                  </th>
                  <th className="px-5 py-3.5 text-left text-white/45 font-normal label-mono hidden md:table-cell">
                    Якість сигналу
                  </th>
                  <th className="px-5 py-3.5 text-right text-white/45 font-normal label-mono">
                    Вартість
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {WASTE.map((row) => (
                  <tr
                    key={row.method}
                    className={
                      row.highlight
                        ? 'bg-accent/8'
                        : 'hover:bg-white/3 transition-colors duration-100'
                    }
                  >
                    <td className="px-5 py-4 text-left">
                      <span
                        className={
                          row.highlight ? 'text-accent font-semibold' : 'text-paper/80'
                        }
                      >
                        {row.method}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-paper/55 hidden sm:table-cell">
                      {row.measures}
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <SignalPill level={row.signal} />
                    </td>
                    <td className="px-5 py-4 text-right tabular">
                      <span
                        className={
                          row.highlight ? 'text-accent font-semibold' : 'text-paper/60'
                        }
                      >
                        {row.cost}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom callout */}
        <p className="mt-8 label-mono text-white/35 text-center">
          * Оцінка витрат — на скринінг одного кандидата з урахуванням часу інженера
        </p>
      </div>
    </section>
  );
}

function SignalPill({ level }: { level: string }) {
  const map: Record<string, string> = {
    Низький: 'text-red-400/80',
    Середній: 'text-yellow-400/80',
    Високий: 'text-accent',
  };
  return (
    <span className={`tabular ${map[level] ?? 'text-paper/60'}`}>{level}</span>
  );
}
