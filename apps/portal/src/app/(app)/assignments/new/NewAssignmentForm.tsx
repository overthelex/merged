'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import {
  createAssignment,
  type CreateAssignmentState,
} from '../../_actions/createAssignment';
import { ProgressOverlay, type ProgressStep } from '@/components/ProgressOverlay';

const INITIAL: CreateAssignmentState = { ok: true };

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

export function NewAssignmentForm() {
  const [state, action] = useFormState(createAssignment, INITIAL);
  const [step, setStep] = useState<1 | 2>(1);
  const [isPrivate, setIsPrivate] = useState(false);
  const [seniority, setSeniority] = useState<string>('middle');

  return (
    <form action={action} className="space-y-8">
      <ForkPendingOverlay />
      <StepHeader step={step} />

      {state.message && !state.ok && (
        <div className="rounded-md border border-red-200 bg-red-50 text-red-900 px-4 py-3 text-sm">
          {state.message}
        </div>
      )}

      <div className={step === 1 ? 'block' : 'hidden'}>
        <Field
          label="URL репозиторію"
          hint="GitHub URL вигляду https://github.com/<owner>/<repo>. Підтримка GitLab та Bitbucket — у наступних релізах."
          error={state.fieldErrors?.repoUrl}
        >
          <input
            name="repoUrl"
            type="url"
            required
            placeholder="https://github.com/acme/backend"
            className="w-full h-11 px-3 rounded-md border border-ink/10 bg-surface text-ink placeholder:text-ink-muted/60 focus:outline-none focus:border-ink/40 font-mono text-sm"
          />
        </Field>

        <div className="mt-5">
          <Toggle
            name="isPrivate"
            checked={isPrivate}
            onChange={setIsPrivate}
            label="Репозиторій приватний"
            hint="Увімкніть, якщо форк потребує токена доступу."
          />
        </div>

        {isPrivate && (
          <div className="mt-5">
            <Field
              label="Access key"
              hint="Fine-grained або classic PAT з правом contents:read на конкретному репо. Зберігається зашифровано; після створення форку може бути відкликаний."
              error={state.fieldErrors?.accessKey}
            >
              <input
                name="accessKey"
                type="password"
                autoComplete="off"
                className="w-full h-11 px-3 rounded-md border border-ink/10 bg-surface text-ink focus:outline-none focus:border-ink/40 font-mono text-sm"
              />
            </Field>
          </div>
        )}

        <div className="flex justify-end mt-8">
          <button
            type="button"
            onClick={() => setStep(2)}
            className="h-10 px-4 rounded-md bg-ink text-surface text-sm font-medium hover:bg-ink-soft transition"
          >
            Далі: рівень →
          </button>
        </div>
      </div>

      <div className={step === 2 ? 'block' : 'hidden'}>
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
        </div>

        <div className="flex items-center justify-between mt-8">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="h-10 px-4 rounded-md border border-ink/10 bg-surface text-ink text-sm hover:bg-surface-dim transition"
          >
            ← Назад
          </button>
          <SubmitButton />
        </div>
      </div>

      <div className="pt-4 border-t border-ink/5">
        <Link href="/" className="text-sm text-ink-muted hover:text-ink">
          ← Скасувати
        </Link>
      </div>
    </form>
  );
}

function StepHeader({ step }: { step: 1 | 2 }) {
  return (
    <ol className="flex items-center gap-3 text-sm">
      <StepPill n={1} active={step === 1} done={step > 1} label="Репозиторій" />
      <span className="text-ink-muted">—</span>
      <StepPill n={2} active={step === 2} done={false} label="Рівень" />
    </ol>
  );
}

function StepPill({
  n,
  label,
  active,
  done,
}: {
  n: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-2 h-8 px-3 rounded-full border text-sm',
        active
          ? 'border-ink bg-ink text-surface'
          : done
            ? 'border-ink/20 bg-surface-dim text-ink'
            : 'border-ink/10 bg-surface text-ink-muted',
      ].join(' ')}
    >
      <span className="tabular text-xs">{n}</span>
      {label}
    </span>
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
      {error && (
        <div className="text-xs text-red-700 mt-1.5">{error}</div>
      )}
    </label>
  );
}

function Toggle({
  name,
  checked,
  onChange,
  label,
  hint,
}: {
  name: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <input type="hidden" name={name} value={checked ? 'yes' : 'no'} />
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          'relative inline-flex h-6 w-10 shrink-0 rounded-full border transition mt-0.5',
          checked
            ? 'bg-ink border-ink'
            : 'bg-surface-dim border-ink/15',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-all',
            checked ? 'left-[18px]' : 'left-0.5',
          ].join(' ')}
        />
      </button>
      <div className="min-w-0">
        <div className="text-sm font-medium text-ink">{label}</div>
        {hint && (
          <div className="text-xs text-ink-muted mt-0.5 leading-snug">{hint}</div>
        )}
      </div>
    </div>
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
      {pending ? 'Створюємо…' : 'Створити задачу'}
    </button>
  );
}

const FORK_STEPS: ProgressStep[] = [
  {
    label: 'Форкуємо репозиторій',
    hint: 'GitHub клонує джерело в нашу організацію.',
    durationMs: 6000,
  },
  {
    label: 'Аналіз репозиторію',
    hint: 'Scout-агенти паралельно читають код, шукають поверхні для задачі.',
    durationMs: 20000,
  },
  {
    label: 'Створення задачі',
    hint: 'Composer готує task.yaml і ASSIGNMENT.md під обраний рівень.',
    durationMs: 25000,
  },
  {
    label: 'Перевірка задачі',
    hint: 'Calibrator валідує схему, рубрику, anti-cheat та сценарій.',
    durationMs: 15000,
  },
  {
    label: 'Фінальна вичитка',
    hint: 'Verifier перечитує ТЗ очима кандидата та оцінювача.',
    durationMs: 10000,
  },
  {
    label: 'Налаштовуємо захист main-гілки',
    hint: 'Щоб кандидат не міг напряму мержити у main.',
    durationMs: 2500,
  },
  {
    label: 'Готуємо assessment-гілку',
    hint: 'Комітимо ASSIGNMENT.md і runner-скрипт у форк.',
    durationMs: 3000,
  },
  {
    label: 'Записуємо задачу в базу',
    durationMs: 800,
  },
  {
    label: 'Надсилаємо лист із запрошенням',
    durationMs: 1200,
  },
];

function ForkPendingOverlay() {
  const { pending } = useFormStatus();
  return (
    <ProgressOverlay
      show={pending}
      title="Створюємо задачу…"
      steps={FORK_STEPS}
      footer="Аналіз репо й калібрування можуть тривати до 2 хв. Не закривайте вкладку."
    />
  );
}
