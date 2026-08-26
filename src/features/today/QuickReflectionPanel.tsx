import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import {
  type QuickReflectionServicePort,
  type QuickReflectionSessionType,
  type QuickReflectionState
} from '../../application/today';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { RatingControl } from '../../components/ui/RatingControl';
import type { Reflection } from '../../domain';
import { cx } from '../../lib/classNames';

interface QuickReflectionPanelProps {
  defaultSessionType?: QuickReflectionSessionType;
  onSaved: (state: QuickReflectionState) => void;
  service: QuickReflectionServicePort;
  userId: string;
}

const quickSessionTypes: QuickReflectionSessionType[] = ['practice', 'game'];

export function QuickReflectionPanel({
  defaultSessionType = 'practice',
  onSaved,
  service,
  userId
}: QuickReflectionPanelProps) {
  const { t } = useTranslation('common');
  const [coachFeedback, setCoachFeedback] = useState('');
  const [focusRating, setFocusRating] = useState<Reflection['focusRating'] | null>(null);
  const [isCoachFeedbackOpen, setIsCoachFeedbackOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [note, setNote] = useState('');
  const [sessionType, setSessionType] =
    useState<QuickReflectionSessionType>(defaultSessionType);

  useEffect(() => {
    setSessionType(defaultSessionType);
  }, [defaultSessionType]);

  const saveReflection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!focusRating) {
      return;
    }

    setIsSaving(true);

    try {
      const nextState = await service.saveQuickReflection({
        coachFeedback: isCoachFeedbackOpen ? coachFeedback : '',
        focusRating,
        note,
        sessionType,
        userId
      });

      onSaved(nextState);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="space-y-5" tone="warm">
      <form className="space-y-5" onSubmit={(event) => void saveReflection(event)}>
        <fieldset className="space-y-3">
          <legend className="text-sm font-black text-hoopjot-ink">
            {t('today.quickReflection.sessionTypeLabel')}
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {quickSessionTypes.map((type) => {
              const selected = sessionType === type;

              return (
                <button
                  aria-pressed={selected}
                  className={cx(
                    'min-h-11 rounded-control border-2 px-3 text-sm font-black outline-none motion-safe:transition',
                    'focus-visible:ring-4 focus-visible:ring-hoopjot-blue/30',
                    selected
                      ? 'border-hoopjot-ink bg-hoopjot-ink text-white shadow-control'
                      : 'border-hoopjot-line bg-hoopjot-surface text-hoopjot-ink hover:border-hoopjot-purple',
                  )}
                  key={type}
                  onClick={() => setSessionType(type)}
                  type="button"
                >
                  {t(`sessions.types.${type}`)}
                </button>
              );
            })}
          </div>
        </fieldset>

        <RatingControl
          getValueLabel={(value) => t('rating.valueLabel', { value })}
          label={t('today.quickReflection.ratingLabel')}
          maxLabel={t('today.quickReflection.ratingMax')}
          minLabel={t('today.quickReflection.ratingMin')}
          name="focus-rating"
          onChange={(value) => setFocusRating(toFocusRating(value))}
          required
          value={focusRating}
        />

        <TextAreaField
          label={t('today.quickReflection.mainNoteLabel')}
          maxLength={1000}
          onChange={setNote}
          value={note}
        />

        {isCoachFeedbackOpen ? (
          <TextAreaField
            label={t('today.quickReflection.coachFeedbackToggle')}
            maxLength={1000}
            onChange={setCoachFeedback}
            value={coachFeedback}
          />
        ) : (
          <Button
            className="px-0 text-hoopjot-purple hover:bg-transparent hover:text-hoopjot-ink"
            onClick={() => setIsCoachFeedbackOpen(true)}
            size="sm"
            variant="quiet"
          >
            {t('today.quickReflection.coachFeedbackToggle')}
          </Button>
        )}

        <Button className="w-full" disabled={!focusRating || isSaving} type="submit">
          {t('today.quickReflection.save')}
        </Button>
      </form>
    </Card>
  );
}

function TextAreaField({
  label,
  maxLength,
  onChange,
  value
}: {
  label: string;
  maxLength: number;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-hoopjot-ink">{label}</span>
      <textarea
        className="min-h-20 w-full resize-y rounded-card border-2 border-hoopjot-line bg-hoopjot-surface px-4 py-3 text-sm leading-6 text-hoopjot-ink outline-none focus-visible:ring-4 focus-visible:ring-hoopjot-blue/30"
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function toFocusRating(value: number): Reflection['focusRating'] {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5
    ? value
    : 3;
}
