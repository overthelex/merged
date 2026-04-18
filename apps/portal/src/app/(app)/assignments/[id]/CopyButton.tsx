'use client';

import { useState } from 'react';

export function CopyButton({ value, label = 'Скопіювати' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      className="h-8 px-3 rounded-md border border-ink/10 bg-surface text-ink text-xs font-medium hover:bg-surface-dim transition"
    >
      {copied ? 'Скопійовано ✓' : label}
    </button>
  );
}
