'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { deleteAssignment } from '../../_actions/deleteAssignment';
import { ProgressOverlay, type ProgressStep } from '@/components/ProgressOverlay';

export function DeleteButton({
  id,
  shortRepo,
}: {
  id: string;
  shortRepo: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-9 px-3 rounded-md border border-red-200 text-red-700 text-sm hover:bg-red-50 transition"
      >
        Видалити задачу
      </button>
    );
  }

  const canSubmit = confirm.trim() === shortRepo;

  return (
    <form action={deleteAssignment} className="rounded-xl border border-red-200 bg-red-50/60 p-4 w-full">
      <DeletePendingOverlay />
      <input type="hidden" name="id" value={id} />
      <div className="text-sm font-medium text-red-900 mb-1">
        Видалити задачу остаточно?
      </div>
      <p className="text-xs text-red-900/80 leading-relaxed mb-3">
        Ми спробуємо видалити форк у GitHub organization і приберемо задачу з порталу. Дію неможливо скасувати. Щоб підтвердити, введіть{' '}
        <span className="font-mono break-all">{shortRepo}</span>.
      </p>
      <input
        type="text"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder={shortRepo}
        autoFocus
        className="w-full h-10 px-3 rounded-md border border-red-200 bg-surface text-ink placeholder:text-ink-muted/60 focus:outline-none focus:border-red-500 font-mono text-xs"
      />
      <div className="flex flex-wrap items-center justify-end gap-2 mt-3">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setConfirm('');
          }}
          className="h-9 px-3 rounded-md border border-ink/10 bg-surface text-ink text-sm hover:bg-surface-dim transition"
        >
          Скасувати
        </button>
        <SubmitButton disabled={!canSubmit} />
      </div>
    </form>
  );
}

const DELETE_STEPS: ProgressStep[] = [
  {
    label: 'Видаляємо форк у GitHub',
    hint: 'Це може зайняти кілька секунд.',
    durationMs: 4000,
  },
  {
    label: 'Прибираємо задачу з порталу',
    durationMs: 800,
  },
];

function DeletePendingOverlay() {
  const { pending } = useFormStatus();
  return (
    <ProgressOverlay
      show={pending}
      title="Видаляємо задачу…"
      steps={DELETE_STEPS}
    />
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="h-9 px-3 rounded-md bg-red-700 text-surface text-sm font-medium hover:bg-red-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {pending ? 'Видаляємо…' : 'Так, видалити'}
    </button>
  );
}
