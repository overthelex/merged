import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getDb, users } from '@merged/db';
import { eq } from 'drizzle-orm';

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: 'admin' | 'hr_manager';
  companyId: string | null;
};

export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect('/login');

  const db = getDb();
  const row = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!row) redirect('/login');

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    image: row.image,
    role: row.role,
    companyId: row.companyId,
  };
}
