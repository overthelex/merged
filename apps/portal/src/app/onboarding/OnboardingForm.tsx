'use client';

import { useFormState, useFormStatus } from 'react-dom';
import {
  completeOnboarding,
  type OnboardingState,
} from './_actions';

const INITIAL: OnboardingState = { ok: true };

export function OnboardingForm({
  defaultCompanyName,
  defaultContactEmail,
  userEmail,
}: {
  defaultCompanyName: string;
  defaultContactEmail: string;
  userEmail: string;
}) {
  const [state, action] = useFormState(completeOnboarding, INITIAL);

  return (
    <form action={action} className="space-y-5">
      {state.message && !state.ok && (
        <div className="rounded-md border border-red-200 bg-red-50 text-red-900 px-4 py-3 text-sm">
          {state.message}
        </div>
      )}

      <Field label="Назва компанії" hint="Як вона буде відображатися в задачах і листах кандидатам." error={state.fieldErrors?.companyName}>
        <input
          name="companyName"
          type="text"
          required
          defaultValue={defaultCompanyName}
          maxLength={200}
          placeholder="Acme LLC"
          className="w-full h-11 px-3 rounded-md border border-ink/10 bg-surface text-ink placeholder:text-ink-muted/60 focus:outline-none focus:border-ink/40 text-sm"
        />
      </Field>

      <Field
        label="Контактний e-mail"
        hint={
          userEmail === defaultContactEmail
            ? `За замовчуванням — ваш e-mail входу (${userEmail}). Змініть, якщо листування має йти на інший.`
            : 'Куди надсилати робочі листи.'
        }
        error={state.fieldErrors?.contactEmail}
      >
        <input
          name="contactEmail"
          type="email"
          required
          defaultValue={defaultContactEmail}
          maxLength={320}
          className="w-full h-11 px-3 rounded-md border border-ink/10 bg-surface text-ink focus:outline-none focus:border-ink/40 text-sm font-mono"
        />
      </Field>

      <Field
        label="Телефон"
        hint="Необовʼязково. Використовується лише для екстреного звʼязку."
        error={state.fieldErrors?.phone}
      >
        <input
          name="phone"
          type="tel"
          defaultValue=""
          maxLength={32}
          placeholder="+380 XX XXX XX XX"
          className="w-full h-11 px-3 rounded-md border border-ink/10 bg-surface text-ink placeholder:text-ink-muted/60 focus:outline-none focus:border-ink/40 text-sm font-mono"
        />
      </Field>

      <div className="pt-2">
        <SubmitButton />
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-ink mb-1.5">{label}</div>
      {children}
      {hint && !error && (
        <div className="text-xs text-ink-muted mt-1.5 leading-snug">{hint}</div>
      )}
      {error && <div className="text-xs text-red-700 mt-1.5">{error}</div>}
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full h-11 rounded-md bg-ink text-surface text-sm font-medium hover:bg-ink-soft transition disabled:opacity-60"
    >
      {pending ? 'Зберігаємо…' : 'Продовжити →'}
    </button>
  );
}
