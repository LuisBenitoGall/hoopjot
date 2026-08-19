import { ArrowLeft, ArrowRight, Check, LogOut } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode
} from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import {
  OnboardingCompletionError,
  OnboardingService,
  onboardingSteps
} from '../../application/onboarding';
import { useAuth } from '../../app/providers/authContext';
import { useLocalRepositories } from '../../app/providers/localRepositoriesContext';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { RatingControl } from '../../components/ui/RatingControl';
import {
  calculateAgeFromBirthYear,
  MAX_ACTIVE_GOALS,
  MINIMUM_PLAYER_AGE,
  type CompetitiveLevel,
  type DominantHand,
  type GoalType,
  type OnboardingDraft,
  type OnboardingStep,
  type PhysicalContext,
  type PlayerPosition,
  type SelfAssessment
} from '../../domain';
import { cx } from '../../lib/classNames';
import { isSupportedLocale, supportedLocales, type SupportedLocale } from '../../i18n/locales';

const positions: PlayerPosition[] = [
  'point_guard',
  'shooting_guard',
  'small_forward',
  'power_forward',
  'center'
];

const competitiveLevels: CompetitiveLevel[] = [
  'recreational',
  'club',
  'academy',
  'high_school',
  'college',
  'semi_pro',
  'professional',
  'other'
];

const dominantHands: DominantHand[] = ['right', 'left', 'both', 'prefer_not_to_say'];

const goalOptions: GoalType[] = [
  'fundamentals',
  'game_understanding',
  'defense',
  'rebounding',
  'finishing',
  'decision_making',
  'confidence',
  'rebuild_game_confidence'
];

const assessmentAreas = [
  'ballHandling',
  'shooting',
  'defense',
  'decisionMaking',
  'confidence'
] as const satisfies readonly (keyof SelfAssessment)[];

const physicalStatuses: PhysicalContext['status'][] = [
  'none',
  'recovering',
  'limited',
  'prefer_not_to_say'
];

type OnboardingDraftPatch =
  | Partial<OnboardingDraft>
  | ((currentDraft: OnboardingDraft) => Partial<OnboardingDraft>);

