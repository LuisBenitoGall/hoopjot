import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  ListChecks,
  PenLine,
  RotateCcw,
  Save,
  Sparkles,
  Target
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { useTranslation } from 'react-i18next';

import {
  ProgressService,
  type FocusAreaSummary,
  type ProgressDashboard,
  type ProgressServicePort,
  type ProgressSessionSummary,
  type ProgressSignal,
  type ProgressSignalTrend
} from '../../application/progress';
import { AppShell } from '../../app/shell/AppShell';
import { useAuth } from '../../app/providers/authContext';
import { useLocalRepositories } from '../../app/providers/localRepositoriesContext';
import { basketballContentRepository } from '../../content/basketball';
import type {
  Guideline,
  SessionType,
  Skill,
  WeeklyReview
} from '../../domain';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Chip, type ChipTone } from '../../components/ui/Chip';
import { EmptyState } from '../../components/ui/EmptyState';

type ProgressRouteState =
  | { dashboard: null; status: 'loading' }
  | { dashboard: ProgressDashboard; status: 'ready' }
  | { dashboard: null; status: 'error' };

type ReviewActionState = 'idle' | 'generating' | 'saving' | 'saved';

interface ProgressRouteProps {
  service?: ProgressServicePort;
}

interface GuidelineCopy {
  title: string;
}

interface WeeklyReviewNotes {
  userImprovementNote: string;
  userNextWeekNote: string;
}

export function ProgressRoute({ service: injectedService }: ProgressRouteProps) {
  const { state: authState } = useAuth();
  const repositories = useLocalRepositories();
  const { i18n, t } = useTranslation(['common', 'content']);
  const locale = getFormatterLocale(i18n.resolvedLanguage);
  const userId = authState.status === 'authenticated' ? authState.user.id : null;
  const [routeState, setRouteState] = useState<ProgressRouteState>({
    dashboard: null,
    status: 'loading'
  });
  const [reviewActionState, setReviewActionState] = useState<ReviewActionState>('idle');
  const [notes, setNotes] = useState<WeeklyReviewNotes>({
    userImprovementNote: '',
    userNextWeekNote: ''
  });

  const service = useMemo(
    () =>
      injectedService ??
      new ProgressService({
        contentRepository: basketballContentRepository,
        dailyFocusRepository: repositories.dailyFocus,
        observationRepository: repositories.observations,
        reflectionRepository: repositories.reflections,
        sessionRepository: repositories.sessions,
        skillStateRepository: repositories.skillState,
        weeklyReviewRepository: repositories.weeklyReviews
      }),
    [injectedService, repositories],
  );

  const loadDashboard = useCallback(async () => {
    if (!userId) {
      return;
    }

    setRouteState({ dashboard: null, status: 'loading' });

    try {
      setRouteState({
        dashboard: await service.getProgressDashboard(userId),
        status: 'ready'
      });
    } catch {
      setRouteState({ dashboard: null, status: 'error' });
    }
  }, [service, userId]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (routeState.status !== 'ready') {
      return;
    }

    setNotes({
      userImprovementNote: routeState.dashboard.weeklyReview?.userImprovementNote ?? '',
      userNextWeekNote: routeState.dashboard.weeklyReview?.userNextWeekNote ?? ''
    });
  }, [routeState]);

  const generateWeeklyReview = async () => {
    if (!userId) {
      return;
    }

    setReviewActionState('generating');

    try {
      const result = await service.getOrCreateWeeklyReview(userId);
      setRouteState({
        dashboard: {
          overview: result.overview,
          weeklyReview: result.weeklyReview
        },
        status: 'ready'
      });
    } catch {
      setRouteState({ dashboard: null, status: 'error' });
    } finally {
      setReviewActionState('idle');
    }
  };

  const saveNotes = async () => {
    if (!userId) {
      return;
    }

    setReviewActionState('saving');

    try {
      const result = await service.saveWeeklyReviewNotes({
        userId,
        userImprovementNote: notes.userImprovementNote,
        userNextWeekNote: notes.userNextWeekNote
      });

      setRouteState({
        dashboard: {
          overview: result.overview,
          weeklyReview: result.weeklyReview
        },
        status: 'ready'
      });
      setReviewActionState('saved');
    } catch {
      setRouteState({ dashboard: null, status: 'error' });
      setReviewActionState('idle');
    }
  };

  return (
    <AppShell activeItemId="progress">
      <div className="space-y-5 pb-3">
        <section className="space-y-3 pt-2">
          <p className="text-sm font-bold text-hoopjot-purple">{t('progress.eyebrow')}</p>
          <h1 className="text-3xl font-black leading-tight">{t('progress.title')}</h1>
          <p className="text-sm leading-6 text-hoopjot-muted">{t('progress.intro')}</p>
        </section>

        {routeState.status === 'loading' ? (
          <Card>
            <p className="text-sm font-black">{t('progress.loading')}</p>
          </Card>
        ) : null}

        {routeState.status === 'error' ? (
          <EmptyState
            action={
              <Button
                icon={<RotateCcw className="h-5 w-5" aria-hidden="true" />}
                onClick={() => {
                  void loadDashboard();
                }}
                size="sm"
              >
                {t('progress.actions.retry')}
              </Button>
            }
            description={t('progress.errors.loadDescription')}
            icon={<BarChart3 className="h-6 w-6" aria-hidden="true" />}
            title={t('progress.errors.loadTitle')}
          />
        ) : null}

        {routeState.status === 'ready' ? (
          <ProgressContent
            dashboard={routeState.dashboard}
            locale={locale}
            notes={notes}
            onGenerateWeeklyReview={() => {
              void generateWeeklyReview();
            }}
            onNotesChange={setNotes}
            onSaveNotes={() => {
              void saveNotes();
            }}
            reviewActionState={reviewActionState}
          />
        ) : null}
      </div>
    </AppShell>
  );
}

