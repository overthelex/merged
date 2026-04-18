'use client';

import { useFormState, useFormStatus } from 'react-dom';
import type { AcceptInviteState } from './actions';
import { ProgressOverlay, type ProgressStep } from '@/components/ProgressOverlay';

const INITIAL: AcceptInviteState = { ok: true };

export function AcceptForm({
  shortId,
  token,
  forkUrl,
  action,
}: {
  shortId: string;
  token: string;
  forkUrl: string | null;
  action: (prev: AcceptInviteState, form: FormData) => Promise<AcceptInviteState>;
}) {
  const [state, formAction] = useFormState(action, INITIAL);

  return (
    <form
      action={formAction}
      className="rounded-xl border border-ink/5 bg-surface p-5 shadow-card space-y-4"
    >
      <InvitePendingOverlay />
      <input type="hidden" name="shortId" value={shortId} />
      <input type="hidden" name="token" value={token} />

      {state.message && !state.ok && (
        <div className="rounded-md border border-red-200 bg-red-50 text-red-900 px-3 py-2 text-sm">
          {state.message}
        </div>
      )}

      <label className="block">
        <div className="text-sm font-medium text-ink mb-1.5">GitHub username</div>
        <input
          name="githubUsername"
          type="text"
          required
          autoComplete="off"
          placeholder="octocat"
          className="w-full h-11 px-3 rounded-md border border-ink/10 bg-surface text-ink font-mono text-sm focus:outline-none focus:border-ink/40"
        />
        <div className="text-xs text-ink-muted mt-1.5 leading-snug">
          Саме цей акаунт ми запросимо як collaborator у приватний форк.
        </div>
      </label>

      <label className="block">
        <div className="text-sm font-medium text-ink mb-1.5">E-mail (необовʼязково)</div>
        <input
          name="email"
          type="email"
          autoComplete="off"
          className="w-full h-11 px-3 rounded-md border border-ink/10 bg-surface text-ink text-sm focus:outline-none focus:border-ink/40"
        />
      </label>

      <SubmitButton forkUrlHint={forkUrl} />
    </form>
  );
}

const INVITE_STEPS: ProgressStep[] = [
  {
    label: 'Перевіряємо посилання',
    durationMs: 600,
  },
  {
    label: 'Запрошуємо вас як collaborator у форк',
    hint: 'GitHub надішле запрошення на ваш акаунт.',
    durationMs: 3000,
  },
  {
    label: 'Фіксуємо кандидата в задачі',
    durationMs: 800,
  },
  {
    label: 'Повідомляємо рекрутера',
    durationMs: 1200,
  },
];

function InvitePendingOverlay() {
  const { pending } = useFormStatus();
  return (
    <ProgressOverlay
      show={pending}
      title="Приймаємо запрошення…"
      steps={INVITE_STEPS}
      footer="Після цього перевірте пошту — GitHub надішле лист з кнопкою Accept."
    />
  );
}

function SubmitButton({ forkUrlHint }: { forkUrlHint: string | null }) {
  const { pending } = useFormStatus();
  return (
    <div className="flex items-center justify-between pt-2">
      <span className="text-xs text-ink-muted">
        {forkUrlHint ? 'Форк готовий — після прийняття отримаєте access' : 'Форк готується…'}
      </span>
      <button
        type="submit"
        disabled={pending}
        className="h-10 px-5 rounded-md bg-accent text-ink text-sm font-semibold hover:bg-accent-dim hover:text-surface transition disabled:opacity-60"
      >
        {pending ? 'Приймаємо…' : 'Прийняти запрошення'}
      </button>
    </div>
  );
}