export function OnboardingRoute() {
  const { refreshOnboardingStatus, signOut, state } = useAuth();
  const repositories = useLocalRepositories();
  const navigate = useNavigate();
  const { i18n, t } = useTranslation('common');
  const service = useMemo(
    () =>
      new OnboardingService({
        draftRepository: repositories.onboardingDrafts,
        goalRepository: repositories.playerGoals,
        profileRepository: repositories.profiles
      }),
    [repositories],
  );
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const draftRef = useRef<OnboardingDraft | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    if (state.status !== 'authenticated') {
      return;
    }

    let mounted = true;

    void service
      .loadDraft(state.user.id, getSupportedLocale(i18n.resolvedLanguage))
      .then((loadedDraft) => {
        if (!mounted) {
          return;
        }

        draftRef.current = loadedDraft;
        setDraft(loadedDraft);

        if (loadedDraft.locale !== i18n.resolvedLanguage) {
          void i18n.changeLanguage(getSupportedLocale(loadedDraft.locale));
        }
      })
      .catch(() => {
        if (mounted) {
          setErrorKey('onboarding.errors.saveFailed');
        }
      });

    return () => {
      mounted = false;
    };
  }, [i18n, service, state]);

  const persistDraft = useCallback(
    (nextDraft: OnboardingDraft) => {
      draftRef.current = nextDraft;
      setDraft(nextDraft);
      setErrorKey(null);

      void service.saveDraft(nextDraft).catch(() => {
        setErrorKey('onboarding.errors.saveFailed');
      });
    },
    [service],
  );

  const updateDraft = useCallback(
    (patch: OnboardingDraftPatch) => {
      const currentDraft = draftRef.current;

      if (!currentDraft) {
        return;
      }

      const nextPatch = typeof patch === 'function' ? patch(currentDraft) : patch;

      persistDraft({ ...currentDraft, ...nextPatch });
    },
    [persistDraft],
  );

  if (state.status !== 'authenticated') {
    return null;
  }

  if (!draft) {
    return (
      <OnboardingFrame signOut={signOut}>
        <Card className="text-center">
          <p className="text-sm font-black">{t('onboarding.loading')}</p>
        </Card>
      </OnboardingFrame>
    );
  }

  const currentStepIndex = onboardingSteps.indexOf(draft.currentStep);
  const currentStepNumber = currentStepIndex + 1;
  const progressPercentage = Math.round((currentStepNumber / onboardingSteps.length) * 100);

  const goToStep = (step: OnboardingStep) => {
    updateDraft({ currentStep: step });
  };

  const goBack = () => {
    const previousStep = onboardingSteps[Math.max(currentStepIndex - 1, 0)];
    goToStep(previousStep);
  };

  const goNext = () => {
    const currentDraft = draftRef.current ?? draft;
    const validationError = validateStep(currentDraft);

    if (validationError) {
      setErrorKey(`onboarding.errors.${validationError}`);
      return;
    }

    const nextStep = onboardingSteps[Math.min(currentStepIndex + 1, onboardingSteps.length - 1)];
    goToStep(nextStep);
  };

  const completeOnboarding = async () => {
    const currentDraft = draftRef.current ?? draft;
    const validationError = validateStep(currentDraft);

    if (validationError) {
      setErrorKey(`onboarding.errors.${validationError}`);
      return;
    }

    setIsCompleting(true);
    setErrorKey(null);

    try {
      await service.completeDraft(currentDraft);
      await refreshOnboardingStatus();
      navigate('/app', { replace: true });
    } catch (error) {
      setErrorKey(toCompletionErrorKey(error));
      setIsCompleting(false);
    }
  };

  return (
    <OnboardingFrame signOut={signOut}>
      <section className="space-y-5">
        <div className="space-y-3 pt-2">
          <p className="text-sm font-bold text-hoopnote-purple">{t('onboarding.eyebrow')}</p>
          <h1 className="text-3xl font-black leading-tight">
            {t(`onboarding.steps.${draft.currentStep}.title`)}
          </h1>
          <p className="text-base leading-7 text-hoopnote-muted">
            {t(`onboarding.steps.${draft.currentStep}.description`)}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-xs font-bold text-hoopnote-muted">
            <span>{t('onboarding.progress', { current: currentStepNumber, total: onboardingSteps.length })}</span>
            <span>{progressPercentage}%</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-hoopnote-line"
            aria-label={t('onboarding.progressLabel')}
            aria-valuemax={onboardingSteps.length}
            aria-valuemin={1}
            aria-valuenow={currentStepNumber}
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-hoopnote-orange"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <Card className="space-y-5">
          {errorKey ? (
            <p className="rounded-card border border-hoopnote-danger/40 bg-hoopnote-danger/10 px-4 py-3 text-sm font-bold">
              {t(errorKey)}
            </p>
          ) : null}

          <StepFields draft={draft} updateDraft={updateDraft} />

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              disabled={currentStepIndex === 0 || isCompleting}
              icon={<ArrowLeft className="h-5 w-5" aria-hidden="true" />}
              onClick={goBack}
              variant="quiet"
            >
              {t('onboarding.actions.back')}
            </Button>

            {draft.currentStep === 'completion' ? (
              <Button
                disabled={isCompleting}
                icon={<Check className="h-5 w-5" aria-hidden="true" />}
                onClick={completeOnboarding}
              >
                {isCompleting ? t('onboarding.actions.finishing') : t('onboarding.actions.finish')}
              </Button>
            ) : (
              <Button
                icon={<ArrowRight className="h-5 w-5" aria-hidden="true" />}
                iconPosition="end"
                onClick={goNext}
              >
                {t('onboarding.actions.next')}
              </Button>
            )}
          </div>
        </Card>
      </section>
    </OnboardingFrame>
  );
}

