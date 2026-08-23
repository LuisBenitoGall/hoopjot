import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Filter,
  RotateCcw,
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
  Link,
  useParams
} from 'react-router-dom';

import {
  JournalService,
  type JournalEntry,
  type JournalFilter,
  type JournalServicePort,
  type JournalTimeline
} from '../../application/journal';
import { AppShell } from '../../app/shell/AppShell';
import { useAuth } from '../../app/providers/authContext';
import { useLocalRepositories } from '../../app/providers/localRepositoriesContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Chip, type ChipTone } from '../../components/ui/Chip';
import { EmptyState } from '../../components/ui/EmptyState';
import { basketballContentRepository } from '../../content/basketball';
import type {
  Guideline,
  Session,
  SessionType
} from '../../domain';
import { cx } from '../../lib/classNames';

const journalFilters: JournalFilter[] = ['all', 'practice', 'game', 'learning', 'recovery'];

type TimelineState =
  | { status: 'loading'; timeline: null }
  | { status: 'ready'; timeline: JournalTimeline }
  | { status: 'error'; timeline: null };

type DetailState =
  | { status: 'loading'; entry: null }
  | { status: 'ready'; entry: JournalEntry | null }
  | { status: 'error'; entry: null };

interface JournalRouteProps {
  service?: JournalServicePort;
}

interface GuidelineCopy {
  cue: string;
  instruction: string;
  title: string;
}

export function JournalRoute({ service: injectedService }: JournalRouteProps) {
  const { state: authState } = useAuth();
  const repositories = useLocalRepositories();
  const { i18n, t } = useTranslation(['common', 'content']);
  const locale = getFormatterLocale(i18n.resolvedLanguage);
  const userId = authState.status === 'authenticated' ? authState.user.id : null;
  const [selectedFilter, setSelectedFilter] = useState<JournalFilter>('all');
  const [timelineState, setTimelineState] = useState<TimelineState>({
    status: 'loading',
    timeline: null
  });

  const service = useMemo(
    () =>
      injectedService ??
      new JournalService({
        checkInRepository: repositories.checkIns,
        contentRepository: basketballContentRepository,
        dailyFocusRepository: repositories.dailyFocus,
        reflectionRepository: repositories.reflections,
        sessionRepository: repositories.sessions
      }),
    [injectedService, repositories],
  );

  const loadTimeline = useCallback(async () => {
    if (!userId) {
      return;
    }

    setTimelineState({ status: 'loading', timeline: null });

    try {
      setTimelineState({
        status: 'ready',
        timeline: await service.listTimeline(userId, selectedFilter)
      });
    } catch {
      setTimelineState({ status: 'error', timeline: null });
    }
  }, [selectedFilter, service, userId]);

  useEffect(() => {
    void loadTimeline();
  }, [loadTimeline]);

  return (
    <AppShell activeItemId="journal">
      <div className="space-y-5 pb-3">
        <section className="space-y-3 pt-2">
          <p className="text-sm font-bold text-hoopjot-purple">{t('journal.eyebrow')}</p>
          <h1 className="text-3xl font-black leading-tight">{t('journal.title')}</h1>
          <p className="text-sm leading-6 text-hoopjot-muted">{t('journal.intro')}</p>
        </section>

        <JournalFilterControls
          onChange={setSelectedFilter}
          selectedFilter={selectedFilter}
        />

        {timelineState.status === 'loading' ? (
          <Card>
            <p className="text-sm font-black">{t('journal.loading')}</p>
          </Card>
        ) : null}

        {timelineState.status === 'error' ? (
          <EmptyState
            action={
              <Button
                icon={<RotateCcw className="h-5 w-5" aria-hidden="true" />}
                onClick={() => {
                  void loadTimeline();
                }}
                size="sm"
              >
                {t('journal.actions.retry')}
              </Button>
            }
            description={t('journal.errors.loadDescription')}
            icon={<BookOpen className="h-6 w-6" aria-hidden="true" />}
            title={t('journal.errors.loadTitle')}
          />
        ) : null}

        {timelineState.status === 'ready' ? (
          <JournalTimelineContent locale={locale} timeline={timelineState.timeline} />
        ) : null}
      </div>
    </AppShell>
  );
}

