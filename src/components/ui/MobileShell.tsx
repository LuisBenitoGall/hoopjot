import { type ReactNode } from 'react';

import { LegalFooterLinks } from './LegalFooterLinks';
import { cx } from '../../lib/classNames';

interface MobileShellProps {
  bottomNavigation: ReactNode;
  children: ReactNode;
  contentWidth?: 'mobile' | 'readable';
  header: ReactNode;
}

const widthClasses: Record<NonNullable<MobileShellProps['contentWidth']>, string> = {
  mobile: 'max-w-[480px]',
  readable: 'max-w-[900px]',
};

export function MobileShell({
  bottomNavigation,
  children,
  contentWidth = 'mobile',
  header,
}: MobileShellProps) {
  return (
    <div className="court-background min-h-screen text-hoopjot-ink">
      <div
        className={cx(
          'mx-auto flex min-h-screen w-full flex-col bg-hoopjot-bg sm:border-x-2 sm:border-hoopjot-line',
          widthClasses[contentWidth],
        )}
      >
        <header className="px-5 pb-3 pt-[calc(env(safe-area-inset-top)+1rem)]">{header}</header>
        <main className="flex-1 px-5 pb-6">{children}</main>
        <footer className="px-5 pb-28">
          <LegalFooterLinks />
        </footer>
        {bottomNavigation}
      </div>
    </div>
  );
}
