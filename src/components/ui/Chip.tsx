import { type HTMLAttributes, type ReactNode } from 'react';

import { cx } from '../../lib/classNames';

export type ChipTone = 'attack' | 'defense' | 'transition' | 'progress' | 'reflection' | 'neutral';

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  icon?: ReactNode;
  tone?: ChipTone;
}

const toneClasses: Record<ChipTone, string> = {
  attack: 'border-hoopjot-orange bg-hoopjot-orange/12 text-hoopjot-ink',
  defense: 'border-hoopjot-purple bg-hoopjot-purple/12 text-hoopjot-ink',
  transition: 'border-hoopjot-blue bg-hoopjot-blue/12 text-hoopjot-ink',
  progress: 'border-hoopjot-success bg-hoopjot-success/12 text-hoopjot-ink',
  reflection: 'border-hoopjot-ink bg-hoopjot-ink/8 text-hoopjot-ink',
  neutral: 'border-hoopjot-line bg-hoopjot-surface text-hoopjot-muted'
};

export function Chip({ children, className, icon, tone = 'neutral', ...props }: ChipProps) {
  return (
    <span
      className={cx(
        'inline-flex min-h-8 items-center gap-1.5 rounded-control border px-3 text-xs font-bold leading-none',
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {icon ? (
        <span className="shrink-0" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  );
}

