/**
 * Locale (language) configuration.
 * ISO 639-1 two-letter codes. Default is always English.
 * Keep in sync with backend schemas.SUPPORTED_LOCALES.
 */

export const DEFAULT_LOCALE = "en" as const;

export const SUPPORTED_LOCALES = ["en", "es", "pt"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export function isValidLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Resolve locale from user preference or fallback to default.
 * Use when you have the user object from the API (e.g. /users/me).
 */
export function resolveLocale(userLocale?: string | null): Locale {
  if (userLocale && isValidLocale(userLocale)) {
    return userLocale;
  }
  return DEFAULT_LOCALE;
}
