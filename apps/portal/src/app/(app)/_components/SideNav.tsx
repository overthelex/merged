'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { key: 'assignments', label: 'Задачі', href: '/', match: (p: string) => p === '/' || p.startsWith('/assignments') },
  { key: 'candidates', label: 'Кандидати', href: '/candidates', match: (p: string) => p.startsWith('/candidates') },
  { key: 'settings', label: 'Налаштування', href: '/settings', match: (p: string) => p.startsWith('/settings') },
] as const;

export function SideNav() {
  const pathname = usePathname() ?? '/';
  return (
    <nav className="w-56 shrink-0 border-r border-ink/5 px-4 py-6">
      <ul className="flex flex-col gap-1">
        {items.map((it) => {
          const isActive = it.match(pathname);
          return (
            <li key={it.key}>
              <Link
                href={it.href}
                className={[
                  'block rounded-md px-3 py-2 text-sm transition',
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
  );
}
