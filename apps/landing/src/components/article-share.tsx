'use client';

import { useState } from 'react';

interface ArticleShareProps {
  title: string;
  punchline: string;
  url: string;
}

export function ArticleShare({ title, punchline, url }: ArticleShareProps) {
  const [copied, setCopied] = useState(false);

  const shareLinkedIn = () => {
    const params = new URLSearchParams({
      url,
      text: `${punchline}\n\n#merged #HiringInAIEra`,
    });
    window.open(`https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`, '_blank');
  };

  const shareX = () => {
    const params = new URLSearchParams({ url, text: `${title}\n\n#merged` });
    window.open(`https://x.com/intent/tweet?${params.toString()}`, '_blank');
  };

  const shareTelegram = () => {
    const params = new URLSearchParams({ url, text: title });
    window.open(`https://t.me/share/url?${params.toString()}`, '_blank');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const btn =
    'inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 font-mono text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2';

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-ink/8 bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="label-mono text-ink/55">Поділитись</p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={shareLinkedIn}
          className={`${btn} border-ink/10 bg-paper-dim text-ink/75 hover:border-ink/25 hover:text-ink`}
        >
          LinkedIn
        </button>
        <button
          type="button"
          onClick={shareX}
          className={`${btn} border-ink/10 bg-paper-dim text-ink/75 hover:border-ink/25 hover:text-ink`}
        >
          X
        </button>
        <button
          type="button"
          onClick={shareTelegram}
          className={`${btn} border-ink/10 bg-paper-dim text-ink/75 hover:border-ink/25 hover:text-ink`}
        >
          Telegram
        </button>
        <button
          type="button"
          onClick={copyLink}
          className={`${btn} ${copied ? 'border-accent/40 bg-accent/10 text-accent-dim' : 'border-ink/10 bg-paper-dim text-ink/75 hover:border-ink/25 hover:text-ink'}`}
          aria-live="polite"
        >
          {copied ? 'Скопійовано' : 'Копіювати посилання'}
        </button>
      </div>
    </div>
  );
}
