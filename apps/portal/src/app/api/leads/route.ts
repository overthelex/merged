import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { getDb, leads } from '@merged/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Accept multiple landing origins — new primary + legacy. Comma-separated.
const ALLOWED_ORIGINS = (
  process.env.PUBLIC_BASE_URL ?? 'https://merged.com.ua,https://merged.legal.org.ua'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const PRIMARY_ORIGIN = ALLOWED_ORIGINS[0]!;

const LeadSchema = z.object({
  email: z.string().email().max(320),
  name: z.string().max(200).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  role: z.string().max(200).optional().nullable(),
  note: z.string().max(5000).optional().nullable(),
  source: z.string().max(60).optional().default('landing'),
});

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : PRIMARY_ORIGIN;
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}

export async function POST(req: Request) {
  const cors = corsHeaders(req.headers.get('origin'));

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400, headers: cors });
  }

  const parsed = LeadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation', issues: parsed.error.issues },
      { status: 422, headers: cors },
    );
  }

  const ip =
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    null;
  const ipHash = ip ? createHash('sha256').update(ip).digest('hex').slice(0, 32) : null;
  const userAgent = req.headers.get('user-agent')?.slice(0, 500) ?? null;

  try {
    const db = getDb();
    const [row] = await db
      .insert(leads)
      .values({
        email: parsed.data.email,
        name: parsed.data.name ?? null,
        company: parsed.data.company ?? null,
        role: parsed.data.role ?? null,
        note: parsed.data.note ?? null,
        source: parsed.data.source ?? 'landing',
        ipHash,
        userAgent,
      })
      .returning({ id: leads.id });

    return NextResponse.json({ ok: true, id: row!.id }, { status: 201, headers: cors });
  } catch (err) {
    console.error('leads.insert failed', err);
    return NextResponse.json({ error: 'internal' }, { status: 500, headers: cors });
  }
}
