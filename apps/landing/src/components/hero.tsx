import Link from 'next/link';
import Image from 'next/image';

const PORTAL = process.env.NEXT_PUBLIC_PORTAL_BASE_URL ?? 'https://portal.merged.com.ua';

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-ink/8">
      {/* Dot-grid texture */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #0b0f17 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Subtle ambient glow */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      <div className="relative section-inner pt-6 pb-24 sm:pb-36">
        <Topbar />

        <div className="mt-24 sm:mt-32 grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-16">
          {/* Left — headline */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-surface px-3 py-1.5 shadow-card">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="label-mono text-ink/60">merged · закрита бета · 2026</span>
            </div>

            <h1 className="mt-8 font-display text-[2.25rem] sm:text-[3.25rem] lg:text-[4.5rem] font-semibold leading-[0.93] tracking-[-0.02em] text-ink">
              Технічний скринінг —{' '}
              <span className="relative inline-block">
                <span className="relative z-10">без співбесід</span>
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-1.5 h-[0.35em] bg-accent/30 -z-0 rounded-sm"
                />
              </span>
              .
            </h1>

            <p className="mt-7 max-w-lg text-[1.125rem] text-ink/65 leading-[1.7]">
              Замість leetcode — одна калібрована задача в реальному репо.
              Кандидат відкриває pull request. Система оцінює автоматично:
              тести, структуру змін, якість комітів, відповіді на ревʼю.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href={PORTAL}
                className="group inline-flex items-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-medium text-paper shadow-card-md transition-all duration-150 hover:bg-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
              >
                Увійти в портал
                <ArrowRight className="transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="#yak-tse-pratsuye"
                className="inline-flex items-center gap-2 rounded-lg border border-ink/12 bg-surface px-5 py-3 text-sm font-medium text-ink/80 shadow-card transition-all duration-150 hover:border-ink/20 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
              >
                Як це працює
              </Link>
            </div>

            <p className="mt-4 label-mono text-ink/45">
              для HR-менеджерів
            </p>

            {/* Stat pills */}
            <div className="mt-10 flex flex-wrap gap-5">
              {[
                { value: '~2 хв', label: 'час оцінки PR' },
                { value: '87%', label: 'точність рубрики' },
                { value: '0 год', label: 'часу сеньйора' },
              ].map((s) => (
                <div key={s.label} className="flex items-baseline gap-2">
                  <span className="tabular font-display text-2xl font-semibold text-ink">
                    {s.value}
                  </span>
                  <span className="label-mono text-ink/45">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — diff card */}
          <DiffCard />
        </div>
      </div>
    </section>
  );
}

/* ── Topbar ─────────────────────────────────────────────────────────── */

function Topbar() {
  return (
    <nav
      className="flex items-center justify-between"
      aria-label="Головна навігація"
    >
      <div className="flex items-center gap-2.5">
        <LogoMark />
        <span className="font-display text-base font-semibold tracking-tight">
          merged
        </span>
      </div>
      <div className="hidden gap-7 sm:flex">
        {[
          { href: '#problema', label: 'Проблема' },
          { href: '#yak-tse-pratsuye', label: 'Як працює' },
          { href: '#rivni', label: 'Рівні' },
          { href: '/blog', label: 'Блог' },
          { href: '#zayavka', label: 'Демо' },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="font-mono text-sm text-ink/55 transition-colors duration-150 hover:text-ink focus-visible:outline-none focus-visible:underline"
          >
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

/* ── LogoMark ───────────────────────────────────────────────────────── */

function LogoMark() {
  return (
    <Image
      src="/brand/logo-ink-128.png"
      alt="merged"
      width={28}
      height={28}
      priority
      className="shrink-0"
    />
  );
}

/* ── ArrowRight ─────────────────────────────────────────────────────── */

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M2.5 7h9M7.5 3l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── DiffCard ───────────────────────────────────────────────────────── */

function DiffCard() {
  return (
    <div className="relative lg:justify-self-end w-full max-w-md mx-auto lg:mx-0">
      {/* Ambient glow behind card */}
      <div
        className="absolute -inset-4 rounded-3xl bg-accent/15 blur-2xl"
        aria-hidden
      />
      <div className="relative rounded-2xl border border-ink/12 bg-ink text-paper shadow-card-lg overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          </div>
          <span className="label-mono text-white/40">pull request · #42</span>
          <span className="label-mono text-accent">open</span>
        </div>

        {/* Diff content */}
        <pre className="px-5 py-5 font-mono text-[11.5px] leading-[1.75] overflow-x-auto">
          <span className="diff-meta">{'@@ src/billing/invoice.ts @@\n'}</span>
          <span className="text-white/50">{'   const amount = base * qty;\n'}</span>
          <span className="diff-del">{'−  const tax = amount * 0.2;\n'}</span>
          <span className="diff-add">{'+'}</span>
          <span className="diff-add">{'  const tax = calcTax(amount, country);\n'}</span>
          <span className="text-white/30">{'\n'}</span>
          <span className="diff-add">{'+'}</span>
          <span className="diff-add">{'  // edge case: UA VAT exemption\n'}</span>
          <span className="diff-add">{'+'}</span>
          <span className="diff-add">{'  if (country === \'UA\' && isExempt(plan)) {\n'}</span>
          <span className="diff-add">{'+'}</span>
          <span className="diff-add">{'    return amount;\n'}</span>
          <span className="diff-add">{'+'}</span>
          <span className="diff-add">{'  }\n'}</span>
          <span className="text-white/50">{'   return amount + tax;\n'}</span>
        </pre>

        {/* Score rows */}
        <div className="border-t border-white/8 px-5 py-4 space-y-2.5">
          {[
            { check: 'tests', label: 'CI пройшов', value: '87/87', ok: true },
            { check: 'diff', label: 'Фокус диффу', value: '3 файли, +24 −4', ok: true },
            { check: 'llm', label: 'Рубрика (LLM-суддя)', value: '4.6 / 5.0', ok: true },
          ].map((row) => (
            <div key={row.check} className="flex items-center gap-3 font-mono text-xs">
              <span className="w-10 text-white/35 tabular">{row.check}</span>
              <span className="text-accent" aria-label="passed">✔</span>
              <span className="text-white/60 flex-1">{row.label}</span>
              <span className="tabular text-white/50">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Footer bar */}
        <div className="border-t border-white/8 px-5 py-3 flex items-center justify-between">
          <span className="label-mono text-white/40">senior · legacy-invoice</span>
          <span className="rounded-md bg-accent px-2.5 py-1 label-mono text-ink font-bold">
            PASS
          </span>
        </div>
      </div>
    </div>
  );
}
