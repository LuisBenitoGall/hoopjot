import { ArrowLeft, ExternalLink, Languages, Settings } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useCookieConsent } from '../../app/cookieConsentContext';
import { createLegalInterpolationValues, getLegalConfig } from '../../app/legalConfig';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { Button } from '../../components/ui/Button';
import { LegalFooterLinks } from '../../components/ui/LegalFooterLinks';
import { cx } from '../../lib/classNames';
import { supportedLocales, type SupportedLocale } from '../../i18n/locales';

type LegalDocumentId = 'cookies' | 'notice' | 'privacy' | 'terms';

interface LegalPageCopy {
  description: string;
  sections: LegalSectionCopy[];
  title: string;
}

interface LegalSectionCopy {
  body?: string[];
  items?: string[];
  title: string;
}

const legalDocuments: Array<{ id: LegalDocumentId; path: string }> = [
  { id: 'notice', path: '/legal/notice' },
  { id: 'privacy', path: '/legal/privacy' },
  { id: 'cookies', path: '/legal/cookies' },
  { id: 'terms', path: '/legal/terms' }
];

export function LegalIndexRoute() {
  const { t } = useTranslation('legal');

  return (
    <LegalLayout>
      <section className="space-y-3">
        <p className="text-sm font-bold text-hoopjot-purple">{t('index.eyebrow')}</p>
        <h1 className="text-4xl font-black leading-none">{t('index.title')}</h1>
        <p className="text-base leading-7 text-hoopjot-muted">{t('index.description')}</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {legalDocuments.map((document) => (
          <Link
            className="rounded-card border-2 border-hoopjot-line bg-hoopjot-surface p-5 shadow-card outline-none motion-safe:transition hover:-translate-y-0.5 hover:border-hoopjot-ink focus-visible:ring-4 focus-visible:ring-hoopjot-blue/30"
            key={document.id}
            to={document.path}
          >
            <h2 className="text-lg font-black">{t(`documents.${document.id}`)}</h2>
            <p className="mt-2 text-sm leading-6 text-hoopjot-muted">
              {t(`summaries.${document.id}`)}
            </p>
          </Link>
        ))}
      </section>
    </LegalLayout>
  );
}

export function LegalNoticeRoute() {
  return <LegalDocumentRoute documentId="notice" />;
}

export function PrivacyPolicyRoute() {
  return <LegalDocumentRoute documentId="privacy" />;
}

export function CookiePolicyRoute() {
  return <LegalDocumentRoute documentId="cookies" />;
}

export function TermsRoute() {
  return <LegalDocumentRoute documentId="terms" />;
}

