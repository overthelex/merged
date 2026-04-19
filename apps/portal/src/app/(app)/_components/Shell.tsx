import type { SessionUser } from '@/lib/session';
import { AppChrome } from './AppChrome';
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
      <AppChrome user={user} />
      <div className="flex-1 flex">
        <SideNav />
        <main className="flex-1 min-w-0 px-4 sm:px-6 md:px-8 py-6 md:py-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
