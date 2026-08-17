import { useTranslation } from 'react-i18next';

import { supportedLocales, type SupportedLocale } from '../../i18n/locales';

export function AppShell() {
  const { i18n, t } = useTranslation('common');
  const activeLocale = getSupportedLocale(i18n.resolvedLanguage);

  const changeLanguage = (locale: SupportedLocale) => {
    void i18n.changeLanguage(locale);
  };

  return (
    <main className="min-h-screen bg-hoopnote-bg text-hoopnote-ink">
      <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-12">
        <div className="mb-8 flex items-center gap-4">
          <img className="h-14 w-14" src="/hoopnote-mark.svg" alt="" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-hoopnote-muted">
              {t('shellEyebrow')}
            </p>
            <h1 className="text-4xl font-black">{t('appName')}</h1>
          </div>
        </div>

        <div className="border-y-4 border-hoopnote-ink/10 py-8">
          <p className="max-w-xl text-2xl font-bold leading-tight">{t('shellStatus')}</p>
          <p className="mt-4 max-w-xl text-base leading-7 text-hoopnote-muted">
            {t('shellDescription')}
          </p>
        </div>

        <div className="mt-8" aria-label={t('languageLabel')}>
          <div className="flex gap-3">
            {supportedLocales.map((locale) => (
              <button
                aria-pressed={activeLocale === locale}
                className="min-h-11 rounded-full border-2 border-hoopnote-ink px-4 text-sm font-bold transition hover:bg-hoopnote-ink hover:text-white aria-pressed:bg-hoopnote-ink aria-pressed:text-white"
                key={locale}
                onClick={() => changeLanguage(locale)}
                type="button"
              >
                {t(`language.${locale}`)}
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function getSupportedLocale(locale: string | undefined): SupportedLocale {
  return locale?.startsWith('es') ? 'es' : 'en';
}

