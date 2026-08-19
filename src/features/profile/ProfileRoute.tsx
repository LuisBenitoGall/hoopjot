import {
  RotateCcw,
  Save,
  UserCircle
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent
} from 'react';
import { useTranslation } from 'react-i18next';

import {
  ProfileService,
  ProfileServiceError,
  type ProfileUpdateInput
} from '../../application/profile';
import { AppShell } from '../../app/shell/AppShell';
import { useAuth } from '../../app/providers/authContext';
import { useLocalRepositories } from '../../app/providers/localRepositoriesContext';
import { useSyncStatus } from '../../app/providers/syncContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  type CompetitiveLevel,
  type DominantHand,
  type PhysicalContext,
  type PlayerPosition,
  type PlayerProfile
} from '../../domain';
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

const physicalStatuses: PhysicalContext['status'][] = [
  'none',
  'recovering',
  'limited',
  'prefer_not_to_say'
];

type RouteState =
  | { profile: null; status: 'error' | 'loading' | 'not_found' }
  | { profile: PlayerProfile; status: 'ready' };

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

type ProfileDraft = ProfileUpdateInput;

interface ProfileRouteProps {
  service?: ProfileService;
}

export function ProfileRoute({ service: injectedService }: ProfileRouteProps) {
  const { state: authState } = useAuth();
  const repositories = useLocalRepositories();
  const { retryNow } = useSyncStatus();
  const { i18n, t } = useTranslation('common');
  const service = useMemo(
    () =>
      injectedService ??
      new ProfileService({
        profileRepository: repositories.profiles
      }),
    [injectedService, repositories],
  );
  const [routeState, setRouteState] = useState<RouteState>({ profile: null, status: 'loading' });
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (authState.status !== 'authenticated') {
      return;
    }

    setRouteState({ profile: null, status: 'loading' });
    setErrorKey(null);

    try {
      const profile = await service.getProfile(authState.user.id);

      if (!profile) {
        setRouteState({ profile: null, status: 'not_found' });
        setDraft(null);
        return;
      }

      setRouteState({ profile, status: 'ready' });
      setDraft(toDraft(profile));
    } catch {
      setRouteState({ profile: null, status: 'error' });
      setDraft(null);
    }
  }, [authState, service]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const updateDraft = (patch: Partial<ProfileDraft>) => {
    setDraft((currentDraft) => (currentDraft ? { ...currentDraft, ...patch } : currentDraft));
    setSaveState('idle');
    setErrorKey(null);
  };

  const saveProfile = async () => {
    if (authState.status !== 'authenticated' || !draft) {
      return;
    }

    setSaveState('saving');
    setErrorKey(null);

    try {
      const profile = await service.updateProfile({
        ...draft,
        userId: authState.user.id
      });

      setRouteState({ profile, status: 'ready' });
      setDraft(toDraft(profile));
      setSaveState('saved');
      await i18n.changeLanguage(getSupportedLocale(profile.locale));
      void retryNow();
    } catch (error) {
      setSaveState('error');
      setErrorKey(getProfileErrorKey(error));
    }
  };

  const resetDraft = () => {
    if (routeState.status !== 'ready') {
      return;
    }

    setDraft(toDraft(routeState.profile));
    setSaveState('idle');
    setErrorKey(null);
  };

  return (
    <AppShell activeItemId="profile">
      <div className="space-y-5 pb-3">
        <section className="space-y-3 pt-2">
          <p className="text-sm font-bold text-hoopnote-purple">{t('profile.eyebrow')}</p>
          <h1 className="text-3xl font-black leading-tight">{t('profile.title')}</h1>
          <p className="text-sm leading-6 text-hoopnote-muted">{t('profile.intro')}</p>
        </section>

        {routeState.status === 'loading' ? (
          <Card>
            <p className="text-sm font-black">{t('profile.loading')}</p>
          </Card>
        ) : null}

        {routeState.status === 'error' ? (
          <EmptyState
            action={
              <Button
                icon={<RotateCcw className="h-5 w-5" aria-hidden="true" />}
                onClick={() => {
                  void loadProfile();
                }}
                size="sm"
              >
                {t('profile.actions.retry')}
              </Button>
            }
            description={t('profile.errors.loadDescription')}
            icon={<UserCircle className="h-6 w-6" aria-hidden="true" />}
            title={t('profile.errors.loadTitle')}
          />
        ) : null}

        {routeState.status === 'not_found' ? (
          <EmptyState
            description={t('profile.empty.description')}
            icon={<UserCircle className="h-6 w-6" aria-hidden="true" />}
            title={t('profile.empty.title')}
          />
        ) : null}

        {routeState.status === 'ready' && draft ? (
          <ProfileForm
            draft={draft}
            email={authState.status === 'authenticated' ? authState.user.email : null}
            errorKey={errorKey}
            onDraftChange={updateDraft}
            onReset={resetDraft}
            onSave={() => {
              void saveProfile();
            }}
            saveState={saveState}
          />
        ) : null}
      </div>
    </AppShell>
  );
}