function ProgressContent({
  dashboard,
  locale,
  notes,
  onGenerateWeeklyReview,
  onNotesChange,
  onSaveNotes,
  reviewActionState
}: {
  dashboard: ProgressDashboard;
  locale: string;
  notes: WeeklyReviewNotes;
  onGenerateWeeklyReview: () => void;
  onNotesChange: (notes: WeeklyReviewNotes) => void;
  onSaveNotes: () => void;
  reviewActionState: ReviewActionState;
}) {
  const { t } = useTranslation('common');
  const skillsById = getOverviewSkillsById(dashboard);

  return (
    <>
      <section className="flex flex-wrap items-center gap-2" aria-label={t('progress.summaryLabel')}>
        <Chip tone={getLearningStateTone(dashboard.overview.learningState)}>
          {t(`progress.learningStates.${dashboard.overview.learningState}`)}
        </Chip>
        <Chip icon={<CalendarDays className="h-3.5 w-3.5" />} tone="neutral">
          {t('progress.weekLabel', {
            date: formatLocalDateLabel(dashboard.overview.weekStart, locale)
          })}
        </Chip>
      </section>

      {dashboard.overview.learningState === 'empty' ? (
        <EmptyState
          description={t('progress.empty.description')}
          icon={<BarChart3 className="h-6 w-6" aria-hidden="true" />}
          title={t('progress.empty.title')}
        />
      ) : null}

      {dashboard.overview.learningState === 'building' ? (
        <Card className="space-y-2" tone="warm">
          <h2 className="text-lg font-black">{t('progress.building.title')}</h2>
          <p className="text-sm leading-6 text-hoopjot-muted">
            {t('progress.building.description')}
          </p>
        </Card>
      ) : null}

      <RecentSessionsSection locale={locale} sessions={dashboard.overview.recentSessions} />
      <FocusAreasSection focusAreas={dashboard.overview.focusAreas} locale={locale} />
      <SignalsSection signals={dashboard.overview.signals} />
      <WeeklyReviewPanel
        locale={locale}
        notes={notes}
        onGenerateWeeklyReview={onGenerateWeeklyReview}
        onNotesChange={onNotesChange}
        onSaveNotes={onSaveNotes}
        review={dashboard.weeklyReview}
        reviewActionState={reviewActionState}
        skillsById={skillsById}
        weekStart={dashboard.overview.weekStart}
      />
    </>
  );
}