function OnboardingFrame({
  children,
  signOut
}: {
  children: ReactNode;
  signOut: () => Promise<void>;
}) {
  const { t } = useTranslation('common');

  return (
    <main className="court-background min-h-screen text-hoopnote-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col px-5 py-6">
        <header className="flex items-center justify-between gap-3">
          <BrandLogo label={t('appName')} />
          <Button
            aria-label={t('auth.signOut')}
            icon={<LogOut className="h-4 w-4" aria-hidden="true" />}
            onClick={() => {
              void signOut();
            }}
            size="icon"
            variant="quiet"
          />
        </header>
        <div className="flex flex-1 flex-col justify-center py-8">{children}</div>
      </div>
    </main>
  );
}

function StepFields({
  draft,
  updateDraft
}: {
  draft: OnboardingDraft;
  updateDraft: (patch: OnboardingDraftPatch) => void;
}) {
  switch (draft.currentStep) {
    case 'locale':
      return <LocaleStep draft={draft} updateDraft={updateDraft} />;
    case 'profile':
      return <ProfileStep draft={draft} updateDraft={updateDraft} />;
    case 'experience':
      return <ExperienceStep draft={draft} updateDraft={updateDraft} />;
    case 'goals':
      return <GoalsStep draft={draft} updateDraft={updateDraft} />;
    case 'assessment':
      return <AssessmentStep draft={draft} updateDraft={updateDraft} />;
    case 'physical':
      return <PhysicalStep draft={draft} updateDraft={updateDraft} />;
    case 'completion':
      return <CompletionStep draft={draft} />;
  }
}

function LocaleStep({
  draft,
  updateDraft
}: {
  draft: OnboardingDraft;
  updateDraft: (patch: OnboardingDraftPatch) => void;
}) {
  const { i18n, t } = useTranslation('common');

  const changeLocale = (locale: SupportedLocale) => {
    void i18n.changeLanguage(locale);
    updateDraft({ locale });
  };

  return (
    <div className="grid gap-3">
      {supportedLocales.map((locale) => (
        <button
          className={cx(
            'min-h-14 rounded-control border-2 px-4 text-left text-base font-black motion-safe:transition',
            draft.locale === locale
              ? 'border-hoopnote-ink bg-hoopnote-ink text-white shadow-control'
              : 'border-hoopnote-line bg-white hover:border-hoopnote-blue',
          )}
          key={locale}
          onClick={() => changeLocale(locale)}
          type="button"
          aria-pressed={draft.locale === locale}
        >
          {t(`language.${locale}`)}
        </button>
      ))}
    </div>
  );
}

function ProfileStep({
  draft,
  updateDraft
}: {
  draft: OnboardingDraft;
  updateDraft: (patch: OnboardingDraftPatch) => void;
}) {
  const { t } = useTranslation('common');

  return (
    <div className="space-y-4">
      <TextField
        label={t('onboarding.fields.alias')}
        name="alias"
        onChange={(value) => updateDraft({ alias: optionalText(value) })}
        value={draft.alias ?? ''}
      />
      <NumberField
        label={t('onboarding.fields.birthYear')}
        max={new Date().getFullYear()}
        min={1900}
        name="birthYear"
        onChange={(value) => updateDraft({ birthYear: value })}
        required
        value={draft.birthYear}
      />
      <NumberField
        label={t('onboarding.fields.heightCm')}
        max={260}
        min={100}
        name="heightCm"
        onChange={(value) => updateDraft({ heightCm: value })}
        value={draft.heightCm}
      />
    </div>
  );
}

