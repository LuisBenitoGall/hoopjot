import {
  RotateCcw,
  Target
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useTranslation } from 'react-i18next';

import {
  QuickReflectionService,
  TodayService,
  type QuickReflectionServicePort,
  type QuickReflectionState,
  type TodayFocusResult
} from '../../application/today';
import { AppShell } from '../../app/shell/AppShell';
import { useAuth } from '../../app/providers/authContext';
import { useLocalRepositories } from '../../app/providers/localRepositoriesContext';
import { DailyFocusCard } from '../../components/basketball/DailyFocusCard';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import type { ChipTone } from '../../components/ui/Chip';
import { EmptyState } from '../../components/ui/EmptyState';
import { basketballContentRepository } from '../../content/basketball';
import type { Guideline } from '../../domain';
import { QuickReflectionPanel } from './QuickReflectionPanel';

type TodayRouteState =
  | { status: 'loading'; feedbackState: null; result: null }
  | { status: 'ready'; feedbackState: QuickReflectionState; result: TodayFocusResult }
  | { status: 'error'; feedbackState: null; result: null };

interface TodayRouteProps {
  quickReflectionService?: QuickReflectionServicePort;
  service?: TodayService;
}

interface GuidelineCopy {
  cue: string;
  instruction: string;
  title: string;
}

export function TodayRoute({
  quickReflectionService: injectedQuickReflectionService,
  service: injectedService
}: TodayRouteProps) {
  const { state: authState } = useAuth();
  const repositories = useLocalRepositories();
  const { t } = useTranslation(['common', 'content']);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [routeState, setRouteState] = useState<TodayRouteState>({
    status: 'loading',
    feedbackState: null,
    result: null
  });
  const viewedFocusIdsRef = useRef<Set<string>>(new Set());

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
  const quickReflectionService = useMemo(
    () =>
      injectedQuickReflectionService ??
      new QuickReflectionService({
        dailyFocusRepository: repositories.dailyFocus,
        reflectionRepository: repositories.reflections,
        sessionRepository: repositories.sessions
      }),
    [injectedQuickReflectionService, repositories],
  );

  const loadToday = useCallback(async () => {
    if (authState.status !== 'authenticated') {
      return;
    }

    setIsFeedbackOpen(false);
    setRouteState({ status: 'loading', feedbackState: null, result: null });

    try {
      const [result, feedbackState] = await Promise.all([
        todayService.getOrCreateTodayFocus(authState.user.id),
        quickReflectionService.getTodayState(authState.user.id)
      ]);
      setRouteState({ status: 'ready', result, feedbackState });
    } catch {
      setRouteState({ status: 'error', feedbackState: null, result: null });
    }
  }, [authState, quickReflectionService, todayService]);

  useEffect(() => {
    void loadToday();
  }, [loadToday]);

  useEffect(() => {
    if (authState.status !== 'authenticated' || routeState.status !== 'ready') {
      return;
    }

    const focus = routeState.result.dailyFocus;

    if (
      !focus ||
      !routeState.result.guideline ||
      focus.status !== 'planned' ||
      viewedFocusIdsRef.current.has(focus.id)
    ) {
      return;
    }

    viewedFocusIdsRef.current.add(focus.id);

    void todayService
      .updateTodayFocusStatus(authState.user.id, 'viewed')
      .then((result) => {
        setRouteState((currentState) => {
          if (currentState.status !== 'ready') {
            return currentState;
          }

          const currentFocus = currentState.result.dailyFocus;

          if (!currentFocus || currentFocus.id !== result.dailyFocus?.id || currentFocus.status !== 'planned') {
            return currentState;
          }

          return { ...currentState, result };
        });
      })
      .catch(() => {
        viewedFocusIdsRef.current.delete(focus.id);
      });
  }, [authState, routeState, todayService]);

  const handleFeedbackSaved = (feedbackState: QuickReflectionState) => {
    setIsFeedbackOpen(false);
    setRouteState((currentState) => {
      if (currentState.status !== 'ready') {
        return currentState;
      }

      return {
        ...currentState,
        feedbackState,
        result: {
          ...currentState.result,
          dailyFocus: feedbackState.dailyFocus ?? currentState.result.dailyFocus
        }
      };
    });
  };

  return (
    <AppShell activeItemId="today">
      <div className="space-y-5 pb-3">
        <section className="space-y-1 pt-2">
          <h1 className="text-sm font-black uppercase text-hoopjot-purple">
            {t('today.eyebrow')}
          </h1>
          {routeState.status === 'ready' ? (
            <time
              className="block text-sm font-bold text-hoopjot-muted"
              dateTime={routeState.result.localDate}
            >
              {routeState.result.localDate}
            </time>
          ) : null}
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
                  void loadToday();
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

        {routeState.status === 'ready' && authState.status === 'authenticated' ? (
          <TodayFocusContent
            feedbackState={routeState.feedbackState}
            isFeedbackOpen={isFeedbackOpen}
            onFeedbackSaved={handleFeedbackSaved}
            onOpenFeedback={() => setIsFeedbackOpen(true)}
            quickReflectionService={quickReflectionService}
            result={routeState.result}
            userId={authState.user.id}
          />
        ) : null}
      </div>
    </AppShell>
  );
}

function TodayFocusContent({
  feedbackState,
  isFeedbackOpen,
  onFeedbackSaved,
  onOpenFeedback,
  quickReflectionService,
  result,
  userId
}: {
  feedbackState: QuickReflectionState;
  isFeedbackOpen: boolean;
  onFeedbackSaved: (state: QuickReflectionState) => void;
  onOpenFeedback: () => void;
  quickReflectionService: QuickReflectionServicePort;
  result: TodayFocusResult;
  userId: string;
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
  const hasSavedReflection = Boolean(feedbackState.reflection);

  return (
    <section className="space-y-4" aria-label={t('today.focusSectionLabel')}>
      <DailyFocusCard
        categoryLabel={t(`game.categories.${result.guideline.category}`)}
        categoryTone={getCategoryTone(result.guideline.category)}
        cue={copy.cue}
        explanation={copy.instruction}
        reason={getReasonText(t, result)}
        reasonLabel={t('today.reasonLabel')}
        title={copy.title}
      />

      {hasSavedReflection ? (
        <p
          className="rounded-card border border-hoopjot-line bg-hoopjot-surface px-4 py-3 text-sm font-black leading-6"
          role="status"
        >
          {t('today.savedConfirmation')}
        </p>
      ) : isFeedbackOpen ? (
        <QuickReflectionPanel
          onSaved={onFeedbackSaved}
          service={quickReflectionService}
          userId={userId}
        />
      ) : (
        <Button className="w-full" onClick={onOpenFeedback}>
          {t('today.actions.logHowItWent')}
        </Button>
      )}
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
