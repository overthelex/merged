export type NavItem = {
  key: string;
  label: string;
  href: string;
  match: (pathname: string) => boolean;
};

export const navItems: readonly NavItem[] = [
  {
    key: 'assignments',
    label: 'Задачі',
    href: '/assignments',
    match: (p) => p === '/' || p.startsWith('/assignments'),
  },
  {
    key: 'candidates',
    label: 'Кандидати',
    href: '/candidates',
    match: (p) => p.startsWith('/candidates'),
  },
  {
    key: 'settings',
    label: 'Налаштування',
    href: '/settings',
    match: (p) => p.startsWith('/settings'),
  },
] as const;
