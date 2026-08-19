import { type HTMLAttributes } from 'react';

import { cx } from '../../lib/classNames';

type CardTone = 'surface' | 'warm' | 'ink';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
}

const toneClasses: Record<CardTone, string> = {
  surface: 'border-hoopnote-line bg-hoopnote-surface text-hoopnote-ink',
  warm: 'border-hoopnote-orange/40 bg-[#fff3e8] text-hoopnote-ink',
  ink: 'border-hoopnote-ink bg-hoopnote-ink text-white'
};

export function Card({ className, tone = 'surface', ...props }: CardProps) {
  return (
    <div
      className={cx('rounded-card border-2 p-5 shadow-card', toneClasses[tone], className)}
      {...props}
    />
  );
}

