import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/session';
import { Shell } from './_components/Shell';

export const dynamic = 'force-dynamic';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  if (!user.onboardedAt) redirect('/onboarding');
  return <Shell user={user}>{children}</Shell>;
}
