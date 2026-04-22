'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { useTransition } from 'react';

const LABELS: Record<Locale, string> = {
  uk: 'UK',
  fr: 'FR',
  en: 'EN',
};

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onChange(next: Locale) {
    if (next === locale) return;
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex items-center gap-0.5 rounded-md border border-ink/10 bg-surface p-0.5 font-mono text-[11px] text-ink/60"
    >
      {routing.locales.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => onChange(code)}
            disabled={isPending}
            aria-pressed={active}
            className={[
              'rounded-[5px] px-1.5 py-0.5 transition-colors',
              active
                ? 'bg-ink text-surface'
                : 'hover:bg-surface-dim hover:text-ink',
            ].join(' ')}
          >
            {LABELS[code]}
          </button>
        );
      })}
    </div>
  );
}
