'use client';

import { useState, useId } from 'react';

const PORTAL = process.env.NEXT_PUBLIC_PORTAL_BASE_URL ?? 'https://portal.legal.org.ua';

type Status = 'idle' | 'sending' | 'ok' | 'err';

export function LeadForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus('sending');
    setError(null);
    try {
      const res = await fetch(`${PORTAL}/api/leads`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...data, source: 'landing' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus('ok');
      form.reset();
    } catch (err) {
      setStatus('err');
      setError(err instanceof Error ? err.message : 'Помилка');
    }
  }

  return (
    <section id="zayavka" className="border-b border-ink/8 bg-ink text-paper">
      <div className="section-inner py-24 sm:py-32">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.25fr] lg:items-start lg:gap-20">
          {/* Left — value prop */}
          <div className="lg:pt-2">
            <p className="label-mono text-accent">Демо</p>
            <h2 className="mt-5 font-display text-4xl sm:text-5xl font-semibold leading-[1.08] tracking-tight">
              Покажемо на вашому стеку.
            </h2>
            <p className="mt-6 text-[1.0625rem] text-paper/65 leading-[1.75]">
              15 хвилин. Ви розкажете, кого наймаєте. Ми покажемо, як виглядав би
              скринінг у merged замість дзвінків. Приклади задач під ваш стек —
              у вашому поштовику того ж дня.
            </p>

            {/* Commitment list */}
            <ul className="mt-8 space-y-3">
              {[
                'Закрита бета, ринок України',
                'Без передоплати, без контракту',
                'Відповідь протягом 24 годин',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" aria-hidden />
                  <span className="font-mono text-sm text-paper/60">{item}</span>
                </li>
              ))}
            </ul>

            {/* Trust signal */}
            <div className="mt-10 rounded-xl border border-white/8 bg-white/4 px-5 py-4">
              <p className="label-mono text-white/40 mb-2">Альтернатива</p>
              <p className="text-sm text-paper/60 leading-relaxed">
                Не хочете форму? Напишіть одразу:{' '}
                <a
                  href="mailto:hello@merged.legal.org.ua"
                  className="text-accent underline underline-offset-2 hover:text-accent/80 transition-colors"
                >
                  hello@merged.legal.org.ua
                </a>
              </p>
            </div>
          </div>

          {/* Right — form */}
          <div className="rounded-2xl border border-white/8 bg-ink-soft shadow-inset-top overflow-hidden">
            {status === 'ok' ? (
              <SuccessState />
            ) : (
              <form onSubmit={onSubmit} className="p-8 sm:p-10 space-y-6" noValidate>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    name="name"
                    label="Імʼя"
                    placeholder="Олена"
                    hint="Як вас звати"
                    required
                  />
                  <Field
                    name="company"
                    label="Компанія"
                    placeholder="Tech Studio"
                    hint="Назва організації"
                    required
                  />
                </div>
                <Field
                  name="email"
                  label="Робочий email"
                  type="email"
                  placeholder="olena@techstudio.ua"
                  hint="Відповімо на цю адресу"
                  required
                />
                <Field
                  name="role"
                  label="Ваша роль"
                  placeholder="Head of Engineering · Recruiter · CTO"
                  hint="Необовʼязково"
                />
                <TextareaField
                  name="note"
                  label="Контекст"
                  placeholder="Кого наймаєте, скільки на місяць, який стек — що завгодно корисне"
                  hint="Допоможе підготувати релевантне демо"
                />

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="w-full rounded-lg bg-accent text-ink font-semibold text-sm px-6 py-3.5 transition-all duration-150 hover:bg-accent/90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink-soft"
                  >
                    {status === 'sending' ? (
                      <span className="flex items-center justify-center gap-2">
                        <SpinnerIcon />
                        Відправляємо…
                      </span>
                    ) : (
                      'Запросити демо'
                    )}
                  </button>

                  {status === 'err' && (
                    <p className="mt-3 text-sm text-red-400 text-center" role="alert">
                      Не вдалося надіслати{error ? `: ${error}` : ''}. Напишіть на{' '}
                      <a
                        className="underline underline-offset-2 hover:text-red-300 transition-colors"
                        href="mailto:hello@merged.legal.org.ua"
                      >
                        hello@merged.legal.org.ua
                      </a>
                    </p>
                  )}
                </div>

                <p className="text-xs text-paper/35 text-center leading-relaxed">
                  Ми не передаємо дані третім сторонам і не надсилаємо спам.
                  Відписатися — одним кліком у будь-який момент.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Field components ────────────────────────────────────────────────── */

function Field({
  name,
  label,
  type = 'text',
  placeholder,
  hint,
  required,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
}) {
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-center gap-1.5">
        <span className="label-mono text-paper/60">{label}</span>
        {required && (
          <span className="label-mono text-accent" aria-label="обовʼязкове поле">
            *
          </span>
        )}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        aria-describedby={hint ? hintId : undefined}
        className="w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-sm text-paper placeholder:text-paper/25 transition-all duration-150 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/40"
      />
      {hint && (
        <span id={hintId} className="label-mono text-paper/30">
          {hint}
        </span>
      )}
    </div>
  );
}

function TextareaField({
  name,
  label,
  placeholder,
  hint,
}: {
  name: string;
  label: string;
  placeholder?: string;
  hint?: string;
}) {
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id}>
        <span className="label-mono text-paper/60">{label}</span>
      </label>
      <textarea
        id={id}
        name={name}
        rows={3}
        placeholder={placeholder}
        aria-describedby={hint ? hintId : undefined}
        className="w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-sm text-paper placeholder:text-paper/25 resize-none transition-all duration-150 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/40"
      />
      {hint && (
        <span id={hintId} className="label-mono text-paper/30">
          {hint}
        </span>
      )}
    </div>
  );
}

/* ── Success state ───────────────────────────────────────────────────── */

function SuccessState() {
  return (
    <div className="p-8 sm:p-10 flex flex-col items-center justify-center min-h-[360px] text-center gap-5">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
          <path
            d="M4 11l5 5 9-9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div>
        <p className="font-display text-xl font-semibold text-paper">
          Заявку отримано
        </p>
        <p className="mt-2 text-sm text-paper/55 leading-relaxed max-w-xs">
          Повернемось протягом 24 годин з пропозицією щодо зручного часу демо.
        </p>
      </div>
    </div>
  );
}

/* ── Spinner ─────────────────────────────────────────────────────────── */

function SpinnerIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      className="animate-spin"
    >
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
      <path
        d="M7 1.5a5.5 5.5 0 0 1 5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
