import Link from 'next/link';
import Image from 'next/image';
import { signOut } from '@/auth';
import type { SessionUser } from '@/lib/session';
import { SideNav } from './SideNav';

export function Shell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar user={user} />
      <div className="flex-1 flex">
        <SideNav />
        <main className="flex-1 min-w-0 px-8 py-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

function TopBar({ user }: { user: SessionUser }) {
  return (
    <header className="h-14 border-b border-ink/5 bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/70 flex items-center justify-between px-6">
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/brand/logo-ink-128.png"
          alt="merged"
          width={22}
          height={22}
          priority
        />
        <span className="font-display font-semibold tracking-tight text-ink">merged</span>
        <span className="label-mono text-ink-muted ml-1">портал</span>
      </Link>
      <div className="flex items-center gap-3">
        <div className="text-sm text-right leading-tight">
          <div className="font-medium text-ink">{user.name ?? user.email}</div>
          {user.name && <div className="text-ink-muted text-xs">{user.email}</div>}
        </div>
        {user.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt=""
            width={28}
            height={28}
            className="rounded-full border border-ink/10"
          />
        )}
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/login' });
          }}
        >
          <button
            type="submit"
            className="h-8 px-3 rounded-md border border-ink/10 bg-surface text-ink text-sm hover:bg-surface-dim transition"
          >
            Вийти
          </button>
        </form>
      </div>
    </header>
  );
}
