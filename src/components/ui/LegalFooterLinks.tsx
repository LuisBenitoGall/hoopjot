import { SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useOptionalCookieConsent } from '../../app/cookieConsentContext';
import { cx } from '../../lib/classNames';

interface LegalFooterLinksProps {
  className?: string;
}

export function LegalFooterLinks({ className }: LegalFooterLinksProps) {
  const cookieConsent = useOptionalCookieConsent();
  const { t } = useTranslation('legal');

  return (
    <nav
      aria-label={t('footer.label')}
      className={cx('flex flex-wrap items-center justify-center gap-x-4 gap-y-2', className)}
    >
      <Link
        className="inline-flex min-h-9 items-center text-xs font-bold text-hoopjot-muted underline"
        to="/legal/notice"
      >
        {t('documents.notice')}
      </Link>
      <Link
        className="inline-flex min-h-9 items-center text-xs font-bold text-hoopjot-muted underline"
        to="/legal/privacy"
      >
        {t('documents.privacy')}
      </Link>
      <Link
        className="inline-flex min-h-9 items-center text-xs font-bold text-hoopjot-muted underline"
        to="/legal/cookies"
      >
        {t('documents.cookies')}
      </Link>
      <Link
        className="inline-flex min-h-9 items-center text-xs font-bold text-hoopjot-muted underline"
        to="/legal/terms"
      >
        {t('documents.terms')}
      </Link>
      <button
        className="inline-flex min-h-9 items-center gap-1 text-xs font-bold text-hoopjot-muted underline outline-none hover:text-hoopjot-ink focus-visible:ring-4 focus-visible:ring-hoopjot-blue/30"
        onClick={() => cookieConsent?.openPreferences()}
        type="button"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
        {t('cookies.actions.manage')}
      </button>
    </nav>
  );
}