function ExperienceStep({
  draft,
  updateDraft
}: {
  draft: OnboardingDraft;
  updateDraft: (patch: OnboardingDraftPatch) => void;
}) {
  const { t } = useTranslation('common');

  return (
    <div className="space-y-4">
      <SelectField
        label={t('onboarding.fields.primaryPosition')}
        name="primaryPosition"
        onChange={(value) => updateDraft({ primaryPosition: value as PlayerPosition })}
        options={positions.map((position) => ({
          label: t(`onboarding.positions.${position}`),
          value: position
        }))}
        required
        value={draft.primaryPosition ?? ''}
      />
      <SelectField
        label={t('onboarding.fields.secondaryPosition')}
        name="secondaryPosition"
        onChange={(value) =>
          updateDraft({ secondaryPosition: optionalSelect(value) as PlayerPosition | undefined })
        }
        options={positions.map((position) => ({
          label: t(`onboarding.positions.${position}`),
          value: position
        }))}
        value={draft.secondaryPosition ?? ''}
      />
      <SelectField
        label={t('onboarding.fields.competitiveLevel')}
        name="competitiveLevel"
        onChange={(value) => updateDraft({ competitiveLevel: value as CompetitiveLevel })}
        options={competitiveLevels.map((level) => ({
          label: t(`onboarding.competitiveLevels.${level}`),
          value: level
        }))}
        required
        value={draft.competitiveLevel ?? ''}
      />
      <SelectField
        label={t('onboarding.fields.dominantHand')}
        name="dominantHand"
        onChange={(value) =>
          updateDraft({ dominantHand: optionalSelect(value) as DominantHand | undefined })
        }
        options={dominantHands.map((hand) => ({
          label: t(`onboarding.dominantHands.${hand}`),
          value: hand
        }))}
        value={draft.dominantHand ?? ''}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberField
          label={t('onboarding.fields.experienceYears')}
          min={0}
          name="experienceYears"
          onChange={(value) => updateDraft({ experienceYears: value })}
          value={draft.experienceYears}
        />
        <NumberField
          label={t('onboarding.fields.weeklyPractices')}
          min={0}
          name="weeklyPractices"
          onChange={(value) => updateDraft({ weeklyPractices: value })}
          value={draft.weeklyPractices}
        />
        <NumberField
          label={t('onboarding.fields.weeklyGames')}
          min={0}
          name="weeklyGames"
          onChange={(value) => updateDraft({ weeklyGames: value })}
          value={draft.weeklyGames}
        />
      </div>
    </div>
  );
}

