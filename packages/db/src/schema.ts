import { pgTable, text, timestamp, uuid, varchar, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const leads = pgTable(
  'leads',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    email: varchar('email', { length: 320 }).notNull(),
    name: varchar('name', { length: 200 }),
    company: varchar('company', { length: 200 }),
    role: varchar('role', { length: 200 }),
    note: text('note'),
    source: varchar('source', { length: 60 }).notNull().default('landing'),
    ipHash: varchar('ip_hash', { length: 64 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: index('leads_email_idx').on(t.email),
    createdAtIdx: index('leads_created_at_idx').on(t.createdAt),
  }),
);

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