export function SessionDetailRoute({ service: injectedService }: JournalRouteProps) {
  const { sessionId } = useParams();
  const { state: authState } = useAuth();
  const repositories = useLocalRepositories();
  const { i18n, t } = useTranslation(['common', 'content']);
  const locale = getFormatterLocale(i18n.resolvedLanguage);
  const userId = authState.status === 'authenticated' ? authState.user.id : null;
  const [detailState, setDetailState] = useState<DetailState>({
    status: 'loading',
    entry: null
  });

  const service = useMemo(
    () =>
      injectedService ??
      new JournalService({
        checkInRepository: repositories.checkIns,
        contentRepository: basketballContentRepository,
        dailyFocusRepository: repositories.dailyFocus,
        reflectionRepository: repositories.reflections,
        sessionRepository: repositories.sessions
      }),
    [injectedService, repositories],
  );

  const loadDetail = useCallback(async () => {
    if (!userId || !sessionId) {
      setDetailState({ status: 'ready', entry: null });
      return;
    }

    setDetailState({ status: 'loading', entry: null });

    try {
      setDetailState({
        status: 'ready',
        entry: await service.getSessionDetail(userId, sessionId)
      });
    } catch {
      setDetailState({ status: 'error', entry: null });
    }
  }, [service, sessionId, userId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  return (
    <AppShell activeItemId="journal">
      <div className="space-y-5 pb-3 pt-2">
        <BackToJournalLink />

        {detailState.status === 'loading' ? (
          <Card>
            <p className="text-sm font-black">{t('journal.loadingDetail')}</p>
          </Card>
        ) : null}

        {detailState.status === 'error' ? (
          <EmptyState
            action={
              <Button
                icon={<RotateCcw className="h-5 w-5" aria-hidden="true" />}
                onClick={() => {
                  void loadDetail();
                }}
                size="sm"
              >
                {t('journal.actions.retry')}
              </Button>
            }
            description={t('journal.errors.detailDescription')}
            icon={<BookOpen className="h-6 w-6" aria-hidden="true" />}
            title={t('journal.errors.detailTitle')}
          />
        ) : null}

        {detailState.status === 'ready' && !detailState.entry ? (
          <EmptyState
            description={t('journal.detail.emptyDescription')}
            icon={<BookOpen className="h-6 w-6" aria-hidden="true" />}
            title={t('journal.detail.emptyTitle')}
          />
        ) : null}

        {detailState.status === 'ready' && detailState.entry ? (
          <SessionDetail entry={detailState.entry} locale={locale} />
        ) : null}
      </div>
    </AppShell>
  );
}

function JournalFilterControls({
  onChange,
  selectedFilter
}: {
  onChange: (filter: JournalFilter) => void;
  selectedFilter: JournalFilter;
}) {
  const { t } = useTranslation('common');

  return (
    <fieldset className="space-y-2">
      <legend className="flex items-center gap-2 text-xs font-black uppercase text-hoopjot-muted">
        <Filter className="h-4 w-4" aria-hidden="true" />
        {t('journal.filters.label')}
      </legend>
      <div className="flex max-w-full flex-wrap gap-2 pb-1">
        {journalFilters.map((filter) => {
          const selected = selectedFilter === filter;

          return (
            <button
              aria-pressed={selected}
              className={cx(
                'min-h-10 rounded-control border px-3 text-xs font-black outline-none motion-safe:transition sm:px-4 sm:text-sm',
                'focus-visible:ring-4 focus-visible:ring-hoopjot-blue/30',
                selected
                  ? 'border-hoopjot-ink bg-hoopjot-ink text-white'
                  : 'border-hoopjot-line bg-hoopjot-surface text-hoopjot-ink hover:border-hoopjot-purple',
              )}
              key={filter}
              onClick={() => onChange(filter)}
              type="button"
            >
              {getFilterLabel(t, filter)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function JournalTimelineContent({
  locale,
  timeline
}: {
  locale: string;
  timeline: JournalTimeline;
}) {
  const { t } = useTranslation(['common', 'content']);

  if (timeline.totalCount === 0) {
    return (
      <EmptyState
        description={t('journal.empty.description')}
        icon={<BookOpen className="h-6 w-6" aria-hidden="true" />}
        title={t('journal.empty.title')}
      />
    );
  }

  return (
    <section aria-live="polite" className="space-y-6">
      <p className="text-sm font-black text-hoopjot-muted">
        {t('journal.resultCount', { count: timeline.totalCount })}
      </p>

      {timeline.groups.map((group) => (
        <section className="space-y-3" key={group.localDate}>
          <h2 className="flex items-center gap-2 text-sm font-black uppercase text-hoopjot-muted">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {formatLocalDateLabel(group.localDate, locale)}
          </h2>

          {group.entries.map((entry) => (
            <JournalSessionCard entry={entry} key={entry.session.id} locale={locale} />
          ))}
        </section>
      ))}
    </section>
  );
}

function JournalSessionCard({
  entry,
  locale
}: {
  entry: JournalEntry;
  locale: string;
}) {
  const { t } = useTranslation(['common', 'content']);
  const typeLabel = t(`sessions.types.${entry.session.type}`);
  const status = getJournalEntryStatus(entry.session, Boolean(entry.reflection));
  const focusTitle = entry.guideline
    ? getGuidelineCopy(t, entry.guideline).title
    : t('journal.focus.none');

  return (
    <article>
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone={getSessionTypeTone(entry.session.type)}>{typeLabel}</Chip>
          <Chip
            icon={entry.reflection ? <CheckCircle2 className="h-3.5 w-3.5" /> : undefined}
            tone={status.tone}
          >
            {t(status.labelKey)}
          </Chip>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black leading-tight">{typeLabel}</h3>
          <p className="flex items-center gap-2 text-sm font-bold text-hoopjot-muted">
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            {formatDateTime(entry.occurredAt, locale)}
          </p>
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-black text-hoopjot-muted">{t('journal.card.focusLabel')}</dt>
            <dd className="mt-1 font-bold leading-6">{focusTitle}</dd>
          </div>
          <div>
            <dt className="font-black text-hoopjot-muted">{t('journal.card.reflectionLabel')}</dt>
            <dd className="mt-1 font-bold leading-6">{t(status.descriptionKey)}</dd>
          </div>
        </dl>

        <Link
          aria-label={t('journal.openDetailLabel', {
            date: formatDateTime(entry.occurredAt, locale),
            type: typeLabel
          })}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-control border-2 border-hoopjot-ink bg-hoopjot-surface px-4 text-sm font-black text-hoopjot-ink shadow-control outline-none hover:bg-hoopjot-ink hover:text-white focus-visible:ring-4 focus-visible:ring-hoopjot-blue/30"
          to={`/journal/${entry.session.id}`}
        >
          {t('journal.actions.openDetail')}
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      </Card>
    </article>
  );
}

function SessionDetail({
  entry,
  locale
}: {
  entry: JournalEntry;
  locale: string;
}) {
  const { t } = useTranslation(['common', 'content']);
  const typeLabel = t(`sessions.types.${entry.session.type}`);
  const status = getJournalEntryStatus(entry.session, Boolean(entry.reflection));

  return (
    <>
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone={getSessionTypeTone(entry.session.type)}>{typeLabel}</Chip>
          <Chip tone={status.tone}>{t(status.labelKey)}</Chip>
        </div>
        <h1 className="text-3xl font-black leading-tight">{typeLabel}</h1>
        <p className="flex items-center gap-2 text-sm font-bold text-hoopjot-muted">
          <Clock3 className="h-4 w-4" aria-hidden="true" />
          {formatDateTime(entry.occurredAt, locale)}
        </p>
      </section>

      <FocusDetail entry={entry} />
      <CheckInDetail entry={entry} />
      <ReflectionDetail entry={entry} />
    </>
  );
}

function FocusDetail({ entry }: { entry: JournalEntry }) {
  const { t } = useTranslation(['common', 'content']);

  if (!entry.guideline) {
    return (
      <Card className="space-y-2">
        <h2 className="flex items-center gap-2 text-lg font-black">
          <Target className="h-5 w-5 text-hoopjot-purple" aria-hidden="true" />
          {t('journal.focus.title')}
        </h2>
        <p className="text-sm leading-6 text-hoopjot-muted">{t('journal.focus.none')}</p>
      </Card>
    );
  }

  const copy = getGuidelineCopy(t, entry.guideline);

  return (
    <Card className="space-y-4" tone="warm">
      <div className="flex flex-wrap gap-2">
        <Chip tone={getCategoryTone(entry.guideline.category)}>
          {t(`game.categories.${entry.guideline.category}`)}
        </Chip>
        <Chip tone="neutral">{t('journal.focus.attached')}</Chip>
      </div>

      <section className="space-y-2">
        <h2 className="flex items-center gap-2 text-lg font-black">
          <Target className="h-5 w-5 text-hoopjot-purple" aria-hidden="true" />
          {t('journal.focus.title')}
        </h2>
        <h3 className="text-2xl font-black leading-tight">{copy.title}</h3>
        <p className="text-sm leading-6 text-hoopjot-muted">{copy.instruction}</p>
      </section>

      <div className="rounded-card border-2 border-dashed border-hoopjot-purple/40 bg-hoopjot-purple/10 p-4">
        <p className="text-lg font-black leading-tight">{copy.cue}</p>
      </div>
    </Card>
  );
}

function CheckInDetail({ entry }: { entry: JournalEntry }) {
  const { t } = useTranslation('common');

  return (
    <Card className="space-y-4">
      <h2 className="text-lg font-black">{t('journal.checkIn.title')}</h2>

      {entry.checkIn ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <DetailMetric
            label={t('sessions.checkIn.energyLabel')}
            value={getOptionalRatingLabel(t, entry.checkIn.energy)}
          />
          <DetailMetric
            label={t('sessions.checkIn.confidenceLabel')}
            value={getOptionalRatingLabel(t, entry.checkIn.confidence)}
          />
          <DetailMetric
            label={t('sessions.checkIn.bodyLabel')}
            value={getOptionalRatingLabel(t, entry.checkIn.physicalFeeling)}
          />
        </div>
      ) : (
        <p className="text-sm leading-6 text-hoopjot-muted">{t('journal.checkIn.none')}</p>
      )}
    </Card>
  );
}

function ReflectionDetail({ entry }: { entry: JournalEntry }) {
  const { t } = useTranslation('common');

  return (
    <Card className="space-y-4">
      <h2 className="text-lg font-black">{t('journal.reflection.title')}</h2>

      {entry.reflection ? (
        <>
          <DetailMetric
            label={t('journal.reflection.focusRating')}
            value={t('journal.ratingValue', { value: entry.reflection.focusRating })}
          />
          <OptionalReflectionText
            label={t('sessions.reflection.noteLabel')}
            value={entry.reflection.note}
          />
          <OptionalReflectionText
            label={t('sessions.reflection.coachFeedbackLabel')}
            value={entry.reflection.coachFeedback}
          />
          <OptionalReflectionText
            label={t('sessions.reflection.rememberLabel')}
            value={entry.reflection.rememberNextTime}
          />
        </>
      ) : (
        <p className="text-sm leading-6 text-hoopjot-muted">{t('journal.reflection.none')}</p>
      )}
    </Card>
  );
}

function BackToJournalLink() {
  const { t } = useTranslation('common');

  return (
    <Link
      className="inline-flex min-h-11 items-center gap-2 rounded-control px-1 text-sm font-black text-hoopjot-ink outline-none hover:text-hoopjot-purple focus-visible:ring-4 focus-visible:ring-hoopjot-blue/30"
      to="/journal"
    >
      <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      {t('journal.actions.back')}
    </Link>
  );
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase text-hoopjot-muted">{label}</p>
      <p className="mt-1 text-sm font-bold leading-6">{value}</p>
    </div>
  );
}

function OptionalReflectionText({
  label,
  value
}: {
  label: string;
  value: string | undefined;
}) {
  if (!value) {
    return null;
  }

  return (
    <section className="space-y-1">
      <h3 className="text-xs font-black uppercase text-hoopjot-muted">{label}</h3>
      <p className="text-sm leading-6">{value}</p>
    </section>
  );
}

function getJournalEntryStatus(
  session: Session,
  hasReflection: boolean,
): {
  descriptionKey: string;
  labelKey: string;
  tone: ChipTone;
} {
  if (hasReflection) {
    return {
      descriptionKey: 'journal.status.reflectedDescription',
      labelKey: 'sessions.status.reflectionSaved',
      tone: 'progress'
    };
  }

  if (session.completedAt) {
    return {
      descriptionKey: 'journal.status.needsReflectionDescription',
      labelKey: 'journal.status.needsReflection',
      tone: 'reflection'
    };
  }

  return {
    descriptionKey: 'journal.status.inProgressDescription',
    labelKey: 'sessions.status.inProgress',
    tone: 'neutral'
  };
}

function getFilterLabel(
  t: ReturnType<typeof useTranslation>['t'],
  filter: JournalFilter,
): string {
  return filter === 'all' ? t('journal.filters.all') : t(`sessions.types.${filter}`);
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

function getOptionalRatingLabel(
  t: ReturnType<typeof useTranslation>['t'],
  value: 1 | 2 | 3 | 4 | 5 | undefined,
): string {
  return value ? t('journal.ratingValue', { value }) : t('journal.notLogged');
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

function getCategoryTone(category: string): ChipTone {
  switch (category) {
    case 'attack':
      return 'attack';
    case 'defense':
      return 'defense';
    case 'transition':
      return 'transition';
    case 'communication':
      return 'reflection';
    case 'decision_making':
      return 'progress';
    default:
      return 'neutral';
  }
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
    month: 'long',
    weekday: 'long',
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
