export const locales = ['uk', 'fr', 'en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const routing = {
  locales,
  defaultLocale,
} as const;

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
