'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { SessionUser } from '@/lib/session';
import { navItems } from './navItems';
import { signOutAction } from './signOutAction';

export function AppChrome({ user }: { user: SessionUser }) {
  const pathname = usePathname() ?? '/';
  const [open, setOpen] = useState(false);

  // Close on navigation so tapping a drawer link dismisses the overlay.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open + close on Escape.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <header className="h-14 border-b border-ink/5 bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/70 flex items-center justify-between gap-3 px-3 sm:px-4 md:px-6">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            aria-label="Відкрити меню"
            aria-expanded={open}
            aria-controls="app-mobile-nav"
            onClick={() => setOpen(true)}
            className="md:hidden -ml-1 grid h-10 w-10 place-items-center rounded-md text-ink hover:bg-surface-dim transition"
          >
            <HamburgerIcon />
          </button>
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <Image
              src="/brand/logo-ink-128.png"
              alt="merged"
              width={22}
              height={22}
              priority
            />
            <span className="font-display font-semibold tracking-tight text-ink truncate">
              merged
            </span>
            <span className="hidden sm:inline label-mono text-ink-muted ml-1">
              портал
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="hidden sm:block text-sm text-right leading-tight min-w-0">
            <div className="font-medium text-ink truncate max-w-[14rem]">
              {user.name ?? user.email}
            </div>
            {user.name && (
              <div className="text-ink-muted text-xs truncate max-w-[14rem]">
                {user.email}
              </div>
            )}
          </div>
          {user.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt=""
              width={28}
              height={28}
              className="rounded-full border border-ink/10 shrink-0"
            />
          )}
          <form action={signOutAction} className="shrink-0">
            <button
              type="submit"
              className="h-8 px-2.5 sm:px-3 rounded-md border border-ink/10 bg-surface text-ink text-xs sm:text-sm hover:bg-surface-dim transition whitespace-nowrap"
            >
              Вийти
            </button>
          </form>
        </div>
      </header>

      {open && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Закрити меню"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] animate-[fadeIn_150ms_ease-out]"
          />
          <aside
            id="app-mobile-nav"
            className="absolute inset-y-0 left-0 w-72 max-w-[80%] bg-surface border-r border-ink/5 shadow-card-lg flex flex-col"
          >
            <div className="h-14 border-b border-ink/5 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image
                  src="/brand/logo-ink-128.png"
                  alt=""
                  width={22}
                  height={22}
                />
                <span className="font-display font-semibold tracking-tight text-ink">
                  merged
                </span>
              </div>
              <button
                type="button"
                aria-label="Закрити меню"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-md text-ink-muted hover:bg-surface-dim transition"
              >
                <CloseIcon />
              </button>
            </div>
            <nav aria-label="Основна навігація" className="p-3 flex-1 overflow-y-auto">
              <ul className="flex flex-col gap-1">
                {navItems.map((it) => {
                  const isActive = it.match(pathname);
                  return (
                    <li key={it.key}>
                      <Link
                        href={it.href}
                        className={[
                          'block rounded-md px-3 py-2.5 text-sm transition',
                          isActive
                            ? 'bg-ink text-surface font-medium'
                            : 'text-ink-muted hover:bg-surface-dim hover:text-ink',
                        ].join(' ')}
                      >
                        {it.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="border-t border-ink/5 px-4 py-3 text-xs text-ink-muted">
              <div className="truncate">{user.name ?? user.email}</div>
              {user.name && <div className="truncate opacity-70">{user.email}</div>}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
