import { RefreshCw, Wifi, WifiOff } from 'lucide-react';

import { cx } from '../../lib/classNames';

export type OfflineBadgeStatus = 'online' | 'offline' | 'syncing';

interface OfflineBadgeProps {
  label: string;
  status: OfflineBadgeStatus;
}

const statusClasses: Record<OfflineBadgeStatus, string> = {
  online: 'border-hoopjot-success/40 bg-hoopjot-success/12 text-hoopjot-ink',
  offline: 'border-hoopjot-ink/20 bg-hoopjot-surface text-hoopjot-ink',
  syncing: 'border-hoopjot-blue/40 bg-hoopjot-blue/12 text-hoopjot-ink'
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
