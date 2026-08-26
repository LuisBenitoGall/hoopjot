import {
  BookOpen,
  RotateCcw
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  Link,
  useParams
} from 'react-router-dom';

import {
  JournalService,
  type JournalEntry,
  type JournalServicePort,
  type JournalTimeline
} from '../../application/journal';
import { AppShell } from '../../app/shell/AppShell';
import { useAuth } from '../../app/providers/authContext';
import { useLocalRepositories } from '../../app/providers/localRepositoriesContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { basketballContentRepository } from '../../content/basketball';
import type {
  Guideline
} from '../../domain';

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
  title: string;
}

const listNoteClampStyle: CSSProperties = {
  display: '-webkit-box',
  overflow: 'hidden',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 2
};

export function JournalRoute({ service: injectedService }: JournalRouteProps) {
  const { state: authState } = useAuth();
  const repositories = useLocalRepositories();
  const { i18n, t } = useTranslation(['common', 'content']);
  const locale = getFormatterLocale(i18n.resolvedLanguage);
  const userId = authState.status === 'authenticated' ? authState.user.id : null;
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
        timeline: await service.listTimeline(userId)
      });
    } catch {
      setTimelineState({ status: 'error', timeline: null });
    }
  }, [service, userId]);

  useEffect(() => {
    void loadTimeline();
  }, [loadTimeline]);

  return (
    <AppShell activeItemId="journal">
      <div className="space-y-5 pb-3">
        <section className="space-y-3 pt-2">
          <h1 className="text-3xl font-black leading-tight">{t('journal.title')}</h1>
          <p className="text-sm leading-6 text-hoopjot-muted">{t('journal.intro')}</p>
        </section>

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

function JournalTimelineContent({
  locale,
  timeline
}: {
  locale: string;
  timeline: JournalTimeline;
}) {
  const { t } = useTranslation(['common', 'content']);
  const entries = getChronologicalEntries(timeline);

  if (entries.length === 0) {
    return (
      <Card className="text-center">
        <h2 className="text-lg font-black">{t('journal.empty.title')}</h2>
      </Card>
    );
  }

  return (
    <section aria-label={t('journal.entriesLabel')} aria-live="polite" className="space-y-3">
      {entries.map((entry) => (
        <JournalSessionCard entry={entry} key={entry.session.id} locale={locale} />
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
  const guidelineCopy = entry.guideline ? getGuidelineCopy(t, entry.guideline) : null;
  const dateLabel = formatLocalDateLabel(entry.localDate, locale);

  return (
    <article>
      <Link
        aria-label={t('journal.openDetailLabel', {
          date: dateLabel,
          type: typeLabel
        })}
        className="block rounded-card border-2 border-hoopjot-line bg-hoopjot-surface p-4 text-hoopjot-ink shadow-card outline-none hover:border-hoopjot-purple focus-visible:ring-4 focus-visible:ring-hoopjot-blue/30"
        to={`/journal/${entry.session.id}`}
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-black uppercase text-hoopjot-muted">
            <p>{dateLabel}</p>
            <p>{typeLabel}</p>
          </div>

          {guidelineCopy ? (
            <h2 className="text-lg font-black leading-tight">{guidelineCopy.title}</h2>
          ) : null}

          {entry.reflection ? (
            <p className="text-sm font-black text-hoopjot-ink">
              {t('journal.ratingValue', { value: entry.reflection.focusRating })}
            </p>
          ) : null}

          {entry.reflection?.note ? (
            <p className="text-sm leading-6 text-hoopjot-muted" style={listNoteClampStyle}>
              {entry.reflection.note}
            </p>
          ) : null}
        </div>
      </Link>
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
  const guidelineCopy = entry.guideline ? getGuidelineCopy(t, entry.guideline) : null;

  return (
    <article className="space-y-4">
      <Card className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-black uppercase text-hoopjot-muted">
          <p>{formatLocalDateLabel(entry.localDate, locale)}</p>
          <p>{typeLabel}</p>
        </div>

        {guidelineCopy ? (
          <>
            <h1 className="text-3xl font-black leading-tight">{guidelineCopy.title}</h1>
            <p className="rounded-card border-2 border-hoopjot-line bg-hoopjot-bg px-4 py-3 text-lg font-black leading-tight">
              {guidelineCopy.cue}
            </p>
          </>
        ) : null}
      </Card>

      {entry.reflection ? (
        <Card className="space-y-4">
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
        </Card>
      ) : null}
    </article>
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

function getChronologicalEntries(timeline: JournalTimeline): JournalEntry[] {
  return timeline.groups.flatMap((group) => group.entries);
}

function getGuidelineCopy(
  t: ReturnType<typeof useTranslation>['t'],
  guideline: Guideline,
): GuidelineCopy {
  return {
    cue: t(`${guideline.translationKey}.cue`, { ns: 'content' }),
    title: t(`${guideline.translationKey}.title`, { ns: 'content' })
  };
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
