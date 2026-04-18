'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import {
  inviteCandidate,
  type InviteCandidateState,
} from '../../_actions/inviteCandidate';

const INITIAL: InviteCandidateState = { ok: true };

export function InviteCandidateForm({
  id,
  emailSuggestions = [],
}: {
  id: string;
  emailSuggestions?: string[];
}) {
  const [state, action] = useFormState(inviteCandidate, INITIAL);
  const suggestionsListId = useId();
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const lastMessage = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (state.message && state.message !== lastMessage.current) {
      lastMessage.current = state.message;
      if (state.ok) {
        setEmail('');
        setNote('');
      }
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="rounded-md border border-ink/10 bg-surface p-4 space-y-3"
    >
      <input type="hidden" name="id" value={id} />

      {state.message && (
        <div
          className={[
            'rounded-md px-3 py-2 text-xs border',
            state.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-red-200 bg-red-50 text-red-900',
          ].join(' ')}
        >
          {state.message}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-ink mb-1">
          E-mail кандидата
        </label>
        <input
          name="email"
          type="email"
          required
          autoComplete="off"
          list={emailSuggestions.length > 0 ? suggestionsListId : undefined}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="candidate@example.com"
          className="w-full h-10 px-3 rounded-md border border-ink/10 bg-surface text-ink placeholder:text-ink-muted/60 focus:outline-none focus:border-ink/40 font-mono text-sm"
        />
        {emailSuggestions.length > 0 && (
          <datalist id={suggestionsListId}>
            {emailSuggestions.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
        )}
        {state.fieldErrors?.email && (
          <div className="text-xs text-red-700 mt-1">{state.fieldErrors.email}</div>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-ink mb-1">
          Коротке повідомлення <span className="text-ink-muted font-normal">(опційно)</span>
        </label>
        <textarea
          name="note"
          rows={2}
          maxLength={400}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Наприклад: «дякую, що погодились — підійде приблизно 2 години»"
          className="w-full px-3 py-2 rounded-md border border-ink/10 bg-surface text-ink placeholder:text-ink-muted/60 focus:outline-none focus:border-ink/40 text-sm leading-relaxed resize-none"
        />
        {state.fieldErrors?.note && (
          <div className="text-xs text-red-700 mt-1">{state.fieldErrors.note}</div>
        )}
      </div>

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
      className="h-9 px-4 rounded-md bg-ink text-surface text-sm font-medium hover:bg-ink-soft transition disabled:opacity-60"
    >
      {pending ? 'Надсилаємо…' : 'Надіслати запрошення'}
    </button>
  );
}
