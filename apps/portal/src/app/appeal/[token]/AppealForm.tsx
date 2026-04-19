'use client';

import { useFormState, useFormStatus } from 'react-dom';
import type { AppealState } from './actions';

const INITIAL: AppealState = { ok: true };

export function AppealForm({
  token,
  githubUsername,
  action,
}: {
  token: string;
  githubUsername: string | null;
  action: (prev: AppealState, form: FormData) => Promise<AppealState>;
}) {
  const [state, formAction] = useFormState(action, INITIAL);

  if (state.ok && state.submitted) {
    return (
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-5 shadow-card">
        <div className="label-mono text-accent-dim mb-2">апеляцію прийнято</div>
        <p className="text-sm text-ink">
          Ми повідомили рекрутера та повернули задачу у статус <strong>in progress</strong>.
          Можете відкривати новий PR у вашому форку.
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-xl border border-ink/5 bg-surface p-5 shadow-card space-y-4"
    >
      <input type="hidden" name="token" value={token} />

      {state.message && !state.ok && (
        <div className="rounded-md border border-red-200 bg-red-50 text-red-900 px-3 py-2 text-sm">
          {state.message}
        </div>
      )}

      {githubUsername && (
        <div className="text-xs text-ink-muted">
          Від імені GitHub-акаунта <code className="font-mono">{githubUsername}</code>.
        </div>
      )}

      <label className="block">
        <div className="text-sm font-medium text-ink mb-1.5">Причина апеляції</div>
        <textarea
          name="reason"
          required
          minLength={20}
          maxLength={4000}
          rows={7}
          placeholder="Опишіть, що, на вашу думку, було оцінено невірно, і чому ви хочете пройти задачу ще раз."
          className="w-full px-3 py-2.5 rounded-md border border-ink/10 bg-surface text-ink text-sm leading-relaxed focus:outline-none focus:border-ink/40"
        />
        <div className="text-xs text-ink-muted mt-1.5 leading-snug">
          Мінімум 20 символів. Цей текст отримає рекрутер разом із поточною оцінкою.
        </div>
      </label>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <div className="flex items-center justify-end pt-2">
      <button
        type="submit"
        disabled={pending}
        className="h-10 px-5 rounded-md bg-accent text-ink text-sm font-semibold hover:bg-accent-dim hover:text-surface transition disabled:opacity-60"
      >
        {pending ? 'Надсилаємо…' : 'Подати апеляцію'}
      </button>
    </div>
  );
}
