import { ArrowLeft, BookOpen, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { GuideService, type GuideServicePort } from '../../application/guide';
import { AppShell } from '../../app/shell/AppShell';
import { useAuth } from '../../app/providers/authContext';
import { useLocalRepositories } from '../../app/providers/localRepositoriesContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import type { ResolvedGuide, ResolvedGuideChapter, ResolvedGuidePoint } from '../../content/guide';
import { GuideMarkdown } from './GuideMarkdown';

interface GuideRouteProps {
  service?: GuideServicePort;
}

type GuideRouteState =
  | { status: 'error' | 'loading' | 'missing_primary_position' }
  | { guide: ResolvedGuide; status: 'ready' };

export function GuideRoute({ service: injectedService }: GuideRouteProps) {
  const { i18n, t } = useTranslation('common');
  const authState = useAuth().state;
  const repositories = useLocalRepositories();
  const service = useMemo(
    () => injectedService ?? new GuideService({ profileRepository: repositories.profiles }),
    [injectedService, repositories],
  );
  const [routeState, setRouteState] = useState<GuideRouteState>({ status: 'loading' });

  const loadGuide = useCallback(async () => {
    if (authState.status !== 'authenticated') {
      return;
    }

    setRouteState({ status: 'loading' });

    try {
      const result = await service.getGuideForPlayer({
        locale: i18n.resolvedLanguage,
        userId: authState.user.id,
      });

      setRouteState(result);
    } catch {
      setRouteState({ status: 'error' });
    }
  }, [authState, i18n.resolvedLanguage, service]);

  useEffect(() => {
    void loadGuide();
  }, [loadGuide]);

  return (
    <AppShell activeItemId="plan" contentWidth="readable">
      <div className="mx-auto max-w-[900px] pb-3 pt-2">
        {routeState.status === 'loading' ? (
          <Card>
            <p className="text-sm font-black">{t('guide.loading')}</p>
          </Card>
        ) : null}

        {routeState.status === 'error' ? (
          <EmptyState
            action={
              <Button
                icon={<RotateCcw className="h-5 w-5" aria-hidden="true" />}
                onClick={() => {
                  void loadGuide();
                }}
                size="sm"
              >
                {t('guide.errors.retry')}
              </Button>
            }
            description={t('guide.errors.loadDescription')}
            icon={<BookOpen className="h-6 w-6" aria-hidden="true" />}
            title={t('guide.errors.loadTitle')}
          />
        ) : null}

        {routeState.status === 'missing_primary_position' ? (
          <EmptyState
            action={
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-control border-2 border-hoopjot-ink bg-hoopjot-surface px-4 py-2 text-sm font-bold leading-none text-hoopjot-ink outline-none hover:bg-hoopjot-ink hover:text-white focus-visible:ring-4 focus-visible:ring-hoopjot-blue/30"
                to="/profile"
              >
                {t('guide.profileIncomplete.action')}
              </Link>
            }
            description={t('guide.profileIncomplete.description')}
            icon={<BookOpen className="h-6 w-6" aria-hidden="true" />}
            title={t('guide.profileIncomplete.title')}
          />
        ) : null}

        {routeState.status === 'ready' ? <GuideArticle guide={routeState.guide} /> : null}
      </div>
    </AppShell>
  );
}

function GuideArticle({ guide }: { guide: ResolvedGuide }) {
  const { t } = useTranslation('common');
  const pointsById = useMemo(
    () => new Map(guide.points.map((point) => [point.id, point])),
    [guide.points],
  );

  return (
    <article className="space-y-8">
      <header className="space-y-4">
        <Link
          className="inline-flex min-h-11 items-center gap-2 rounded-control px-1 text-sm font-black text-hoopjot-ink outline-none hover:text-hoopjot-purple focus-visible:ring-4 focus-visible:ring-hoopjot-blue/30"
          to="/plan"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          {t('guide.backToPlan')}
        </Link>
        <div className="space-y-3">
          <p className="text-sm font-bold text-hoopjot-purple">{t('guide.eyebrow')}</p>
          <h1 className="text-4xl font-black leading-none sm:text-5xl">{guide.title}</h1>
          <p className="max-w-3xl text-base leading-7 text-hoopjot-muted sm:text-lg">
            {guide.subtitle}
          </p>
        </div>
      </header>

      <nav
        aria-label={t('guide.contents')}
        className="rounded-card border border-hoopjot-line bg-hoopjot-surface p-4"
      >
        <h2 className="text-sm font-black uppercase text-hoopjot-muted">{t('guide.contents')}</h2>
        <ol className="mt-3 grid gap-2 sm:grid-cols-2">
          {guide.chapters.map((chapter) => (
            <li key={chapter.id}>
              <a
                className="inline-flex min-h-10 items-center rounded-control px-2 text-sm font-black text-hoopjot-ink outline-none hover:bg-hoopjot-ink/8 focus-visible:ring-4 focus-visible:ring-hoopjot-blue/30"
                href={`#${getChapterAnchorId(chapter)}`}
              >
                {chapter.number.toString().padStart(2, '0')} {chapter.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <GuideMarkdownSection
        content={guide.introduction.content}
        title={guide.introduction.title}
      />

      <div className="space-y-10">
        {guide.chapters.map((chapter) => (
          <GuideChapter
            chapter={chapter}
            key={chapter.id}
            points={chapter.pointIds
              .map((pointId) => pointsById.get(pointId))
              .filter((point): point is ResolvedGuidePoint => Boolean(point))}
          />
        ))}
      </div>

      <section className="space-y-4 border-t-2 border-hoopjot-ink/20 pt-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-black leading-tight">{t('guide.rulesTitle')}</h2>
          <p className="text-sm leading-6 text-hoopjot-muted sm:text-base sm:leading-7">
            {guide.rulesIntro}
          </p>
        </div>
        <ol className="grid gap-3 sm:grid-cols-2">
          {guide.rules.map((rule) => (
            <li
              className="rounded-card border border-hoopjot-line bg-hoopjot-surface px-4 py-3 text-sm font-black leading-6"
              key={rule.id}
            >
              <span className="mr-2 text-hoopjot-muted">
                {rule.number.toString().padStart(2, '0')}
              </span>
              {rule.title}
            </li>
          ))}
        </ol>
      </section>

      <GuideMarkdownSection content={guide.closing.content} title={guide.closing.title} />
    </article>
  );
}

function GuideChapter({
  chapter,
  points,
}: {
  chapter: ResolvedGuideChapter;
  points: ResolvedGuidePoint[];
}) {
  return (
    <section
      className="space-y-5 border-t-2 border-hoopjot-ink/20 pt-6"
      data-testid="guide-chapter"
      id={getChapterAnchorId(chapter)}
    >
      <div className="space-y-1">
        <p className="text-xs font-black text-hoopjot-muted">
          {chapter.number.toString().padStart(2, '0')}
        </p>
        <h2 className="text-2xl font-black leading-tight sm:text-3xl">{chapter.title}</h2>
      </div>

      <div className="space-y-6">
        {points.map((point) => (
          <section className="space-y-3" data-testid="guide-point" key={point.id}>
            <h3 className="text-xl font-black leading-tight">
              <span className="mr-2 text-hoopjot-muted">
                {point.number.toString().padStart(2, '0')}
              </span>
              {point.title}
            </h3>
            <GuideMarkdown content={point.content} />
          </section>
        ))}
      </div>
    </section>
  );
}

function GuideMarkdownSection({ content, title }: { content: string; title: string }) {
  return (
    <section className="space-y-4 border-t-2 border-hoopjot-ink/20 pt-6">
      <h2 className="text-2xl font-black leading-tight">{title}</h2>
      <GuideMarkdown content={content} />
    </section>
  );
}

function getChapterAnchorId(chapter: ResolvedGuideChapter): string {
  return `guide-${chapter.id}`;
}