function GoalsStep({
  draft,
  updateDraft
}: {
  draft: OnboardingDraft;
  updateDraft: (patch: OnboardingDraftPatch) => void;
}) {
  const { t } = useTranslation('common');
  const [limitReached, setLimitReached] = useState(false);

  const toggleGoal = (goalType: GoalType) => {
    setLimitReached(false);

    updateDraft((currentDraft) => {
      if (currentDraft.goalTypes.includes(goalType)) {
        return { goalTypes: currentDraft.goalTypes.filter((goal) => goal !== goalType) };
      }

      if (currentDraft.goalTypes.length >= MAX_ACTIVE_GOALS) {
        setLimitReached(true);
        return {};
      }

      return { goalTypes: [...currentDraft.goalTypes, goalType] };
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold text-hoopnote-muted">
        {t('onboarding.goalCount', {
          count: draft.goalTypes.length,
          max: MAX_ACTIVE_GOALS
        })}
      </p>
      {limitReached ? (
        <p className="rounded-card border border-hoopnote-warning/50 bg-hoopnote-warning/10 px-4 py-3 text-sm font-bold">
          {t('onboarding.errors.tooManyGoals')}
        </p>
      ) : null}
      <div className="grid gap-3">
        {goalOptions.map((goalType) => {
          const selected = draft.goalTypes.includes(goalType);

          return (
            <button
              aria-pressed={selected}
              className={cx(
                'min-h-12 rounded-control border-2 px-4 text-left text-sm font-black motion-safe:transition',
                selected
                  ? 'border-hoopnote-ink bg-hoopnote-ink text-white shadow-control'
                  : 'border-hoopnote-line bg-white hover:border-hoopnote-blue',
              )}
              key={goalType}
              onClick={() => toggleGoal(goalType)}
              type="button"
            >
              {t(`onboarding.goals.${goalType}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AssessmentStep({
  draft,
  updateDraft
}: {
  draft: OnboardingDraft;
  updateDraft: (patch: OnboardingDraftPatch) => void;
}) {
  const { t } = useTranslation('common');

  return (
    <div className="space-y-5">
      {assessmentAreas.map((area) => (
        <RatingControl
          getValueLabel={(value) => t('onboarding.assessment.valueLabel', { value })}
          key={area}
          label={t(`onboarding.assessment.${area}`)}
          maxLabel={t('onboarding.assessment.maxLabel')}
          minLabel={t('onboarding.assessment.minLabel')}
          name={`assessment-${area}`}
          onChange={(value) =>
            updateDraft((currentDraft) => ({
              selfAssessment: {
                ...currentDraft.selfAssessment,
                [area]: value
              }
            }))
          }
          value={draft.selfAssessment[area]}
        />
      ))}
    </div>
  );
}

function PhysicalStep({
  draft,
  updateDraft
}: {
  draft: OnboardingDraft;
  updateDraft: (patch: OnboardingDraftPatch) => void;
}) {
  const { t } = useTranslation('common');

  const updatePhysicalContext = (
    status: PhysicalContext['status'] | undefined,
    note = draft.physicalContext?.note,
  ) => {
    if (!status) {
      updateDraft({ physicalContext: undefined });
      return;
    }

    updateDraft({
      physicalContext: {
        status,
        note: optionalText(note ?? '')
      }
    });
  };

  return (
    <div className="space-y-4">
      <SelectField
        label={t('onboarding.fields.physicalStatus')}
        name="physicalStatus"
        onChange={(value) =>
          updatePhysicalContext(optionalSelect(value) as PhysicalContext['status'] | undefined)
        }
        options={physicalStatuses.map((status) => ({
          label: t(`onboarding.physicalStatuses.${status}`),
          value: status
        }))}
        value={draft.physicalContext?.status ?? ''}
      />
      <label className="block space-y-2">
        <span className="text-sm font-bold">{t('onboarding.fields.physicalNote')}</span>
        <textarea
          className="min-h-28 w-full rounded-card border-2 border-hoopnote-line bg-white px-4 py-3 text-base font-semibold outline-none focus:border-hoopnote-blue focus:ring-4 focus:ring-hoopnote-blue/20"
          disabled={!draft.physicalContext?.status}
          maxLength={500}
          name="physicalNote"
          onChange={(event) =>
            updatePhysicalContext(draft.physicalContext?.status, event.target.value)
          }
          value={draft.physicalContext?.note ?? ''}
        />
      </label>
    </div>
  );
}

function CompletionStep({ draft }: { draft: OnboardingDraft }) {
  const { t } = useTranslation('common');

  return (
    <dl className="grid gap-3 text-sm">
      <SummaryRow label={t('onboarding.summary.locale')} value={t(`language.${draft.locale}`)} />
      <SummaryRow
        label={t('onboarding.summary.position')}
        value={draft.primaryPosition ? t(`onboarding.positions.${draft.primaryPosition}`) : ''}
      />
      <SummaryRow
        label={t('onboarding.summary.level')}
        value={
          draft.competitiveLevel
            ? t(`onboarding.competitiveLevels.${draft.competitiveLevel}`)
            : ''
        }
      />
      <SummaryRow
        label={t('onboarding.summary.goals')}
        value={draft.goalTypes.map((goal) => t(`onboarding.goals.${goal}`)).join(', ')}
      />
    </dl>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-hoopnote-line bg-white px-4 py-3">
      <dt className="text-xs font-bold text-hoopnote-muted">{label}</dt>
      <dd className="mt-1 font-black">{value}</dd>
    </div>
  );
}

interface TextFieldProps {
  label: string;
  name: string;
  onChange: (value: string) => void;
  value: string;
}

function TextField({ label, name, onChange, value }: TextFieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold">{label}</span>
      <input
        className="min-h-12 w-full rounded-card border-2 border-hoopnote-line bg-white px-4 text-base font-semibold outline-none focus:border-hoopnote-blue focus:ring-4 focus:ring-hoopnote-blue/20"
        name={name}
        onChange={(event) => onChange(event.target.value)}
        type="text"
        value={value}
      />
    </label>
  );
}

interface NumberFieldProps {
  label: string;
  max?: number;
  min?: number;
  name: string;
  onChange: (value: number | undefined) => void;
  required?: boolean;
  value?: number;
}

function NumberField({ label, max, min, name, onChange, required = false, value }: NumberFieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold">{label}</span>
      <input
        className="min-h-12 w-full rounded-card border-2 border-hoopnote-line bg-white px-4 text-base font-semibold outline-none focus:border-hoopnote-blue focus:ring-4 focus:ring-hoopnote-blue/20"
        max={max}
        min={min}
        name={name}
        onChange={(event) => onChange(numberFromInput(event.target.value))}
        required={required}
        type="number"
        value={value ?? ''}
      />
    </label>
  );
}

interface SelectFieldProps {
  label: string;
  name: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  required?: boolean;
  value: string;
}

function SelectField({ label, name, onChange, options, required = false, value }: SelectFieldProps) {
  const { t } = useTranslation('common');

  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold">{label}</span>
      <select
        className="min-h-12 w-full rounded-card border-2 border-hoopnote-line bg-white px-4 text-base font-semibold outline-none focus:border-hoopnote-blue focus:ring-4 focus:ring-hoopnote-blue/20"
        name={name}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
        required={required}
        value={value}
      >
        <option value="">{t('onboarding.fields.selectPlaceholder')}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function validateStep(draft: OnboardingDraft): string | null {
  if (draft.currentStep === 'profile') {
    if (!draft.birthYear) {
      return 'birthYearRequired';
    }

    if (
      calculateAgeFromBirthYear(draft.birthYear, new Date().getFullYear()) < MINIMUM_PLAYER_AGE
    ) {
      return 'invalidAge';
    }
  }

  if (draft.currentStep === 'experience') {
    if (!draft.primaryPosition) {
      return 'primaryPositionRequired';
    }

    if (!draft.competitiveLevel) {
      return 'competitiveLevelRequired';
    }
  }

  if (draft.currentStep === 'goals') {
    if (draft.goalTypes.length === 0) {
      return 'goalRequired';
    }

    if (draft.goalTypes.length > MAX_ACTIVE_GOALS) {
      return 'tooManyGoals';
    }
  }

  return null;
}

function toCompletionErrorKey(error: unknown): string {
  if (error instanceof OnboardingCompletionError) {
    const keyByCode: Record<OnboardingCompletionError['code'], string> = {
      birth_year_required: 'onboarding.errors.birthYearRequired',
      competitive_level_required: 'onboarding.errors.competitiveLevelRequired',
      goal_required: 'onboarding.errors.goalRequired',
      invalid_age: 'onboarding.errors.invalidAge',
      primary_position_required: 'onboarding.errors.primaryPositionRequired',
      too_many_goals: 'onboarding.errors.tooManyGoals'
    };

    return keyByCode[error.code];
  }

  return 'onboarding.errors.saveFailed';
}

function optionalText(value: string): string | undefined {
  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function optionalSelect(value: string): string | undefined {
  return value === '' ? undefined : value;
}

function numberFromInput(value: string): number | undefined {
  return value === '' ? undefined : Number(value);
}

function getSupportedLocale(locale: string | undefined): SupportedLocale {
  const language = locale?.split('-')[0];

  return isSupportedLocale(language) ? language : 'en';
}
