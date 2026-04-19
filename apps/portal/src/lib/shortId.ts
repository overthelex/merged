import { randomBytes } from 'node:crypto';

const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';

export function shortId(len = 10): string {
  const bytes = randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) {
    const b = bytes[i] ?? 0;
    out += ALPHABET[b % ALPHABET.length];
  }
  return out;
}

export function inviteToken(): string {
  return randomBytes(24).toString('base64url');
}

export function appealToken(): string {
  return randomBytes(24).toString('base64url');
}
