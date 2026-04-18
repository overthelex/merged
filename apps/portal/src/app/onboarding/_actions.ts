'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getDb, companies, users } from '@merged/db';
import { requireUser } from '@/lib/session';
import { shortId } from '@/lib/shortId';

// Ukrainian-friendly phone: digits, spaces, parentheses, dashes, leading +.
// Deliberately loose — we don't do carrier validation.
const PHONE = /^[+]?[\d\s().-]{6,32}$/;

const Schema = z.object({
  companyName: z.string().trim().min(1, 'Назва компанії обовʼязкова').max(200),
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

export type OnboardingState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof Schema>, string>>;
};

export async function completeOnboarding(
  _prev: OnboardingState,
  form: FormData,
): Promise<OnboardingState> {
  const user = await requireUser();

  const parsed = Schema.safeParse({
    companyName: form.get('companyName') ?? '',
    contactEmail: form.get('contactEmail') ?? '',
    phone: form.get('phone') ?? '',
  });

  if (!parsed.success) {
    const fieldErrors: OnboardingState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof z.infer<typeof Schema>;
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, message: 'Перевірте поля форми.', fieldErrors };
  }

  const db = getDb();

  // Reuse an existing company row if one is already linked (user was
  // auto-associated earlier), otherwise create fresh.
  let companyId = user.companyId;
  if (companyId) {
    await db
      .update(companies)
      .set({ name: parsed.data.companyName })
      .where(eq(companies.id, companyId));
  } else {
    const slug = `c-${shortId(8)}`;
    const [inserted] = await db
      .insert(companies)
      .values({ name: parsed.data.companyName, slug })
      .returning({ id: companies.id });
    if (!inserted) {
      return { ok: false, message: 'Не вдалося створити компанію. Спробуйте ще раз.' };
    }
    companyId = inserted.id;
  }

  await db
    .update(users)
    .set({
      companyId,
      contactEmail: parsed.data.contactEmail,
      phone: parsed.data.phone ? parsed.data.phone : null,
      onboardedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  redirect('/');
}
