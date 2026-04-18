import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export * from './schema';

let _client: postgres.Sql | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb(url: string = process.env.DATABASE_URL ?? '') {
  if (!url) throw new Error('DATABASE_URL is not set');
  if (!_client) {
    _client = postgres(url, { max: 10, prepare: false });
    _db = drizzle(_client, { schema });
  }
  return _db!;
}

export async function close() {
  if (_client) {
    await _client.end({ timeout: 5 });
    _client = null;
    _db = null;
  }
}
