import { createContext, useContext } from 'react';

export type CookieConsentCategory = 'analytics' | 'marketing' | 'preferences' | 'technical';

export interface CookieConsentPreferences {
  categories: Record<CookieConsentCategory, boolean>;
  updatedAt: string;
  version: number;
}

export interface CookieConsentContextValue {
  acceptAll: () => void;
  hasConsent: (category: CookieConsentCategory) => boolean;
  openPreferences: () => void;
  preferences: CookieConsentPreferences | null;
  rejectNonEssential: () => void;
  savePreferences: (categories: Record<CookieConsentCategory, boolean>) => void;
}

export const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function useCookieConsent(): CookieConsentContextValue {
  const context = useContext(CookieConsentContext);

  if (!context) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }

  return context;
}

export function useOptionalCookieConsent(): CookieConsentContextValue | null {
  return useContext(CookieConsentContext);
}
