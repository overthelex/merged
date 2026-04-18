'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getDb, users } from '@merged/db';
import { requireUser } from '@/lib/session';

const Schema = z.object({
  name: z.string().trim().min(1, 'Імʼя не може бути порожнім').max(120),
});

export type UpdateProfileState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof Schema>, string>>;
};

export async function updateProfile(
  _prev: UpdateProfileState,
  form: FormData,
): Promise<UpdateProfileState> {
  const user = await requireUser();

  const parsed = Schema.safeParse({ name: form.get('name') ?? '' });
  if (!parsed.success) {
    const fieldErrors: UpdateProfileState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof z.infer<typeof Schema>;
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, message: 'Перевірте поля форми.', fieldErrors };
  }

  const db = getDb();
  await db.update(users).set({ name: parsed.data.name }).where(eq(users.id, user.id));

  revalidatePath('/settings');
  return { ok: true, message: 'Профіль оновлено.' };
}
