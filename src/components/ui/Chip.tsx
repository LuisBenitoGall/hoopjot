import { type HTMLAttributes, type ReactNode } from 'react';

import { cx } from '../../lib/classNames';

export type ChipTone = 'attack' | 'defense' | 'transition' | 'progress' | 'reflection' | 'neutral';

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  icon?: ReactNode;
  tone?: ChipTone;
}

const toneClasses: Record<ChipTone, string> = {
  attack: 'border-hoopnote-orange bg-hoopnote-orange/12 text-hoopnote-ink',
  defense: 'border-hoopnote-purple bg-hoopnote-purple/12 text-hoopnote-ink',
  transition: 'border-hoopnote-blue bg-hoopnote-blue/12 text-hoopnote-ink',
  progress: 'border-hoopnote-success bg-hoopnote-success/12 text-hoopnote-ink',
  reflection: 'border-hoopnote-ink bg-hoopnote-ink/8 text-hoopnote-ink',
  neutral: 'border-hoopnote-line bg-hoopnote-surface text-hoopnote-muted'
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