function ProfileForm({
  draft,
  email,
  errorKey,
  onDraftChange,
  onReset,
  onSave,
  saveState
}: {
  draft: ProfileDraft;
  email: string | null;
  errorKey: string | null;
  onDraftChange: (patch: Partial<ProfileDraft>) => void;
  onReset: () => void;
  onSave: () => void;
  saveState: SaveState;
}) {
  const { t } = useTranslation('common');

  const updatePhysicalContext = (
    status: PhysicalContext['status'] | undefined,
    note = draft.physicalContext?.note,
  ) => {
    if (!status) {
      onDraftChange({ physicalContext: undefined });
      return;
    }

    onDraftChange({
      physicalContext: {
        status,
        note: optionalText(note ?? '')
      }
    });
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      {errorKey ? (
        <p
          className="rounded-card border border-hoopnote-danger/40 bg-hoopnote-danger/10 px-4 py-3 text-sm font-bold"
          role="alert"
        >
          {t(errorKey)}
        </p>
      ) : null}

      {saveState === 'saved' ? (
        <p
          className="rounded-card border border-hoopnote-success/40 bg-hoopnote-success/10 px-4 py-3 text-sm font-bold"
          role="status"
        >
          {t('profile.saved')}
        </p>
      ) : null}

      <Card className="space-y-4">
        <SectionHeading title={t('profile.sections.account')} />
        <ReadOnlyField label={t('profile.fields.email')} value={email ?? t('profile.notAvailable')} />
        <SelectField
          label={t('profile.fields.locale')}
          name="locale"
          onChange={(value) => onDraftChange({ locale: value })}
          options={supportedLocales.map((locale) => ({
            label: t(`language.${locale}`),
            value: locale
          }))}
          required
          value={draft.locale}
        />
      </Card>

      <Card className="space-y-4">
        <SectionHeading title={t('profile.sections.player')} />
        <TextField
          label={t('onboarding.fields.alias')}
          maxLength={80}
          name="alias"
          onChange={(value) => onDraftChange({ alias: optionalText(value) })}
          value={draft.alias ?? ''}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            label={t('onboarding.fields.birthYear')}
            max={new Date().getFullYear()}
            min={1900}
            name="birthYear"
            onChange={(value) => onDraftChange({ birthYear: value })}
            required
            value={draft.birthYear}
          />
          <NumberField
            label={t('onboarding.fields.heightCm')}
            max={260}
            min={100}
            name="heightCm"
            onChange={(value) => onDraftChange({ heightCm: value })}
            value={draft.heightCm}
          />
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionHeading title={t('profile.sections.basketball')} />
        <SelectField
          label={t('onboarding.fields.primaryPosition')}
          name="primaryPosition"
          onChange={(value) => onDraftChange({ primaryPosition: value as PlayerPosition })}
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
            onDraftChange({ secondaryPosition: optionalSelect(value) as PlayerPosition | undefined })
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
          onChange={(value) => onDraftChange({ competitiveLevel: value as CompetitiveLevel })}
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
            onDraftChange({ dominantHand: optionalSelect(value) as DominantHand | undefined })
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
            onChange={(value) => onDraftChange({ experienceYears: value })}
            value={draft.experienceYears}
          />
          <NumberField
            label={t('onboarding.fields.weeklyPractices')}
            min={0}
            name="weeklyPractices"
            onChange={(value) => onDraftChange({ weeklyPractices: value })}
            value={draft.weeklyPractices}
          />
          <NumberField
            label={t('onboarding.fields.weeklyGames')}
            min={0}
            name="weeklyGames"
            onChange={(value) => onDraftChange({ weeklyGames: value })}
            value={draft.weeklyGames}
          />
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionHeading title={t('profile.sections.physical')} />
        <p className="text-sm leading-6 text-hoopnote-muted">{t('profile.physicalDescription')}</p>
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
          <span className="text-sm font-bold text-hoopnote-ink">
            {t('onboarding.fields.physicalNote')}
          </span>
          <textarea
            className="min-h-24 w-full resize-y rounded-card border-2 border-hoopnote-line bg-white px-4 py-3 text-sm leading-6 text-hoopnote-ink outline-none focus-visible:ring-4 focus-visible:ring-hoopnote-blue/30 disabled:opacity-60"
            disabled={!draft.physicalContext?.status}
            maxLength={500}
            name="physicalNote"
            onChange={(event) =>
              updatePhysicalContext(draft.physicalContext?.status, event.target.value)
            }
            value={draft.physicalContext?.note ?? ''}
          />
        </label>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          disabled={saveState === 'saving'}
          icon={<Save className="h-5 w-5" aria-hidden="true" />}
          type="submit"
        >
          {saveState === 'saving' ? t('profile.actions.saving') : t('profile.actions.save')}
        </Button>
        <Button
          disabled={saveState === 'saving'}
          icon={<RotateCcw className="h-5 w-5" aria-hidden="true" />}
          onClick={onReset}
          variant="secondary"
        >
          {t('profile.actions.reset')}
        </Button>
      </div>
    </form>
  );
}

