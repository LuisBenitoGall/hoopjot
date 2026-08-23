import { Settings, X } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../components/ui/Button';
import {
  CookieConsentContext,
  type CookieConsentCategory,
  type CookieConsentContextValue,
  type CookieConsentPreferences
} from './cookieConsentContext';

const cookieConsentVersion = 1;
const cookieConsentStorageKey = 'hoopjot:privacy-preferences';

interface CookieConsentCategoryDefinition {
  active: boolean;
  id: CookieConsentCategory;
  required: boolean;
}

const cookieConsentCategories: CookieConsentCategoryDefinition[] = [
  { active: true, id: 'technical', required: true },
  { active: false, id: 'preferences', required: false },
  { active: false, id: 'analytics', required: false },
  { active: false, id: 'marketing', required: false }
];

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [hasLoadedStoredPreferences, setHasLoadedStoredPreferences] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [preferences, setPreferences] = useState<CookieConsentPreferences | null>(null);

  useEffect(() => {
    setPreferences(readStoredPreferences());
    setHasLoadedStoredPreferences(true);
  }, []);

  const persistPreferences = useCallback(
    (categories: Record<CookieConsentCategory, boolean>) => {
      const nextPreferences = normalizePreferences({
        categories,
        updatedAt: new Date().toISOString(),
        version: cookieConsentVersion
      });

      setPreferences(nextPreferences);
      writeStoredPreferences(nextPreferences);
      setIsPreferencesOpen(false);
    },
    [],
  );

  const acceptAll = useCallback(() => {
    persistPreferences(createAcceptedCategoryPreferences());
  }, [persistPreferences]);

  const rejectNonEssential = useCallback(() => {
    persistPreferences(createRequiredOnlyCategoryPreferences());
  }, [persistPreferences]);

  const hasConsent = useCallback(
    (category: CookieConsentCategory) => Boolean(preferences?.categories[category]),
    [preferences],
  );

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      acceptAll,
      hasConsent,
      openPreferences: () => setIsPreferencesOpen(true),
      preferences,
      rejectNonEssential,
      savePreferences: persistPreferences
    }),
    [acceptAll, hasConsent, persistPreferences, preferences, rejectNonEssential],
  );

  const shouldShowBanner = hasLoadedStoredPreferences && !preferences && !isPreferencesOpen;

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      {shouldShowBanner ? (
        <CookieConsentBanner
          onAcceptAll={acceptAll}
          onOpenPreferences={() => setIsPreferencesOpen(true)}
          onRejectNonEssential={rejectNonEssential}
        />
      ) : null}
      {isPreferencesOpen ? (
        <CookiePreferencesDialog
          onClose={() => setIsPreferencesOpen(false)}
          onSave={persistPreferences}
          preferences={preferences}
        />
      ) : null}
    </CookieConsentContext.Provider>
  );
}

