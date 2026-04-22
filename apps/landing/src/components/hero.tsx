import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { LocaleSwitcher } from './locale-switcher';

const PORTAL = process.env.NEXT_PUBLIC_PORTAL_BASE_URL ?? 'https://portal.merged.com.ua';

type StatKey = 'time' | 'accuracy' | 'seniorTime';
const STAT_KEYS: StatKey[] = ['time', 'accuracy', 'seniorTime'];

type DiffRowKey = 'tests' | 'diff' | 'llm';
const DIFF_ROW_KEYS: DiffRowKey[] = ['tests', 'diff', 'llm'];

export function Hero() {
  const t = useTranslations('hero');

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
              <span className="label-mono text-ink/60">{t('badge')}</span>
            </div>

            <h1 className="mt-8 font-display text-[2.25rem] sm:text-[3.25rem] lg:text-[4.5rem] font-semibold leading-[0.93] tracking-[-0.02em] text-ink">
              {t('titlePart1')}
              <span className="relative inline-block">
                <span className="relative z-10">{t('titlePart2')}</span>
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-1.5 h-[0.35em] bg-accent/30 -z-0 rounded-sm"
                />
              </span>
              {t('titlePart3')}
            </h1>

            <p className="mt-7 max-w-lg text-[1.125rem] text-ink/65 leading-[1.7]">
              {t('subtitle')}
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <a
                href={PORTAL}
                className="group inline-flex items-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-medium text-paper shadow-card-md transition-all duration-150 hover:bg-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
              >
                {t('ctaPrimary')}
                <ArrowRight className="transition-transform duration-150 group-hover:translate-x-0.5" />
              </a>
              <Link
                href="/#yak-tse-pratsuye"
                className="inline-flex items-center gap-2 rounded-lg border border-ink/12 bg-surface px-5 py-3 text-sm font-medium text-ink/80 shadow-card transition-all duration-150 hover:border-ink/20 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
              >
                {t('ctaSecondary')}
              </Link>
            </div>

            <p className="mt-4 label-mono text-ink/45">{t('audienceNote')}</p>

            {/* Stat pills */}
            <div className="mt-10 flex flex-wrap gap-5">
              {STAT_KEYS.map((key) => (
                <div key={key} className="flex items-baseline gap-2">
                  <span className="tabular font-display text-2xl font-semibold text-ink">
                    {t(`stats.${key}.value`)}
                  </span>
                  <span className="label-mono text-ink/45">
                    {t(`stats.${key}.label`)}
                  </span>
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
  const t = useTranslations('hero');
  const navLinks = [
    { href: '/#problema', label: t('nav.problem') },
    { href: '/#yak-tse-pratsuye', label: t('nav.howItWorks') },
    { href: '/#rivni', label: t('nav.levels') },
    { href: '/blog', label: t('nav.blog') },
    { href: '/#zayavka', label: t('nav.demo') },
  ];

  return (
    <nav className="flex items-center justify-between" aria-label={t('navAriaLabel')}>
      <div className="flex items-center gap-2.5">
        <LogoMark alt={t('logoAlt')} />
        <span className="font-display text-base font-semibold tracking-tight">
          merged
        </span>
      </div>
      <div className="hidden items-center gap-7 sm:flex">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="font-mono text-sm text-ink/55 transition-colors duration-150 hover:text-ink focus-visible:outline-none focus-visible:underline"
          >
            {link.label}
          </Link>
        ))}
        <LocaleSwitcher />
      </div>
    </nav>
  );
}

/* ── LogoMark ───────────────────────────────────────────────────────── */

function LogoMark({ alt }: { alt: string }) {
  return (
    <Image
      src="/brand/logo-ink-128.png"
      alt={alt}
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
  const t = useTranslations('hero.diffCard');
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
          <span className="label-mono text-white/40">{t('prLabel')}</span>
          <span className="label-mono text-accent">{t('prStatus')}</span>
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
          {DIFF_ROW_KEYS.map((key) => (
            <div key={key} className="flex items-center gap-3 font-mono text-xs">
              <span className="w-10 text-white/35 tabular">{key}</span>
              <span className="text-accent" aria-label={t('passedAriaLabel')}>✔</span>
              <span className="text-white/60 flex-1">{t(`rows.${key}.label`)}</span>
              <span className="tabular text-white/50">{t(`rows.${key}.value`)}</span>
            </div>
          ))}
        </div>

        {/* Footer bar */}
        <div className="border-t border-white/8 px-5 py-3 flex items-center justify-between">
          <span className="label-mono text-white/40">{t('footerMeta')}</span>
          <span className="rounded-md bg-accent px-2.5 py-1 label-mono text-ink font-bold">
            {t('footerStatus')}
          </span>
        </div>
      </div>
    </div>
  );
}
