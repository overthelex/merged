import Image from 'next/image';
import Link from 'next/link';

interface SiteHeaderProps {
  variant?: 'default' | 'minimal';
  rightSlot?: React.ReactNode;
}

export function SiteHeader({ variant = 'default', rightSlot }: SiteHeaderProps) {
  return (
    <nav
      className="section-inner flex items-center justify-between pt-6"
      aria-label="Головна навігація"
    >
      <Link href="/" className="flex items-center gap-2.5 no-underline">
        <Image
          src="/brand/logo-ink-128.png"
          alt="merged"
          width={28}
          height={28}
          priority
          className="shrink-0"
        />
        <span className="font-display text-base font-semibold tracking-tight text-ink">
          merged
        </span>
      </Link>
      {rightSlot ? (
        <div className="flex items-center gap-6">{rightSlot}</div>
      ) : (
        variant === 'default' && (
          <div className="hidden gap-7 sm:flex">
            {[
              { href: '/#problema', label: 'Проблема' },
              { href: '/#yak-tse-pratsuye', label: 'Як працює' },
              { href: '/blog', label: 'Блог' },
              { href: '/#zayavka', label: 'Демо' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-mono text-sm text-ink/55 transition-colors duration-150 hover:text-ink focus-visible:outline-none focus-visible:underline"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )
      )}
    </nav>
  );
}