function CookieConsentBanner({
  onAcceptAll,
  onOpenPreferences,
  onRejectNonEssential
}: {
  onAcceptAll: () => void;
  onOpenPreferences: () => void;
  onRejectNonEssential: () => void;
}) {
  const { t } = useTranslation('legal');

  return (
    <aside
      aria-label={t('cookies.banner.label')}
      className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-hoopjot-line bg-hoopjot-surface/98 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 text-hoopjot-ink shadow-[0_-12px_36px_rgb(23_20_79_/_0.14)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-black">{t('cookies.banner.title')}</p>
          <p className="text-sm leading-6 text-hoopjot-muted">{t('cookies.banner.description')}</p>
        </div>
        <div className="grid gap-2 sm:min-w-[23rem] sm:grid-cols-3">
          <Button onClick={onRejectNonEssential} size="sm" variant="secondary">
            {t('cookies.actions.reject')}
          </Button>
          <Button
            icon={<Settings className="h-4 w-4" aria-hidden="true" />}
            onClick={onOpenPreferences}
            size="sm"
            variant="quiet"
          >
            {t('cookies.actions.configure')}
          </Button>
          <Button onClick={onAcceptAll} size="sm" variant="secondary">
            {t('cookies.actions.accept')}
          </Button>
        </div>
      </div>
    </aside>
  );
}

function CookiePreferencesDialog({
  onClose,
  onSave,
  preferences
}: {
  onClose: () => void;
  onSave: (categories: Record<CookieConsentCategory, boolean>) => void;
  preferences: CookieConsentPreferences | null;
}) {
  const { t } = useTranslation('legal');
  const [draft, setDraft] = useState<Record<CookieConsentCategory, boolean>>(
    () => preferences?.categories ?? createRequiredOnlyCategoryPreferences(),
  );

  const toggleCategory = (category: CookieConsentCategory, checked: boolean) => {
    setDraft((currentDraft) => ({ ...currentDraft, [category]: checked }));
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-hoopjot-ink/45 px-4 py-6 backdrop-blur-sm">
      <div
        aria-labelledby="cookie-preferences-title"
        aria-modal="true"
        className="mx-auto w-full max-w-lg rounded-card border-2 border-hoopjot-ink bg-hoopjot-surface p-5 text-hoopjot-ink shadow-card"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-bold text-hoopjot-purple">{t('cookies.dialog.eyebrow')}</p>
            <h2 className="text-2xl font-black leading-tight" id="cookie-preferences-title">
              {t('cookies.dialog.title')}
            </h2>
          </div>
          <Button
            aria-label={t('cookies.actions.close')}
            icon={<X className="h-4 w-4" aria-hidden="true" />}
            onClick={onClose}
            size="icon"
            variant="quiet"
          />
        </div>

        <p className="mt-3 text-sm leading-6 text-hoopjot-muted">
          {t('cookies.dialog.description')}
        </p>

        <div className="mt-5 space-y-3">
          {cookieConsentCategories.map((category) => {
            const isDisabled = category.required || !category.active;

            return (
              <label
                className="flex items-start justify-between gap-4 rounded-card border-2 border-hoopjot-line bg-white p-4"
                key={category.id}
              >
                <span className="space-y-1">
                  <span className="block text-sm font-black">
                    {t(`cookies.categories.${category.id}.title`)}
                  </span>
                  <span className="block text-sm leading-6 text-hoopjot-muted">
                    {t(`cookies.categories.${category.id}.description`)}
                  </span>
                  {category.required ? (
                    <span className="block text-xs font-black uppercase text-hoopjot-muted">
                      {t('cookies.dialog.required')}
                    </span>
                  ) : null}
                  {!category.active ? (
                    <span className="block text-xs font-black uppercase text-hoopjot-muted">
                      {t('cookies.dialog.inactive')}
                    </span>
                  ) : null}
                </span>
                <input
                  checked={draft[category.id]}
                  className="mt-1 h-5 w-5 accent-hoopjot-orange disabled:opacity-60"
                  disabled={isDisabled}
                  onChange={(event) => toggleCategory(category.id, event.target.checked)}
                  type="checkbox"
                />
              </label>
            );
          })}
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <Button onClick={() => onSave(createRequiredOnlyCategoryPreferences())} variant="secondary">
            {t('cookies.actions.reject')}
          </Button>
          <Button onClick={() => onSave(draft)}>{t('cookies.actions.save')}</Button>
          <Button onClick={() => onSave(createAcceptedCategoryPreferences())} variant="secondary">
            {t('cookies.actions.accept')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function createAcceptedCategoryPreferences(): Record<CookieConsentCategory, boolean> {
  return cookieConsentCategories.reduce(
    (categories, category) => ({
      ...categories,
      [category.id]: category.required || category.active
    }),
    createEmptyCategoryPreferences(),
  );
}

function createEmptyCategoryPreferences(): Record<CookieConsentCategory, boolean> {
  return {
    analytics: false,
    marketing: false,
    preferences: false,
    technical: false
  };
}

function createRequiredOnlyCategoryPreferences(): Record<CookieConsentCategory, boolean> {
  return {
    ...createEmptyCategoryPreferences(),
    technical: true
  };
}

function normalizePreferences(preferences: CookieConsentPreferences): CookieConsentPreferences {
  return {
    categories: {
      ...createRequiredOnlyCategoryPreferences(),
      ...preferences.categories,
      technical: true
    },
    updatedAt: preferences.updatedAt,
    version: cookieConsentVersion
  };
}

function readStoredPreferences(): CookieConsentPreferences | null {
  if (import.meta.env.VITE_ENABLE_E2E_AUTH === 'true') {
    return normalizePreferences({
      categories: createRequiredOnlyCategoryPreferences(),
      updatedAt: new Date(0).toISOString(),
      version: cookieConsentVersion
    });
  }

  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawPreferences = window.localStorage.getItem(cookieConsentStorageKey);

    if (!rawPreferences) {
      return null;
    }

    const parsedPreferences = JSON.parse(rawPreferences) as CookieConsentPreferences;

    if (parsedPreferences.version !== cookieConsentVersion) {
      return null;
    }

    return normalizePreferences(parsedPreferences);
  } catch {
    return null;
  }
}

function writeStoredPreferences(preferences: CookieConsentPreferences): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(cookieConsentStorageKey, JSON.stringify(preferences));
  } catch {
    // In private or locked-down browsers, in-memory consent is enough for this session.
  }
}
