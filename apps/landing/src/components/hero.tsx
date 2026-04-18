import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-ink/10">
      <div className="absolute inset-0 pointer-events-none opacity-[0.06]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(11,15,23,0.6) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pt-8 pb-20 sm:pt-12 sm:pb-32">
        <Topbar />

        <div className="mt-20 sm:mt-28 grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink/60">
              merged · <span className="text-accent">TID</span> · 2026
            </p>
            <h1 className="mt-6 font-display text-5xl sm:text-7xl font-semibold leading-[0.95] tracking-tight">
              Технічний скринінг —{' '}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10">без співбесід</span>
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-1 h-3 bg-accent/70 -z-0"
                />
              </span>
              .
            </h1>
            <p className="mt-8 max-w-xl text-lg sm:text-xl text-ink/75 leading-relaxed">
              Замість leetcode-інтервʼю — одна калібрована задача в реальному репо.
              Кандидат робить pull request. Ми оцінюємо автоматично: тести, структура
              змін, якість комітів, відповіді на код-ревʼю.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="#zayavka"
                className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-medium text-paper transition hover:bg-ink-soft"
              >
                Запросити демо
                <span className="transition group-hover:translate-x-0.5">→</span>
              </Link>
              <Link
                href="#yak-tse-pratsuye"
                className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-6 py-3 font-medium hover:bg-ink/5"
              >
                Як це працює
              </Link>
            </div>
          </div>

          <DiffCard />
        </div>
      </div>
    </section>
  );
}

function Topbar() {
  return (
    <nav className="flex items-center justify-between font-mono text-sm">
      <div className="flex items-center gap-2">
        <LogoMark />
        <span className="font-semibold tracking-tight">merged</span>
      </div>
      <div className="hidden gap-8 sm:flex text-ink/70">
        <a href="#problema" className="hover:text-ink">Проблема</a>
        <a href="#yak-tse-pratsuye" className="hover:text-ink">Як працює</a>
        <a href="#rivni" className="hover:text-ink">Рівні</a>
        <a href="#zayavka" className="hover:text-ink">Демо</a>
      </div>
    </nav>
  );
}

function LogoMark() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <rect width="28" height="28" rx="7" fill="#0b0f17" />
      <path
        d="M7.5 19V9m0 10c2.5 0 4-2 4-4.5S10 10 8 10M20.5 9v10m0-10c-2.5 0-4 2-4 4.5S18 18 20 18"
        stroke="#00d488"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="14" cy="14" r="1.6" fill="#00d488" />
    </svg>
  );
}

function DiffCard() {
  return (
    <div className="relative">
      <div className="absolute -inset-3 bg-accent/20 blur-2xl rounded-3xl" aria-hidden />
      <div className="relative rounded-2xl border border-ink/10 bg-ink text-paper shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
          </div>
          <span className="text-white/50">pull request · #42</span>
        </div>
        <pre className="px-5 py-5 font-mono text-[12.5px] leading-relaxed whitespace-pre">
{`@@ src/billing/invoice.ts
-  const tax = amount * 0.2;
+  const tax = calcTax(amount, country);
+
+  // fixes edge case for UA VAT
+  if (country === 'UA' && isExempt(plan)) {
+    return amount;
+  }
  return amount + tax;

ci   ✔ tests passed (87/87)
diff ✔ focused (3 files, +24 −4)
llm  ✔ rubric: 4.6 / 5
`}
        </pre>
        <div className="border-t border-white/10 px-5 py-3 flex items-center justify-between text-xs font-mono">
          <span className="text-white/60">senior · repo: legacy-invoice</span>
          <span className="rounded-full bg-accent/90 text-ink px-2 py-0.5 font-semibold">
            PASS
          </span>
        </div>
      </div>
    </div>
  );
}
