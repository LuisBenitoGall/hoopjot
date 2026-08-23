import {
  Activity,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  RotateCcw,
  Trophy
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent
} from 'react';
import { useTranslation } from 'react-i18next';

import type {
  CompleteSessionInput,
  SessionReflectionServicePort,
  SessionReflectionState,
  StartSessionInput
} from '../../application/sessions';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Chip, type ChipTone } from '../../components/ui/Chip';
import { EmptyState } from '../../components/ui/EmptyState';
import { RatingControl } from '../../components/ui/RatingControl';
import type {
  CheckIn,
  Reflection,
  Session,
  SessionType
} from '../../domain';
import { cx } from '../../lib/classNames';

type OptionalRatingValue = CheckIn['energy'];

interface SessionReflectionPanelProps {
  service: SessionReflectionServicePort;
  userId: string;
}

type PanelState =
  | { status: 'loading'; sessionState: null }
  | { status: 'ready'; sessionState: SessionReflectionState }
  | { status: 'error'; sessionState: null };

interface CheckInDraft {
  confidence?: OptionalRatingValue;
  energy?: OptionalRatingValue;
  physicalFeeling?: OptionalRatingValue;
}

const sessionTypeOptions: Array<{
  icon: typeof Activity;
  type: SessionType;
}> = [
  { icon: Activity, type: 'practice' },
  { icon: Trophy, type: 'game' },
  { icon: BookOpen, type: 'learning' },
  { icon: RotateCcw, type: 'recovery' }
];

const optionalRatingValues = [1, 2, 3, 4, 5] as const;

export function SessionReflectionPanel({ service, userId }: SessionReflectionPanelProps) {
  const { t } = useTranslation('common');
  const [panelState, setPanelState] = useState<PanelState>({
    status: 'loading',
    sessionState: null
  });
  const [selectedType, setSelectedType] = useState<SessionType>('practice');
  const [checkInDraft, setCheckInDraft] = useState<CheckInDraft>({});
  const [focusRating, setFocusRating] = useState<Reflection['focusRating']>(3);
  const [note, setNote] = useState('');
  const [coachFeedback, setCoachFeedback] = useState('');
  const [rememberNextTime, setRememberNextTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadSessionState = useCallback(async () => {
    setPanelState({ status: 'loading', sessionState: null });

    try {
      setPanelState({
        status: 'ready',
        sessionState: await service.getTodaySessionState(userId)
      });
    } catch {
      setPanelState({ status: 'error', sessionState: null });
    }
  }, [service, userId]);

  useEffect(() => {
    void loadSessionState();
  }, [loadSessionState]);

  const startSession = async () => {
    setIsSaving(true);

    try {
      const input: StartSessionInput = {
        userId,
        type: selectedType,
        checkIn: checkInDraft
      };

      setPanelState({
        status: 'ready',
        sessionState: await service.startSession(input)
      });
      setCheckInDraft({});
      setFocusRating(3);
      setNote('');
      setCoachFeedback('');
      setRememberNextTime('');
    } catch {
      setPanelState({ status: 'error', sessionState: null });
    } finally {
      setIsSaving(false);
    }
  };

  const completeSession = async (event: FormEvent<HTMLFormElement>, session: Session) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const input: CompleteSessionInput = {
        userId,
        sessionId: session.id,
        focusRating,
        note,
        coachFeedback,
        rememberNextTime
      };

      setPanelState({
        status: 'ready',
        sessionState: await service.completeSession(input)
      });
      setNote('');
      setCoachFeedback('');
      setRememberNextTime('');
    } catch {
      setPanelState({ status: 'error', sessionState: null });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-4" aria-label={t('sessions.sectionLabel')}>
      <div className="space-y-2">
        <p className="text-sm font-bold text-hoopjot-purple">{t('sessions.eyebrow')}</p>
        <h2 className="text-2xl font-black leading-tight">{t('sessions.title')}</h2>
        <p className="text-sm leading-6 text-hoopjot-muted">{t('sessions.intro')}</p>
      </div>

      {panelState.status === 'loading' ? (
        <Card>
          <p className="text-sm font-black">{t('sessions.loading')}</p>
        </Card>
      ) : null}

      {panelState.status === 'error' ? (
        <EmptyState
          action={
            <Button
              icon={<RotateCcw className="h-5 w-5" aria-hidden="true" />}
              onClick={() => {
                void loadSessionState();
              }}
              size="sm"
            >
              {t('sessions.actions.retry')}
            </Button>
          }
          description={t('sessions.errors.loadDescription')}
          icon={<ClipboardCheck className="h-6 w-6" aria-hidden="true" />}
          title={t('sessions.errors.loadTitle')}
        />
      ) : null}

      {panelState.status === 'ready' ? (
        <>
          <SavedSessionSummary sessionState={panelState.sessionState} />

          {isSessionReadyForReflection(panelState.sessionState) ? (
            <ReflectionForm
              coachFeedback={coachFeedback}
              focusRating={focusRating}
              isSaving={isSaving}
              note={note}
              onCoachFeedbackChange={setCoachFeedback}
              onFocusRatingChange={setFocusRating}
              onNoteChange={setNote}
              onRememberNextTimeChange={setRememberNextTime}
              onSubmit={(event) => {
                if (panelState.sessionState.latestSession) {
                  void completeSession(event, panelState.sessionState.latestSession);
                }
              }}
              rememberNextTime={rememberNextTime}
              session={panelState.sessionState.latestSession}
            />
          ) : (
            <StartSessionForm
              checkInDraft={checkInDraft}
              isSaving={isSaving}
              onCheckInChange={setCheckInDraft}
              onSelectedTypeChange={setSelectedType}
              onStart={() => {
                void startSession();
              }}
              selectedType={selectedType}
            />
          )}
        </>
      ) : null}
    </section>
  );
}

