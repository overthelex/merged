const SIGNALS = [
  { label: 'CI пройшов', weight: 20, color: 'bg-ink/20' },
  { label: 'Фокус і розмір диффу', weight: 15, color: 'bg-ink/40' },
  { label: 'Якість комітів', weight: 10, color: 'bg-ink/55' },
  { label: 'Rationale у PR-описі', weight: 20, color: 'bg-ink/70' },
  { label: 'Декомпозиція (LLM-суддя)', weight: 20, color: 'bg-accent/70' },
  { label: 'Trade-off-и та архітектура', weight: 15, color: 'bg-accent' },
];

export function Signals() {
  return (
    <section className="border-b border-ink/10">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink/60">
              Що саме міряємо
            </p>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl font-semibold leading-tight">
              «Зелений CI» — лише&nbsp;20% сигналу.
            </h2>
            <p className="mt-6 text-lg text-ink/75 leading-relaxed">
              Інші 80% — те, що сучасний LLM-суддя по структурованій рубриці робить
              краще за людину-інтервʼюера: читає весь PR, описання, історію комітів,
              відповіді на коментарі. Без втоми, без упереджень, без хорошого/поганого
              дня.
            </p>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white p-8 sm:p-10">
            <div className="flex items-center justify-between font-mono text-sm text-ink/60">
              <span>Ваги рубрики</span>
              <span>усього 100%</span>
            </div>
            <ul className="mt-6 space-y-4">
              {SIGNALS.map((s) => (
                <li key={s.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink/80">{s.label}</span>
                    <span className="font-mono text-ink/60">{s.weight}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink/5">
                    <div
                      className={`h-full ${s.color}`}
                      style={{ width: `${s.weight * 4}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-xs font-mono text-ink/50">
              * Ваги налаштовуються на рівні окремого template-а задачі.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
