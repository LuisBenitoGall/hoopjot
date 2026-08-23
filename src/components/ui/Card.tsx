import { type HTMLAttributes } from 'react';

import { cx } from '../../lib/classNames';

type CardTone = 'surface' | 'warm' | 'ink';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
}

const toneClasses: Record<CardTone, string> = {
  surface: 'border-hoopjot-line bg-hoopjot-surface text-hoopjot-ink',
  warm: 'border-hoopjot-orange/40 bg-[#fff3e8] text-hoopjot-ink',
  ink: 'border-hoopjot-ink bg-hoopjot-ink text-white'
};

export function Card({ className, tone = 'surface', ...props }: CardProps) {
  return (
    <div
      className={cx('rounded-card border-2 p-5 shadow-card', toneClasses[tone], className)}
      {...props}
    />
  );
}

