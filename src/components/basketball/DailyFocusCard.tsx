import { Play } from 'lucide-react';
import { type ReactNode } from 'react';

import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Chip, type ChipTone } from '../ui/Chip';

interface DailyFocusCardProps {
  actionLabel: string;
  actionIcon?: ReactNode;
  categoryLabel: string;
  categoryTone: ChipTone;
  cue: string;
  explanation: string;
  footer?: ReactNode;
  onAction?: () => void;
  reason: string;
  reasonLabel: string;
  title: string;
}

export function DailyFocusCard({
  actionLabel,
  actionIcon,
  categoryLabel,
  categoryTone,
  cue,
  explanation,
  footer,
  onAction,
  reason,
  reasonLabel,
  title
}: DailyFocusCardProps) {
  return (
    <Card className="relative overflow-hidden border-hoopjot-ink bg-hoopjot-surface p-0">
      <div className="absolute inset-x-5 top-0 h-1.5 rounded-b-control bg-hoopjot-orange" />
      <div className="space-y-5 p-5 pt-7">
        <Chip tone={categoryTone}>{categoryLabel}</Chip>

        <div className="space-y-3">
          <h2 className="text-[2rem] font-black leading-none text-hoopjot-ink">{title}</h2>
          <p className="text-base leading-7 text-hoopjot-muted">{explanation}</p>
        </div>

        <div className="rounded-card border-2 border-dashed border-hoopjot-purple/40 bg-hoopjot-purple/10 p-4">
          <p className="text-xl font-black leading-tight text-hoopjot-ink">{cue}</p>
        </div>

        <div className="border-l-4 border-hoopjot-blue pl-4">
          <p className="text-sm font-black text-hoopjot-ink">{reasonLabel}</p>
          <p className="mt-1 text-sm leading-6 text-hoopjot-muted">{reason}</p>
        </div>

        <Button
          className="w-full"
          icon={actionIcon ?? <Play className="h-5 w-5" aria-hidden="true" />}
          onClick={onAction}
        >
          {actionLabel}
        </Button>

        {footer ? <div className="space-y-3">{footer}</div> : null}
      </div>
    </Card>
  );
}
