import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://merged:merged@localhost:5432/merged',
  },
  verbose: true,
  strict: true,
} satisfies Config;