function LegalDocumentRoute({ documentId }: { documentId: LegalDocumentId }) {
  const { openPreferences } = useCookieConsent();
  const { t } = useTranslation('legal');
  const config = getLegalConfig();
  const interpolationValues = createLegalInterpolationValues(
    config,
    t('values.missing'),
    t('values.notApplicable'),
  );
  const page = t(`pages.${documentId}`, {
    returnObjects: true,
    ...interpolationValues
  }) as LegalPageCopy;

  return (
    <LegalLayout activeDocumentId={documentId}>
      <article className="space-y-6">
        <header className="space-y-3">
          <p className="text-sm font-bold text-hoopjot-purple">
            {t('layout.effectiveDate', { effectiveDate: interpolationValues.effectiveDate })}
          </p>
          <h1 className="text-4xl font-black leading-none">{page.title}</h1>
          <p className="text-base leading-7 text-hoopjot-muted">{page.description}</p>
        </header>

        <dl className="grid gap-3 rounded-card border-2 border-hoopjot-line bg-hoopjot-surface p-4 sm:grid-cols-2">
          <LegalFact label={t('facts.owner')} value={interpolationValues.ownerName} />
          <LegalFact label={t('facts.nif')} value={interpolationValues.ownerNif} />
          <LegalFact label={t('facts.contact')} value={interpolationValues.ownerEmail} />
          <LegalFact label={t('facts.site')} value={interpolationValues.siteUrl} />
        </dl>

        <div className="space-y-5">
          {page.sections.map((section) => (
            <section className="space-y-3" key={section.title}>
              <h2 className="text-2xl font-black leading-tight">{section.title}</h2>
              {section.body?.map((paragraph) => (
                <p className="text-sm leading-7 text-hoopjot-muted" key={paragraph}>
                  {paragraph}
                </p>
              ))}
              {section.items ? (
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li className="flex gap-2 text-sm leading-7 text-hoopjot-muted" key={item}>
                      <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-hoopjot-orange" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        {documentId === 'cookies' ? (
          <Button
            icon={<Settings className="h-5 w-5" aria-hidden="true" />}
            onClick={openPreferences}
            variant="secondary"
          >
            {t('cookies.actions.manage')}
          </Button>
        ) : null}
      </article>
    </LegalLayout>
  );
}

function LegalFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase text-hoopjot-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm font-bold text-hoopjot-ink">{value}</dd>
    </div>
  );
}

function LegalLayout({
  activeDocumentId,
  children
}: {
  activeDocumentId?: LegalDocumentId;
  children: ReactNode;
}) {
  const { i18n, t } = useTranslation(['common', 'legal']);
  const activeLocale = getSupportedLocale(i18n.resolvedLanguage);

  const changeLanguage = (locale: SupportedLocale) => {
    void i18n.changeLanguage(locale);
  };

  return (
    <main className="court-background min-h-screen text-hoopjot-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <BrandLogo label={t('appName', { ns: 'common' })} />
          <div className="ml-auto flex flex-wrap items-center justify-end gap-1">
            <Languages className="h-4 w-4 text-hoopjot-purple" aria-hidden="true" />
            {supportedLocales.map((locale) => (
              <Button
                aria-pressed={activeLocale === locale}
                key={locale}
                onClick={() => changeLanguage(locale)}
                size="sm"
                variant={activeLocale === locale ? 'secondary' : 'quiet'}
              >
                {t(`language.${locale}`, { ns: 'common' })}
              </Button>
            ))}
          </div>
        </header>

        <div className="py-5">
          <Link
            className="inline-flex items-center gap-2 text-sm font-black text-hoopjot-ink outline-none hover:text-hoopjot-purple focus-visible:ring-4 focus-visible:ring-hoopjot-blue/30"
            to="/"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('layout.backToApp', { ns: 'legal' })}
          </Link>
        </div>

        <nav
          aria-label={t('layout.navigationLabel', { ns: 'legal' })}
          className="mb-6 flex gap-2 overflow-x-auto pb-2"
        >
          {legalDocuments.map((document) => (
            <NavLink
              className={({ isActive }) =>
                cx(
                  'whitespace-nowrap rounded-control border-2 px-4 py-2 text-sm font-black outline-none focus-visible:ring-4 focus-visible:ring-hoopjot-blue/30',
                  isActive || activeDocumentId === document.id
                    ? 'border-hoopjot-ink bg-hoopjot-ink text-white'
                    : 'border-hoopjot-line bg-hoopjot-surface text-hoopjot-muted hover:border-hoopjot-purple hover:text-hoopjot-ink',
                )
              }
              key={document.id}
              to={document.path}
            >
              {t(`documents.${document.id}`, { ns: 'legal' })}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1 space-y-6">{children}</div>

        <footer className="mt-10 space-y-4 border-t-2 border-hoopjot-line pt-5">
          <LegalFooterLinks />
          <a
            className="mx-auto flex w-fit items-center gap-1 text-xs font-bold text-hoopjot-muted underline"
            href="https://www.aepd.es/"
            rel="noreferrer"
            target="_blank"
          >
            {t('layout.aepd', { ns: 'legal' })}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </footer>
      </div>
    </main>
  );
}

function getSupportedLocale(locale: string | undefined): SupportedLocale {
  return locale?.startsWith('es') ? 'es' : 'en';
}