function StartSessionForm({
  checkInDraft,
  isSaving,
  onCheckInChange,
  onSelectedTypeChange,
  onStart,
  selectedType
}: {
  checkInDraft: CheckInDraft;
  isSaving: boolean;
  onCheckInChange: (draft: CheckInDraft) => void;
  onSelectedTypeChange: (type: SessionType) => void;
  onStart: () => void;
  selectedType: SessionType;
}) {
  const { t } = useTranslation('common');

  return (
    <Card className="space-y-5">
      <fieldset className="space-y-3">
        <legend className="text-sm font-black text-hoopjot-ink">
          {t('sessions.typeLabel')}
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {sessionTypeOptions.map((option) => {
            const Icon = option.icon;
            const selected = selectedType === option.type;

            return (
              <button
                aria-pressed={selected}
                className={cx(
                  'flex min-h-12 items-center justify-center gap-2 rounded-control border-2 px-3 text-sm font-black outline-none motion-safe:transition',
                  'focus-visible:ring-4 focus-visible:ring-hoopjot-blue/30',
                  selected
                    ? 'border-hoopjot-ink bg-hoopjot-ink text-white shadow-control'
                    : 'border-hoopjot-line bg-hoopjot-surface text-hoopjot-ink hover:border-hoopjot-purple',
                )}
                key={option.type}
                onClick={() => onSelectedTypeChange(option.type)}
                type="button"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {t(`sessions.types.${option.type}`)}
              </button>
            );
          })}
        </div>
      </fieldset>

      <section className="space-y-4" aria-label={t('sessions.checkIn.sectionLabel')}>
        <div>
          <h3 className="text-sm font-black text-hoopjot-ink">
            {t('sessions.checkIn.title')}
          </h3>
          <p className="mt-1 text-sm leading-6 text-hoopjot-muted">
            {t('sessions.checkIn.description')}
          </p>
        </div>

        <OptionalRatingControl
          maxLabel={t('sessions.checkIn.energyMax')}
          minLabel={t('sessions.checkIn.energyMin')}
          name="energy"
          onChange={(value) => onCheckInChange({ ...checkInDraft, energy: value })}
          value={checkInDraft.energy}
          label={t('sessions.checkIn.energyLabel')}
        />
        <OptionalRatingControl
          maxLabel={t('sessions.checkIn.confidenceMax')}
          minLabel={t('sessions.checkIn.confidenceMin')}
          name="confidence"
          onChange={(value) => onCheckInChange({ ...checkInDraft, confidence: value })}
          value={checkInDraft.confidence}
          label={t('sessions.checkIn.confidenceLabel')}
        />
        <OptionalRatingControl
          maxLabel={t('sessions.checkIn.bodyMax')}
          minLabel={t('sessions.checkIn.bodyMin')}
          name="physical-feeling"
          onChange={(value) =>
            onCheckInChange({ ...checkInDraft, physicalFeeling: value })
          }
          value={checkInDraft.physicalFeeling}
          label={t('sessions.checkIn.bodyLabel')}
        />
      </section>

      <Button
        className="w-full"
        disabled={isSaving}
        icon={<Activity className="h-5 w-5" aria-hidden="true" />}
        onClick={onStart}
      >
        {isSaving ? t('sessions.actions.saving') : t('sessions.actions.start')}
      </Button>
    </Card>
  );
}

