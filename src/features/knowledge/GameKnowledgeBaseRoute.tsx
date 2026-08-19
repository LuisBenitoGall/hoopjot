import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Filter,
  Target
} from 'lucide-react';
import {
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
  basketballCatalogVersion,
  basketballContentRepository
} from '../../content/basketball';
import type {
  BasketballContentRepository,
  Guideline,
  SkillCategory
} from '../../domain';
import { Card } from '../../components/ui/Card';
import { Chip, type ChipTone } from '../../components/ui/Chip';
import { EmptyState } from '../../components/ui/EmptyState';
import { cx } from '../../lib/classNames';
import { AppShell } from '../../app/shell/AppShell';

const allFilter = 'all';

type CategoryFilter = SkillCategory | typeof allFilter;
type ContentState =
  | { status: 'loading'; guidelines: Guideline[] }
  | { status: 'ready'; guidelines: Guideline[] }
  | { status: 'error'; guidelines: Guideline[] };

interface KnowledgeRouteProps {
  repository?: BasketballContentRepository;
}

interface GuidelineCopy {
  cue: string;
  instruction: string;
  title: string;
}

export function GameKnowledgeBaseRoute({
  repository = basketballContentRepository
}: KnowledgeRouteProps) {
  const { t } = useTranslation(['common', 'content']);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>(allFilter);
  const [selectedSubcategory, setSelectedSubcategory] = useState(allFilter);
  const contentState = useGuidelines(repository);

  const categoryOptions = useMemo(
    () => [allFilter, ...unique(contentState.guidelines.map((guideline) => guideline.category))],
    [contentState.guidelines],
  );

  const subcategoryOptions = useMemo(
    () =>
      [
        allFilter,
        ...unique(
          contentState.guidelines
            .filter((guideline) =>
              selectedCategory === allFilter ? true : guideline.category === selectedCategory,
            )
            .map((guideline) => guideline.subcategory),
        )
      ],
    [contentState.guidelines, selectedCategory],
  );

  const filteredGuidelines = useMemo(
    () =>
      contentState.guidelines.filter(
        (guideline) =>
          (selectedCategory === allFilter || guideline.category === selectedCategory) &&
          (selectedSubcategory === allFilter || guideline.subcategory === selectedSubcategory),
      ),
    [contentState.guidelines, selectedCategory, selectedSubcategory],
  );

  const chooseCategory = (category: CategoryFilter) => {
    setSelectedCategory(category);
    setSelectedSubcategory(allFilter);
  };

  return (
    <AppShell activeItemId="game">
      <div className="space-y-5 pb-3">
        <section className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-hoopnote-purple">{t('game.eyebrow')}</p>
            <Chip tone="neutral">{t('game.catalogVersion', { version: basketballCatalogVersion })}</Chip>
          </div>
          <h1 className="text-3xl font-black leading-tight">{t('game.title')}</h1>
        </section>

        <section aria-label={t('game.categoryFilterLabel')} className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="flex items-center gap-2 text-xs font-black uppercase text-hoopnote-muted">
              <Filter className="h-4 w-4" aria-hidden="true" />
              {t('game.categoryFilterLabel')}
            </legend>
            <div className="flex max-w-full flex-wrap gap-2 pb-1">
              {categoryOptions.map((category) => (
                <button
                  aria-pressed={selectedCategory === category}
                  className={cx(
                    'min-h-10 rounded-control border px-3 text-xs font-black outline-none motion-safe:transition sm:px-4 sm:text-sm',
                    'focus-visible:ring-4 focus-visible:ring-hoopnote-blue/30',
                    selectedCategory === category
                      ? 'border-hoopnote-ink bg-hoopnote-ink text-white'
                      : 'border-hoopnote-line bg-hoopnote-surface text-hoopnote-ink hover:border-hoopnote-purple',
                  )}
                  key={category}
                  onClick={() => chooseCategory(category as CategoryFilter)}
                  type="button"
                >
                  {t(`game.categories.${category}`)}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block space-y-2" htmlFor="game-subcategory">
            <span className="text-xs font-black uppercase text-hoopnote-muted">
              {t('game.subcategoryFilterLabel')}
            </span>
            <select
              className="min-h-12 w-full rounded-card border-2 border-hoopnote-line bg-hoopnote-surface px-4 text-sm font-bold text-hoopnote-ink outline-none focus-visible:ring-4 focus-visible:ring-hoopnote-blue/30"
              id="game-subcategory"
              onChange={(event) => setSelectedSubcategory(event.target.value)}
              value={selectedSubcategory}
            >
              {subcategoryOptions.map((subcategory) => (
                <option key={subcategory} value={subcategory}>
                  {t(`game.subcategories.${subcategory}`)}
                </option>
              ))}
            </select>
          </label>
        </section>

        {contentState.status === 'loading' ? (
          <Card>
            <p className="text-sm font-black">{t('game.loading')}</p>
          </Card>
        ) : null}

        {contentState.status === 'error' ? (
          <EmptyState
            description={t('game.detailNotFoundDescription')}
            icon={<BookOpen className="h-6 w-6" aria-hidden="true" />}
            title={t('game.detailNotFoundTitle')}
          />
        ) : null}

        {contentState.status === 'ready' ? (
          <section aria-live="polite" className="space-y-3">
            <p className="text-sm font-black text-hoopnote-muted">
              {t('game.resultCount', { count: filteredGuidelines.length })}
            </p>

            {filteredGuidelines.length > 0 ? (
              filteredGuidelines.map((guideline) => (
                <GuidelineCard guideline={guideline} key={guideline.id} />
              ))
            ) : (
              <EmptyState
                description={t('game.emptyDescription')}
                icon={<BookOpen className="h-6 w-6" aria-hidden="true" />}
                title={t('game.emptyTitle')}
              />
            )}
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

export function GuidelineDetailRoute({
  repository = basketballContentRepository
}: KnowledgeRouteProps) {
  const { guidelineId } = useParams();
  const { t } = useTranslation(['common', 'content']);
  const [guideline, setGuideline] = useState<Guideline | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let mounted = true;

    setStatus('loading');
    repository
      .getGuidelineById(guidelineId ?? '')
      .then((nextGuideline) => {
        if (!mounted) {
          return;
        }

        setGuideline(nextGuideline);
        setStatus('ready');
      })
      .catch(() => {
        if (mounted) {
          setGuideline(null);
          setStatus('error');
        }
      });

    return () => {
      mounted = false;
    };
  }, [guidelineId, repository]);

  return (
    <AppShell activeItemId="game">
      <div className="space-y-5 pb-3 pt-2">
        <Link
          className="inline-flex min-h-11 items-center gap-2 rounded-control px-1 text-sm font-black text-hoopnote-ink outline-none hover:text-hoopnote-purple focus-visible:ring-4 focus-visible:ring-hoopnote-blue/30"
          to="/game"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          {t('game.backToGame')}
        </Link>

        {status === 'loading' ? (
          <Card>
            <p className="text-sm font-black">{t('game.loading')}</p>
          </Card>
        ) : null}

        {status !== 'loading' && !guideline ? (
          <EmptyState
            description={t('game.detailNotFoundDescription')}
            icon={<BookOpen className="h-6 w-6" aria-hidden="true" />}
            title={t('game.detailNotFoundTitle')}
          />
        ) : null}

        {status === 'ready' && guideline ? <GuidelineDetail guideline={guideline} /> : null}
      </div>
    </AppShell>
  );
}

function GuidelineCard({ guideline }: { guideline: Guideline }) {
  const { t } = useTranslation(['common', 'content']);
  const copy = getGuidelineCopy(t, guideline);

  return (
    <article>
      <Card className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Chip tone={getCategoryTone(guideline.category)}>
            {t(`game.categories.${guideline.category}`)}
          </Chip>
          <Chip tone="neutral">{t(`game.subcategories.${guideline.subcategory}`)}</Chip>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black leading-tight">{copy.title}</h2>
          <p className="text-sm leading-6 text-hoopnote-muted">{copy.instruction}</p>
        </div>

        <div className="rounded-card border-2 border-dashed border-hoopnote-purple/40 bg-hoopnote-purple/10 p-4">
          <p className="text-lg font-black leading-tight">{copy.cue}</p>
        </div>

        <Link
          aria-label={t('game.openGuidelineLabel', { title: copy.title })}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-control bg-hoopnote-orange px-4 text-sm font-black text-hoopnote-ink shadow-control outline-none hover:bg-[#ff8b1f] focus-visible:ring-4 focus-visible:ring-hoopnote-blue/30"
          data-testid={`guideline-link-${guideline.id}`}
          to={`/game/${guideline.id}`}
        >
          {t('game.openGuideline')}
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      </Card>
    </article>
  );
}

function GuidelineDetail({ guideline }: { guideline: Guideline }) {
  const { t } = useTranslation(['common', 'content']);
  const copy = getGuidelineCopy(t, guideline);

  return (
    <>
      <section className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Chip tone={getCategoryTone(guideline.category)}>
            {t(`game.categories.${guideline.category}`)}
          </Chip>
          <Chip tone="neutral">{t(`game.subcategories.${guideline.subcategory}`)}</Chip>
        </div>
        <h1 className="text-3xl font-black leading-tight">{copy.title}</h1>
      </section>

      <Card className="space-y-5">
        <section className="space-y-2">
          <h2 className="text-sm font-black uppercase text-hoopnote-muted">
            {t('game.instructionLabel')}
          </h2>
          <p className="text-base leading-7">{copy.instruction}</p>
        </section>

        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase text-hoopnote-muted">
            <Target className="h-4 w-4" aria-hidden="true" />
            {t('game.cueLabel')}
          </h2>
          <div className="rounded-card border-2 border-dashed border-hoopnote-purple/40 bg-hoopnote-purple/10 p-4">
            <p className="text-xl font-black leading-tight">{copy.cue}</p>
          </div>
        </section>
      </Card>

      <Card aria-label={t('game.metadataLabel')} className="grid gap-4 sm:grid-cols-2">
        <MetadataItem label={t('game.levelLabel')} value={t(`game.levels.${guideline.level}`)} />
        <MetadataItem
          label={t('game.contextLabel')}
          value={guideline.contexts.map((context) => t(`game.contexts.${context}`)).join(', ')}
        />
        <MetadataItem
          label={t('game.positionsLabel')}
          value={getPositionsLabel(t, guideline.positions)}
        />
        <MetadataItem
          label={t('game.subcategoryFilterLabel')}
          value={t(`game.subcategories.${guideline.subcategory}`)}
        />
      </Card>
    </>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase text-hoopnote-muted">{label}</p>
      <p className="mt-1 text-sm font-bold leading-6">{value}</p>
    </div>
  );
}

function useGuidelines(repository: BasketballContentRepository): ContentState {
  const [state, setState] = useState<ContentState>({
    status: 'loading',
    guidelines: []
  });

  useEffect(() => {
    let mounted = true;

    repository
      .listGuidelines()
      .then((guidelines) => {
        if (mounted) {
          setState({
            status: 'ready',
            guidelines: guidelines.filter((guideline) => guideline.active)
          });
        }
      })
      .catch(() => {
        if (mounted) {
          setState({ status: 'error', guidelines: [] });
        }
      });

    return () => {
      mounted = false;
    };
  }, [repository]);

  return state;
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

function getPositionsLabel(
  t: ReturnType<typeof useTranslation>['t'],
  positions: Guideline['positions'],
): string {
  if (positions[0] === 'all') {
    return t('game.positions.all');
  }

  return positions.map((position) => t(`onboarding.positions.${position}`)).join(', ');
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

function unique<T extends string>(values: T[]): T[] {
  return values.filter((value, index) => values.indexOf(value) === index);
}