function SectionHeading({ title }: { title: string }) {
  return <h2 className="text-lg font-black leading-tight">{title}</h2>;
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-hoopnote-line bg-white px-4 py-3">
      <p className="text-xs font-bold text-hoopnote-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-hoopnote-ink">{value}</p>
    </div>
  );
}

interface TextFieldProps {
  label: string;
  maxLength?: number;
  name: string;
  onChange: (value: string) => void;
  value: string;
}

function TextField({ label, maxLength, name, onChange, value }: TextFieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-hoopnote-ink">{label}</span>
      <input
        className="min-h-12 w-full rounded-card border-2 border-hoopnote-line bg-white px-4 text-base font-semibold text-hoopnote-ink outline-none focus:border-hoopnote-blue focus:ring-4 focus:ring-hoopnote-blue/20"
        maxLength={maxLength}
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

function NumberField({
  label,
  max,
  min,
  name,
  onChange,
  required = false,
  value
}: NumberFieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-hoopnote-ink">{label}</span>
      <input
        className="min-h-12 w-full rounded-card border-2 border-hoopnote-line bg-white px-4 text-base font-semibold text-hoopnote-ink outline-none focus:border-hoopnote-blue focus:ring-4 focus:ring-hoopnote-blue/20"
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

function SelectField({
  label,
  name,
  onChange,
  options,
  required = false,
  value
}: SelectFieldProps) {
  const { t } = useTranslation('common');

  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-hoopnote-ink">{label}</span>
      <select
        className="min-h-12 w-full rounded-card border-2 border-hoopnote-line bg-white px-4 text-base font-semibold text-hoopnote-ink outline-none focus:border-hoopnote-blue focus:ring-4 focus:ring-hoopnote-blue/20"
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

function toDraft(profile: PlayerProfile): ProfileDraft {
  return {
    alias: profile.alias,
    birthYear: profile.birthYear,
    competitiveLevel: profile.competitiveLevel,
    dominantHand: profile.dominantHand,
    experienceYears: profile.experienceYears,
    heightCm: profile.heightCm,
    locale: getSupportedLocale(profile.locale),
    physicalContext: profile.physicalContext,
    primaryPosition: profile.primaryPosition,
    secondaryPosition: profile.secondaryPosition,
    userId: profile.userId,
    weeklyGames: profile.weeklyGames,
    weeklyPractices: profile.weeklyPractices
  };
}

function getProfileErrorKey(error: unknown): string {
  if (error instanceof ProfileServiceError) {
    const keyByCode: Record<ProfileServiceError['code'], string> = {
      birth_year_required: 'profile.errors.birthYearRequired',
      competitive_level_required: 'profile.errors.competitiveLevelRequired',
      invalid_age: 'profile.errors.invalidAge',
      not_found: 'profile.errors.notFound',
      primary_position_required: 'profile.errors.primaryPositionRequired',
      save_failed: 'profile.errors.saveFailed'
    };

    return keyByCode[error.code];
  }

  return 'profile.errors.saveFailed';
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
