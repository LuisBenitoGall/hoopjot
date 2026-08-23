import { Languages } from 'lucide-react';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { BrandLogo } from '../../components/brand/BrandLogo';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LegalFooterLinks } from '../../components/ui/LegalFooterLinks';
import { supportedLocales, type SupportedLocale } from '../../i18n/locales';

interface AuthScreenLayoutProps {
  children: ReactNode;
  description: string;
  title: string;
}

export function AuthScreenLayout({ children, description, title }: AuthScreenLayoutProps) {
  const { i18n, t } = useTranslation('common');
  const activeLocale = getSupportedLocale(i18n.resolvedLanguage);

  const changeLanguage = (locale: SupportedLocale) => {
    void i18n.changeLanguage(locale);
  };

  return (
    <main className="court-background min-h-screen text-hoopjot-ink">
      <section className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col px-5 py-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <BrandLogo label={t('appName')} />
          <div
            className="ml-auto flex flex-wrap items-center justify-end gap-1"
            aria-label={t('languageLabel')}
          >
            <Languages className="h-4 w-4 text-hoopjot-purple" aria-hidden="true" />
            {supportedLocales.map((locale) => (
              <Button
                aria-pressed={activeLocale === locale}
                key={locale}
                onClick={() => changeLanguage(locale)}
                size="sm"
                variant={activeLocale === locale ? 'secondary' : 'quiet'}
              >
                {t(`language.${locale}`)}
              </Button>
            ))}
          </div>
        </header>

        <div className="flex flex-1 flex-col justify-center py-10">
          <div className="mb-6 space-y-3">
            <p className="text-sm font-bold text-hoopjot-purple">{t('auth.eyebrow')}</p>
            <h1 className="text-4xl font-black leading-none">{title}</h1>
            <p className="text-base leading-7 text-hoopjot-muted">{description}</p>
          </div>

          <Card>{children}</Card>
        </div>

        <LegalFooterLinks className="pb-2" />
      </section>
    </main>
  );
}

function getSupportedLocale(locale: string | undefined): SupportedLocale {
  return locale?.startsWith('es') ? 'es' : 'en';
}
