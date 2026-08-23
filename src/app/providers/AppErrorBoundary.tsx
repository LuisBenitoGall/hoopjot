/* eslint-disable react-refresh/only-export-components */
import { Component, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { BrandLogo } from '../../components/brand/BrandLogo';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  override state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(): void {
    // Keep production logging opt-in so reflection notes, physical context and tokens are never emitted accidentally.
  }

  override render() {
    if (this.state.hasError) {
      return <AppErrorFallback />;
    }

    return this.props.children;
  }
}

function AppErrorFallback() {
  const { t } = useTranslation('common');

  return (
    <main className="court-background flex min-h-screen items-center justify-center px-5 text-hoopjot-ink">
      <Card className="w-full max-w-sm space-y-5 text-center">
        <div className="flex justify-center">
          <BrandLogo label={t('appName')} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black">{t('errors.app.title')}</h1>
          <p className="text-sm leading-6 text-hoopjot-muted">{t('errors.app.description')}</p>
        </div>
        <Button
          className="w-full"
          onClick={() => {
            window.location.reload();
          }}
        >
          {t('errors.app.action')}
        </Button>
      </Card>
    </main>
  );
}
