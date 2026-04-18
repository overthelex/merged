import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import {
  getDb,
  users,
  accounts,
  sessions,
  verificationTokens,
} from '@merged/db';
import authConfig from './auth.config';
import { sendWelcomeEmail } from './lib/email';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(getDb(), {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: 'jwt' },
  events: {
    async createUser({ user }) {
      if (user.email) {
        await sendWelcomeEmail(user.email, user.name ?? null);
      }
    },
  },
  ...authConfig,
});