function ReflectionForm({
  coachFeedback,
  focusRating,
  isSaving,
  note,
  onCoachFeedbackChange,
  onFocusRatingChange,
  onNoteChange,
  onRememberNextTimeChange,
  onSubmit,
  rememberNextTime,
  session
}: {
  coachFeedback: string;
  focusRating: Reflection['focusRating'];
  isSaving: boolean;
  note: string;
  onCoachFeedbackChange: (value: string) => void;
  onFocusRatingChange: (value: Reflection['focusRating']) => void;
  onNoteChange: (value: string) => void;
  onRememberNextTimeChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  rememberNextTime: string;
  session: Session;
}) {
  const { t } = useTranslation('common');

  return (
    <Card className="space-y-5" tone="warm">
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone={getSessionTypeTone(session.type)}>{t(`sessions.types.${session.type}`)}</Chip>
        <Chip tone="neutral">{t('sessions.status.inProgress')}</Chip>
      </div>

      <form className="space-y-5" onSubmit={onSubmit}>
        <RatingControl
          getValueLabel={(value) => t('sessions.reflection.ratingValue', { value })}
          label={t('sessions.reflection.ratingLabel')}
          maxLabel={t('sessions.reflection.ratingMax')}
          minLabel={t('sessions.reflection.ratingMin')}
          name="focus-rating"
          onChange={(value) => onFocusRatingChange(toFocusRating(value))}
          value={focusRating}
        />

        <TextAreaField
          label={t('sessions.reflection.noteLabel')}
          maxLength={1000}
          onChange={onNoteChange}
          placeholder={t('sessions.reflection.notePlaceholder')}
          value={note}
        />
        <TextAreaField
          label={t('sessions.reflection.coachFeedbackLabel')}
          maxLength={1000}
          onChange={onCoachFeedbackChange}
          placeholder={t('sessions.reflection.coachFeedbackPlaceholder')}
          value={coachFeedback}
        />
        <TextAreaField
          label={t('sessions.reflection.rememberLabel')}
          maxLength={1000}
          onChange={onRememberNextTimeChange}
          placeholder={t('sessions.reflection.rememberPlaceholder')}
          value={rememberNextTime}
        />

        <Button
          className="w-full"
          disabled={isSaving}
          icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
          type="submit"
        >
          {isSaving ? t('sessions.actions.saving') : t('sessions.actions.complete')}
        </Button>
      </form>
    </Card>
  );
}

function SavedSessionSummary({
  sessionState
}: {
  sessionState: SessionReflectionState;
}) {
  const { t } = useTranslation('common');

  if (!sessionState.latestSession || !sessionState.reflection) {
    return null;
  }

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone={getSessionTypeTone(sessionState.latestSession.type)}>
          {t(`sessions.types.${sessionState.latestSession.type}`)}
        </Chip>
        <Chip tone="progress">{t('sessions.status.reflectionSaved')}</Chip>
      </div>
      <div>
        <h3 className="text-lg font-black">{t('sessions.saved.title')}</h3>
        <p className="mt-1 text-sm leading-6 text-hoopjot-muted">
          {t('sessions.saved.description', {
            rating: sessionState.reflection.focusRating
          })}
        </p>
      </div>
    </Card>
  );
}

function OptionalRatingControl({
  label,
  maxLabel,
  minLabel,
  name,
  onChange,
  value
}: {
  label: string;
  maxLabel: string;
  minLabel: string;
  name: string;
  onChange: (value: OptionalRatingValue) => void;
  value: OptionalRatingValue;
}) {
  const { t } = useTranslation('common');

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-bold text-hoopjot-ink">{label}</legend>
      <button
        className="min-h-9 rounded-control px-3 text-xs font-black text-hoopjot-muted outline-none hover:bg-hoopjot-ink/8 focus-visible:ring-4 focus-visible:ring-hoopjot-blue/30"
        onClick={() => onChange(undefined)}
        type="button"
      >
        {t('sessions.checkIn.clear')}
      </button>
      <div className="flex items-center justify-between gap-1">
        {optionalRatingValues.map((rating) => {
          const selected = rating === value;

          return (
            <label className="block flex-1" key={rating}>
              <input
                aria-label={t('sessions.checkIn.ratingValue', { label, value: rating })}
                checked={selected}
                className="peer sr-only"
                name={name}
                onChange={() => onChange(rating)}
                type="radio"
                value={rating}
              />
              <span
                className={cx(
                  'flex min-h-10 min-w-9 items-center justify-center rounded-control border text-xs font-black outline-none motion-safe:transition',
                  'peer-focus-visible:ring-4 peer-focus-visible:ring-hoopjot-blue/30',
                  selected
                    ? 'border-hoopjot-ink bg-hoopjot-ink text-white shadow-control'
                    : 'border-hoopjot-line bg-hoopjot-surface text-hoopjot-ink hover:border-hoopjot-blue',
                )}
              >
                {rating}
              </span>
            </label>
          );
        })}
      </div>
      <div className="flex justify-between gap-4 text-xs font-bold text-hoopjot-muted">
        <span>{minLabel}</span>
        <span className="text-right">{maxLabel}</span>
      </div>
    </fieldset>
  );
}

function TextAreaField({
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
        className="min-h-20 w-full resize-y rounded-card border-2 border-hoopjot-line bg-hoopjot-surface px-4 py-3 text-sm leading-6 text-hoopjot-ink outline-none focus-visible:ring-4 focus-visible:ring-hoopjot-blue/30"
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function isSessionReadyForReflection(
  sessionState: SessionReflectionState,
): sessionState is SessionReflectionState & { latestSession: Session } {
  return Boolean(sessionState.latestSession && !sessionState.reflection);
}

function toFocusRating(value: number): Reflection['focusRating'] {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5
    ? value
    : 3;
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
