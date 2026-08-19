import { RefreshCw, Wifi, WifiOff } from 'lucide-react';

import { cx } from '../../lib/classNames';

export type OfflineBadgeStatus = 'online' | 'offline' | 'syncing';

interface OfflineBadgeProps {
  label: string;
  status: OfflineBadgeStatus;
}

const statusClasses: Record<OfflineBadgeStatus, string> = {
  online: 'border-hoopnote-success/40 bg-hoopnote-success/12 text-hoopnote-ink',
  offline: 'border-hoopnote-ink/20 bg-hoopnote-surface text-hoopnote-ink',
  syncing: 'border-hoopnote-blue/40 bg-hoopnote-blue/12 text-hoopnote-ink'
};

const statusIcons = {
  online: Wifi,
  offline: WifiOff,
  syncing: RefreshCw
} satisfies Record<OfflineBadgeStatus, typeof Wifi>;

export function OfflineBadge({ label, status }: OfflineBadgeProps) {
  const Icon = statusIcons[status];

  return (
    <div
      className={cx(
        'inline-flex min-h-9 items-center gap-2 rounded-control border px-3 text-xs font-bold',
        statusClasses[status],
      )}
      role="status"
    >
      <Icon
        className={cx('h-4 w-4', status === 'syncing' && 'motion-safe:animate-spin')}
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  );
}
