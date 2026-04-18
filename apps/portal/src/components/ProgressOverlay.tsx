'use client';

import { useEffect, useMemo, useState } from 'react';

export type ProgressStep = {
  label: string;
  hint?: string;
  /** Approximate duration of this step, in ms. Used only to animate the UI. */
  durationMs: number;
};

export function ProgressOverlay({
  show,
  title,
  footer,
  steps,
}: {
  show: boolean;
  title: string;
  footer?: string;
  steps: ProgressStep[];
}) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (show && startedAt === null) setStartedAt(Date.now());
    if (!show && startedAt !== null) setStartedAt(null);
  }, [show, startedAt]);

  useEffect(() => {
    if (!show) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [show]);

  const thresholds = useMemo(() => {
    const out: number[] = [];
    let acc = 0;
    for (const s of steps) {
      acc += s.durationMs;
      out.push(acc);
    }
    return out;
  }, [steps]);

  if (!show) return null;

  const elapsed = startedAt === null ? 0 : now - startedAt;
  // Active index: first step whose threshold hasn't been crossed yet. Final step
  // stays "in progress" forever — the caller is the one that removes the overlay
  // when the real server action resolves.
  let activeIdx = steps.length - 1;
  for (let i = 0; i < thresholds.length; i += 1) {
    if (elapsed < thresholds[i]!) {
      activeIdx = i;
      break;
    }
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm px-4"
    >
      <div className="w-full max-w-md rounded-xl bg-surface shadow-card-lg border border-ink/5 p-6">
        <div className="flex items-center gap-3 mb-5">
          <Spinner />
          <div className="font-display font-semibold text-ink text-base leading-tight">
            {title}
          </div>
        </div>

        <ol className="space-y-2.5">
          {steps.map((s, i) => {
            const state =
              i < activeIdx ? 'done' : i === activeIdx ? 'active' : 'pending';
            return (
              <li
                key={s.label}
                className="flex items-start gap-3"
                aria-current={state === 'active' ? 'step' : undefined}
              >
                <StepIcon state={state} />
                <div className="min-w-0 flex-1">
                  <div
                    className={[
                      'text-sm leading-snug',
                      state === 'done' ? 'text-ink-muted line-through decoration-ink/20' : '',
                      state === 'active' ? 'text-ink font-medium' : '',
                      state === 'pending' ? 'text-ink-muted/70' : '',
                    ].join(' ')}
                  >
                    {s.label}
                  </div>
                  {s.hint && state === 'active' && (
                    <div className="text-xs text-ink-muted mt-0.5 leading-snug">
                      {s.hint}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        {footer && (
          <div className="mt-5 pt-4 border-t border-ink/5 text-xs text-ink-muted leading-snug">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin text-accent-dim"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.2"
      />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StepIcon({ state }: { state: 'pending' | 'active' | 'done' }) {
  if (state === 'done') {
    return (
      <span
        aria-label="готово"
        className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-accent-dim text-surface"
      >
        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden="true">
          <path
            d="M2 6.5 L5 9.5 L10 3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }
  if (state === 'active') {
    return (
      <span
        aria-label="виконується"
        className="mt-0.5 inline-flex h-4 w-4 items-center justify-center"
      >
        <span className="relative inline-flex h-3 w-3">
          <span className="absolute inset-0 rounded-full bg-accent opacity-40 animate-ping" />
          <span className="relative inline-block h-3 w-3 rounded-full bg-accent-dim" />
        </span>
      </span>
    );
  }
  return (
    <span
      aria-label="в черзі"
      className="mt-0.5 inline-flex h-4 w-4 items-center justify-center"
    >
      <span className="inline-block h-3 w-3 rounded-full border border-ink/15" />
    </span>
  );
}
