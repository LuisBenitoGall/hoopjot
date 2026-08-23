import { type ReactNode } from 'react';

import { LegalFooterLinks } from './LegalFooterLinks';

interface MobileShellProps {
  bottomNavigation: ReactNode;
  children: ReactNode;
  header: ReactNode;
}

export function MobileShell({ bottomNavigation, children, header }: MobileShellProps) {
  return (
    <div className="court-background min-h-screen text-hoopjot-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-hoopjot-bg sm:border-x-2 sm:border-hoopjot-line">
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
