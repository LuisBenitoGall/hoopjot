import { type ReactNode } from 'react';

interface MobileShellProps {
  bottomNavigation: ReactNode;
  children: ReactNode;
  header: ReactNode;
}

export function MobileShell({ bottomNavigation, children, header }: MobileShellProps) {
  return (
    <div className="court-background min-h-screen text-hoopnote-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-hoopnote-bg sm:border-x-2 sm:border-hoopnote-line">
        <header className="px-5 pb-3 pt-[calc(env(safe-area-inset-top)+1rem)]">{header}</header>
        <main className="flex-1 px-5 pb-28">{children}</main>
        {bottomNavigation}
      </div>
    </div>
  );
}
