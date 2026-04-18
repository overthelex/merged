import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  uuid,
  varchar,
  index,
  integer,
  jsonb,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Mirrors next-auth's AdapterAccountType — kept inline so @merged/db has no
// auth-library dependency.
type AccountType = 'oauth' | 'oidc' | 'email' | 'webauthn';

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

// ─────────────────────────────────────────────────────────────────────────────
// Auth.js v5 — standard Drizzle adapter schema
// ─────────────────────────────────────────────────────────────────────────────

export const userRole = pgEnum('user_role', ['admin', 'hr_manager']);

export const users = pgTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date', withTimezone: true }),
  image: text('image'),
  role: userRole('role').notNull().default('hr_manager'),
  companyId: uuid('company_id').references((): any => companies.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (t) => ({
    compoundKey: primaryKey({ columns: [t.provider, t.providerAccountId] }),
  }),
);

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date', withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date', withTimezone: true }).notNull(),
  },
  (t) => ({
    compoundKey: primaryKey({ columns: [t.identifier, t.token] }),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// HR / assignment domain
// ─────────────────────────────────────────────────────────────────────────────

export const seniority = pgEnum('seniority', ['junior', 'middle', 'senior', 'architect']);
export const assignmentStatus = pgEnum('assignment_status', [
  'pending_fork',
  'pending_candidate',
  'in_progress',
  'submitted',
  'scored',
  'cancelled',
  'expired',
]);

export const companies = pgTable(
  'company',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 200 }).notNull(),
    slug: varchar('slug', { length: 80 }).notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    nameIdx: index('company_name_idx').on(t.name),
  }),
);

export const assignments = pgTable(
  'assignment',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    shortId: varchar('short_id', { length: 16 }).notNull().unique(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    hrUserId: text('hr_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    sourceRepoUrl: text('source_repo_url').notNull(),
    sourceRepoPrivate: integer('source_repo_private').notNull().default(0),
    forkOwner: varchar('fork_owner', { length: 80 }),
    forkName: varchar('fork_name', { length: 140 }),
    forkUrl: text('fork_url'),
    seniority: seniority('seniority').notNull(),
    status: assignmentStatus('status').notNull().default('pending_fork'),
    inviteToken: varchar('invite_token', { length: 80 }).notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
  },
  (t) => ({
    companyIdx: index('assignment_company_idx').on(t.companyId),
    hrIdx: index('assignment_hr_idx').on(t.hrUserId),
    statusIdx: index('assignment_status_idx').on(t.status),
  }),
);

export const candidates = pgTable(
  'candidate',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    assignmentId: uuid('assignment_id')
      .notNull()
      .references(() => assignments.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 320 }),
    githubUsername: varchar('github_username', { length: 80 }),
    invitedAt: timestamp('invited_at', { withTimezone: true }),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    assignmentIdx: index('candidate_assignment_idx').on(t.assignmentId),
  }),
);

export const submissions = pgTable(
  'submission',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    assignmentId: uuid('assignment_id')
      .notNull()
      .references(() => assignments.id, { onDelete: 'cascade' }),
    candidateId: uuid('candidate_id').references(() => candidates.id, { onDelete: 'set null' }),
    prNumber: integer('pr_number').notNull(),
    prHeadSha: varchar('pr_head_sha', { length: 64 }).notNull(),
    score: integer('score'),
    breakdown: jsonb('breakdown'),
    scoredAt: timestamp('scored_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    assignmentIdx: index('submission_assignment_idx').on(t.assignmentId),
  }),
);

export const companyTokens = pgTable(
  'company_token',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    encryptedPat: text('encrypted_pat').notNull(),
    scope: varchar('scope', { length: 120 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (t) => ({
    companyIdx: index('company_token_company_idx').on(t.companyId),
  }),
);

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Assignment = typeof assignments.$inferSelect;
export type NewAssignment = typeof assignments.$inferInsert;
export type Candidate = typeof candidates.$inferSelect;
export type NewCandidate = typeof candidates.$inferInsert;
export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
export type CompanyToken = typeof companyTokens.$inferSelect;
export type NewCompanyToken = typeof companyTokens.$inferInsert;
export type Seniority = (typeof seniority.enumValues)[number];
export type AssignmentStatusValue = (typeof assignmentStatus.enumValues)[number];
export type UserRole = (typeof userRole.enumValues)[number];