function RecentSessionsSection({
  locale,
  sessions
}: {
  locale: string;
  sessions: ProgressSessionSummary[];
}) {
  const { t } = useTranslation(['common', 'content']);

  return (
    <section className="space-y-3" aria-label={t('progress.recentSessions.sectionLabel')}>
      <SectionHeading
        icon={<ListChecks className="h-5 w-5" aria-hidden="true" />}
        title={t('progress.recentSessions.title')}
      />

      {sessions.length === 0 ? (
        <p className="text-sm leading-6 text-hoopjot-muted">
          {t('progress.recentSessions.emptyDescription')}
        </p>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <article key={session.session.id}>
              <Card className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Chip tone={getSessionTypeTone(session.session.type)}>
                    {t(`sessions.types.${session.session.type}`)}
                  </Chip>
                  <TrendChip trend={session.trend} />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-black leading-tight">
                    {session.guideline
                      ? getGuidelineCopy(t, session.guideline).title
                      : t('progress.recentSessions.noFocus')}
                  </h3>
                  <p className="text-sm font-bold text-hoopjot-muted">
                    {formatDateTime(session.occurredAt, locale)}
                  </p>
                </div>

                <p className="text-sm leading-6 text-hoopjot-muted">
                  {session.reflection
                    ? t('progress.recentSessions.reflectionSaved')
                    : t('progress.recentSessions.noReflection')}
                </p>
              </Card>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function FocusAreasSection({
  focusAreas,
  locale
}: {
  focusAreas: FocusAreaSummary[];
  locale: string;
}) {
  const { t } = useTranslation('common');

  return (
    <section className="space-y-3" aria-label={t('progress.focusAreas.sectionLabel')}>
      <SectionHeading
        icon={<Target className="h-5 w-5" aria-hidden="true" />}
        title={t('progress.focusAreas.title')}
      />

      {focusAreas.length === 0 ? (
        <p className="text-sm leading-6 text-hoopjot-muted">
          {t('progress.focusAreas.emptyDescription')}
        </p>
      ) : (
        <Card className="space-y-4">
          <ul className="space-y-4">
            {focusAreas.map((focusArea) => (
              <li
                className="border-b border-hoopjot-line pb-4 last:border-0 last:pb-0"
                key={focusArea.skillId}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-base font-black">
                      {getSkillLabel(t, focusArea.skill, focusArea.skillId)}
                    </p>
                    <p className="text-sm font-bold text-hoopjot-muted">
                      {t('progress.focusAreas.lastFocused', {
                        date: formatLocalDateLabel(focusArea.lastFocusedAt, locale)
                      })}
                    </p>
                  </div>
                  <TrendChip trend={focusArea.trend} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}

function SignalsSection({ signals }: { signals: ProgressSignal[] }) {
  const { t } = useTranslation('common');

  return (
    <section className="space-y-3" aria-label={t('progress.signals.sectionLabel')}>
      <SectionHeading
        icon={<Sparkles className="h-5 w-5" aria-hidden="true" />}
        title={t('progress.signals.title')}
      />

      {signals.length === 0 ? (
        <p className="text-sm leading-6 text-hoopjot-muted">
          {t('progress.signals.emptyDescription')}
        </p>
      ) : (
        <Card className="space-y-4">
          <ul className="space-y-4">
            {signals.map((signal) => (
              <li
                className="border-b border-hoopjot-line pb-4 last:border-0 last:pb-0"
                key={signal.skillId}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-base font-black">
                      {getSkillLabel(t, signal.skill, signal.skillId)}
                    </p>
                    <p className="text-sm font-bold text-hoopjot-muted">
                      {t('progress.signals.evidenceLabel')}
                    </p>
                  </div>
                  <TrendChip trend={signal.trend} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}

function WeeklyReviewPanel({
  locale,
  notes,
  onGenerateWeeklyReview,
  onNotesChange,
  onSaveNotes,
  review,
  reviewActionState,
  skillsById,
  weekStart
}: {
  locale: string;
  notes: WeeklyReviewNotes;
  onGenerateWeeklyReview: () => void;
  onNotesChange: (notes: WeeklyReviewNotes) => void;
  onSaveNotes: () => void;
  review: WeeklyReview | null;
  reviewActionState: ReviewActionState;
  skillsById: Map<string, Skill>;
  weekStart: string;
}) {
  const { t } = useTranslation('common');

  return (
    <section className="space-y-3" aria-label={t('progress.weeklyReview.sectionLabel')}>
      <SectionHeading
        icon={<PenLine className="h-5 w-5" aria-hidden="true" />}
        title={t('progress.weeklyReview.title')}
      />

      <Card className="space-y-5" tone="warm">
        <div className="space-y-2">
          <Chip icon={<CalendarDays className="h-3.5 w-3.5" />} tone="neutral">
            {t('progress.weekLabel', {
              date: formatLocalDateLabel(weekStart, locale)
            })}
          </Chip>
          <p className="text-sm leading-6 text-hoopjot-muted">
            {t('progress.weeklyReview.description')}
          </p>
        </div>

        {!review ? (
          <Button
            disabled={reviewActionState === 'generating'}
            icon={<Sparkles className="h-5 w-5" aria-hidden="true" />}
            onClick={onGenerateWeeklyReview}
          >
            {reviewActionState === 'generating'
              ? t('progress.actions.generatingReview')
              : t('progress.actions.generateReview')}
          </Button>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <WeeklyReviewSkillGroup
                label={t('progress.weeklyReview.highlighted')}
                skillIds={review.highlightedSkillIds}
                skillsById={skillsById}
              />
              <WeeklyReviewSkillGroup
                label={t('progress.weeklyReview.improving')}
                skillIds={review.improvingSkillIds}
                skillsById={skillsById}
              />
              <WeeklyReviewSkillGroup
                label={t('progress.weeklyReview.recurring')}
                skillIds={review.recurringSkillIds}
                skillsById={skillsById}
              />
              <WeeklyReviewSkillGroup
                label={t('progress.weeklyReview.nextPriority')}
                skillIds={review.nextPrioritySkillIds}
                skillsById={skillsById}
              />
            </div>

            <WeeklyReviewTextField
              label={t('progress.weeklyReview.userImprovementLabel')}
              maxLength={2000}
              onChange={(value) =>
                onNotesChange({
                  ...notes,
                  userImprovementNote: value
                })
              }
              placeholder={t('progress.weeklyReview.userImprovementPlaceholder')}
              value={notes.userImprovementNote}
            />
            <WeeklyReviewTextField
              label={t('progress.weeklyReview.userNextWeekLabel')}
              maxLength={2000}
              onChange={(value) =>
                onNotesChange({
                  ...notes,
                  userNextWeekNote: value
                })
              }
              placeholder={t('progress.weeklyReview.userNextWeekPlaceholder')}
              value={notes.userNextWeekNote}
            />

            <div className="flex flex-wrap items-center gap-3">
              <Button
                disabled={reviewActionState === 'saving'}
                icon={<Save className="h-5 w-5" aria-hidden="true" />}
                onClick={onSaveNotes}
              >
                {reviewActionState === 'saving'
                  ? t('progress.actions.savingNotes')
                  : t('progress.actions.saveNotes')}
              </Button>
              {reviewActionState === 'saved' ? (
                <p className="flex items-center gap-2 text-sm font-bold text-hoopjot-success">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  {t('progress.weeklyReview.saved')}
                </p>
              ) : null}
            </div>
          </>
        )}
      </Card>
    </section>
  );
}

function WeeklyReviewSkillGroup({
  label,
  skillIds,
  skillsById
}: {
  label: string;
  skillIds: string[];
  skillsById: Map<string, Skill>;
}) {
  const { t } = useTranslation('common');

  return (
    <section className="space-y-2">
      <h3 className="text-xs font-black uppercase text-hoopjot-muted">{label}</h3>
      {skillIds.length === 0 ? (
        <p className="text-sm leading-6 text-hoopjot-muted">
          {t('progress.weeklyReview.noItems')}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {skillIds.map((skillId) => (
            <Chip key={skillId} tone="progress">
              {getSkillLabel(t, skillsById.get(skillId) ?? null, skillId)}
            </Chip>
          ))}
        </div>
      )}
    </section>
  );
}

function WeeklyReviewTextField({
  label,
  maxLength,
  onChange,
  placeholder,
  value
}: {
  label: string;
  maxLength: number;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-hoopjot-ink">{label}</span>
      <textarea
        className="min-h-24 w-full resize-y rounded-card border-2 border-hoopjot-line bg-hoopjot-surface px-4 py-3 text-sm leading-6 text-hoopjot-ink outline-none focus-visible:ring-4 focus-visible:ring-hoopjot-blue/30"
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function TrendChip({ trend }: { trend: ProgressSignalTrend }) {
  const { t } = useTranslation('common');

  return (
    <Chip icon={getTrendIcon(trend)} tone={getTrendTone(trend)}>
      {t(`progress.trends.${trend}`)}
    </Chip>
  );
}

function SectionHeading({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <h2 className="flex items-center gap-2 text-xl font-black leading-tight">
      <span className="text-hoopjot-purple">{icon}</span>
      {title}
    </h2>
  );
}

function getTrendIcon(trend: ProgressSignalTrend) {
  if (trend === 'needs_attention') {
    return <CircleAlert className="h-3.5 w-3.5" />;
  }

  if (trend === 'improving') {
    return <CheckCircle2 className="h-3.5 w-3.5" />;
  }

  return undefined;
}

function getGuidelineCopy(
  t: ReturnType<typeof useTranslation>['t'],
  guideline: Guideline,
): GuidelineCopy {
  return {
    title: t(`${guideline.translationKey}.title`, { ns: 'content' })
  };
}

function getSkillLabel(
  t: ReturnType<typeof useTranslation>['t'],
  skill: Skill | null,
  skillId: string,
): string {
  if (!skill) {
    return t('progress.skillFallback', { skillId });
  }

  return `${t(`game.categories.${skill.category}`)} / ${t(`game.subcategories.${skill.subcategory}`)}`;
}

function getLearningStateTone(state: ProgressDashboard['overview']['learningState']): ChipTone {
  switch (state) {
    case 'empty':
      return 'neutral';
    case 'building':
      return 'transition';
    case 'ready':
      return 'progress';
  }
}

function getTrendTone(trend: ProgressSignalTrend): ChipTone {
  switch (trend) {
    case 'improving':
      return 'progress';
    case 'needs_attention':
      return 'reflection';
    case 'stable':
      return 'transition';
    case 'learning':
      return 'neutral';
  }
}

function getSessionTypeTone(type: SessionType): ChipTone {
  switch (type) {
    case 'practice':
      return 'attack';
    case 'game':
      return 'defense';
    case 'learning':
      return 'transition';
    default:
      return 'neutral';
  }
}

function getOverviewSkillsById(dashboard: ProgressDashboard): Map<string, Skill> {
  const skillsById = new Map<string, Skill>();

  for (const focusArea of dashboard.overview.focusAreas) {
    if (focusArea.skill) {
      skillsById.set(focusArea.skillId, focusArea.skill);
    }
  }

  for (const signal of dashboard.overview.signals) {
    if (signal.skill) {
      skillsById.set(signal.skillId, signal.skill);
    }
  }

  return skillsById;
}

function formatDateTime(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function formatLocalDateLabel(localDate: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(parseLocalDate(localDate));
}

function parseLocalDate(localDate: string): Date {
  const [year, month, day] = localDate.split('-').map(Number);

  return new Date(year, month - 1, day);
}

function getFormatterLocale(locale: string | undefined): string {
  return locale?.startsWith('es') ? 'es-ES' : 'en-US';
}
