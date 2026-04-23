import { locales, defaultLocale } from './routing';

// Builds the `alternates.languages` map for a Next.js generateMetadata
// return value. Without this on every page, Google can't tell that
// /uk/blog/ is the Ukrainian translation of /en/blog/ and may demote
// the non-canonical-language variants in search results.
export function localizedAlternates(
  toPath: (locale: string) => string,
): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[l] = toPath(l);
  }
  languages['x-default'] = toPath(defaultLocale);
  return languages;
}
