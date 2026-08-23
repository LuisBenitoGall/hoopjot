import { cx } from '../../lib/classNames';

interface RatingControlProps {
  getValueLabel: (value: number) => string;
  label: string;
  maxLabel: string;
  minLabel: string;
  name: string;
  onChange: (value: number) => void;
  value: number;
}

const ratingValues = [1, 2, 3, 4, 5] as const;

export function RatingControl({
  getValueLabel,
  label,
  maxLabel,
  minLabel,
  name,
  onChange,
  value
}: RatingControlProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-bold text-hoopjot-ink">{label}</legend>
      <div className="flex items-center justify-between gap-2">
        {ratingValues.map((rating) => {
          const selected = rating === value;

          return (
            <label className="block flex-1" key={rating}>
              <input
                aria-label={getValueLabel(rating)}
                checked={selected}
                className="peer sr-only"
                name={name}
                onChange={() => onChange(rating)}
                type="radio"
                value={rating}
              />
              <span
                className={cx(
                  'flex min-h-12 min-w-11 items-center justify-center rounded-control border-2 text-sm font-black outline-none motion-safe:transition',
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

