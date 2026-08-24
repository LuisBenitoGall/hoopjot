import { ArrowLeft, ArrowRight, BookOpen, Target } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import type { TFunction } from 'i18next';

import { AppShell } from '../../app/shell/AppShell';
import { useAuth } from '../../app/providers/authContext';
import { useLocalRepositories } from '../../app/providers/localRepositoriesContext';
import { Card } from '../../components/ui/Card';
import { Chip, type ChipTone } from '../../components/ui/Chip';
import { EmptyState } from '../../components/ui/EmptyState';
import { basketballContentRepository } from '../../content/basketball';
import {
  getPlanContent,
  type PlanClosingContent,
  type PlanHeroContent,
  type PlanHowItWorksStepContent,
  type PlanLocaleContent,
  type PlanSectionContent,
  type PlanSubBlockContent,
} from '../../content/plan';
import type {
  BasketballContentRepository,
  DailyFocus,
  Guideline,
  PlayerGoal,
  PlayerProfile,
} from '../../domain';
import { type SupportedLocale } from '../../i18n/locales';
import { cx } from '../../lib/classNames';

interface PlanRouteProps {
  contentRepository?: BasketballContentRepository;
  getLocalDate?: () => string;
}

interface PlanSnapshotState {
  activeGoals: PlayerGoal[];
  currentFocus: DailyFocus | null;
  profile: PlayerProfile | null;
}

type GuidelineDetailState =
  | { guideline: null; status: 'loading' }
  | { guideline: Guideline; status: 'ready' }
  | { guideline: null; status: 'error' | 'not_found' };

interface GuidelineCopy {
  cue: string;
  instruction: string;
  title: string;
}

interface ProfileFact {
  label: string;
  value: string;
}

const emptyPlanSnapshotState: PlanSnapshotState = {
  activeGoals: [],
  currentFocus: null,
  profile: null,
};

export function PlanRoute({
  contentRepository = basketballContentRepository,
  getLocalDate,
}: PlanRouteProps) {
  const { guidelineId } = useParams();
  const { i18n } = useTranslation('common');
  const authState = useAuth().state;
  const repositories = useLocalRepositories();
  const locale = getSupportedLocale(i18n.resolvedLanguage);
  const content = getPlanContent(locale);
  const resolveLocalDate = useMemo(
    () => getLocalDate ?? (() => formatLocalDate(new Date())),
    [getLocalDate],
  );
  const snapshotState = usePlanSnapshotState({
    getLocalDate: resolveLocalDate,
    repositories,
    userId: authState.status === 'authenticated' ? authState.user.id : null,
  });
  const guidelineMap = useGuidelineMap(contentRepository);
  const guidelineDetailState = useGuidelineDetail(guidelineId, contentRepository);

  if (guidelineId) {
    return <PlanGuidelineDetailRoute guidelineState={guidelineDetailState} />;
  }

  return (
    <AppShell activeItemId="plan" contentWidth="readable">
      <article className="mx-auto max-w-[900px] space-y-8 pb-3">
        <PlanHero alias={snapshotState.profile?.alias} content={content.hero} />
        <ProfileSnapshot
          activeGoals={snapshotState.activeGoals}
          content={content.profileSnapshot}
          profile={snapshotState.profile}
        />
        <HowHoopjotWorks steps={content.howHoopjotWorks.steps} />
        <DevelopmentMap
          currentGuidelineId={snapshotState.currentFocus?.guidelineId ?? null}
          guidelineMap={guidelineMap}
          sections={content.developmentMap.sections}
        />
        <PlanClosingNote content={content.closing} />
      </article>
    </AppShell>
  );
}

export function PlanHero({ alias, content }: { alias?: string; content: PlanHeroContent }) {
  const aliasSuffix = alias ? `, ${alias}` : '';
  const body = content.bodyTemplate.replace('{{aliasSuffix}}', aliasSuffix);

  return (
    <section className="space-y-4 pt-2">
      <h1 className="text-4xl font-black leading-none sm:text-5xl">{content.title}</h1>
      <p className="max-w-3xl text-base leading-7 text-hoopjot-muted sm:text-lg">{body}</p>
    </section>
  );
}

