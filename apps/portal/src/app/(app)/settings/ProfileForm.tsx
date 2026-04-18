'use client';

import { useFormState, useFormStatus } from 'react-dom';
import {
  updateProfile,
  type UpdateProfileState,
} from '../_actions/updateProfile';

const INITIAL: UpdateProfileState = { ok: true };

export function ProfileForm({
  defaultName,
  email,
  defaultContactEmail,
  defaultPhone,
}: {
  defaultName: string;
  email: string;
  defaultContactEmail: string;
  defaultPhone: string;
}) {
  const [state, action] = useFormState(updateProfile, INITIAL);

  return (
    <form action={action} className="space-y-5">
      {state.message && (
        <div
          className={[
            'rounded-md px-4 py-3 text-sm border',
            state.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-red-200 bg-red-50 text-red-900',
          ].join(' ')}
        >
          {state.message}
        </div>
      )}

      <label className="block">
        <div className="text-sm font-medium text-ink mb-1.5">Імʼя</div>
        <input
          name="name"
          type="text"
          required
          defaultValue={defaultName}
          maxLength={120}
          className="w-full h-11 px-3 rounded-md border border-ink/10 bg-surface text-ink placeholder:text-ink-muted/60 focus:outline-none focus:border-ink/40 text-sm"
        />
        {state.fieldErrors?.name && (
          <div className="text-xs text-red-700 mt-1.5">{state.fieldErrors.name}</div>
        )}
      </label>

      <label className="block">
        <div className="text-sm font-medium text-ink mb-1.5">E-mail входу</div>
        <input
          type="email"
          value={email}
          readOnly
          disabled
          className="w-full h-11 px-3 rounded-md border border-ink/10 bg-surface-dim text-ink-muted font-mono text-sm cursor-not-allowed"
        />
        <div className="text-xs text-ink-muted mt-1.5 leading-snug">
          E-mail входу привʼязаний до GitHub-акаунту і змінюється через повторний вхід.
        </div>
      </label>

      <label className="block">
        <div className="text-sm font-medium text-ink mb-1.5">Контактний e-mail</div>
        <input
          name="contactEmail"
          type="email"
          required
          defaultValue={defaultContactEmail}
          maxLength={320}
          className="w-full h-11 px-3 rounded-md border border-ink/10 bg-surface text-ink focus:outline-none focus:border-ink/40 text-sm font-mono"
        />
        {state.fieldErrors?.contactEmail && (
          <div className="text-xs text-red-700 mt-1.5">{state.fieldErrors.contactEmail}</div>
        )}
        <div className="text-xs text-ink-muted mt-1.5 leading-snug">
          Куди надсилати робочі повідомлення та підтвердження.
        </div>
      </label>

      <label className="block">
        <div className="text-sm font-medium text-ink mb-1.5">Телефон</div>
        <input
          name="phone"
          type="tel"
          defaultValue={defaultPhone}
          maxLength={32}
          placeholder="+380 XX XXX XX XX"
          className="w-full h-11 px-3 rounded-md border border-ink/10 bg-surface text-ink placeholder:text-ink-muted/60 focus:outline-none focus:border-ink/40 text-sm font-mono"
        />
        {state.fieldErrors?.phone && (
          <div className="text-xs text-red-700 mt-1.5">{state.fieldErrors.phone}</div>
        )}
      </label>

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-10 px-5 rounded-md bg-ink text-surface text-sm font-medium hover:bg-ink-soft transition disabled:opacity-60"
    >
      {pending ? 'Зберігаємо…' : 'Зберегти'}
    </button>
  );
}
