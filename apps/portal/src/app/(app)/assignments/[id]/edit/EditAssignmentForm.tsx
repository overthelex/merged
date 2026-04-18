'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import {
  updateAssignment,
  type UpdateAssignmentState,
} from '../../../_actions/updateAssignment';
import { ProgressOverlay, type ProgressStep } from '@/components/ProgressOverlay';

const INITIAL: UpdateAssignmentState = { ok: true };

const SENIORITIES = [
  {
    key: 'junior',
    label: 'Junior',
    hint: '0–2 роки. Фокус: читабельність, базові тести, зрозумілий PR.',
  },
  {
    key: 'middle',
    label: 'Middle',
    hint: '2–4 роки. Фокус: декомпозиція задачі, покриття тестами, обробка edge cases.',
  },
  {
    key: 'senior',
    label: 'Senior',
    hint: '4+ років. Фокус: архітектурні рішення, trade-offs, відповідь на ревʼю.',
  },
  {
    key: 'architect',
    label: 'Architect',
    hint: 'Фокус: межі системи, міграції, сумісність, доказ у коментарях до PR.',
  },
] as const;

export function EditAssignmentForm({
  id,
  shortId,
  sourceRepoUrl,
  seniority: initialSeniority,
}: {
  id: string;
  shortId: string;
  sourceRepoUrl: string;
  seniority: string;
}) {
  const [state, action] = useFormState(updateAssignment, INITIAL);
  const [seniority, setSeniority] = useState<string>(initialSeniority);

  return (
    <form action={action} className="space-y-8">
      <EditPendingOverlay />
      <input type="hidden" name="id" value={id} />

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

      <div className="rounded-xl border border-ink/5 bg-surface-dim p-4">
        <div className="label-mono text-ink-muted mb-1">Задача</div>
        <div className="font-mono text-sm text-ink">{stripGithubPrefix(sourceRepoUrl)}</div>
        <div className="text-xs text-ink-muted mt-1">ID · {shortId}</div>
      </div>

      <div>
        <div className="label-mono text-ink-muted mb-3">Рівень позиції</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SENIORITIES.map((s) => {
            const active = seniority === s.key;
            return (
              <label
                key={s.key}
                className={[
                  'block rounded-lg border px-4 py-3 cursor-pointer transition',
                  active
                    ? 'border-ink bg-surface shadow-card-md'
                    : 'border-ink/10 bg-surface hover:border-ink/30',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="seniority"
                  value={s.key}
                  checked={active}
                  onChange={() => setSeniority(s.key)}
                  className="sr-only"
                />
                <div className="flex items-center justify-between mb-1">
                  <span className="font-display font-semibold text-ink">
                    {s.label}
                  </span>
                  {active && (
                    <span className="label-mono text-accent-dim">обрано</span>
                  )}
                </div>
                <p className="text-sm text-ink-muted leading-snug">{s.hint}</p>
              </label>
            );
          })}
        </div>
        {state.fieldErrors?.seniority && (
          <div className="text-xs text-red-700 mt-2">{state.fieldErrors.seniority}</div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-ink/5">
        <Link
          href={`/assignments/${id}`}
          className="text-sm text-ink-muted hover:text-ink"
        >
          ← Скасувати
        </Link>
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
      className="h-10 px-5 rounded-md bg-accent text-ink text-sm font-semibold hover:bg-accent-dim hover:text-surface transition disabled:opacity-60"
    >
      {pending ? 'Зберігаємо…' : 'Зберегти'}
    </button>
  );
}

const EDIT_STEPS: ProgressStep[] = [
  { label: 'Оновлюємо задачу', durationMs: 800 },
  { label: 'Перечитуємо з бази', durationMs: 600 },
];

function EditPendingOverlay() {
  const { pending } = useFormStatus();
  return (
    <ProgressOverlay
      show={pending}
      title="Зберігаємо зміни…"
      steps={EDIT_STEPS}
    />
  );
}

function stripGithubPrefix(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?github\.com\//i, '').replace(/\.git\/?$/, '');
}
