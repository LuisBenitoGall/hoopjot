import {
  CheckCircle2,
  Eye,
  RotateCcw,
  SkipForward,
  Target
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';
import { useTranslation } from 'react-i18next';

import {
  TodayService,
  type TodayFocusResult
} from '../../application/today';
import { SessionReflectionService } from '../../application/sessions';
import { AppShell } from '../../app/shell/AppShell';
import { useAuth } from '../../app/providers/authContext';
import { useLocalRepositories } from '../../app/providers/localRepositoriesContext';
import { DailyFocusCard } from '../../components/basketball/DailyFocusCard';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Chip, type ChipTone } from '../../components/ui/Chip';
import { EmptyState } from '../../components/ui/EmptyState';
import { basketballContentRepository } from '../../content/basketball';
import { SessionReflectionPanel } from '../sessions/SessionReflectionPanel';
import type {
  DailyFocusStatus,
  Guideline
} from '../../domain';

type TodayRouteState =
  | { status: 'loading'; result: null }
  | { status: 'ready'; result: TodayFocusResult }
  | { status: 'error'; result: null };

interface TodayRouteProps {
  service?: TodayService;
}

interface GuidelineCopy {
  cue: string;
  instruction: string;
  title: string;
}

const statusActions: Array<{
  icon: typeof Eye;
  status: DailyFocusStatus;
  translationKey: string;
}> = [
  { icon: Eye, status: 'viewed', translationKey: 'today.actions.markViewed' },
  { icon: CheckCircle2, status: 'completed', translationKey: 'today.actions.markCompleted' },
  { icon: SkipForward, status: 'skipped', translationKey: 'today.actions.markSkipped' }
];

export function TodayRoute({ service: injectedService }: TodayRouteProps) {
  const { state: authState } = useAuth();
  const repositories = useLocalRepositories();
  const { t } = useTranslation(['common', 'content']);
  const [routeState, setRouteState] = useState<TodayRouteState>({
    status: 'loading',
    result: null
  });
  const [savingStatus, setSavingStatus] = useState<DailyFocusStatus | null>(null);

  const todayService = useMemo(
    () =>
      injectedService ??
      new TodayService({
        contentRepository: basketballContentRepository,
        dailyFocusRepository: repositories.dailyFocus,
        goalRepository: repositories.playerGoals,
        observationRepository: repositories.observations,
        profileRepository: repositories.profiles,
        sessionRepository: repositories.sessions,
        skillStateRepository: repositories.skillState
      }),
    [injectedService, repositories],
  );
  const sessionReflectionService = useMemo(
    () =>
      new SessionReflectionService({
        checkInRepository: repositories.checkIns,
        dailyFocusRepository: repositories.dailyFocus,
        reflectionRepository: repositories.reflections,
        sessionRepository: repositories.sessions
      }),
    [repositories],
  );

  const loadFocus = useCallback(async () => {
    if (authState.status !== 'authenticated') {
      return;
    }

    setRouteState({ status: 'loading', result: null });

    try {
      const result = await todayService.getOrCreateTodayFocus(authState.user.id);
      setRouteState({ status: 'ready', result });
    } catch {
      setRouteState({ status: 'error', result: null });
    }
  }, [authState, todayService]);

  useEffect(() => {
    void loadFocus();
  }, [loadFocus]);

  const updateStatus = async (status: DailyFocusStatus) => {
    if (authState.status !== 'authenticated') {
      return;
    }

    setSavingStatus(status);

    try {
      const result = await todayService.updateTodayFocusStatus(authState.user.id, status);
      setRouteState({ status: 'ready', result });
    } catch {
      setRouteState({ status: 'error', result: null });
    } finally {
      setSavingStatus(null);
    }
  };

  return (
    <AppShell activeItemId="today">
      <div className="space-y-5 pb-3">
        <section className="space-y-3 pt-2">
          <p className="text-sm font-bold text-hoopjot-purple">{t('today.eyebrow')}</p>
          <h1 className="text-4xl font-black leading-none">{t('today.title')}</h1>
          <p className="text-base leading-7 text-hoopjot-muted">{t('today.intro')}</p>
        </section>

        {routeState.status === 'loading' ? (
          <Card>
            <p className="text-sm font-black">{t('today.loading')}</p>
          </Card>
        ) : null}

        {routeState.status === 'error' ? (
          <EmptyState
            action={
              <Button
                icon={<RotateCcw className="h-5 w-5" aria-hidden="true" />}
                onClick={() => {
                  void loadFocus();
                }}
                size="sm"
              >
                {t('today.actions.retry')}
              </Button>
            }
            description={t('today.errors.loadDescription')}
            icon={<Target className="h-6 w-6" aria-hidden="true" />}
            title={t('today.errors.loadTitle')}
          />
        ) : null}

        {routeState.status === 'ready' ? (
          <TodayFocusContent
            onStatusChange={(status) => {
              void updateStatus(status);
            }}
            result={routeState.result}
            savingStatus={savingStatus}
          />
        ) : null}

        {authState.status === 'authenticated' ? (
          <SessionReflectionPanel
            service={sessionReflectionService}
            userId={authState.user.id}
          />
        ) : null}
      </div>
    </AppShell>
  );
}

