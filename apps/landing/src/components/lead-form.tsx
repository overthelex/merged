'use client';

import { useState } from 'react';

const PORTAL = process.env.NEXT_PUBLIC_PORTAL_BASE_URL ?? 'https://app.merged.legal.org.ua';

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
    <section id="zayavka" className="border-b border-ink/10 bg-ink text-paper">
      <div className="mx-auto max-w-4xl px-6 py-24 sm:py-32">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-start">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
              Демо
            </p>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl font-semibold leading-tight">
              Покажемо на&nbsp;вашому стеку.
            </h2>
            <p className="mt-6 text-paper/70 leading-relaxed">
              15 хвилин. Ви розкажете, кого наймаєте. Ми покажемо, як виглядав би
              скринінг у merged замість дзвінків. Приклади задач під ваш стек — у вашому
              поштовику того ж дня.
            </p>
            <ul className="mt-8 space-y-3 font-mono text-sm text-paper/60">
              <li>→ закрита бета, ринок України</li>
              <li>→ без передоплати, без контракту</li>
              <li>→ українською, під ваш стек</li>
            </ul>
          </div>

          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-white/10 bg-ink-soft p-8 sm:p-10 space-y-5"
          >
            <Field name="name" label="Імʼя" placeholder="Олена" required />
            <Field
              name="company"
              label="Компанія"
              placeholder="Tech Studio"
              required
            />
            <Field
              name="email"
              label="Робочий email"
              type="email"
              placeholder="olena@example.com"
              required
            />
            <Field
              name="role"
              label="Роль"
              placeholder="Head of Engineering · Recruiter · CTO"
            />
            <label className="block">
              <span className="font-mono text-xs uppercase tracking-widest text-paper/60">
                Коментар
              </span>
              <textarea
                name="note"
                rows={3}
                className="mt-2 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-paper placeholder:text-paper/40 focus:outline-none focus:border-accent"
                placeholder="Кого наймаєте, скільки на місяць, який стек"
              />
            </label>
            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full rounded-full bg-accent text-ink font-semibold px-6 py-3 transition hover:bg-accent-soft disabled:opacity-60"
            >
              {status === 'sending'
                ? 'Відправляємо…'
                : status === 'ok'
                  ? 'Надіслано — повернемось за 24 години'
                  : 'Запросити демо'}
            </button>
            {status === 'err' && (
              <p className="text-sm text-red-300">
                Не вдалося надіслати{error ? `: ${error}` : ''}. Напишіть на{' '}
                <a className="underline" href="mailto:hello@merged.legal.org.ua">
                  hello@merged.legal.org.ua
                </a>
                .
              </p>
            )}
            <p className="text-xs text-paper/50">
              Ми не передаємо дані третім сторонам. Відписатися — одним кліком.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

function Field({
  name,
  label,
  type = 'text',
  placeholder,
  required,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="font-mono text-xs uppercase tracking-widest text-paper/60">
        {label}
        {required && <span className="text-accent"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-2 w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-paper placeholder:text-paper/40 focus:outline-none focus:border-accent"
      />
    </label>
  );
}
