import { type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

import { cx } from '../../lib/classNames';

export interface BottomNavigationItem {
  href: string;
  icon: LucideIcon;
  id: string;
  label: string;
}

interface BottomNavigationProps {
  activeItemId: string;
  ariaLabel: string;
  items: BottomNavigationItem[];
}

export function BottomNavigation({ activeItemId, ariaLabel, items }: BottomNavigationProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[480px] border-t-2 border-hoopjot-line bg-hoopjot-surface/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur"
    >
      <ul
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeItemId;

          return (
            <li key={item.id}>
              <Link
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'flex min-h-16 flex-col items-center justify-center gap-1 rounded-card px-1 text-[0.7rem] font-bold leading-none outline-none motion-safe:transition',
                  'focus-visible:ring-4 focus-visible:ring-hoopjot-blue/30',
                  active
                    ? 'bg-hoopjot-ink text-white shadow-control'
                    : 'text-hoopjot-muted hover:bg-hoopjot-ink/8 hover:text-hoopjot-ink',
                )}
                to={item.href}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
