import { BookMarked, BookOpen, Home, Languages, Map, UserCircle } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { DailyFocusCard } from '../../components/basketball/DailyFocusCard';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { BottomNavigation, type BottomNavigationItem } from '../../components/ui/BottomNavigation';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import { EmptyState } from '../../components/ui/EmptyState';
import { MobileShell } from '../../components/ui/MobileShell';
import { OfflineBadge } from '../../components/ui/OfflineBadge';
import { RatingControl } from '../../components/ui/RatingControl';
import { supportedLocales, type SupportedLocale } from '../../i18n/locales';
import { usePwaStatus, type PwaConnectionStatus } from '../providers/pwaContext';
import { useSyncStatus } from '../providers/syncContext';
import type { OfflineBadgeStatus } from '../../components/ui/OfflineBadge';
import type { SyncIndicatorStatus } from '../../sync';

type PrimaryNavigationItemId =
  | 'today'
  | 'plan'
  | 'guide'
  | 'journal'
  | 'game'
  | 'progress'
  | 'profile';

interface AppShellProps {
  activeItemId?: PrimaryNavigationItemId;
  children?: ReactNode;
  contentWidth?: 'mobile' | 'readable';
}

export function AppShell({
  activeItemId = 'today',
  children,
  contentWidth = 'mobile',
}: AppShellProps) {
  const { connectionStatus, isApplyingUpdate, isUpdateAvailable, refreshApp } = usePwaStatus();
  const { status: syncStatus } = useSyncStatus();
  const [rating, setRating] = useState(3);
  const { i18n, t } = useTranslation('common');
  const activeLocale = getSupportedLocale(i18n.resolvedLanguage);
  const connectionBadge = getConnectionBadge(connectionStatus, syncStatus, t);

  const changeLanguage = (locale: SupportedLocale) => {
    void i18n.changeLanguage(locale);
  };

  const navigationItems: BottomNavigationItem[] = [
    { href: '/app', icon: Home, id: 'today', label: t('nav.today') },
    { href: '/plan', icon: Map, id: 'plan', label: t('nav.plan') },
    { href: '/guide', icon: BookMarked, id: 'guide', label: t('nav.guide') },
    { href: '/journal', icon: BookOpen, id: 'journal', label: t('nav.journal') },
  ];
  const shellMaxWidthClassName = contentWidth === 'readable' ? 'max-w-[900px]' : 'max-w-[480px]';

  return (
    <MobileShell
      bottomNavigation={
        <BottomNavigation
          activeItemId={activeItemId}
          ariaLabel={t('nav.label')}
          items={navigationItems}
          maxWidthClassName={shellMaxWidthClassName}
        />
      }
      contentWidth={contentWidth}
      header={
        <div className="flex items-center justify-between gap-3">
          <BrandLogo label={t('appName')} size="compact" />
          <div className="flex items-center gap-2">
            {connectionBadge ? (
              <OfflineBadge label={connectionBadge.label} status={connectionBadge.status} />
            ) : null}
            <Link
              aria-label={t('nav.profile')}
              className="inline-flex h-11 w-11 items-center justify-center rounded-control text-hoopjot-ink outline-none hover:bg-hoopjot-ink/8 focus-visible:ring-4 focus-visible:ring-hoopjot-blue/30"
              to="/profile"
            >
              <UserCircle className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      }
    >
      {isUpdateAvailable ? (
        <section
          className="mb-4 rounded-card border-2 border-hoopjot-blue/35 bg-hoopjot-blue/10 p-4"
          role="status"
          aria-label={t('pwa.update.label')}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-black">{t('pwa.update.title')}</p>
              <p className="text-sm leading-6 text-hoopjot-muted">{t('pwa.update.description')}</p>
            </div>
            <Button
              className="w-full sm:w-auto"
              disabled={isApplyingUpdate}
              onClick={() => {
                void refreshApp();
              }}
              size="sm"
              variant="secondary"
            >
              {isApplyingUpdate ? t('pwa.update.applying') : t('pwa.update.action')}
            </Button>
          </div>
        </section>
      ) : null}

      {children ?? (
        <div className="space-y-5" id="today">
          <section className="space-y-3 pt-2">
            <p className="text-sm font-bold text-hoopjot-purple">{t('shellEyebrow')}</p>
            <h1 className="text-4xl font-black leading-none">{t('designSystem.title')}</h1>
            <p className="text-base leading-7 text-hoopjot-muted">{t('designSystem.intro')}</p>
          </section>

          <DailyFocusCard
            actionLabel={t('dailyFocus.action')}
            categoryLabel={t('dailyFocus.category')}
            categoryTone="defense"
            cue={t('dailyFocus.cue')}
            explanation={t('dailyFocus.explanation')}
            reason={t('dailyFocus.reason')}
            reasonLabel={t('dailyFocus.reasonLabel')}
            title={t('dailyFocus.title')}
          />

          <Card>
            <RatingControl
              getValueLabel={(value) => t('rating.valueLabel', { value })}
              label={t('rating.label')}
              maxLabel={t('rating.maxLabel')}
              minLabel={t('rating.minLabel')}
              name="focus-clarity"
              onChange={setRating}
              value={rating}
            />
          </Card>

          <section className="grid gap-4 sm:grid-cols-2">
            <EmptyState
              description={t('emptyState.description')}
              icon={<BookOpen className="h-6 w-6" aria-hidden="true" />}
              title={t('emptyState.title')}
            />

            <Card className="space-y-4" tone="warm">
              <div className="flex items-center gap-2">
                <Languages className="h-5 w-5 text-hoopjot-purple" aria-hidden="true" />
                <h2 className="text-lg font-black">{t('languageLabel')}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
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
              <div className="flex flex-wrap gap-2">
                <Chip tone="attack">{t('chips.attack')}</Chip>
                <Chip tone="defense">{t('chips.defense')}</Chip>
                <Chip tone="transition">{t('chips.transition')}</Chip>
              </div>
            </Card>
          </section>
        </div>
      )}
    </MobileShell>
  );
}

function getSupportedLocale(locale: string | undefined): SupportedLocale {
  return locale?.startsWith('es') ? 'es' : 'en';
}

function getConnectionBadge(
  connectionStatus: PwaConnectionStatus,
  syncStatus: SyncIndicatorStatus,
  t: ReturnType<typeof useTranslation>['t'],
): { label: string; status: OfflineBadgeStatus } | null {
  if (connectionStatus === 'offline' || syncStatus === 'offline') {
    return { label: t('offlineBadge.offline'), status: 'offline' };
  }

  if (connectionStatus === 'reconnecting') {
    return { label: t('offlineBadge.reconnecting'), status: 'syncing' };
  }

  if (syncStatus === 'syncing') {
    return { label: t('offlineBadge.syncing'), status: 'syncing' };
  }

  if (syncStatus === 'needs_attention') {
    return { label: t('offlineBadge.needsAttention'), status: 'offline' };
  }

  return null;
}