export function ProfileSnapshot({
  activeGoals,
  content,
  profile,
}: {
  activeGoals: PlayerGoal[];
  content: PlanLocaleContent['profileSnapshot'];
  profile: PlayerProfile | null;
}) {
  const { t } = useTranslation('common');
  const facts = getProfileFacts(t, profile);
  const activeGoalLabels = activeGoals.map((goal) => getGoalLabel(t, goal));

  return (
    <section className="space-y-4 border-y border-hoopjot-line py-5">
      <h2 className="text-2xl font-black leading-tight">{content.title}</h2>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {facts.map((fact) => (
          <div className="border-b border-hoopjot-line/80 pb-3" key={fact.label}>
            <dt className="text-xs font-black uppercase text-hoopjot-muted">{fact.label}</dt>
            <dd className="mt-1 text-sm font-bold leading-6">{fact.value}</dd>
          </div>
        ))}
        {activeGoalLabels.length > 0 ? (
          <div className="border-b border-hoopjot-line/80 pb-3 sm:col-span-2">
            <dt className="text-xs font-black uppercase text-hoopjot-muted">
              {t('plan.profileSnapshot.fields.activeGoals')}
            </dt>
            <dd className="mt-2">
              <ul className="flex flex-wrap gap-2">
                {activeGoalLabels.map((goalLabel) => (
                  <li
                    className="rounded-control border border-hoopjot-line bg-hoopjot-surface px-3 py-2 text-sm font-bold"
                    key={goalLabel}
                  >
                    {goalLabel}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}

export function HowHoopjotWorks({ steps }: { steps: PlanHowItWorksStepContent[] }) {
  const { t } = useTranslation('common');

  return (
    <section aria-label={t('plan.howHoopjotWorksLabel')}>
      <ol className="grid gap-4 sm:grid-cols-4">
        {steps.map((step, index) => (
          <li className="border-t-2 border-hoopjot-ink/20 pt-3" key={step.title}>
            <p className="text-xs font-black text-hoopjot-orange">
              {String(index + 1).padStart(2, '0')}
            </p>
            <h2 className="mt-2 text-lg font-black leading-tight">{step.title}</h2>
            <p className="mt-2 text-sm leading-6 text-hoopjot-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function DevelopmentMap({
  currentGuidelineId,
  guidelineMap,
  sections,
}: {
  currentGuidelineId: string | null;
  guidelineMap: Map<string, Guideline>;
  sections: PlanSectionContent[];
}) {
  const { t } = useTranslation('common');
  const { hasEntered, mapRef, prefersReducedMotion } = usePlanMapMotion();
  const isVisible = hasEntered || prefersReducedMotion;

  return (
    <section
      aria-label={t('plan.developmentMapLabel')}
      className="plan-development-map relative space-y-8"
      data-in-view={isVisible ? 'true' : 'false'}
      data-reduced-motion={prefersReducedMotion ? 'true' : 'false'}
      data-testid="development-map"
      ref={mapRef}
    >
      <div
        aria-hidden="true"
        className="plan-development-line absolute bottom-0 left-0 top-2 w-0.5 rounded-full bg-hoopjot-ink/15"
      />
      <div className="space-y-8 pl-6">
        {sections.map((section, index) => (
          <DevelopmentSection
            currentGuidelineId={currentGuidelineId}
            guidelineMap={guidelineMap}
            index={index}
            isVisible={isVisible}
            key={section.id}
            prefersReducedMotion={prefersReducedMotion}
            section={section}
          />
        ))}
      </div>
    </section>
  );
}

export function DevelopmentSection({
  currentGuidelineId,
  guidelineMap,
  index,
  isVisible,
  prefersReducedMotion,
  section,
}: {
  currentGuidelineId: string | null;
  guidelineMap: Map<string, Guideline>;
  index: number;
  isVisible: boolean;
  prefersReducedMotion: boolean;
  section: PlanSectionContent;
}) {
  const accentClassName = getSectionAccentClassName(section.id);

  return (
    <article
      className="plan-section-reveal relative space-y-4"
      data-testid={`plan-section-${section.number}`}
      style={getSectionRevealStyle(index, isVisible, prefersReducedMotion)}
    >
      <div className="space-y-2">
        <p className={cx('text-xs font-black', accentClassName)}>{section.number}</p>
        <h2 className="text-2xl font-black leading-tight sm:text-3xl">{section.title}</h2>
        <p className="max-w-3xl text-sm leading-6 text-hoopjot-muted sm:text-base sm:leading-7">
          {section.intro}
        </p>
      </div>

      <div className="space-y-5">
        {section.subBlocks.map((subBlock) => (
          <DevelopmentSubBlock
            currentGuidelineId={currentGuidelineId}
            guidelineMap={guidelineMap}
            key={subBlock.id}
            subBlock={subBlock}
          />
        ))}
      </div>
    </article>
  );
}

export function PlanClosingNote({ content }: { content: PlanClosingContent }) {
  return (
    <section className="space-y-3 border-t-2 border-hoopjot-ink/20 pt-5">
      <h2 className="text-2xl font-black leading-tight">{content.title}</h2>
      <p className="max-w-3xl text-base leading-7 text-hoopjot-muted">{content.body}</p>
    </section>
  );
}

function DevelopmentSubBlock({
  currentGuidelineId,
  guidelineMap,
  subBlock,
}: {
  currentGuidelineId: string | null;
  guidelineMap: Map<string, Guideline>;
  subBlock: PlanSubBlockContent;
}) {
  const { t } = useTranslation(['common', 'content']);
  const isCurrentFocus =
    currentGuidelineId !== null && subBlock.guidelineIds.includes(currentGuidelineId);
  const linkedGuidelines = subBlock.guidelineIds
    .map((guidelineId) => guidelineMap.get(guidelineId))
    .filter((guideline): guideline is Guideline => Boolean(guideline));

  return (
    <section className="space-y-3 border-l-2 border-hoopjot-line pl-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-black leading-tight">{subBlock.title}</h3>
        {isCurrentFocus ? (
          <span className="inline-flex min-h-7 items-center rounded-control border border-hoopjot-orange bg-hoopjot-orange/12 px-2.5 text-[0.7rem] font-black leading-none text-hoopjot-ink">
            {t('plan.todayChip')}
          </span>
        ) : null}
      </div>

      {subBlock.coreIdea ? (
        <p className="text-sm leading-6">
          <strong>{t('plan.coreIdeaLabel')}</strong> {subBlock.coreIdea}
        </p>
      ) : null}

      <ul className="space-y-2 text-sm leading-6 text-hoopjot-muted">
        {subBlock.principles.map((principle) => (
          <li className="flex gap-2" key={principle}>
            <span
              aria-hidden="true"
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-hoopjot-ink/40"
            />
            <span>{principle}</span>
          </li>
        ))}
      </ul>

      {subBlock.cue ? (
        <p className="text-sm font-black leading-6 text-hoopjot-ink">{subBlock.cue}</p>
      ) : null}

      {linkedGuidelines.length > 0 ? (
        <ul aria-label={t('plan.guidelineLinksLabel')} className="space-y-2 pt-1">
          {linkedGuidelines.map((guideline) => {
            const copy = getGuidelineCopy(t, guideline);

            return (
              <li key={guideline.id}>
                <Link
                  className="inline-flex min-h-11 w-full items-center justify-between gap-3 rounded-card border border-hoopjot-line bg-hoopjot-surface px-3 py-2 text-sm font-black text-hoopjot-ink outline-none hover:border-hoopjot-purple focus-visible:ring-4 focus-visible:ring-hoopjot-blue/30"
                  to={`/plan/${guideline.id}`}
                >
                  <span>{copy.title}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

function PlanGuidelineDetailRoute({ guidelineState }: { guidelineState: GuidelineDetailState }) {
  const { t } = useTranslation('common');

  return (
    <AppShell activeItemId="plan" contentWidth="readable">
      <article className="mx-auto max-w-[900px] space-y-5 pb-3 pt-2">
        <Link
          className="inline-flex min-h-11 items-center gap-2 rounded-control px-1 text-sm font-black text-hoopjot-ink outline-none hover:text-hoopjot-purple focus-visible:ring-4 focus-visible:ring-hoopjot-blue/30"
          to="/plan"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          {t('plan.guideline.backToPlan')}
        </Link>

        {guidelineState.status === 'loading' ? (
          <Card>
            <p className="text-sm font-black">{t('plan.guideline.loading')}</p>
          </Card>
        ) : null}

        {guidelineState.status !== 'loading' && !guidelineState.guideline ? (
          <EmptyState
            description={t('plan.guideline.notFoundDescription')}
            icon={<BookOpen className="h-6 w-6" aria-hidden="true" />}
            title={t('plan.guideline.notFoundTitle')}
          />
        ) : null}

        {guidelineState.status === 'ready' ? (
          <PlanGuidelineDetail guideline={guidelineState.guideline} />
        ) : null}
      </article>
    </AppShell>
  );
}

function PlanGuidelineDetail({ guideline }: { guideline: Guideline }) {
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
        <h1 className="text-3xl font-black leading-tight sm:text-4xl">{copy.title}</h1>
      </section>

      <section className="space-y-5 border-y border-hoopjot-line py-5">
        <section className="space-y-2">
          <h2 className="text-sm font-black uppercase text-hoopjot-muted">
            {t('game.instructionLabel')}
          </h2>
          <p className="max-w-3xl text-base leading-7">{copy.instruction}</p>
        </section>

        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase text-hoopjot-muted">
            <Target className="h-4 w-4" aria-hidden="true" />
            {t('game.cueLabel')}
          </h2>
          <div className="rounded-card border-2 border-dashed border-hoopjot-purple/40 bg-hoopjot-purple/10 p-4">
            <p className="text-xl font-black leading-tight">{copy.cue}</p>
          </div>
        </section>
      </section>

      <dl
        aria-label={t('game.metadataLabel')}
        className="grid gap-x-6 gap-y-3 border-b border-hoopjot-line pb-5 sm:grid-cols-2"
      >
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
      </dl>
    </>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase text-hoopjot-muted">{label}</dt>
      <dd className="mt-1 text-sm font-bold leading-6">{value}</dd>
    </div>
  );
}

function usePlanSnapshotState({
  getLocalDate,
  repositories,
  userId,
}: {
  getLocalDate: () => string;
  repositories: ReturnType<typeof useLocalRepositories>;
  userId: string | null;
}): PlanSnapshotState {
  const [state, setState] = useState<PlanSnapshotState>(emptyPlanSnapshotState);

  useEffect(() => {
    if (!userId) {
      setState(emptyPlanSnapshotState);
      return undefined;
    }

    let mounted = true;

    Promise.all([
      repositories.profiles.getByUserId(userId),
      repositories.playerGoals.listByUserId(userId),
      repositories.dailyFocus.getByLocalDate(userId, getLocalDate()),
    ])
      .then(([profile, goals, currentFocus]) => {
        if (!mounted) {
          return;
        }

        setState({
          activeGoals: goals
            .filter((goal) => goal.active)
            .sort((left, right) => left.priority - right.priority)
            .slice(0, 3),
          currentFocus,
          profile,
        });
      })
      .catch(() => {
        if (mounted) {
          setState(emptyPlanSnapshotState);
        }
      });

    return () => {
      mounted = false;
    };
  }, [getLocalDate, repositories, userId]);

  return state;
}

function useGuidelineMap(repository: BasketballContentRepository): Map<string, Guideline> {
  const [guidelineMap, setGuidelineMap] = useState<Map<string, Guideline>>(new Map());

  useEffect(() => {
    let mounted = true;

    repository
      .listGuidelines()
      .then((guidelines) => {
        if (!mounted) {
          return;
        }

        setGuidelineMap(
          new Map(
            guidelines
              .filter((guideline) => guideline.active)
              .map((guideline) => [guideline.id, guideline]),
          ),
        );
      })
      .catch(() => {
        if (mounted) {
          setGuidelineMap(new Map());
        }
      });

    return () => {
      mounted = false;
    };
  }, [repository]);

  return guidelineMap;
}

function useGuidelineDetail(
  guidelineId: string | undefined,
  repository: BasketballContentRepository,
): GuidelineDetailState {
  const [state, setState] = useState<GuidelineDetailState>({
    guideline: null,
    status: 'loading',
  });

  useEffect(() => {
    if (!guidelineId) {
      return undefined;
    }

    let mounted = true;
    setState({ guideline: null, status: 'loading' });

    repository
      .getGuidelineById(guidelineId)
      .then((guideline) => {
        if (!mounted) {
          return;
        }

        setState(
          guideline ? { guideline, status: 'ready' } : { guideline: null, status: 'not_found' },
        );
      })
      .catch(() => {
        if (mounted) {
          setState({ guideline: null, status: 'error' });
        }
      });

    return () => {
      mounted = false;
    };
  }, [guidelineId, repository]);

  return state;
}

function usePlanMapMotion() {
  const mapRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [hasEntered, setHasEntered] = useState(() => getPrefersReducedMotion());

  useEffect(() => {
    if (prefersReducedMotion) {
      setHasEntered(true);
      return undefined;
    }

    const element = mapRef.current;

    if (!element || typeof IntersectionObserver === 'undefined') {
      setHasEntered(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }

        setHasEntered(true);
        observer.disconnect();
      },
      { threshold: 0.18 },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [prefersReducedMotion]);

  return { hasEntered, mapRef, prefersReducedMotion };
}

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(getPrefersReducedMotion);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);

    handleChange();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);

      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }

    mediaQuery.addListener(handleChange);

    return () => {
      mediaQuery.removeListener(handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

function getPrefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function getSectionRevealStyle(
  index: number,
  isVisible: boolean,
  prefersReducedMotion: boolean,
): CSSProperties {
  if (!isVisible || prefersReducedMotion) {
    return { transitionDelay: '0ms' };
  }

  return { transitionDelay: `${index * 60}ms` };
}

function getProfileFacts(t: TFunction<'common'>, profile: PlayerProfile | null): ProfileFact[] {
  if (!profile) {
    return [];
  }

  const facts: ProfileFact[] = [
    {
      label: t('plan.profileSnapshot.fields.primaryPosition'),
      value: t(`onboarding.positions.${profile.primaryPosition}`),
    },
    {
      label: t('plan.profileSnapshot.fields.competitiveLevel'),
      value: t(`onboarding.competitiveLevels.${profile.competitiveLevel}`),
    },
  ];

  if (profile.secondaryPosition) {
    facts.splice(1, 0, {
      label: t('plan.profileSnapshot.fields.secondaryPosition'),
      value: t(`onboarding.positions.${profile.secondaryPosition}`),
    });
  }

  if (profile.heightCm) {
    facts.splice(profile.secondaryPosition ? 2 : 1, 0, {
      label: t('plan.profileSnapshot.fields.heightCm'),
      value: t('plan.profileSnapshot.heightValue', { value: profile.heightCm }),
    });
  }

  return facts;
}

function getGoalLabel(t: TFunction<'common'>, goal: PlayerGoal): string {
  if (goal.goalType === 'custom') {
    return goal.customLabel ?? goal.goalType;
  }

  return t(`onboarding.goals.${goal.goalType}`, { defaultValue: goal.goalType });
}

function getGuidelineCopy(t: TFunction, guideline: Guideline): GuidelineCopy {
  return {
    cue: t(`${guideline.translationKey}.cue`, { ns: 'content' }),
    instruction: t(`${guideline.translationKey}.instruction`, { ns: 'content' }),
    title: t(`${guideline.translationKey}.title`, { ns: 'content' }),
  };
}

function getPositionsLabel(t: TFunction<'common'>, positions: Guideline['positions']): string {
  if (positions[0] === 'all') {
    return t('game.positions.all');
  }

  return positions.map((position) => t(`onboarding.positions.${position}`)).join(', ');
}

function getSupportedLocale(locale: string | undefined): SupportedLocale {
  return locale?.startsWith('es') ? 'es' : 'en';
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
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

function getSectionAccentClassName(sectionId: string): string {
  switch (sectionId) {
    case 'attack':
      return 'text-hoopjot-orange';
    case 'defense':
      return 'text-hoopjot-purple';
    case 'transition':
      return 'text-hoopjot-blue';
    case 'communication-decisions':
      return 'text-hoopjot-ink';
    default:
      return 'text-hoopjot-success';
  }
}
