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

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(getDb(), {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: 'jwt' },
  ...authConfig,
});