function TodayFocusContent({
  onStatusChange,
  result,
  savingStatus
}: {
  onStatusChange: (status: DailyFocusStatus) => void;
  result: TodayFocusResult;
  savingStatus: DailyFocusStatus | null;
}) {
  const { t } = useTranslation(['common', 'content']);

  if (!result.dailyFocus || !result.guideline) {
    return (
      <EmptyState
        description={getUnavailableDescription(t, result.unavailableReason)}
        icon={<Target className="h-6 w-6" aria-hidden="true" />}
        title={getUnavailableTitle(t, result.unavailableReason)}
      />
    );
  }

  const copy = getGuidelineCopy(t, result.guideline);

  return (
    <section className="space-y-4" aria-label={t('today.focusSectionLabel')}>
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone={getStatusTone(result.dailyFocus.status)}>
          {t(`today.statuses.${result.dailyFocus.status}`)}
        </Chip>
        <Chip tone="neutral">{result.localDate}</Chip>
      </div>

      <DailyFocusCard
        actionIcon={<Eye className="h-5 w-5" aria-hidden="true" />}
        actionLabel={t('today.actions.markViewed')}
        categoryLabel={t(`game.categories.${result.guideline.category}`)}
        categoryTone={getCategoryTone(result.guideline.category)}
        cue={copy.cue}
        explanation={copy.instruction}
        footer={
          <StatusControls
            currentStatus={result.dailyFocus.status}
            onStatusChange={onStatusChange}
            savingStatus={savingStatus}
          />
        }
        onAction={() => onStatusChange('viewed')}
        reason={getReasonText(t, result)}
        reasonLabel={t('today.reasonLabel')}
        title={copy.title}
      />
    </section>
  );
}

function StatusControls({
  currentStatus,
  onStatusChange,
  savingStatus
}: {
  currentStatus: DailyFocusStatus;
  onStatusChange: (status: DailyFocusStatus) => void;
  savingStatus: DailyFocusStatus | null;
}) {
  const { t } = useTranslation('common');

  return (
    <section className="space-y-3" aria-label={t('today.statusLabel')}>
      <p className="text-sm font-black text-hoopjot-ink">{t('today.statusLabel')}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {statusActions.map((action) => {
          const Icon = action.icon;

          return (
            <Button
              aria-pressed={currentStatus === action.status}
              disabled={savingStatus !== null}
              icon={<Icon className="h-4 w-4" aria-hidden="true" />}
              key={action.status}
              onClick={() => onStatusChange(action.status)}
              size="sm"
              variant={currentStatus === action.status ? 'primary' : 'secondary'}
            >
              {savingStatus === action.status ? t('today.actions.saving') : t(action.translationKey)}
            </Button>
          );
        })}
      </div>
    </section>
  );
}

function getGuidelineCopy(
  t: ReturnType<typeof useTranslation>['t'],
  guideline: Guideline,
): GuidelineCopy {
  return {
    cue: t(`${guideline.translationKey}.cue`, { ns: 'content' }),
    instruction: t(`${guideline.translationKey}.instruction`, { ns: 'content' }),
    title: t(`${guideline.translationKey}.title`, { ns: 'content' })
  };
}

function getReasonText(
  t: ReturnType<typeof useTranslation>['t'],
  result: TodayFocusResult,
): string {
  if (!result.dailyFocus) {
    return t('today.reasons.rotation');
  }

  return t(`today.reasons.${result.dailyFocus.reasonCode}`, {
    context: result.selectionContext ? t(`game.contexts.${result.selectionContext}`) : ''
  });
}

function getUnavailableTitle(
  t: ReturnType<typeof useTranslation>['t'],
  reason: TodayFocusResult['unavailableReason'],
): string {
  return reason === 'recovery_session'
    ? t('today.noFocus.recoveryTitle')
    : t('today.noFocus.emptyTitle');
}

function getUnavailableDescription(
  t: ReturnType<typeof useTranslation>['t'],
  reason: TodayFocusResult['unavailableReason'],
): string {
  return reason === 'recovery_session'
    ? t('today.noFocus.recoveryDescription')
    : t('today.noFocus.emptyDescription');
}

function getCategoryTone(category: string): ChipTone {
  switch (category) {
    case 'attack':
      return 'attack';
    case 'defense':
      return 'defense';
    case 'transition':
      return 'transition';
    case 'decision_making':
      return 'progress';
    case 'communication':
      return 'reflection';
    default:
      return 'neutral';
  }
}

function getStatusTone(status: DailyFocusStatus): ChipTone {
  switch (status) {
    case 'completed':
      return 'progress';
    case 'skipped':
      return 'reflection';
    case 'viewed':
      return 'transition';
    default:
      return 'neutral';
  }
}
