'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getDb, users } from '@merged/db';
import { requireUser } from '@/lib/session';

const PHONE = /^[+]?[\d\s().-]{6,32}$/;

const Schema = z.object({
  name: z.string().trim().min(1, 'Імʼя не може бути порожнім').max(120),
  contactEmail: z
    .string()
    .trim()
    .email('Некоректний e-mail')
    .max(320),
  phone: z
    .string()
    .trim()
    .max(32)
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || PHONE.test(v), 'Некоректний телефон'),
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

  const parsed = Schema.safeParse({
    name: form.get('name') ?? '',
    contactEmail: form.get('contactEmail') ?? '',
    phone: form.get('phone') ?? '',
  });
  if (!parsed.success) {
    const fieldErrors: UpdateProfileState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof z.infer<typeof Schema>;
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, message: 'Перевірте поля форми.', fieldErrors };
  }

  const db = getDb();
  await db
    .update(users)
    .set({
      name: parsed.data.name,
      contactEmail: parsed.data.contactEmail,
      phone: parsed.data.phone ? parsed.data.phone : null,
    })
    .where(eq(users.id, user.id));

  revalidatePath('/settings');
  return { ok: true, message: 'Профіль оновлено.' };
}
