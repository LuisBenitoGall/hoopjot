export const supportedLocales = ['en', 'es'] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

export const defaultLocale: SupportedLocale = 'en';

export function isSupportedLocale(locale: string | undefined): locale is SupportedLocale {
  return supportedLocales.includes(locale as SupportedLocale);
}

